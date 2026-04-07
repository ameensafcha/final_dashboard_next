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
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const employeeRef = useRef<Employee | null>(null);
  const queryClient = useQueryClient();

  const fetchEmployee = async (userId: string) => {
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

    if (error) {
      console.error("Error fetching employee:", error.message, "code:", (error as any).code);
      setEmployee(null);
      employeeRef.current = null;
      return;
    }

    const emp = {
      ...data,
      role: Array.isArray(data.role) ? data.role[0] : data.role,
    } as Employee & { role: { name: string } | null };
    setEmployee(emp);
    employeeRef.current = emp;
  };

  useEffect(() => {
    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setSession(session);
        setUser(session.user);
        await fetchEmployee(session.user.id);
      }
      setIsLoading(false);
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        if (event === "SIGNED_OUT") {
          setEmployee(null);
          employeeRef.current = null;
        }

        setIsLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    if (!data.session) throw new Error("No session created");

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

    if (empError || !emp) {
      await supabase.auth.signOut();
      throw new Error("Access denied. Contact admin.");
    }

    if (!emp.is_active) {
      await supabase.auth.signOut();
      throw new Error("Your account is deactivated.");
    }

    // Set employee state
    const employee = {
      ...emp,
      role: Array.isArray(emp.role) ? emp.role[0] : emp.role,
    } as Employee & { role: { name: string } | null };
    setEmployee(employee);
    employeeRef.current = employee;

    queryClient.invalidateQueries();
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setEmployee(null);
    queryClient.clear();
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
        login,
        logout,
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