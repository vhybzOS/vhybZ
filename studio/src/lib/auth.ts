import { createAuthClient } from "better-auth/react";

const getApiUrl = () => {
  if (typeof window !== "undefined") {
    return window.location.hostname === "localhost" 
      ? "http://localhost:8000"
      : "https://vhybz-server.deno.dev";
  }
  return process.env.NODE_ENV === "production"
    ? "https://vhybz-server.deno.dev"
    : "http://localhost:8000";
};

export const authClient = createAuthClient({
  baseURL: getApiUrl(),
  credentials: "include",
});

export const {
  signIn,
  signOut,
  signUp,
  useSession,
  getSession,
} = authClient;