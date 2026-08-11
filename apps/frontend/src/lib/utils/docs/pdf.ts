import { PDFDocument } from 'pdf-lib';
import { TARGET_SIZE } from './constants';
import { formatSize } from './helpers';

export const compressPdfFile = async (
  file: File
): Promise<{ file: File; compressed: boolean; message?: string }> => {
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
  const pageCount = pdfDoc.getPageCount();

  const compressedBytes = new Uint8Array(await pdfDoc.save());
  const compressedBuffer = compressedBytes.buffer as ArrayBuffer;

  // Jika sudah ≤ target setelah save ulang, return
  if (compressedBytes.byteLength <= TARGET_SIZE) {
    const compressedFile = new File([compressedBuffer], file.name, {
      type: 'application/pdf',
      lastModified: Date.now(),
    });
    return { file: compressedFile, compressed: true };
  }

  if (pageCount > 50) {
    return {
      file: new File([compressedBuffer], file.name, {
        type: 'application/pdf',
        lastModified: Date.now(),
      }),
      compressed: compressedBytes.byteLength < arrayBuffer.byteLength,
      message: `File PDF "${file.name}" memiliki ${pageCount} halaman dan terlalu besar untuk dikompres otomatis di browser. Pertimbangkan untuk mengompres menggunakan tools desktop.`,
    };
  }

  try {
    const renderedPdf = await renderPdfPagesToCompressedPdf(arrayBuffer, pageCount);
    if (renderedPdf && renderedPdf.byteLength < compressedBytes.byteLength) {
      const renderedBuffer = new Uint8Array(renderedPdf).buffer as ArrayBuffer;
      const renderedFile = new File([renderedBuffer], file.name, {
        type: 'application/pdf',
        lastModified: Date.now(),
      });
      const reachedTarget = renderedFile.size <= TARGET_SIZE;
      return {
        file: renderedFile,
        compressed: true,
        message: reachedTarget
          ? undefined
          : `File PDF "${file.name}" berhasil dikompres dari ${formatSize(file.size)} ke ${formatSize(renderedFile.size)}, namun masih melebihi 1 MB.`,
      };
    }
  } catch (err) {
    console.warn('Gagal render PDF ke gambar:', err);
  }

  // Fallback: return hasil save ulang pdf-lib
  const fallbackFile = new File([compressedBuffer], file.name, {
    type: 'application/pdf',
    lastModified: Date.now(),
  });
  return {
    file: fallbackFile,
    compressed: fallbackFile.size < file.size,
    message:
      fallbackFile.size > TARGET_SIZE
        ? `File PDF "${file.name}" berhasil dioptimasi dari ${formatSize(file.size)} ke ${formatSize(fallbackFile.size)}, namun masih melebihi 1 MB.`
        : undefined,
  };
};

export const renderPdfPagesToCompressedPdf = async (
  pdfArrayBuffer: ArrayBuffer,
  pageCount: number
): Promise<Uint8Array | null> => {
  const srcDoc = await PDFDocument.load(pdfArrayBuffer, { ignoreEncryption: true });

  const targetPerPage = TARGET_SIZE / pageCount;
  let quality = 0.6;
  if (targetPerPage < 20_000) quality = 0.3;
  else if (targetPerPage < 50_000) quality = 0.4;
  else if (targetPerPage < 100_000) quality = 0.5;

  const maxDim = targetPerPage < 50_000 ? 1024 : 1440;

  for (let i = 0; i < pageCount; i++) {
    const page = srcDoc.getPage(i);
    const { width, height } = page.getSize();

    let renderWidth = width;
    let renderHeight = height;
    if (renderWidth > maxDim || renderHeight > maxDim) {
      const scale = Math.min(maxDim / renderWidth, maxDim / renderHeight);
      renderWidth = Math.round(renderWidth * scale);
      renderHeight = Math.round(renderHeight * scale);
    }

    return null;
  }

  return null;
};
