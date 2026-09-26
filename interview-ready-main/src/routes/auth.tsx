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
  const { user, signIn, signUp, triggerGoogleSignIn } = useAuth();
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

  // If already logged in, redirect to preparation flow
  if (user) {
    return (
      <div className="panel mx-auto max-w-md p-6 text-center sm:p-8 space-y-4 mt-6">
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
    setGoogleLoading(true);

    const safetyTimer = setTimeout(() => {
      setGoogleLoading(false);
    }, 30000);

    try {
      await triggerGoogleSignIn();
      clearTimeout(safetyTimer);
      void navigate({ to: "/prepare" });
    } catch (err: unknown) {
      clearTimeout(safetyTimer);
      console.error("[Google Sign-In]", err);
      setError(err instanceof Error ? err.message : "Google Sign-In failed or popup was closed.");
    } finally {
      clearTimeout(safetyTimer);
      setGoogleLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await signIn(email, password);
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
      await signUp(email, password, displayName);
      void navigate({ to: "/prepare" });
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
          Sign in to save and sync your mock interview readiness scores to MongoDB
        </p>
      </div>

      <section className="panel p-6 sm:p-8">
        {/* DIRECT GOOGLE SIGN-IN BUTTON */}
        <Button
          type="button"
          variant="outline"
          onClick={() => void handleGoogleSignIn()}
          disabled={googleLoading || loading}
          className="flex min-h-11 w-full items-center justify-center gap-2.5 border-border font-semibold shadow-xs hover:bg-muted/50 cursor-pointer"
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
          }}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2 rounded-xl">
            <TabsTrigger value="signin" className="rounded-lg text-xs font-semibold">
              Sign In
            </TabsTrigger>
            <TabsTrigger value="signup" className="rounded-lg text-xs font-semibold">
              Create Account
            </TabsTrigger>
          </TabsList>

          {error && (
            <div
              role="alert"
              className="mt-4 flex items-start gap-2 rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive"
            >
              <AlertTriangle className="size-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* SIGN IN TAB */}
          <TabsContent value="signin" className="mt-5 space-y-4">
            <form onSubmit={handleSignIn} className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="signin-email" className="text-xs font-semibold text-foreground">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 size-4 text-muted-foreground" />
                  <Input
                    id="signin-email"
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="signin-password"
                    className="text-xs font-semibold text-foreground"
                  >
                    Password
                  </label>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 size-4 text-muted-foreground" />
                  <Input
                    id="signin-password"
                    type={showPassword ? "text" : "password"}
                    required
                    autoComplete="current-password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-9 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-2.5 top-2.5 rounded-md p-0.5 text-muted-foreground hover:text-foreground focus:outline-none"
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
                  <Loader2 className="size-4 animate-spin mr-2" />
                ) : (
                  <KeyRound className="size-4 mr-2" />
                )}
                Sign In & Continue
              </Button>
            </form>
          </TabsContent>

          {/* SIGN UP TAB */}
          <TabsContent value="signup" className="mt-5 space-y-4">
            <form onSubmit={handleSignUp} className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="signup-name" className="text-xs font-semibold text-foreground">
                  Your Name (optional)
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-3 size-4 text-muted-foreground" />
                  <Input
                    id="signup-name"
                    type="text"
                    autoComplete="name"
                    placeholder="Jane Doe"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="signup-email" className="text-xs font-semibold text-foreground">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 size-4 text-muted-foreground" />
                  <Input
                    id="signup-email"
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="signup-password" className="text-xs font-semibold text-foreground">
                  Password (min 6 characters)
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 size-4 text-muted-foreground" />
                  <Input
                    id="signup-password"
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={6}
                    autoComplete="new-password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-9 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-2.5 top-2.5 rounded-md p-0.5 text-muted-foreground hover:text-foreground focus:outline-none"
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
                    autoComplete="new-password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-9 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    className="absolute right-2.5 top-2.5 rounded-md p-0.5 text-muted-foreground hover:text-foreground focus:outline-none"
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
                  <Loader2 className="size-4 animate-spin mr-2" />
                ) : (
                  <ArrowRight className="size-4 mr-2" />
                )}
                Create Account & Continue
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </section>
    </div>
  );
}
