import { createContext, useContext, useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { db, useCollection } from './db';

const SESSION = 'jp-rentacar-session';
const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const users = useCollection('users');
  const [userId, setUserId] = useState(() => {
    try { return localStorage.getItem(SESSION); } catch { return null; }
  });
  const user = users.find((u) => u.id === userId) || null;

  useEffect(() => {
    try { userId ? localStorage.setItem(SESSION, userId) : localStorage.removeItem(SESSION); } catch { /* ignore */ }
  }, [userId]);

  // blocked users are signed out
  useEffect(() => { if (user && user.status === 'blocked') setUserId(null); }, [user]);

  const api = {
    user,
    isAdmin: user && (user.role === 'admin' || user.role === 'staff'),
    login(email, password) {
      const u = db.all('users').find((x) => x.email.toLowerCase() === email.trim().toLowerCase());
      if (!u || u.password !== password) throw new Error('That email and password don’t match an account.');
      if (u.status === 'blocked') throw new Error('This account has been suspended. Please contact us.');
      setUserId(u.id);
      db.update('users', u.id, { lastLogin: new Date().toISOString() });
      return u;
    },
    register({ name, email, phone, country, password }) {
      if (db.all('users').some((x) => x.email.toLowerCase() === email.trim().toLowerCase())) throw new Error('An account with this email already exists. Try signing in.');
      const u = db.create('users', { role: 'customer', name, email: email.trim(), phone, country, password, status: 'active', documents: [], favorites: [], avatar: '' }, 'usr');
      db.notify('admin', 'New customer', `${name} created an account.`, '/admin/customers');
      setUserId(u.id);
      return u;
    },
    logout() { setUserId(null); },
    updateMe(patch) { if (user) db.update('users', user.id, patch); },
    toggleFavorite(vehicleId) {
      if (!user) return false;
      const fav = user.favorites || [];
      db.update('users', user.id, { favorites: fav.includes(vehicleId) ? fav.filter((f) => f !== vehicleId) : [...fav, vehicleId] });
      return true;
    },
  };
  return <AuthCtx.Provider value={api}>{children}</AuthCtx.Provider>;
}

export const useAuth = () => useContext(AuthCtx);

export function RequireAuth({ children, admin = false }) {
  const { user, isAdmin } = useAuth();
  const loc = useLocation();
  if (!user) return <Navigate to={`/login?next=${encodeURIComponent(loc.pathname)}`} replace />;
  if (admin && !isAdmin) return <Navigate to="/account" replace />;
  return children;
}
