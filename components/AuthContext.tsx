"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { clearToken, getToken, setToken as persistToken } from "@/lib/auth";

type AuthState = {
  username: string | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthCtx = createContext<AuthState>({ username: null, loading: true, login: async () => {}, logout: () => {} });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [username, setUsername] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setLoading(false);
      return;
    }
    api
      .me()
      .then((me) => setUsername(me.username))
      .catch(() => clearToken())
      .finally(() => setLoading(false));
  }, []);

  const login = async (u: string, p: string) => {
    const { access_token } = await api.login(u, p);
    persistToken(access_token);
    setUsername(u);
  };

  const logout = () => {
    clearToken();
    setUsername(null);
  };

  return <AuthCtx.Provider value={{ username, loading, login, logout }}>{children}</AuthCtx.Provider>;
}

export function useAuth() {
  return useContext(AuthCtx);
}
