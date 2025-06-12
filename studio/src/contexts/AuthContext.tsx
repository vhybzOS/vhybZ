import React, { createContext, useContext } from "react";
import { useSession, signIn, signOut } from "../lib/auth";

interface AuthContextType {
  user: any;
  loading: boolean;
  signIn: (provider: string) => Promise<void>;
  signOut: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const { data: session, isPending: loading } = useSession();

  const handleSignIn = async (provider: string) => {
    await signIn.social({ provider });
  };

  const handleSignOut = async () => {
    await signOut();
  };

  const value: AuthContextType = {
    user: session?.user ?? null,
    loading,
    signIn: handleSignIn,
    signOut: handleSignOut,
    isAuthenticated: !!session?.user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};