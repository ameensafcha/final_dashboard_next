"use client";

import { createContext, useContext, useEffect, useState, useRef, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { useQueryClient } from "@tanstack/react-query";

interface AuthContextType {
  user: User | null;
  employee: any | null;
  role: string | null;
  permissions: string[];
  isLoading: boolean;
  authError: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [employee, setEmployee] = useState<any>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const fetchEmployee = async () => {
    try {
      const response = await fetch('/api/auth/employee');
      
      // Check if response is HTML instead of JSON
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        console.error("Received non-JSON response from server");
        return;
      }

      const data = await response.json();
      if (response.ok) {
        setEmployee(data);
        setPermissions(data.permissions || []);
      } else {
        if (response.status === 401) await logout();
      }
    } catch (err) {
      console.error("Fetch Error:", err);
    }
  };

  const login = async (email: string, password: string) => {
    setAuthError(null);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    await fetchEmployee();
    queryClient.invalidateQueries();
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setEmployee(null);
    setPermissions([]);
    setUser(null);
    queryClient.clear();
  };

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      if (session) await fetchEmployee();
      setIsLoading(false);
    };

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (event === 'SIGNED_IN') fetchEmployee();
      if (event === 'SIGNED_OUT') {
        setEmployee(null);
        setPermissions([]);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, employee, role: employee?.role, permissions, isLoading, authError, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};