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
    
    const { data, error } = await supabase
      .from("employees")
      .select(`
        id,
        name,
        email,
        role_id,
        is_active,
        role:roles(name)
      `)
      .eq("id", userId)
      .single();

    console.log("[Auth] Employee fetch result:", { data, error });

    if (error) {
      console.error("[Auth] Error fetching employee:", error.message, "code:", (error as any).code);
      setEmployee(null);
      setAuthError("Failed to load user profile");
      return;
    }

    if (!data) {
      console.error("[Auth] No employee data found for userId:", userId);
      setEmployee(null);
      setAuthError("User profile not found");
      return;
    }

    // Validate is_active before setting
    if (!data.is_active) {
      console.error("[Auth] Employee is inactive, clearing session");
      setEmployee(null);
      setAuthError("Your account has been deactivated");
      await supabase.auth.signOut();
      return;
    }

    const emp = {
      ...data,
      role: Array.isArray(data.role) ? data.role[0] : data.role,
    } as Employee & { role: { name: string } | null };
    console.log("[Auth] Employee loaded:", emp.role?.name);
    employeeRef.current = emp;
    setEmployee(emp);
    setAuthError(null); // Clear any previous auth errors
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

    // Fetch employee and validate in one go
    const { data: emp, error: empError } = await supabase
      .from("employees")
      .select(`
        id,
        name,
        email,
        role_id,
        is_active,
        role:roles(name)
      `)
      .eq("id", data.user.id)
      .single();

    console.log("[Auth] Employee query result:", { emp, empError });

    if (empError || !emp) {
      console.error("[Auth] Employee not found or error:", empError);
      await supabase.auth.signOut();
      throw new Error("Access denied. Contact admin.");
    }

    if (!emp.is_active) {
      console.error("[Auth] Employee is inactive");
      await supabase.auth.signOut();
      throw new Error("Your account is deactivated.");
    }

    // Set employee state
    const employee = {
      ...emp,
      role: Array.isArray(emp.role) ? emp.role[0] : emp.role,
    } as Employee & { role: { name: string } | null };
    
    console.log("[Auth] Employee set:", employee);
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