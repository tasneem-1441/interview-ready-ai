import { useEffect, useState, useCallback } from "react";
import {
  signInWithEmail,
  signUpWithEmail,
  signInWithGoogle,
  verifyCurrentSession,
} from "./auth.functions";

export interface AuthUser {
  id: string;
  email: string;
  displayName?: string | undefined;
}

export type AuthState = {
  loading: boolean;
  user: AuthUser | null;
  token: string | null;
};

const TOKEN_KEY = "AUTH_TOKEN";
const USER_KEY = "AUTH_USER";

interface GoogleNotification {
  isNotDisplayed?: () => boolean;
  isSkippedMoment?: () => boolean;
  getNotDisplayedReason?: () => string;
}

interface GoogleTokenResponse {
  access_token?: string;
  error?: string;
  error_description?: string;
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: Record<string, unknown>) => void;
          prompt: (notification?: (notification: GoogleNotification) => void) => void;
        };
        oauth2: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (response: GoogleTokenResponse) => void;
            error_callback?: (error: unknown) => void;
          }) => {
            requestAccessToken: (options?: { prompt?: string }) => void;
          };
        };
      };
    };
  }
}

function getStoredAuth(): { user: AuthUser | null; token: string | null } {
  if (typeof window === "undefined") return { user: null, token: null };
  try {
    const token = localStorage.getItem(TOKEN_KEY);
    const userRaw = localStorage.getItem(USER_KEY);
    const user = userRaw ? (JSON.parse(userRaw) as AuthUser) : null;
    return { token, user };
  } catch {
    return { user: null, token: null };
  }
}

export function notifyAuthChanged() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("auth-changed"));
  }
}

let googleScriptPromise: Promise<void> | null = null;

function loadGoogleGsiScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.google?.accounts?.oauth2 || window.google?.accounts?.id) return Promise.resolve();
  if (googleScriptPromise) return googleScriptPromise;

  googleScriptPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", (e) => reject(e));
      return;
    }
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = (e) => reject(e);
    document.head.appendChild(script);
  });

  return googleScriptPromise;
}

