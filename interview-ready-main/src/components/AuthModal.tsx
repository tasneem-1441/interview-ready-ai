import { useState } from "react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  defaultTab?: "signin" | "signup";
}

export function AuthModal({
  open,
  onOpenChange,
  onSuccess,
  defaultTab = "signin",
}: AuthModalProps) {
  const { signIn, signUp, triggerGoogleSignIn } = useAuth();
  const [tab, setTab] = useState<"signin" | "signup">(defaultTab);

  // Form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetForm = () => {
    setError(null);
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setDisplayName("");
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setGoogleLoading(true);

    const safetyTimer = setTimeout(() => {
      setGoogleLoading(false);
    }, 30000);

    try {
      await triggerGoogleSignIn();
      clearTimeout(safetyTimer);
      resetForm();
      onOpenChange(false);
      onSuccess?.();
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
      resetForm();
      onOpenChange(false);
      onSuccess?.();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await signUp(email, password, displayName);
      resetForm();
      onOpenChange(false);
      onSuccess?.();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create account.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md sm:rounded-2xl p-6">
        <DialogHeader className="text-center sm:text-center">
          <div className="mx-auto grid size-11 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-sm mb-2">
            <BrainCircuit className="size-6" />
          </div>
          <DialogTitle className="text-xl font-bold tracking-tight">
            {tab === "signin" ? "Sign in to InterviewReady" : "Create your account"}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Sign in is required to start interview preparation and save your progress to MongoDB.
          </DialogDescription>
        </DialogHeader>

        {/* DIRECT GOOGLE SIGN-IN BUTTON */}
        <div className="mt-1">
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

          <div className="relative my-4 flex items-center justify-center">
            <div className="w-full border-t border-border" />
            <span className="absolute bg-background px-2.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Or continue with email
            </span>
          </div>
        </div>

        <Tabs
          value={tab}
          onValueChange={(val) => {
            setTab(val as "signin" | "signup");
            setError(null);
          }}
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
            <div className="mt-3 flex items-start gap-2 rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">
              <AlertTriangle className="size-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* SIGN IN TAB */}
          <TabsContent value="signin" className="mt-4">
            <form onSubmit={handleSignIn} className="space-y-3.5">
              <div className="space-y-1.5 text-left">
                <label
                  htmlFor="modal-signin-email"
                  className="text-xs font-semibold text-foreground"
                >
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 size-4 text-muted-foreground" />
                  <Input
                    id="modal-signin-email"
                    type="email"
                    required
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-9 text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1.5 text-left">
                <label
                  htmlFor="modal-signin-password"
                  className="text-xs font-semibold text-foreground"
                >
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 size-4 text-muted-foreground" />
                  <Input
                    id="modal-signin-password"
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-9 pr-10 text-sm"
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
                className="mt-2 min-h-11 w-full font-semibold"
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
          <TabsContent value="signup" className="mt-4">
            <form onSubmit={handleSignUp} className="space-y-3.5">
              <div className="space-y-1.5 text-left">
                <label
                  htmlFor="modal-signup-name"
                  className="text-xs font-semibold text-foreground"
                >
                  Your Name (optional)
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-3 size-4 text-muted-foreground" />
                  <Input
                    id="modal-signup-name"
                    type="text"
                    placeholder="Jane Doe"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="pl-9 text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1.5 text-left">
                <label
                  htmlFor="modal-signup-email"
                  className="text-xs font-semibold text-foreground"
                >
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 size-4 text-muted-foreground" />
                  <Input
                    id="modal-signup-email"
                    type="email"
                    required
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-9 text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1.5 text-left">
                <label
                  htmlFor="modal-signup-password"
                  className="text-xs font-semibold text-foreground"
                >
                  Password (min 6 characters)
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 size-4 text-muted-foreground" />
                  <Input
                    id="modal-signup-password"
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={6}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-9 pr-10 text-sm"
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

              <div className="space-y-1.5 text-left">
                <label
                  htmlFor="modal-signup-confirm"
                  className="text-xs font-semibold text-foreground"
                >
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 size-4 text-muted-foreground" />
                  <Input
                    id="modal-signup-confirm"
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    minLength={6}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-9 pr-10 text-sm"
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
                {confirmPassword && password === confirmPassword && (
                  <p className="flex items-center gap-1 text-[11px] font-medium text-success">
                    <CheckCircle2 className="size-3" /> Passwords match
                  </p>
                )}
              </div>

              <Button
                type="submit"
                disabled={loading || !email || password.length < 6 || password !== confirmPassword}
                className="mt-2 min-h-11 w-full font-semibold"
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
      </DialogContent>
    </Dialog>
  );
}
