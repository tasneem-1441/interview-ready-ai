import { useState, useEffect } from "react";
import { Key, Sparkles, Check, Trash2, ExternalLink, ShieldCheck, Cpu } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function AiKeyModal() {
  const [open, setOpen] = useState(false);
  const [key, setKey] = useState("");
  const [savedKey, setSavedKey] = useState<string | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("GEMINI_API_KEY");
      setSavedKey(stored || null);
      if (stored) setKey(stored);
    }
  }, [open]);

  const handleSave = () => {
    if (typeof window !== "undefined") {
      const trimmed = key.trim();
      if (trimmed) {
        localStorage.setItem("GEMINI_API_KEY", trimmed);
        setSavedKey(trimmed);
      } else {
        localStorage.removeItem("GEMINI_API_KEY");
        setSavedKey(null);
      }
      setSavedSuccess(true);
      setTimeout(() => {
        setSavedSuccess(false);
        setOpen(false);
      }, 1000);
    }
  };

  const handleClear = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("GEMINI_API_KEY");
      setSavedKey(null);
      setKey("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary/60 px-2.5 py-1 text-xs font-medium text-foreground hover:bg-secondary transition-colors"
          title="Configure AI Engine"
        >
          {savedKey ? (
            <>
              <Sparkles className="size-3 text-primary" />
              <span className="hidden sm:inline">AI: Gemini Live</span>
              <span className="sm:hidden">Gemini</span>
            </>
          ) : (
            <>
              <Cpu className="size-3 text-muted-foreground" />
              <span className="hidden sm:inline">AI: Built-in Engine</span>
              <span className="sm:hidden">Built-in</span>
            </>
          )}
        </button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Key className="size-5 text-primary" /> AI Engine Settings
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Switch between the resilient built-in STAR evaluator and real-time Google Gemini AI.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2 text-sm">
          {/* Active status */}
          <div className="rounded-xl border border-border bg-secondary/40 p-3.5 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Active Evaluation Mode</p>
              <p className="text-sm font-semibold flex items-center gap-1.5 mt-0.5 text-foreground">
                {savedKey ? (
                  <>
                    <Sparkles className="size-4 text-primary" /> Google Gemini (2.0 Flash)
                  </>
                ) : (
                  <>
                    <ShieldCheck className="size-4 text-primary" /> Built-in Offline STAR Engine
                  </>
                )}
              </p>
            </div>
            <span
              className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                savedKey ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
              }`}
            >
              {savedKey ? "Online AI" : "Offline Resilient"}
            </span>
          </div>

          <div className="space-y-2">
            <label htmlFor="gemini-key" className="text-xs font-semibold text-foreground">
              Google Gemini API Key (Optional)
            </label>
            <div className="relative">
              <Input
                id="gemini-key"
                type="password"
                placeholder="AQ..."
                value={key}
                onChange={(e) => setKey(e.target.value)}
                className="pr-10 font-mono text-xs"
              />
              {key && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  title="Clear key"
                >
                  <Trash2 className="size-4" />
                </button>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground flex items-center justify-between">
              <span>Your key is stored privately in this browser.</span>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-primary hover:underline font-medium"
              >
                Get free key <ExternalLink className="size-3" />
              </a>
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-border">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClear}
            disabled={!savedKey}
            className="text-xs text-muted-foreground"
          >
            Reset to Offline
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleSave}
            className="min-w-24 text-xs font-semibold"
          >
            {savedSuccess ? (
              <>
                <Check className="size-3.5 mr-1" /> Saved!
              </>
            ) : (
              "Save Settings"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
