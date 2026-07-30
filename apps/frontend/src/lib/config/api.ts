// Konfigurasi Core Penghubung API Backend & Environment Variables
export const API_BASE_URL: string = (() => {
  const envUrl = (import.meta.env.VITE_API_URL as string) || "";
  if (!envUrl) return "/api";
  const clean = envUrl.replace(/\/+$/, "");
  return clean.endsWith("/api") ? clean : `${clean}/api`;
})();

// Menggabungkan API_BASE_URL dari .env dengan endpoint path
export const getApiUrl = (endpoint: string): string => {
  if (endpoint.startsWith("http://") || endpoint.startsWith("https://")) {
    return endpoint;
  }
  const cleanBase = API_BASE_URL.replace(/\/+$/, "");
  let cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  
  // Mencegah duplikasi /api/api
  if (cleanBase.endsWith("/api") && cleanEndpoint.startsWith("/api/")) {
    cleanEndpoint = cleanEndpoint.substring(4);
  }
  
  return `${cleanBase}${cleanEndpoint}`;
};

export const getFileUrl = (url?: string | null): string => {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:")) {
    return url;
  }

  const cleanPath = url.startsWith("/") ? url : `/${url}`;
  const envUrl = (import.meta.env.VITE_API_URL as string) || "";

  if (envUrl) {
    const origin = envUrl.replace(/\/api\/?$/, "").replace(/\/+$/, "");
    return `${origin}${cleanPath}`;
  }

  if (typeof window !== "undefined") {
    if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
      return `http://localhost:3000${cleanPath}`;
    }
    return `${window.location.origin}${cleanPath}`;
  }

  return cleanPath;
};
