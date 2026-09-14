import { create } from 'zustand';
import api from '../services/api';

const getInitialUser = () => {
  try {
    const item = localStorage.getItem('devforge_user');
    return item ? JSON.parse(item) : null;
  } catch (e) {
    return null;
  }
};

const getInitialToken = () => {
  try {
    return localStorage.getItem('devforge_token') || null;
  } catch (e) {
    return null;
  }
};

const initialUser = getInitialUser();
const initialToken = getInitialToken();

export const useAuthStore = create((set, get) => ({
  user: initialUser,
  accessToken: initialToken,
  loading: initialUser ? false : true,

  setAuth: (user, accessToken) => {
    try {
      if (user) localStorage.setItem('devforge_user', JSON.stringify(user));
      if (accessToken) localStorage.setItem('devforge_token', accessToken);
    } catch (e) {}
    set({ user, accessToken, loading: false });
  },

  clearAuth: () => {
    try {
      localStorage.removeItem('devforge_user');
      localStorage.removeItem('devforge_token');
    } catch (e) {}
    set({ user: null, accessToken: null, loading: false });
  },

  checkAuth: async () => {
    if (!get().user) {
      set({ loading: true });
    }
    try {
      const { data } = await api.post('/auth/refresh');
      if (data.user) {
        try { localStorage.setItem('devforge_user', JSON.stringify(data.user)); } catch (e) {}
      }
      if (data.accessToken) {
        try { localStorage.setItem('devforge_token', data.accessToken); } catch (e) {}
      }
      set({ user: data.user, accessToken: data.accessToken, loading: false });
      return data.user;
    } catch (error) {
      get().clearAuth();
      return null;
    }
  }
}));
