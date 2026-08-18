import { create } from 'zustand';

const getStoredAuth = () => {
  try {
    const token =
      localStorage.getItem('libro_token') ||
      sessionStorage.getItem('libro_token');

    const storedUser =
      localStorage.getItem('libro_user') ||
      sessionStorage.getItem('libro_user');

    if (!token || !storedUser) {
      return {
        user: null,
        role: null,
        token: null,
        isAuthenticated: false,
      };
    }

    const user = JSON.parse(storedUser);

    return {
      user,
      role: user?.role || null,
      token,
      isAuthenticated: true,
    };
  } catch (error) {
    console.error('Failed to restore Libro session:', error);

    return {
      user: null,
      role: null,
      token: null,
      isAuthenticated: false,
    };
  }
};

const storedAuth = getStoredAuth();

export const useLibroStore = create((set) => ({
  // Auth state
  user: storedAuth.user,
  role: storedAuth.role,
  token: storedAuth.token,
  isAuthenticated: storedAuth.isAuthenticated,

  // Set authenticated user
  setAuth: ({ user, token, remember = true }) => {
    const storage = remember
      ? localStorage
      : sessionStorage;

    storage.setItem('libro_token', token);
    storage.setItem(
      'libro_user',
      JSON.stringify(user)
    );

    set({
      user,
      role: user?.role || null,
      token,
      isAuthenticated: true,
    });
  },

  // Update role
  setRole: (role) =>
    set((state) => ({
      role,
      user: state.user
        ? {
            ...state.user,
            role,
          }
        : null,
    })),

  // Logout
  logout: () => {
    localStorage.removeItem('libro_token');
    localStorage.removeItem('libro_user');

    sessionStorage.removeItem('libro_token');
    sessionStorage.removeItem('libro_user');

    set({
      user: null,
      role: null,
      token: null,
      isAuthenticated: false,
    });
  },

  // UI Drawer State for Mobile Nav
  isMobileNavOpen: false,

  toggleMobileNav: () =>
    set((state) => ({
      isMobileNavOpen: !state.isMobileNavOpen,
    })),

  closeMobileNav: () =>
    set({
      isMobileNavOpen: false,
    }),

  // Global Search Overlay State
  isSearchOpen: false,

  toggleSearch: () =>
    set((state) => ({
      isSearchOpen: !state.isSearchOpen,
    })),

  setSearchOpen: (open) =>
    set({
      isSearchOpen: open,
    }),
}))