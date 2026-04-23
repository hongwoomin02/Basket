import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { authApi } from "../lib/api";

interface AuthUser {
  id: string;
  email: string;
  role: "USER" | "OWNER" | "ADMIN" | "ORGANIZER" | "OPS" | "PENDING_OWNER";
  displayName: string;
  phone: string | null;
  notificationEnabled: boolean;
}

interface AuthState {
  user: AuthUser | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      setIsLoading(false);
      return;
    }
    authApi
      .me()
      .then((data) => {
        setUser({
          id: data.id,
          email: data.email,
          role: data.role as AuthUser["role"],
          displayName: data.display_name,
          phone: data.phone,
          notificationEnabled: data.notification_enabled,
        });
      })
      .catch(() => {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
      })
      .finally(() => setIsLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const tokens = await authApi.login(email, password);
    localStorage.setItem("access_token", tokens.access_token);
    localStorage.setItem("refresh_token", tokens.refresh_token);
    const data = await authApi.me();
    setUser({
      id: data.id,
      email: data.email,
      role: data.role as AuthUser["role"],
      displayName: data.display_name,
      phone: data.phone,
      notificationEnabled: data.notification_enabled,
    });
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, isLoggedIn: !!user, isLoading, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
