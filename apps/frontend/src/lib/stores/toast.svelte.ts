// Fitur: store notifikasi global toast dengan Svelte 5 runes
export interface ToastItem {
  id: string;
  message: string;
  type: "info" | "success" | "danger" | "warning";
}

class ToastStore {
  toasts = $state<ToastItem[]>([]);

  add(message: string, type: "info" | "success" | "danger" | "warning" = "info", durationMs = 4000) {
    const id = crypto.randomUUID();
    this.toasts.push({ id, message, type });

    // UI-02-7: Toast bertumpuk maksimal 3; yang tertua terdorong keluar.
    if (this.toasts.length > 3) {
      this.toasts = this.toasts.slice(-3);
    }

    if (durationMs > 0) {
      setTimeout(() => this.remove(id), durationMs);
    }
  }

  remove(id: string) {
    this.toasts = this.toasts.filter((t) => t.id !== id);
  }
}

export const toastStore = new ToastStore();
