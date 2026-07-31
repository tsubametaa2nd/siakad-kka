// Fitur: utilitas format tanggal WIB & hitung mundur
export const formatDateTimeWIB = (utcIsoString: string | undefined | null): string => {
  if (!utcIsoString) return "-";
  const date = new Date(utcIsoString);
  if (isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

export const formatFullDateTimeWIB = (utcIsoString: string | undefined | null): string => {
  if (!utcIsoString) return "-";
  const date = new Date(utcIsoString);
  if (isNaN(date.getTime())) return "-";
  const formatted = new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
  return `${formatted} WIB`;
};

export const formatDateWIB = (utcIsoString: string | undefined | null): string => {
  if (!utcIsoString) return "-";
  const date = new Date(utcIsoString);
  if (isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
};

export const formatTimeRemaining = (utcIsoDeadline: string | undefined | null): string => {
  if (!utcIsoDeadline) return "-";
  const deadline = new Date(utcIsoDeadline).getTime();
  const now = Date.now();
  const diffMs = deadline - now;

  if (diffMs <= 0) {
    const pastMs = Math.abs(diffMs);
    const pastHours = Math.floor(pastMs / (1000 * 60 * 60));
    const pastDays = Math.floor(pastHours / 24);
    if (pastDays > 0) return `Lewat ${pastDays} hari`;
    if (pastHours > 0) return `Lewat ${pastHours} jam`;
    const pastMinutes = Math.floor((pastMs % (1000 * 60 * 60)) / (1000 * 60));
    return `Lewat ${pastMinutes || 1} menit`;
  }

  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;

  if (days > 0) return `${days} hari ${remainingHours} jam lagi`;
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  if (hours > 0) return `${hours} jam ${minutes} menit lagi`;
  return `${minutes} menit lagi`;
};

export const isDeadlineUrgent = (utcIsoDeadline: string | undefined | null): boolean => {
  if (!utcIsoDeadline) return false;
  const deadline = new Date(utcIsoDeadline).getTime();
  const now = Date.now();
  const diffMs = deadline - now;
  return diffMs > 0 && diffMs < 24 * 60 * 60 * 1000;
};

export const localToUtcIso = (datetimeLocalStr: string): string => {
  if (!datetimeLocalStr) return '';
  return new Date(datetimeLocalStr).toISOString();
};

export const utcIsoToLocalDatetime = (utcIsoString: string | undefined | null): string => {
  if (!utcIsoString) return '';
  const date = new Date(utcIsoString);
  if (isNaN(date.getTime())) return '';
  const pad = (num: number) => String(num).padStart(2, '0');
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

/** Mengubah detik ke format "Xm Yd" (contoh: "2m 35d") */
export const formatTimeTaken = (totalSeconds: number | null | undefined): string => {
  if (totalSeconds == null || totalSeconds < 0) return '-';
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes === 0) return `${seconds}d`;
  return `${minutes}m ${seconds}d`;
};

