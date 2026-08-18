import { useLibroStore } from '@/store/useStore';

export function useAuth() {
  const user = useLibroStore((state) => state.user);
  const role = useLibroStore((state) => state.role);
  const token = useLibroStore((state) => state.token);
  const setRole = useLibroStore((state) => state.setRole);
  const setAuth = useLibroStore((state) => state.setAuth);
  const logout = useLibroStore((state) => state.logout);
  const isAuthenticated = useLibroStore(
    (state) => state.isAuthenticated
  );

  return {
    user,
    role,
    token,
    setRole,
    setAuth,
    logout,
    isStudent: role === 'student',
    isLibrarian: role === 'librarian',
    isAuthenticated,
  };
}