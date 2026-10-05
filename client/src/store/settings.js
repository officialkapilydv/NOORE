import { create } from 'zustand';
import { api } from '@/lib/api';
import defaults from '@shared/content/settings.json';
import pageDefaults from '@shared/content/pages.json';

/** Site settings managed from the admin panel; defaults render instantly, API refreshes. */
export const useSettings = create((set) => ({
  settings: defaults,
  pages: pageDefaults.map(({ body, ...p }) => p),
  loaded: false,
  load: async () => {
    try {
      const [settings, pages] = await Promise.all([api.settings(), api.pages()]);
      set({ settings: { ...defaults, ...settings }, pages: pages.items, loaded: true });
    } catch {
      set({ loaded: true });
    }
  },
}));

export const useSetting = (selector) => useSettings((s) => selector(s.settings));
