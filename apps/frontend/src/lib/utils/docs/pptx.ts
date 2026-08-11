import JSZip from 'jszip';
import { TARGET_SIZE } from './constants';
import { formatSize } from './helpers';
import { compressImagesInZip } from './zip';

export const compressPptxFile = async (
  file: File
): Promise<{ file: File; compressed: boolean; message?: string }> => {
  const arrayBuffer = await file.arrayBuffer();
  const zip = await JSZip.loadAsync(arrayBuffer);

  // Cari dan kompres gambar di ppt/media/
  await compressImagesInZip(zip, 'ppt/media/');

  // Repack dengan kompresi maksimal
  const compressedBlob = await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 9 },
  });

  const compressedFile = new File([compressedBlob], file.name, {
    type: file.type,
    lastModified: Date.now(),
  });

  if (compressedFile.size >= file.size) {
    return { file, compressed: false, message: `File "${file.name}" sudah optimal, tidak bisa dikompres lebih kecil.` };
  }

  const reachedTarget = compressedFile.size <= TARGET_SIZE;

  return {
    file: compressedFile,
    compressed: true,
    message: reachedTarget
      ? undefined
      : `File "${file.name}" berhasil dikompres dari ${formatSize(file.size)} ke ${formatSize(compressedFile.size)}, namun masih melebihi 1 MB.`,
  };
};
