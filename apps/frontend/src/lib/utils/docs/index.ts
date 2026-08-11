import { TARGET_SIZE, DOCUMENT_EXTENSIONS } from './constants';
import { getExtension } from './helpers';
import { compressDocxFile } from './docx';
import { compressPptxFile } from './pptx';
import { compressPdfFile } from './pdf';

export * from './constants';
export * from './helpers';
export * from './zip';
export * from './docx';
export * from './pptx';
export * from './pdf';

/**
 * Entry point: kompres file dokumen jika ukurannya melebihi target.
 */
export const compressDocumentFile = async (
  file: File
): Promise<{ file: File; compressed: boolean; message?: string }> => {
  if (file.size <= TARGET_SIZE) {
    return { file, compressed: false };
  }

  const ext = getExtension(file.name);

  // Format lama (DOC/PPT binary) tidak bisa dikompres di browser
  if (ext === '.doc' || ext === '.ppt') {
    return {
      file,
      compressed: false,
      message: `File "${file.name}" berformat lama (${ext.toUpperCase()}) dan tidak bisa dikompres otomatis di browser. Pertimbangkan untuk menyimpan ulang sebagai ${ext === '.doc' ? 'DOCX' : 'PPTX'} lalu upload kembali.`,
    };
  }

  try {
    if (ext === '.docx') {
      return await compressDocxFile(file);
    } else if (ext === '.pptx') {
      return await compressPptxFile(file);
    } else if (ext === '.pdf') {
      return await compressPdfFile(file);
    }
  } catch (err) {
    console.warn(`Gagal mengompres "${file.name}":`, err);
    return {
      file,
      compressed: false,
      message: `Kompresi otomatis gagal untuk "${file.name}". File akan diunggah tanpa kompresi.`,
    };
  }

  return { file, compressed: false };
};

export const isCompressibleDocument = (file: File): boolean => {
  const ext = getExtension(file.name);
  return DOCUMENT_EXTENSIONS.includes(ext);
};
