export const db = {
  async get(k: string) {
    try {
      const r = localStorage.getItem(k);
      return r ? JSON.parse(r) : null;
    } catch (_) {
      return null;
    }
  },
  async set(k: string, v: any) {
    try {
      localStorage.setItem(k, JSON.stringify(v));
    } catch (_) {}
  },
  // Shared storage is not natively supported in standard localStorage, 
  // but we can simulate it or use a specific key prefix.
  // For this environment, we'll just use localStorage with a prefix.
  async getShared(k: string) {
    try {
      const r = localStorage.getItem("shared_" + k);
      return r ? JSON.parse(r) : null;
    } catch (_) {
      return null;
    }
  },
  async setShared(k: string, v: any) {
    try {
      localStorage.setItem("shared_" + k, JSON.stringify(v));
    } catch (_) {}
  },
};
