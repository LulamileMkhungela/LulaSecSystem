/* =========================================================
   LulaSecSystem — Authentication Module
   ========================================================= */

window.LulaAuth = (function () {
  'use strict';

  const SESSION_KEY = 'lulasecsystem_session';

  function getSession() {
    try {
      const raw = sessionStorage.getItem(SESSION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  }

  function setSession(user) {
    const session = {
      userId: user.id, email: user.email, name: user.name,
      role: user.role, avatar: user.avatar, title: user.title,
      site: user.site, color: user.color, loginAt: new Date().toISOString()
    };
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return session;
  }

  function clearSession() {
    sessionStorage.removeItem(SESSION_KEY);
  }

  function login(email, password) {
    const user = window.LulaDB.getUserByEmail(email);
    if (!user) return { ok: false, error: 'No account found with that email.' };
    if (user.password !== password) return { ok: false, error: 'Incorrect password. Use Demo1234!' };
    return { ok: true, user: setSession(user) };
  }

  function logout() {
    clearSession();
  }

  function isAuthenticated() {
    return !!getSession();
  }

  function requireAuth() {
    if (!isAuthenticated()) {
      window.LulaApp.showLanding();
      return false;
    }
    return true;
  }

  return { login, logout, getSession, isAuthenticated, requireAuth };
})();
