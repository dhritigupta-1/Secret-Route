import { create } from 'zustand';

const getInitialUser = () => {
  try {
    const item = localStorage.getItem('user');
    return item ? JSON.parse(item) : null;
  } catch {
    return null;
  }
};

export const useAuthStore = create((set) => ({
  user: getInitialUser(),
  refreshToken: localStorage.getItem('refreshToken') || null,
  setUser: (userData, refreshToken) => {
    if (userData) {
      localStorage.setItem('user', JSON.stringify(userData));
      if (refreshToken) {
        localStorage.setItem('refreshToken', refreshToken);
      }
    } else {
      localStorage.removeItem('user');
      localStorage.removeItem('refreshToken');
    }
    set({ user: userData, refreshToken: refreshToken || null });
  },
  logout: () => {
    localStorage.removeItem('user');
    localStorage.removeItem('refreshToken');
    set({ user: null, refreshToken: null });
  }
}));
