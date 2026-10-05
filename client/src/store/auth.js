import { create } from 'zustand';
import { api, getToken, setToken } from '@/lib/api';

export const useAuth = create((set) => ({
  user: null,
  status: getToken() ? 'loading' : 'guest',

  bootstrap: async () => {
    if (!getToken()) return set({ status: 'guest', user: null });
    try {
      const { user } = await api.me();
      set({ user, status: 'authed' });
    } catch {
      setToken(null);
      set({ user: null, status: 'guest' });
    }
  },
  login: async (payload) => {
    const { token, user } = await api.login(payload);
    setToken(token);
    set({ user, status: 'authed' });
    return user;
  },
  register: async (payload) => {
    const { token, user } = await api.register(payload);
    setToken(token);
    set({ user, status: 'authed' });
    return user;
  },
  logout: () => {
    setToken(null);
    set({ user: null, status: 'guest' });
  },
}));
