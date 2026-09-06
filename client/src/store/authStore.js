import { create } from 'zustand';
import api from '../services/api';

export const useAuthStore = create((set) => ({
  user: null,
  accessToken: null,
  loading: true,

  setAuth: (user, accessToken) => set({ user, accessToken, loading: false }),

  clearAuth: () => set({ user: null, accessToken: null, loading: false }),

  checkAuth: async () => {
    set({ loading: true });
    try {
      const { data } = await api.post('/auth/refresh');
      set({ user: data.user, accessToken: data.accessToken, loading: false });
      return data.user;
    } catch (error) {
      set({ user: null, accessToken: null, loading: false });
      return null;
    }
  }
}));
