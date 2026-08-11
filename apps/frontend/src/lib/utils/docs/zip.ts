import type JSZip from 'jszip';
import { IMAGE_EXTENSIONS_IN_ZIP } from './constants';
import { getExtension, compressImageBlob } from './helpers';

export const compressImagesInZip = async (zip: JSZip, mediaFolder: string): Promise<void> => {
  const imageFiles: string[] = [];

  zip.forEach((relativePath) => {
    if (relativePath.startsWith(mediaFolder)) {
      const ext = getExtension(relativePath);
      if (IMAGE_EXTENSIONS_IN_ZIP.includes(ext)) {
        imageFiles.push(relativePath);
      }
    }
  });

  if (imageFiles.length === 0) return;

  // Kompres setiap gambar secara paralel (max 5 concurrent)
  const batchSize = 5;
  for (let i = 0; i < imageFiles.length; i += batchSize) {
    const batch = imageFiles.slice(i, i + batchSize);
    await Promise.all(
      batch.map(async (imgPath) => {
        try {
          const imgData = await zip.file(imgPath)!.async('arraybuffer');
          const blob = new Blob([imgData]);

          // Coba kompres gambar
          const compressed = await compressImageBlob(blob, 0.65, 1440);
          if (compressed && compressed.size < blob.size) {
            const compressedBuffer = await compressed.arrayBuffer();
            // Ganti ekstensi ke .jpg jika perlu
            const newPath = imgPath.replace(/\.(png|bmp|tiff|tif)$/i, '.jpg');

            if (newPath !== imgPath) {
              zip.remove(imgPath);
            }
            zip.file(newPath, compressedBuffer, { binary: true });

            // Jika ekstensi berubah, update referensi di file XML
            if (newPath !== imgPath) {
              await updateMediaReferencesInZip(zip, imgPath, newPath);
            }
          }
        } catch (err) {
          // Gagal kompres gambar individual, skip
          console.warn(`Gagal kompres gambar ${imgPath}:`, err);
        }
      })
    );
  }
};

export const updateMediaReferencesInZip = async (
  zip: JSZip,
  oldPath: string,
  newPath: string
): Promise<void> => {
  const oldBasename = oldPath.split('/').pop() || '';
  const newBasename = newPath.split('/').pop() || '';

  if (oldBasename === newBasename) return;

  // Scan semua file .xml dan .rels di dalam ZIP
  const xmlFiles: string[] = [];
  zip.forEach((path) => {
    if (path.endsWith('.xml') || path.endsWith('.rels')) {
      xmlFiles.push(path);
    }
  });

  for (const xmlPath of xmlFiles) {
    try {
      const content = await zip.file(xmlPath)!.async('string');
      if (content.includes(oldBasename)) {
        const updated = content.split(oldBasename).join(newBasename);
        zip.file(xmlPath, updated);
      }
    } catch {
      // skip file yang gagal dibaca
    }
  }

  // Update juga [Content_Types].xml
  try {
    const contentTypes = zip.file('[Content_Types].xml');
    if (contentTypes) {
      let ct = await contentTypes.async('string');
      // Pastikan ekstensi jpg terdaftar
      if (!ct.includes('Extension="jpg"') && !ct.includes("Extension='jpg'")) {
        ct = ct.replace(
          '<Types ',
          '<Types xmlns:ct="http://schemas.openxmlformats.org/package/2006/content-types" '
        ).replace(
          '</Types>',
          '<Default Extension="jpg" ContentType="image/jpeg"/></Types>'
        );
      }
      if (ct.includes(oldBasename)) {
        ct = ct.split(oldBasename).join(newBasename);
      }
      zip.file('[Content_Types].xml', ct);
    }
  } catch {
    // skip
  }
};
