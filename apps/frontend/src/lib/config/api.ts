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
