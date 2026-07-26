// Fitur: klien HTTP API backend
import { toastStore } from '../stores/toast.svelte';
import { API_BASE_URL, getApiUrl } from '../config/api';

export class ApiError extends Error {
  code?: string;
  status?: number;
  constructor(message: string, code?: string, status?: number) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
  }
}

const getHeaders = (isFormData = false): Record<string, string> => {
  const headers: Record<string, string> = {};
  if (!isFormData) {
    headers["Content-Type"] = "application/json";
  }
  const token = sessionStorage.getItem("token");
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
};

export const apiFetch = async <T = any>(endpoint: string, options: RequestInit = {}, isFormData = false): Promise<T> => {
  const url = getApiUrl(endpoint);
  const headers = { ...getHeaders(isFormData), ...(options.headers as Record<string, string>) };

  try {
    const res = await fetch(url, { ...options, headers });

    if (res.status === 401) {
      sessionStorage.removeItem("token");
      sessionStorage.removeItem("user");
      toastStore.add("Sesi berakhir, silakan masuk lagi", "warning");
      window.location.hash = "#/login";
    }

    const rawText = await res.text();
    let json: any = null;

    try {
      json = JSON.parse(rawText);
    } catch {
      if (!res.ok) {
        throw new ApiError(
          res.status === 404 ? "Data atau endpoint tidak ditemukan (404)" : rawText || "Gagal menghubungi server",
          undefined,
          res.status
        );
      }
      return rawText as unknown as T;
    }

    if (json && json.success === false) {
      throw new ApiError(json.error?.message || "Terjadi kesalahan pada server", json.error?.code, res.status);
    }
    if (!res.ok) {
      throw new ApiError(json?.message || json?.error?.message || "Gagal menghubungi server", undefined, res.status);
    }

    return json?.data !== undefined ? json.data : json;
  } catch (err: any) {
    if (err instanceof ApiError) throw err;
    throw new ApiError(err.message || "Gagal terhubung ke jaringan");
  }
};

export const apiUploadWithProgress = async <T = any>(
  endpoint: string,
  formData: FormData,
  onProgress?: (percent: number) => void,
  method: "POST" | "PUT" = "POST"
): Promise<T> => {
  return new Promise((resolve, reject) => {
    const url = getApiUrl(endpoint);
    const xhr = new XMLHttpRequest();
    xhr.open(method, url);

    const token = sessionStorage.getItem("token");
    if (token) {
      xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    }

    if (xhr.upload && onProgress) {
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const percent = Math.round((e.loaded / e.total) * 100);
          onProgress(percent);
        }
      };
    }

    xhr.onload = () => {
      if (xhr.status === 401) {
        sessionStorage.removeItem("token");
        sessionStorage.removeItem("user");
        toastStore.add("Sesi berakhir, silakan masuk lagi", "warning");
        window.location.hash = "#/login";
      }

      try {
        const json = JSON.parse(xhr.responseText);
        if (json.success === false) {
          reject(new ApiError(json.error?.message || "Terjadi kesalahan pada server", json.error?.code, xhr.status));
        } else if (xhr.status < 200 || xhr.status >= 300) {
          reject(new ApiError(json.message || json.error?.message || "Gagal mengunggah berkas", undefined, xhr.status));
        } else {
          resolve(json.data !== undefined ? json.data : json);
        }
      } catch {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(xhr.responseText as unknown as T);
        } else {
          const errText = xhr.responseText ? xhr.responseText.slice(0, 150) : "Gagal mengunggah berkas";
          reject(new ApiError(errText, undefined, xhr.status));
        }
      }
    };

    xhr.onerror = () => reject(new ApiError("Gagal terhubung ke jaringan"));
    xhr.send(formData);
  });
};

export const api = {
  get: <T = any>(endpoint: string) => apiFetch<T>(endpoint, { method: "GET" }),
  post: <T = any>(endpoint: string, body?: any) =>
    apiFetch<T>(endpoint, { method: "POST", body: body !== undefined ? JSON.stringify(body) : undefined }),
  put: <T = any>(endpoint: string, body?: any) =>
    apiFetch<T>(endpoint, { method: "PUT", body: body !== undefined ? JSON.stringify(body) : undefined }),
  patch: <T = any>(endpoint: string, body?: any) =>
    apiFetch<T>(endpoint, { method: "PATCH", body: body !== undefined ? JSON.stringify(body) : undefined }),
  delete: <T = any>(endpoint: string) => apiFetch<T>(endpoint, { method: "DELETE" }),
  upload: <T = any>(endpoint: string, formData: FormData, onProgress?: (percent: number) => void, method: "POST" | "PUT" = "POST") =>
    apiUploadWithProgress<T>(endpoint, formData, onProgress, method),
};
