import { useMemo, useState } from "react";
import {
  ArrowRight,
  Briefcase,
  Building2,
  ClipboardPaste,
  Filter,
  MapPin,
  Search,
} from "lucide-react";
import { NCS_VACANCIES, type Vacancy } from "@/lib/interview-data";
import { extractSkills, type TargetJob } from "@/lib/target-job";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

export function TargetJobStep({
  initial,
  onNext,
}: {
  initial: TargetJob | null;
  onNext: (job: TargetJob) => void;
}) {
  const [vacancyId, setVacancyId] = useState<string>(
    initial?.source === "ncs"
      ? (NCS_VACANCIES.find((v) => v.title === initial.title)?.id ?? "")
      : "",
  );
  const [custom, setCustom] = useState(initial?.source === "custom" ? initial.description : "");
  const [tab, setTab] = useState<"ncs" | "custom">(initial?.source === "custom" ? "custom" : "ncs");
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");

  const categories = useMemo(() => {
    const set = new Set<string>();
    NCS_VACANCIES.forEach((v) => {
      if (v.category) set.add(v.category);
    });
    return ["All", ...Array.from(set)];
  }, []);

  const filteredVacancies = useMemo(() => {
    return NCS_VACANCIES.filter((v) => {
      const matchesCategory = categoryFilter === "All" || v.category === categoryFilter;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        v.title.toLowerCase().includes(q) ||
        v.org.toLowerCase().includes(q) ||
        v.location.toLowerCase().includes(q) ||
        v.skills.some((s) => s.toLowerCase().includes(q));
      return matchesCategory && matchesSearch;
    });
  }, [categoryFilter, searchQuery]);

  const vacancy: Vacancy | undefined = NCS_VACANCIES.find((v) => v.id === vacancyId);
  const customReady = custom.trim().length >= 60;
  const canContinue = tab === "ncs" ? Boolean(vacancy) : customReady;

  const submit = () => {
    if (tab === "custom" && customReady) {
      const firstLine = (custom.trim().split("\n")[0] ?? "").slice(0, 60);
      onNext({
        title: firstLine || "Pasted job description",
        org: "External employer",
        description: custom.trim(),
        skills: extractSkills(custom),
        source: "custom",
      });
      return;
    }
    if (vacancy) {
      onNext({
        title: vacancy.title,
        org: vacancy.org,
        location: vacancy.location,
        description: vacancy.description,
        skills: vacancy.skills,
        source: "ncs",
      });
    }
  };

  return (
    <section className="panel p-5 sm:p-7">
      <header className="mb-5">
        <p className="eyebrow">Step 1 of 5</p>
        <h2 className="mt-1 text-2xl font-bold">Pick your target job</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Everything after this — your fit score, the interview questions and your practice plan —
          is built from this job description.
        </p>
      </header>

      <Tabs value={tab} onValueChange={(v) => setTab(v as "ncs" | "custom")}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="ncs" className="min-h-10">
            NCS vacancies
          </TabsTrigger>
          <TabsTrigger value="custom" className="min-h-10">
            Paste a job ad
          </TabsTrigger>
        </TabsList>

        <TabsContent value="ncs" className="mt-4 space-y-3">
          {/* Search and Category Filtering */}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search vacancies by title, skill, or city…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-10 pl-9 text-xs"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="flex items-center gap-1 text-[11px] font-semibold text-muted-foreground mr-1">
              <Filter className="size-3" /> Filter:
            </span>
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategoryFilter(cat)}
                className={cn(
                  "rounded-full px-2.5 py-0.5 text-[11px] font-medium transition-colors",
                  categoryFilter === cat
                    ? "bg-primary text-primary-foreground font-bold shadow-xs"
                    : "bg-secondary text-muted-foreground hover:text-foreground",
                )}
              >
                {cat}
              </button>
            ))}
          </div>

          <div>
            <label
              htmlFor="vacancy"
              className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground"
            >
              Choose from ({filteredVacancies.length} vacancies found)
            </label>
            <Select value={vacancyId} onValueChange={setVacancyId}>
              <SelectTrigger id="vacancy" className="h-12 w-full">
                <SelectValue placeholder="Select an NCS vacancy…" />
              </SelectTrigger>
              <SelectContent>
                {filteredVacancies.map((v) => (
                  <SelectItem key={v.id} value={v.id}>
                    {v.title} — {v.org} ({v.location})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {vacancy ? (
            <div className="mt-4 rounded-xl border border-primary/30 bg-primary/5 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                  <span className="flex items-center gap-1.5 font-semibold text-foreground">
                    <Briefcase className="size-4 text-primary" aria-hidden="true" /> {vacancy.title}
                  </span>
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Building2 className="size-3.5" aria-hidden="true" /> {vacancy.org}
                  </span>
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <MapPin className="size-3.5" aria-hidden="true" /> {vacancy.location}
                  </span>
                </div>
                {vacancy.category && (
                  <span className="rounded-md border border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                    {vacancy.category}
                  </span>
                )}
              </div>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {vacancy.description}
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {vacancy.skills.map((s) => (
                  <span
                    key={s}
                    className="rounded-md bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <p className="mt-4 rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
              No vacancy selected yet. Pick one to see the role's required skills.
            </p>
          )}
        </TabsContent>

        <TabsContent value="custom" className="mt-4">
          <label htmlFor="jd" className="mb-2 flex items-center gap-2 text-sm font-medium">
            <ClipboardPaste className="size-4 text-primary" aria-hidden="true" /> Job description
            text
          </label>
          <Textarea
            id="jd"
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            rows={9}
            placeholder="Paste the full job ad here (at least 60 characters)…"
            className="resize-y text-sm"
          />
          <p className={cn("mt-1 text-xs", customReady ? "text-success" : "text-muted-foreground")}>
            {customReady
              ? `Detected skills: ${extractSkills(custom).join(", ")}`
              : `${custom.trim().length}/60 characters`}
          </p>
        </TabsContent>
      </Tabs>

      <Button
        size="lg"
        disabled={!canContinue}
        onClick={submit}
        className="mt-6 min-h-12 w-full text-base font-semibold"
      >
        Continue to resume check <ArrowRight className="size-4" aria-hidden="true" />
      </Button>
      {!canContinue && (
        <p className="mt-2 text-center text-xs text-muted-foreground">
          {tab === "ncs"
            ? "Select a vacancy to continue."
            : "Paste at least 60 characters to continue."}
        </p>
      )}
    </section>
  );
}
