import { create } from 'zustand';
import { auth as authApi } from '../api/client';

export const useAuthStore = create((set, get) => ({
  token: localStorage.getItem('wastewise.token') || null,
  user: JSON.parse(localStorage.getItem('wastewise.user') || 'null'),
  selectedCampusId: localStorage.getItem('wastewise.campusId') || null,

  setSession: ({ token, user }) => {
    localStorage.setItem('wastewise.token', token);
    localStorage.setItem('wastewise.user', JSON.stringify(user));
    const campusId = user?.campusIds?.[0]?.toString?.() || user?.campusIds?.[0] || null;
    if (campusId) localStorage.setItem('wastewise.campusId', campusId);
    set({ token, user, selectedCampusId: campusId || get().selectedCampusId });
  },

  setSelectedCampus: (id) => {
    localStorage.setItem('wastewise.campusId', id);
    set({ selectedCampusId: id });
  },

  refresh: async () => {
    if (!get().token) return;
    try {
      const { user } = await authApi.me();
      localStorage.setItem('wastewise.user', JSON.stringify(user));
      set({ user });
    } catch {
      get().logout();
    }
  },

  logout: () => {
    localStorage.removeItem('wastewise.token');
    localStorage.removeItem('wastewise.user');
    localStorage.removeItem('wastewise.campusId');
    set({ token: null, user: null, selectedCampusId: null });
  },
}));
