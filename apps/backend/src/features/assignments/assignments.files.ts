// Fitur: helper validasi & manajemen file lampiran tugas guru
import { deleteFile, getSignedUrl, uploadFile } from "../../shared/storage/files";
import { BadRequest } from "../../shared/utils/errors";

const ALLOWED_EXTENSIONS = [
  ".pdf",
  ".doc",
  ".docx",
  ".ppt",
  ".pptx",
  ".xls",
  ".xlsx",
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".zip",
  ".txt",
];
const MAX_FILE_SIZE = Math.floor(10 * 1024 * 1024); // 10MB

export const normalizeArray = <T>(input: T | T[] | undefined): T[] => {
  if (!input) return [];
  return Array.isArray(input) ? input : [input];
};

export const validateAssignmentFiles = (filesInput: File | File[] | undefined): File[] => {
  const files = normalizeArray(filesInput);
  if (files.length > 5) throw BadRequest("Maksimal 5 berkas lampiran per tugas");

  for (const file of files) {
    if (!file || typeof file.arrayBuffer !== "function") continue;
    if (file.size > MAX_FILE_SIZE) throw BadRequest(`Ukuran berkas '${file.name}' melebihi batas 10 MB`);
    const ext = "." + file.name.split(".").pop()?.toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) throw BadRequest(`Format berkas '${file.name}' tidak diizinkan`);
  }

  return files.filter((f) => f && typeof f.arrayBuffer === "function");
};

export const uploadAssignmentFiles = async (classId: string, teacherId: string, files: File[]) => {
  const fileMetas: any[] = [];
  for (const file of files) {
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `assignments/${classId}/${teacherId}/${Date.now()}_${safeName}`;
    const arrayBuffer = await file.arrayBuffer();
    const storedPath = await uploadFile(path, Buffer.from(arrayBuffer), file.type || "application/octet-stream");
    fileMetas.push({
      name: file.name,
      path: storedPath,
      size: file.size,
      mime: file.type || "application/octet-stream",
    });
  }
  return fileMetas;
};

export const attachSignedUrlsToAssignment = async (assignment: any) => {
  if (!assignment) return assignment;

  if (Array.isArray(assignment)) {
    return Promise.all(assignment.map((a) => attachSignedUrlsToAssignment(a)));
  }

  if (!assignment.attachments || !Array.isArray(assignment.attachments)) {
    return { ...assignment, attachments: [] };
  }

  const attachmentsWithUrls = await Promise.all(
    assignment.attachments.map(async (f: any) => {
      const rawUrl =
        f.path && (f.path.startsWith("/public/") || f.path.startsWith("http") || f.path.startsWith("data:"))
          ? f.path
          : await getSignedUrl(f.path, 3600);
      return {
        ...f,
        url: rawUrl,
        signedUrl: rawUrl,
      };
    })
  );

  return { ...assignment, attachments: attachmentsWithUrls };
};

export const removeAssignmentStorageFiles = async (files: { path: string }[]) => {
  for (const f of files || []) {
    if (!f || !f.path) continue;
    try {
      await deleteFile(f.path);
    } catch (e) {
      console.error(`Gagal menghapus berkas lampiran storage '${f.path}':`, e);
    }
  }
};
