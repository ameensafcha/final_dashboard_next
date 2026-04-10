"use client";

import { createContext, useContext, useEffect, useState, useRef, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { useQueryClient } from "@tanstack/react-query";

interface Employee {
  id: string;
  name: string;
  email: string;
  role_id: string | null;
  is_active: boolean;
  role?: {
    name: string;
  } | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  employee: Employee | null;
  role: string | null;
  isLoading: boolean;
  authError: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  retryAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const employeeRef = useRef<Employee | null>(null);

  const fetchEmployee = async (userId: string) => {
    console.log("[Auth] Fetching employee for userId:", userId);
    
    // Use Prisma API route (single source of truth for role)
    const response = await fetch('/api/auth/employee');
    
    if (!response.ok) {
      if (response.status === 401) {
        console.error("[Auth] Unauthorized, clearing session");
        setEmployee(null);
        setAuthError("Session expired or unauthorized");
        await supabase.auth.signOut();
        return;
      }
      console.error("[Auth] Error fetching employee:", response.status);
      setEmployee(null);
      setAuthError("Failed to load user profile");
      return;
    }

    const data = await response.json();
    console.log("[Auth] Employee fetch result:", data);

    // Server-side is_active validation - getCurrentUser already checks this
    // But we verify the response is valid
    if (!data || !data.id) {
      console.error("[Auth] No employee data found for userId:", userId);
      setEmployee(null);
      setAuthError("User profile not found");
      return;
    }

    console.log("[Auth] Employee loaded:", data.role?.name);
    employeeRef.current = data;
    setEmployee(data);
    setAuthError(null);
  };

  useEffect(() => {
    let initialSessionHandled = false;

    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          setSession(session);
          setUser(session.user);
          await fetchEmployee(session.user.id);
          initialSessionHandled = true;
        } else {
          console.log("[Auth] No session found on init");
        }
      } catch (err) {
        console.error("[Auth] Error initializing auth:", err);
        setAuthError("Failed to initialize auth");
      }
      // Do NOT set isLoading=false here — let onAuthStateChange handle it
    };

    initAuth();

    const timeoutId = setTimeout(() => {
      console.log("[Auth] Auth timeout reached - forcing loading to false");
      setIsLoading(false);
    }, 10000);

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        // Fetch employee on SIGNED_IN if not already loaded (handles token refresh cycles)
        if (event === "SIGNED_IN" && session?.user && !employeeRef.current) {
          await fetchEmployee(session.user.id);
        }

        // Sync auth state with database on token refresh (handles role changes)
        if ((event === "TOKEN_REFRESHED" || event === "USER_UPDATED") && session?.user) {
          await fetchEmployee(session.user.id);
        }

        if (event === "SIGNED_OUT") {
          employeeRef.current = null;
          setEmployee(null);
          setAuthError(null);
        }

        setIsLoading(false);
        clearTimeout(timeoutId);
      }
    );

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeoutId);
    };
  }, []);

  const login = async (email: string, password: string) => {
    console.log("[Auth] Login attempt for:", email);
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error("[Auth] Login error:", error.message);
      throw error;
    }
    
    if (!data.session) {
      console.error("[Auth] No session created");
      throw new Error("No session created");
    }

    console.log("[Auth] Login successful, session exists");

    // Fetch employee from Prisma API route (single source of truth for role)
    const response = await fetch('/api/auth/employee');
    
    if (!response.ok) {
      await supabase.auth.signOut();
      if (response.status === 401) {
        throw new Error("Access denied. Contact admin.");
      }
      throw new Error("Failed to load user profile");
    }

    const employee = await response.json();
    console.log("[Auth] Employee loaded via API:", employee.role?.name);

    // Set employee state - is_active validation is server-side only
    setEmployee(employee);
    queryClient.invalidateQueries();
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setEmployee(null);
    setAuthError(null);
    queryClient.clear();
  };

  const retryAuth = async () => {
    setAuthError(null);
    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setSession(session);
        setUser(session.user);
        await fetchEmployee(session.user.id);
      } else {
        setAuthError("Session expired");
      }
    } catch (err) {
      console.error("[Auth] Retry auth error:", err);
      setAuthError("Failed to restore session");
    } finally {
      setIsLoading(false);
    }
  };

  const role = employee?.role?.name ?? null;

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        employee,
        role,
        isLoading,
        authError,
        login,
        logout,
        retryAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}