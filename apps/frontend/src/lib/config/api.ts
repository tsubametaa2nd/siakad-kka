// Konfigurasi Core Penghubung API Backend & Environment Variables
export const API_BASE_URL: string = (import.meta.env.VITE_API_URL as string) || "/api";

// Menggabungkan API_BASE_URL dari .env dengan endpoint path
export const getApiUrl = (endpoint: string): string => {
  if (endpoint.startsWith("http://") || endpoint.startsWith("https://")) {
    return endpoint;
  }
  const cleanBase = API_BASE_URL.replace(/\/+$/, "");
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  return `${cleanBase}${cleanEndpoint}`;
};
