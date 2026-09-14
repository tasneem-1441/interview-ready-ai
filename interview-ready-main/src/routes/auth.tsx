import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowRight,
  BrainCircuit,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Lock,
  Mail,
  User,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

function GoogleIcon() {
  return (
    <svg className="size-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      />
    </svg>
  );
}

const TITLE = "Sign In — NCS InterviewReady AI";
const DESCRIPTION =
  "Sign in or create an account to save your interview practice attempts, resume analysis, and preparation plans across devices.";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  // If already logged in, redirect to preparation flow
  if (user) {
    return (
      <div className="panel mx-auto max-w-md p-6 text-center sm:p-8 space-y-4">
        <CheckCircle2 className="mx-auto size-10 text-success" />
        <h1 className="text-xl font-bold">You are already signed in</h1>
        <p className="text-sm text-muted-foreground">
          Logged in as <span className="font-semibold text-foreground">{user.email}</span>
        </p>
        <Button asChild size="lg" className="w-full">
          <Link to="/prepare">
            Go to Preparation <ArrowRight className="size-4" />
          </Link>
        </Button>
      </div>
    );
  }

  const handleGoogleSignIn = async () => {
    setError(null);
    setMessage(null);
    setGoogleLoading(true);

    try {
      const { data, error: googleError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/prepare`,
          skipBrowserRedirect: true,
        },
      });

      if (googleError) throw googleError;
      if (!data?.url) {
        throw new Error("Could not initialize Google authentication URL.");
      }

      // Pre-flight check if provider is enabled to prevent landing on a raw JSON error page
      try {
        const probe = await fetch(data.url, { method: "GET" });
        if (probe.status === 400) {
          const body = (await probe.json().catch(() => null)) as {
            msg?: string;
            error_code?: string;
          } | null;
          if (
            body?.msg?.toLowerCase().includes("not enabled") ||
            body?.error_code === "validation_failed"
          ) {
            throw new Error(
              "Google Sign-In is not enabled yet in this project's Supabase backend. Please enable the Google provider in your Supabase / Lovable Cloud dashboard (under Authentication > Providers > Google). In the meantime, you can create an account or sign in with email & password below, or Continue as Guest.",
            );
          }
        }
      } catch (probeErr) {
        if (
          probeErr instanceof Error &&
          probeErr.message.includes("Google Sign-In is not enabled")
        ) {
          throw probeErr;
        }
        // CORS or opaque redirect error means the provider is enabled and redirecting to Google
      }

      window.location.assign(data.url);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Google sign-in could not be initiated. Make sure Google provider is enabled in Supabase.",
      );
      setGoogleLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) throw signInError;
      void navigate({ to: "/prepare" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to sign in. Check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match. Please re-enter matching passwords.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    setLoading(true);

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: displayName.trim() || email.split("@")[0],
          },
        },
      });

      if (signUpError) throw signUpError;

      if (data.session) {
        void navigate({ to: "/prepare" });
      } else {
        setMessage(
          "Account created! Please check your email to confirm your account, or sign in if confirmation is disabled.",
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to sign up.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md space-y-6 pt-4 sm:pt-8">
      <div className="text-center space-y-2">
        <div className="inline-grid size-12 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
          <BrainCircuit className="size-6" />
        </div>
        <h1 className="font-display text-2xl font-bold sm:text-3xl">NCS InterviewReady AI</h1>
        <p className="text-sm text-muted-foreground">
          Sign in to sync your mock interview readiness across devices
        </p>
      </div>

      <section className="panel p-6 sm:p-8">
        <Button
          type="button"
          variant="outline"
          onClick={() => void handleGoogleSignIn()}
          disabled={googleLoading || loading}
          className="flex min-h-11 w-full items-center justify-center gap-2.5 border-border font-semibold shadow-xs hover:bg-muted/50"
        >
          {googleLoading ? <Loader2 className="size-4 animate-spin" /> : <GoogleIcon />}
          <span>Continue with Google</span>
        </Button>

        <div className="relative my-5 flex items-center justify-center">
          <div className="w-full border-t border-border" />
          <span className="absolute bg-card px-2.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            Or continue with email
          </span>
        </div>

        <Tabs
          value={tab}
          onValueChange={(v) => {
            setTab(v as "signin" | "signup");
            setError(null);
            setMessage(null);
            setShowPassword(false);
            setShowConfirmPassword(false);
          }}
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="signin" className="min-h-10">
              Sign In
            </TabsTrigger>
            <TabsTrigger value="signup" className="min-h-10">
              Create Account
            </TabsTrigger>
          </TabsList>

          {error && (
            <div
              role="alert"
              className="mt-4 flex items-start gap-2 rounded-xl border border-destructive/40 bg-destructive/5 p-3 text-xs text-destructive"
            >
              <AlertTriangle className="mt-0.5 size-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {message && (
            <div
              role="status"
              className="mt-4 flex items-start gap-2 rounded-xl border border-success/40 bg-success/5 p-3 text-xs text-success"
            >
              <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
              <span>{message}</span>
            </div>
          )}

          <TabsContent value="signin" className="mt-5 space-y-4">
            <form onSubmit={(e) => void handleSignIn(e)} className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="signin-email" className="text-xs font-semibold text-foreground">
                  Email address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 size-4 text-muted-foreground" />
                  <Input
                    id="signin-email"
                    type="email"
                    required
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="signin-password" className="text-xs font-semibold text-foreground">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 size-4 text-muted-foreground" />
                  <Input
                    id="signin-password"
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-9 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-2.5 top-2.5 rounded-md p-0.5 text-muted-foreground hover:text-foreground focus:outline-hidden"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading || !email || !password}
                className="min-h-12 w-full font-semibold"
              >
                {loading ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <KeyRound className="size-4" />
                )}
                Sign In
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="signup" className="mt-5 space-y-4">
            <form onSubmit={(e) => void handleSignUp(e)} className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="signup-name" className="text-xs font-semibold text-foreground">
                  Your Name or Handle
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-3 size-4 text-muted-foreground" />
                  <Input
                    id="signup-name"
                    type="text"
                    placeholder="e.g. Priya Sharma"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="signup-email" className="text-xs font-semibold text-foreground">
                  Email address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 size-4 text-muted-foreground" />
                  <Input
                    id="signup-email"
                    type="email"
                    required
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="signup-password" className="text-xs font-semibold text-foreground">
                  Password (minimum 6 characters)
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 size-4 text-muted-foreground" />
                  <Input
                    id="signup-password"
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={6}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-9 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-2.5 top-2.5 rounded-md p-0.5 text-muted-foreground hover:text-foreground focus:outline-hidden"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="signup-confirm-password"
                  className="text-xs font-semibold text-foreground"
                >
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 size-4 text-muted-foreground" />
                  <Input
                    id="signup-confirm-password"
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    minLength={6}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-9 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    className="absolute right-2.5 top-2.5 rounded-md p-0.5 text-muted-foreground hover:text-foreground focus:outline-hidden"
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="size-4" />
                    ) : (
                      <Eye className="size-4" />
                    )}
                  </button>
                </div>
                {confirmPassword && password !== confirmPassword && (
                  <p className="text-[11px] font-medium text-destructive">Passwords do not match</p>
                )}
                {confirmPassword && password === confirmPassword && (
                  <p className="flex items-center gap-1 text-[11px] font-medium text-success">
                    <CheckCircle2 className="size-3" /> Passwords match
                  </p>
                )}
              </div>

              <Button
                type="submit"
                disabled={
                  loading ||
                  !email ||
                  password.length < 6 ||
                  !confirmPassword ||
                  password !== confirmPassword
                }
                className="min-h-12 w-full font-semibold"
              >
                {loading ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <ArrowRight className="size-4" />
                )}
                Create Account & Sync
              </Button>
            </form>
          </TabsContent>
        </Tabs>

        <div className="mt-6 border-t border-border pt-4 text-center">
          <p className="text-xs text-muted-foreground">
            Don't want an account right now?{" "}
            <Link to="/prepare" className="font-semibold text-primary hover:underline">
              Continue as Guest
            </Link>
          </p>
          <p className="mt-1 text-[11px] text-muted-foreground">
            Guest sessions and attempts remain stored privately on this browser.
          </p>
        </div>
      </section>
    </div>
  );
}
