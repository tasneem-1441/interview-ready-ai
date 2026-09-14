export type TargetJob = {
  title: string;
  org: string;
  location?: string;
  description: string;
  skills: string[];
  source: "ncs" | "custom";
};

const SKILL_POOL = [
  "React",
  "Node.js",
  "PostgreSQL",
  "SQL",
  "Python",
  "Excel",
  "Power BI",
  "Docker",
  "REST APIs",
  "Unit Testing",
  "Agile",
  "Git",
  "Selenium",
  "Playwright",
  "CI/CD",
  "API Testing",
  "Statistics",
  "Communication",
  "CRM",
  "Reporting",
  "JavaScript",
  "Attention to Detail",
  "Empathy",
  "Stakeholder Communication",
  "Data Storytelling",
  "Account Management",
  "Escalation Handling",
  "Defect Triage",
];

/** Pull recognised skills out of a pasted job description. */
export function extractSkills(text: string) {
  const lower = text.toLowerCase();
  const found = SKILL_POOL.filter((s) => lower.includes(s.toLowerCase()));
  return found.length ? found : ["Communication", "Reporting", "Attention to Detail"];
}
