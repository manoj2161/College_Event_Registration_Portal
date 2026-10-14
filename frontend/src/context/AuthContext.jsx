import { createContext, useContext, useEffect, useState } from "react";

import { apiRequest, refreshSession, setAccessToken } from "../services/api.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function initializeSession() {
      try {
        const session = await refreshSession();

        if (active) {
          setUser(session?.user || null);
        }
      } catch {
        if (active) {
          setAccessToken("");
          setUser(null);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    initializeSession();

    return () => {
      active = false;
    };
  }, []);

  async function login(values) {
    const data = await apiRequest("/auth/login", {
      method: "POST",
      body: values,
    });

    if (!data?.accessToken || !data?.user) {
      throw new Error(
        "Login succeeded, but the server returned an incomplete session.",
      );
    }

    setAccessToken(data.accessToken);
    setUser(data.user);

    return data.user;
  }

  async function signup(values) {
    const data = await apiRequest("/auth/register", {
      method: "POST",
      body: values,
    });

    // Registration requires email verification before login.
    // Do not set an access token or authenticated user here.
    return {
      message:
        data.message ||
        "Registration successful. Verify your email before signing in.",
    };
  }

  async function logout() {
    try {
      await apiRequest("/auth/logout", {
        method: "POST",
      });
    } catch {
      // Clear local authentication even if the server request fails.
    } finally {
      setAccessToken("");
      setUser(null);
    }
  }

  function updateUser(nextUser) {
    setUser(nextUser);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        signup,
        logout,
        setUser: updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider.");
  }

  return context;
}
