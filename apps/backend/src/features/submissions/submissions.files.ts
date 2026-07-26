// Fitur: helper validasi & manajemen file pengumpulan
import { deleteFile, getSignedUrl, uploadFile } from "../../shared/storage/files";
import { BadRequest } from "../../shared/utils/errors";

const ALLOWED_EXTENSIONS = [".pdf", ".doc", ".docx", ".ppt", ".pptx", ".xls", ".xlsx", ".jpg", ".jpeg", ".png", ".zip"];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export const normalizeArray = <T>(input: T | T[] | undefined): T[] => {
  if (!input) return [];
  return Array.isArray(input) ? input : [input];
};

export const validateAndParseLinks = (linksInput: string | string[] | undefined): string[] => {
  const rawLinks = normalizeArray(linksInput);
  const links: string[] = [];

  for (const item of rawLinks) {
    if (typeof item === "string" && item.trim().startsWith("[")) {
      try {
        const parsed = JSON.parse(item);
        if (Array.isArray(parsed)) links.push(...parsed);
      } catch {
        links.push(item);
      }
    } else if (typeof item === "string") {
      links.push(item);
    }
  }

  const cleanLinks = links.map((l) => l.trim()).filter(Boolean);
  if (cleanLinks.length > 5) throw BadRequest("Maksimal 5 link per pengumpulan");

  for (const link of cleanLinks) {
    try {
      const url = new URL(link);
      if (url.protocol !== "http:" && url.protocol !== "https:") throw new Error();
    } catch {
      throw BadRequest(`Link '${link}' bukan merupakan URL http/https yang valid`);
    }
  }

  return cleanLinks;
};

export const validateFiles = (filesInput: File | File[] | undefined): File[] => {
  const files = normalizeArray(filesInput);
  if (files.length > 5) throw BadRequest("Maksimal 5 file per pengumpulan");

  for (const file of files) {
    if (file.size > MAX_FILE_SIZE) throw BadRequest(`Ukuran file '${file.name}' melebihi batas 10MB`);
    const ext = "." + file.name.split(".").pop()?.toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) throw BadRequest(`Format file '${file.name}' tidak diizinkan`);
  }

  return files;
};

export const uploadSubmissionFiles = async (classId: string, assignmentId: string, studentId: string, files: File[]) => {
  const fileMetas: any[] = [];
  for (const file of files) {
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `${classId}/${assignmentId}/${studentId}/${Date.now()}_${safeName}`;
    const arrayBuffer = await file.arrayBuffer();
    await uploadFile(path, Buffer.from(arrayBuffer), file.type || "application/octet-stream");
    fileMetas.push({ path, name: file.name, size: file.size, mime: file.type || "application/octet-stream" });
  }
  return fileMetas;
};

export const attachSignedUrls = async (submission: any) => {
  if (!submission || !submission.files) return submission;
  const filesWithUrls = await Promise.all(
    submission.files.map(async (f: any) => {
      let rawUrl = f.path && (f.path.startsWith("/public/") || f.path.startsWith("http")) ? f.path : await getSignedUrl(f.path, 3600);
      if (rawUrl.startsWith("/public/")) {
        rawUrl = `http://localhost:3000${rawUrl}`;
      }
      return {
        ...f,
        url: rawUrl,
        signedUrl: rawUrl,
      };
    })
  );
  return { ...submission, files: filesWithUrls };
};

export const removeStorageFiles = async (files: { path: string }[]) => {
  for (const f of files || []) {
    try {
      await deleteFile(f.path);
    } catch (e) {
      console.error(`Gagal menghapus file storage '${f.path}':`, e);
    }
  }
};