export function useAuth(): AuthState & {
  signIn: (e: string, p: string) => Promise<AuthUser>;
  signUp: (e: string, p: string, n?: string) => Promise<AuthUser>;
  signInWithGoogleCredential: (credential: string) => Promise<AuthUser>;
  triggerGoogleSignIn: () => Promise<AuthUser>;
  signOut: () => Promise<void>;
} {
  const [state, setState] = useState<AuthState>(() => {
    const { token, user } = getStoredAuth();
    return {
      loading: Boolean(token && !user),
      token,
      user,
    };
  });

  const syncFromStorage = useCallback(() => {
    const { token, user } = getStoredAuth();
    setState({
      loading: false,
      token,
      user,
    });
  }, []);

  useEffect(() => {
    syncFromStorage();

    const handleStorage = () => syncFromStorage();
    window.addEventListener("storage", handleStorage);
    window.addEventListener("auth-changed", handleStorage);

    // If token exists, verify in background once on mount
    const { token } = getStoredAuth();
    if (token) {
      verifyCurrentSession({ data: { token } })
        .then((res) => {
          if (res.valid && res.user) {
            localStorage.setItem(USER_KEY, JSON.stringify(res.user));
            setState({ loading: false, token, user: res.user });
          } else {
            localStorage.removeItem(TOKEN_KEY);
            localStorage.removeItem(USER_KEY);
            setState({ loading: false, token: null, user: null });
            notifyAuthChanged();
          }
        })
        .catch(() => {
          setState((s) => ({ ...s, loading: false }));
        });
    } else {
      setState((s) => ({ ...s, loading: false }));
    }

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("auth-changed", handleStorage);
    };
  }, [syncFromStorage]);

  const signIn = useCallback(async (email: string, pass: string) => {
    const res = await signInWithEmail({
      data: { email, password: pass },
    });
    localStorage.setItem(TOKEN_KEY, res.token);
    localStorage.setItem(USER_KEY, JSON.stringify(res.user));
    setState({ loading: false, token: res.token, user: res.user });
    notifyAuthChanged();
    return res.user;
  }, []);

  const signUp = useCallback(async (email: string, pass: string, name?: string) => {
    const res = await signUpWithEmail({
      data: { email, password: pass, displayName: name },
    });
    localStorage.setItem(TOKEN_KEY, res.token);
    localStorage.setItem(USER_KEY, JSON.stringify(res.user));
    setState({ loading: false, token: res.token, user: res.user });
    notifyAuthChanged();
    return res.user;
  }, []);

  const signInWithGoogleCredential = useCallback(async (credential: string) => {
    const res = await signInWithGoogle({
      data: { credential },
    });
    localStorage.setItem(TOKEN_KEY, res.token);
    localStorage.setItem(USER_KEY, JSON.stringify(res.user));
    setState({ loading: false, token: res.token, user: res.user });
    notifyAuthChanged();
    return res.user;
  }, []);

  const triggerGoogleSignIn = useCallback(async (): Promise<AuthUser> => {
    await loadGoogleGsiScript();

    const clientId =
      (typeof window !== "undefined" &&
        ((window as any).VITE_GOOGLE_CLIENT_ID || localStorage.getItem("GOOGLE_CLIENT_ID"))) ||
      import.meta.env["VITE_GOOGLE_CLIENT_ID"];

    if (!clientId) {
      throw new Error(
        "Google Client ID is not configured. Please add VITE_GOOGLE_CLIENT_ID to your .env file or sign in with email and password below.",
      );
    }

    return new Promise((resolve, reject) => {
      let isSettled = false;

      const safeResolve = (u: AuthUser) => {
        if (!isSettled) {
          isSettled = true;
          resolve(u);
        }
      };

      const safeReject = (err: any) => {
        if (!isSettled) {
          isSettled = true;
          reject(err instanceof Error ? err : new Error(String(err)));
        }
      };

      try {
        // Preferred modern method: Google OAuth2 popup client
        if (window.google?.accounts?.oauth2) {
          const client = window.google.accounts.oauth2.initTokenClient({
            client_id: clientId,
            scope: "email profile openid",
            callback: async (tokenResponse: any) => {
              if (tokenResponse.error) {
                safeReject(new Error(tokenResponse.error_description || tokenResponse.error));
                return;
              }
              try {
                const res = await signInWithGoogle({
                  data: { accessToken: tokenResponse.access_token },
                });
                localStorage.setItem(TOKEN_KEY, res.token);
                localStorage.setItem(USER_KEY, JSON.stringify(res.user));
                setState({ loading: false, token: res.token, user: res.user });
                notifyAuthChanged();
                safeResolve(res.user);
              } catch (backendErr) {
                safeReject(backendErr);
              }
            },
            error_callback: (err: any) => {
              safeReject(new Error(err?.message || "Google sign-in popup was cancelled."));
            },
          });

          client.requestAccessToken({ prompt: "select_account" });
          return;
        }

        // Fallback: Google ID Token One-Tap
        if (window.google?.accounts?.id) {
          window.google.accounts.id.initialize({
            client_id: clientId,
            callback: async (response: { credential: string }) => {
              try {
                const u = await signInWithGoogleCredential(response.credential);
                safeResolve(u);
              } catch (err) {
                safeReject(err);
              }
            },
          });

          window.google.accounts.id.prompt((notification: any) => {
            if (notification?.isNotDisplayed?.() || notification?.isSkippedMoment?.()) {
              const reason = notification?.getNotDisplayedReason?.() || "not displayed";
              safeReject(
                new Error(
                  `Google prompt was not displayed (${reason}). Please check your Authorized JavaScript origins in Google Cloud Console.`,
                ),
              );
            }
          });
          return;
        }

        throw new Error("Google Identity Services script failed to load. Please refresh the page.");
      } catch (err) {
        safeReject(err);
      }
    });
  }, [signInWithGoogleCredential]);

  const handleSignOut = useCallback(async () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setState({ loading: false, token: null, user: null });
    notifyAuthChanged();
  }, []);

  return {
    ...state,
    signIn,
    signUp,
    signInWithGoogleCredential,
    triggerGoogleSignIn,
    signOut: handleSignOut,
  };
}

export async function signOut() {
  if (typeof window !== "undefined") {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    notifyAuthChanged();
  }
}
