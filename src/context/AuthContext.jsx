// AuthContext.jsx  –  Global login/logout state
// Authenticates via POST /api/login/ (real backend)

import { createContext, useContext, useState } from 'react';
import { loginUser } from '../services/api';

const STORAGE_KEY = 'inventrack_user';

// ── Context ───────────────────────────────────────────────────────────────────
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // ── Restore session from localStorage on first load ───────────────────────
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Returns { ok: true } or { ok: false, error: 'message' }
  async function login(username, password) {
    try {
      const data = await loginUser(username, password);

      // Backend may return: { token, user: {...} }  OR  { token, name, role, ... }
      const userData = {
        name:     data.user?.name     ?? data.name     ?? username,
        role:     data.user?.role     ?? data.role     ?? 'User',
        username: data.user?.username ?? data.username ?? username,
        email:    data.user?.email    ?? data.email    ?? '',
        token:    data.token          ?? data.access   ?? null,  // JWT or DRF token
      };

      setUser(userData);
      // Persist so page refresh keeps user logged in
      localStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err.message || 'Invalid username or password.' };
    }
  }

  function logout() {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook – use anywhere:  const { user, login, logout } = useAuth();
export function useAuth() {
  return useContext(AuthContext);
}
