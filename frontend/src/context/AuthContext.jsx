import { createContext, useContext, useEffect, useState } from "react";
import { apiRequest, refreshSession, setAccessToken } from "../services/api.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    refreshSession().then((session) => {
      if (active) setUser(session?.user || null);
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, []);

  async function login(values) {
    const data = await apiRequest("/auth/login", { method: "POST", body: values });
    setAccessToken(data.accessToken);
    setUser(data.user);
    return data.user;
  }

  async function signup(values) {
    const data = await apiRequest("/auth/register", { method: "POST", body: values });
    setAccessToken(data.accessToken);
    setUser(data.user);
    return { user: data.user, message: data.message };
  }

  async function logout() {
    try {
      await apiRequest("/auth/logout", { method: "POST" });
    } catch { /* Clear local state even if the server is unavailable. */ }
    setAccessToken("");
    setUser(null);
  }

  function updateUser(nextUser) {
    setUser(nextUser);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, setUser: updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
