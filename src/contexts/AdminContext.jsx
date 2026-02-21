import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'kettlebell-admin';

const AdminContext = createContext(null);

export function AdminProvider({ children }) {
  const [isAdmin, setIsAdminState] = useState(false);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      setIsAdminState(raw === '1');
    } catch (_) {
      setIsAdminState(false);
    }
  }, []);

  const setIsAdmin = useCallback((value) => {
    setIsAdminState(!!value);
    try {
      if (value) sessionStorage.setItem(STORAGE_KEY, '1');
      else sessionStorage.removeItem(STORAGE_KEY);
    } catch (_) {}
  }, []);

  const adminLogin = useCallback((email, password) => {
    const expectedEmail = import.meta.env.VITE_ADMIN_EMAIL ?? '';
    const expectedPassword = import.meta.env.VITE_ADMIN_PASSWORD ?? '';
    const ok =
      expectedEmail &&
      expectedPassword &&
      String(email ?? '').trim() === String(expectedEmail).trim() &&
      String(password ?? '') === String(expectedPassword);
    if (ok) setIsAdmin(true);
    return ok;
  }, []);

  const adminLogout = useCallback(() => {
    setIsAdminState(false);
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch (_) {}
  }, []);

  const value = {
    isAdmin,
    adminLogin,
    adminLogout,
  };

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
}

export function useAdmin() {
  const ctx = useContext(AdminContext);
  return ctx ?? { isAdmin: false, adminLogin: () => false, adminLogout: () => {} };
}
