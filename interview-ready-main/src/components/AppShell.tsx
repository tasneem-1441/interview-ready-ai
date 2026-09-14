import { Link } from "@tanstack/react-router";
import { BrainCircuit, Cloud, Home, LineChart, LogIn, LogOut, Sparkles, User } from "lucide-react";
import type { ReactNode } from "react";
import { signOut, useAuth } from "@/lib/use-auth";
import { AiKeyModal } from "./AiKeyModal";

const NAV = [
  { to: "/", label: "Overview", icon: Home },
  { to: "/prepare", label: "Prepare", icon: Sparkles },
  { to: "/progress", label: "Progress", icon: LineChart },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const { user } = useAuth();

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto grid w-full max-w-5xl grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-4 py-3 sm:px-6">
          <Link to="/" className="flex min-w-0 items-center gap-2.5">
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <BrainCircuit className="size-5" />
            </span>
            <span className="min-w-0">
              <span className="block truncate font-display text-base font-bold leading-tight">
                NCS <span className="text-gradient">InterviewReady AI</span>
              </span>
              <span className="hidden text-xs text-muted-foreground sm:block">
                Job fit, mock interview and readiness scoring
              </span>
            </span>
          </Link>

          <div className="flex items-center gap-2">
            <nav aria-label="Main" className="hidden items-center gap-1 sm:flex">
              {NAV.map(({ to, label }) => (
                <Link
                  key={to}
                  to={to}
                  activeOptions={{ exact: to === "/" }}
                  activeProps={{ className: "bg-secondary text-foreground" }}
                  inactiveProps={{ className: "text-muted-foreground hover:bg-secondary/70" }}
                  className="rounded-lg px-3 py-2 text-sm font-medium transition-colors"
                >
                  {label}
                </Link>
              ))}
            </nav>

            <AiKeyModal />

            {/* Account authentication widget */}
            {user ? (
              <div className="flex items-center gap-2 pl-2 sm:border-l sm:border-border">
                <div
                  className="hidden sm:flex items-center gap-1 text-[11px] font-semibold text-success bg-success/10 px-2 py-0.5 rounded-full"
                  title="Cloud sync enabled"
                >
                  <Cloud className="size-3" /> Synced
                </div>
                <span
                  className="max-w-[110px] truncate text-xs font-semibold text-foreground hidden sm:inline"
                  title={user.email}
                >
                  {(user.user_metadata?.["display_name"] as string | undefined) ||
                    user.email?.split("@")[0]}
                </span>
                <button
                  type="button"
                  onClick={() => void signOut()}
                  title="Sign out"
                  className="rounded-lg border border-border px-2.5 py-1 text-xs font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                >
                  <LogOut className="size-3.5 inline mr-1" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </div>
            ) : (
              <Link
                to="/auth"
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/20 transition-colors"
              >
                <LogIn className="size-3.5" />
                <span>Sign In</span>
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-28 pt-6 sm:px-6 sm:pb-16">
        {children}
      </main>

      {/* Mobile bottom navigation */}
      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur sm:hidden"
      >
        <ul className="mx-auto flex max-w-md">
          {NAV.map(({ to, label, icon: Icon }) => (
            <li key={to} className="flex-1">
              <Link
                to={to}
                activeOptions={{ exact: to === "/" }}
                activeProps={{ className: "text-primary" }}
                inactiveProps={{ className: "text-muted-foreground" }}
                className="flex min-h-14 flex-col items-center justify-center gap-1 text-xs font-medium"
              >
                <Icon className="size-5" aria-hidden="true" />
                {label}
              </Link>
            </li>
          ))}
          <li className="flex-1">
            <Link
              to="/auth"
              activeOptions={{ exact: true }}
              activeProps={{ className: "text-primary" }}
              inactiveProps={{ className: "text-muted-foreground" }}
              className="flex min-h-14 flex-col items-center justify-center gap-1 text-xs font-medium"
            >
              {user ? <User className="size-5" /> : <LogIn className="size-5" />}
              {user ? "Account" : "Sign In"}
            </Link>
          </li>
        </ul>
      </nav>

      <footer className="hidden border-t border-border py-6 text-center text-xs text-muted-foreground sm:block">
        {user ? (
          <span className="text-success font-medium">
            ✓ Cloud sync active — your attempts are safely backed up to your account.
          </span>
        ) : (
          "Runs securely in your browser — sign in anytime to sync your progress to the cloud."
        )}
      </footer>
    </div>
  );
}
