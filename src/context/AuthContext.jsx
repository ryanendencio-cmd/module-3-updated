import { createContext, useContext, useState, useEffect } from 'react';
import { loginUser, getMe, logout as apiLogout } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMe()
      .then(data => setUser(data))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  async function login(email, password) {
    try {
      const data = await loginUser(email, password);
      setUser(data);
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err.message || 'Invalid email or password.' };
    }
  }

  async function logout() {
    try { await apiLogout(); } catch {}
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
