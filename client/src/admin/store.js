import { create } from 'zustand';
import { adminApi, adminToken, onUnauthorized } from './api';

export const useAdminAuth = create((set) => ({
  admin: null,
  status: adminToken.get() ? 'loading' : 'guest',
  bootstrap: async () => {
    if (!adminToken.get()) return set({ status: 'guest' });
    try {
      const { admin } = await adminApi.me();
      set({ admin, status: 'authed' });
    } catch {
      adminToken.set(null);
      set({ admin: null, status: 'guest' });
    }
  },
  login: async (payload) => {
    const { token, admin } = await adminApi.login(payload);
    adminToken.set(token);
    set({ admin, status: 'authed' });
  },
  logout: () => {
    adminToken.set(null);
    set({ admin: null, status: 'guest' });
  },
}));

onUnauthorized(() => useAdminAuth.getState().logout());
