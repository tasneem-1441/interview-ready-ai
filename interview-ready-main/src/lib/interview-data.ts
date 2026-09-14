export type Vacancy = {
  id: string;
  title: string;
  org: string;
  location: string;
  category?: string;
  description: string;
  skills: string[];
};

export const NCS_VACANCIES: Vacancy[] = [
  {
    id: "ncs-fsd-01",
    title: "Full Stack Developer",
    org: "Bharat Digital Services Pvt Ltd",
    location: "Pune, MH",
    category: "Software Engineering",
    description:
      "Build and maintain customer-facing web platforms using React, Node.js and PostgreSQL. Own REST API design, write unit tests, and collaborate with product in an Agile squad. Exposure to Docker and cloud deployment preferred.",
    skills: [
      "React",
      "Node.js",
      "PostgreSQL",
      "REST APIs",
      "Docker",
      "Unit Testing",
      "Agile",
      "Git",
    ],
  },
  {
    id: "ncs-da-02",
    title: "Data Analyst",
    org: "National Skill Analytics Cell",
    location: "New Delhi, DL",
    category: "Data & Analytics",
    description:
      "Analyse labour market datasets, build dashboards and present insights to programme officers. Strong SQL and Excel required; Python and Power BI desirable. Must communicate findings to non-technical stakeholders.",
    skills: [
      "SQL",
      "Excel",
      "Python",
      "Power BI",
      "Statistics",
      "Data Storytelling",
      "Stakeholder Communication",
    ],
  },
  {
    id: "ncs-cs-03",
    title: "Customer Success Executive",
    org: "Sarathi Fintech Solutions",
    location: "Bengaluru, KA",
    category: "Operations & Support",
    description:
      "Own onboarding and retention for SMB accounts. Handle escalations, track CRM hygiene, and drive renewals. Requires excellent spoken communication, empathy and structured follow-up discipline.",
    skills: [
      "CRM",
      "Communication",
      "Escalation Handling",
      "Account Management",
      "Empathy",
      "Reporting",
    ],
  },
  {
    id: "ncs-qa-04",
    title: "QA Automation Engineer",
    org: "Meghdoot Systems",
    location: "Hyderabad, TS",
    category: "Software Engineering",
    description:
      "Design automated regression suites with Selenium/Playwright, integrate them into CI pipelines and triage defects. Familiarity with API testing and performance basics is a plus.",
    skills: [
      "Selenium",
      "Playwright",
      "CI/CD",
      "API Testing",
      "Defect Triage",
      "JavaScript",
      "Attention to Detail",
    ],
  },
  {
    id: "ncs-cld-05",
    title: "Cloud & DevOps Engineer",
    org: "National e-Governance Infrastructure Cell",
    location: "New Delhi, DL",
    category: "Infrastructure & Cloud",
    description:
      "Provision and monitor scalable cloud infrastructure for government citizen portals. Manage Kubernetes clusters, write Terraform modules, maintain CI/CD pipelines, and ensure high availability.",
    skills: ["AWS", "Kubernetes", "Terraform", "Docker", "CI/CD", "Linux", "Monitoring", "Git"],
  },
  {
    id: "ncs-sec-06",
    title: "Cybersecurity Analyst",
    org: "SecureBharat Defence Tech",
    location: "Bengaluru, KA",
    category: "Security & Operations",
    description:
      "Monitor security operations center alerts, triage threat vectors, perform vulnerability assessments, and lead incident response. Familiarity with SIEM tooling, network analysis, and Linux is required.",
    skills: [
      "SIEM",
      "Vulnerability Assessment",
      "Incident Response",
      "Network Security",
      "Python",
      "Linux",
      "Attention to Detail",
    ],
  },
  {
    id: "ncs-ai-07",
    title: "AI / Machine Learning Engineer",
    org: "Pragati Intelligence Labs",
    location: "Pune, MH",
    category: "Data & Analytics",
    description:
      "Develop and deploy LLM applications, RAG pipelines, and predictive models. Experience with Python, PyTorch, LangChain, vector databases, and containerized model serving is expected.",
    skills: [
      "Python",
      "PyTorch",
      "LangChain",
      "Vector Databases",
      "REST APIs",
      "Docker",
      "Data Modeling",
      "Git",
    ],
  },
  {
    id: "ncs-fin-08",
    title: "Fintech Operations & Banking Officer",
    org: "Jan Dhan Digital Hub",
    location: "Mumbai, MH",
    category: "Operations & Support",
    description:
      "Coordinate payment gateway reconciliations, manage merchant KYC/AML verification workflows, handle compliance escalations, and create daily operational reporting dashboards.",
    skills: [
      "KYC/AML",
      "Reconciliation",
      "SQL",
      "Excel",
      "Communication",
      "Reporting",
      "Customer Support",
    ],
  },
];

export type SkillRow = { skill: string; kind: "matched" | "gap"; note: string };

export type ResumeAnalysis = {
  fileName: string;
  wordCount: number;
  fitScore: number;
  matched: SkillRow[];
  gaps: SkillRow[];
};

/** Alternate spellings so matching reflects how resumes are really written. */
const SKILL_ALIASES: Record<string, string[]> = {
  "Node.js": ["node.js", "nodejs", "node js", "express"],
  PostgreSQL: ["postgresql", "postgres", "psql", "rdbms"],
  "REST APIs": ["rest api", "restful", "api design", "endpoints"],
  "Unit Testing": ["unit test", "jest", "vitest", "junit", "pytest", "test coverage"],
  "CI/CD": ["ci/cd", "continuous integration", "jenkins", "github actions", "gitlab ci"],
  "Power BI": ["power bi", "powerbi", "tableau", "looker"],
  Excel: ["excel", "spreadsheet", "vlookup", "pivot table"],
  SQL: ["sql", "queries", "joins", "stored procedure"],
  Statistics: ["statistic", "regression", "a/b test", "hypothesis"],
  "Data Storytelling": ["storytelling", "insight", "narrative", "presentation"],
  "Stakeholder Communication": ["stakeholder", "cross-functional", "client-facing"],
  CRM: ["crm", "salesforce", "zoho", "hubspot"],
  "Escalation Handling": ["escalation", "conflict resolution", "grievance"],
  "Account Management": ["account management", "retention", "renewal", "upsell"],
  Empathy: ["empathy", "empathetic", "customer-first"],
  "Defect Triage": ["defect", "bug triage", "jira", "severity"],
  "API Testing": ["postman", "api testing", "contract test"],
  "Attention to Detail": ["attention to detail", "meticulous", "detail-oriented"],
  Communication: ["communication", "presented", "documented", "wrote"],
  Reporting: ["report", "dashboard", "mis"],
  Agile: ["agile", "scrum", "sprint", "kanban"],
  Git: ["git", "github", "gitlab", "version control"],
  Docker: ["docker", "container", "containers", "containerization"],
  React: ["react", "next.js", "jsx"],
  JavaScript: ["javascript", "typescript", "es6"],
  Python: ["python", "pandas", "numpy"],
  Selenium: ["selenium", "webdriver"],
  Playwright: ["playwright", "cypress", "e2e"],
  AWS: ["aws", "amazon web services", "cloud", "ec2", "s3", "lambda"],
  Kubernetes: ["kubernetes", "k8s", "helm", "eks", "gke"],
  Terraform: ["terraform", "iac", "infrastructure as code", "ansible"],
  Linux: ["linux", "ubuntu", "bash", "shell scripting", "unix"],
  Monitoring: ["monitoring", "prometheus", "grafana", "cloudwatch", "datadog"],
  SIEM: ["siem", "splunk", "qradar", "sentinel", "wazuh", "soc"],
  "Vulnerability Assessment": ["vulnerability", "vapt", "nessus", "qualys", "burp suite"],
  "Incident Response": ["incident response", "threat hunting", "forensics", "triage"],
  "Network Security": ["network security", "firewall", "wireshark", "vpn", "ids/ips"],
  PyTorch: ["pytorch", "tensorflow", "keras", "scikit-learn", "deep learning"],
  LangChain: ["langchain", "llamaindex", "rag", "prompt engineering", "genai"],
  "Vector Databases": ["vector", "pinecone", "chroma", "weaviate", "milvus", "embeddings"],
  "Data Modeling": ["data modeling", "feature engineering", "schema design"],
  "KYC/AML": ["kyc", "aml", "anti-money laundering", "compliance", "due diligence"],
  Reconciliation: ["reconciliation", "settlement", "clearing", "accounting", "ledger"],
  "Customer Support": ["customer support", "support", "helpdesk", "ticketing", "service"],
};

function termsFor(skill: string) {
  return [skill.toLowerCase(), ...(SKILL_ALIASES[skill] ?? [])];
}

/** Sentence around the first hit, so matches are shown with real evidence. */
function evidenceFor(resumeText: string, term: string) {
  const idx = resumeText.toLowerCase().indexOf(term);
  if (idx === -1) return "";
  const start = Math.max(0, resumeText.lastIndexOf(".", idx) + 1);
  const endDot = resumeText.indexOf(".", idx);
  const end = endDot === -1 ? Math.min(resumeText.length, idx + 140) : endDot;
  return resumeText.slice(start, end).trim().slice(0, 160);
}

export function analyseResume(
  fileName: string,
  resumeText: string,
  jobSkills: string[],
): ResumeAnalysis {
  const lower = resumeText.toLowerCase();
  const matched: SkillRow[] = [];
  const gaps: SkillRow[] = [];

  jobSkills.forEach((skill) => {
    const hit = termsFor(skill).find((t) => lower.includes(t));
    if (hit) {
      const evidence = evidenceFor(resumeText, hit);
      matched.push({
        skill,
        kind: "matched",
        note: evidence ? `Found in: “${evidence}”` : "Mentioned in your resume text.",
      });
    } else {
      gaps.push({
        skill,
        kind: "gap",
        note: `No mention of ${skill.toLowerCase()} (or common equivalents) in your resume text.`,
      });
    }
  });

  const fitScore = jobSkills.length ? Math.round((matched.length / jobSkills.length) * 100) : 0;

  return {
    fileName,
    wordCount: resumeText.split(/\s+/).filter(Boolean).length,
    fitScore,
    matched,
    gaps,
  };
}

export type QuestionClass = "Technical" | "HR" | "Behavioral";

export type Question = {
  id: number;
  cls: QuestionClass;
  prompt: string;
};

export type Difficulty = "easy" | "medium" | "hard";

/** Local fallback pools stratified by difficulty — used when AI generation is unavailable. */
const QUESTION_POOLS_BY_DIFFICULTY: Record<
  Difficulty,
  Record<QuestionClass, ((role: string) => string)[]>
> = {
  easy: {
    Technical: [
      (r) =>
        `What are the core programming languages or tools you feel most confident using for a ${r} role?`,
      () =>
        "Can you explain the difference between a synchronous and an asynchronous operation in simple terms?",
      (r) =>
        `What basic steps or tools do you use to test your code before sharing it with team members in a ${r} project?`,
      () =>
        "Walk me through how you typically set up your local development environment when starting a new project.",
      (r) =>
        `When you encounter a new software tool or library needed for a ${r} task, how do you go about learning it?`,
      () =>
        "What is your step-by-step process for reading an error message or stack trace when your code crashes?",
      (r) =>
        `What are the primary responsibilities of a junior ${r}, and which one are you most eager to tackle?`,
      () => "Explain what version control is and why teams use Git branching in daily development.",
    ],
    HR: [
      (r) => `Walk me through your background and what motivated you to pursue a ${r} career.`,
      () =>
        "What are your two biggest professional strengths, and what is one area you are actively trying to improve?",
      () => "What kind of team environment and management style brings out your best productivity?",
      (r) => `Where do you envision yourself growing over the next two years as a ${r}?`,
      () => "Why does this organisation and our team culture appeal to you personally?",
      () => "How do you organize your daily work when you have multiple tasks due on the same day?",
    ],
    Behavioral: [
      () =>
        "Tell me about a team project you worked on recently. What was your specific contribution to the outcome?",
      () =>
        "Describe a time when you received constructive critique from a colleague or mentor. How did you act on it?",
      () =>
        "Tell me about a challenging deadline you faced. How did you manage your time to finish on schedule?",
      () =>
        "Describe a situation where you encountered a problem you didn't know how to solve. Who did you reach out to?",
      () =>
        "Give an example of a goal you set for yourself in your last role or studies, and how you accomplished it.",
      () =>
        "Tell me about a time project requirements changed suddenly. How did you adapt your approach?",
    ],
  },
  medium: {
    Technical: [
      (r) =>
        `Walk me through a production system or feature you built closest to the ${r} role. What was your exact architectural contribution?`,
      () =>
        "Describe how you debug an issue that only appears in production under concurrent traffic and not locally.",
      (r) =>
        `Which tool or technology in the ${r} job description are you least familiar with, and how would you ramp up in two weeks?`,
      () =>
        "Tell me about a time you had to make an engineering trade-off between release speed and code quality. What did you decide?",
      (r) =>
        `How would you verify that a feature you shipped as a ${r} achieved its latency and throughput goals in production?`,
      () =>
        "Explain a complex technical concept from your recent work as if you were speaking to a non-technical stakeholder.",
      () =>
        "What was the most challenging defect or performance bottleneck you investigated? How did you isolate root cause?",
      (r) =>
        `If you joined our engineering team as a ${r} tomorrow, what architecture patterns or CI/CD pipelines would you inspect first?`,
    ],
    HR: [
      (r) =>
        `What concrete milestones do you expect to achieve during your first 90 days in this ${r} role?`,
      () =>
        "What are your compensation expectations, and how flexible are you regarding location, hybrid schedules, or shift timings?",
      (r) =>
        `Why are you transitioning towards a ${r} role at this stage of your career, and where do you want to be in 3 years?`,
      () =>
        "Walk me through your resume in two minutes, highlighting only the experiences most directly applicable to this vacancy.",
      () =>
        "What kind of manager and peer collaboration dynamic brings out your most creative and resilient work?",
      () =>
        "Is there any career gap, domain transition, or short stint in your history you would like to clarify?",
    ],
    Behavioral: [
      () =>
        "Tell me about a time you had a significant technical disagreement with a teammate under an imminent deadline. How did it end?",
      () =>
        "Describe a project failure or missed deliverable that you owned publicly. What systemic changes did you make afterwards?",
      () =>
        "Give an example of when you had to master a complex technology with zero documentation or mentorship.",
      () =>
        "Tell me about a time you had to say no, or push back against an unrealistic requirement from a senior stakeholder.",
      () =>
        "Describe a high-friction situation where you handled a dissatisfied customer or team member. How did you restore trust?",
      () =>
        "Tell me about an unexpected blocker that threatened your project roadmap. What mitigation plan did you execute?",
    ],
  },
  hard: {
    Technical: [
      (r) =>
        `Design a horizontally scalable, fault-tolerant architecture for the core ${r} pipeline. How do you handle cascading failures and network partitions?`,
      () =>
        "Walk me through how you would diagnose a non-deterministic race condition or memory leak causing sudden 99th-percentile latency spikes under peak load.",
      (r) =>
        `How would you execute a zero-downtime database schema migration on high-write tables with millions of active rows in a ${r} service?`,
      () =>
        "How do you evaluate consistency vs. availability trade-offs in distributed storage when designing services under network partition risks?",
      () =>
        "Describe a catastrophic production incident you triaged in real time. How did you coordinate containment, rollback, and root cause post-mortem?",
      (r) =>
        `How do you establish defensive boundaries, rate limiting, and circuit breakers between services to prevent cluster brownouts as a ${r}?`,
      () =>
        "How would you design a distributed cache invalidation strategy across multi-region clusters while avoiding thundering herd problems?",
      (r) =>
        `If you were tasked with slashing cloud compute and memory overhead by 40% in our ${r} infrastructure, where would you profile first?`,
    ],
    HR: [
      (r) =>
        `In this ${r} role, you will navigate conflicting mandates from executive leadership and engineering teams. How do you resolve severe organizational misalignment?`,
      () =>
        "Describe how you lead and motivate a demoralized engineering team through an intense, high-stakes turnaround period.",
      () =>
        "What is your approach to managing out or turning around an underperforming team member whose technical output is blocking critical deadlines?",
      (r) =>
        `How do you advocate for essential architectural refactoring when business stakeholders are demanding rapid feature delivery for a ${r} roadmap?`,
      () =>
        "Describe how you assess organizational risk when deciding whether to adopt bleeding-edge tools versus proven legacy infrastructure.",
      () =>
        "Tell me about a time you had to align cross-functional VP-level stakeholders who had diametrically opposed priorities.",
    ],
    Behavioral: [
      () =>
        "Tell me about a high-stakes ethical or architectural crisis where following instructions would have compromised user privacy or data integrity.",
      () =>
        "Describe a situation where a major system release you championed suffered a catastrophic public failure. How did you navigate the fallout?",
      () =>
        "Tell me about a time you mediated an intractable architectural dispute between two principal engineers with opposing technical philosophies.",
      () =>
        "Give an example of making a critical architectural decision with incomplete, ambiguous data under intense executive scrutiny.",
      () =>
        "Tell me about a time you had to convince a skeptical C-suite executive to cancel a multimillion-dollar initiative or reverse an architectural direction.",
      () =>
        "Describe how you navigated a toxic or highly politicized cross-departmental dynamic to deliver a mission-critical initiative.",
    ],
  },
};

const ORDER: QuestionClass[] = ["Technical", "Technical", "HR", "HR", "Behavioral", "Behavioral"];

/**
 * Six questions (2 per class) tailored to the chosen difficulty tier.
 * `attempt` rotates pools so a re-test never repeats, and `avoid` skips prompts already asked.
 */
export function buildQuestions(
  role: string,
  attempt = 1,
  avoid: string[] = [],
  difficulty: Difficulty = "medium",
): Question[] {
  const used = new Set(avoid.map((a) => a.trim()));
  const takenPerClass: Record<string, number> = {};
  const pools = QUESTION_POOLS_BY_DIFFICULTY[difficulty] || QUESTION_POOLS_BY_DIFFICULTY.medium;

  return ORDER.map((cls, i) => {
    const pool = pools[cls];
    const nth = takenPerClass[cls] ?? 0;
    takenPerClass[cls] = nth + 1;
    const start = ((attempt - 1) * 2 + nth) % pool.length;

    let prompt = "";
    for (let k = 0; k < pool.length; k += 1) {
      const candidate = pool[(start + k) % pool.length]!(role);
      if (!used.has(candidate.trim())) {
        prompt = candidate;
        break;
      }
    }
    if (!prompt) prompt = pool[start]!(role);
    used.add(prompt.trim());
    return { id: i + 1, cls, prompt };
  });
}

/** Turn AI-generated prompts into the Question shape the simulator renders. */
export function toQuestions(items: { cls: QuestionClass; prompt: string }[]): Question[] {
  return items.map((q, i) => ({ id: i + 1, cls: q.cls, prompt: q.prompt.trim() }));
}

export type AnswerRecord = {
  questionId: number;
  /** The question text, kept so the AI coach can score the answer in context. */
  prompt?: string;
  cls: QuestionClass;
  mode: "text" | "audio";
  text: string;
  seconds: number;
  fillerWords: number;
  fillerBreakdown?: Record<string, number>;
  longPauses: number;
  wordsPerMinute: number;
  audioUrl?: string | undefined;
};

export const FILLERS = ["um", "uh", "like", "basically", "actually", "you know", "sort of"];

export function scoreAnswer(text: string, seconds: number, mode: "text" | "audio") {
  const words = text.trim().split(/\s+/).filter(Boolean);
  const lower = ` ${text.toLowerCase()} `;
  const fillerBreakdown: Record<string, number> = {};
  let fillerWords = 0;

  if (mode === "audio") {
    FILLERS.forEach((f) => {
      const count = lower.split(` ${f} `).length - 1;
      if (count > 0) {
        fillerBreakdown[f] = count;
        fillerWords += count;
      }
    });
  }

  const longPauses = mode === "audio" ? Math.max(0, Math.round(seconds / 22) - 1) : 0;
  const wordsPerMinute =
    mode === "audio" && seconds > 0 ? Math.round((words.length / seconds) * 60) : 0;
  return { words: words.length, fillerWords, fillerBreakdown, longPauses, wordsPerMinute };
}

export const WEIGHTS = {
  resumeFit: 0.35,
  answerQuality: 0.3,
  delivery: 0.2,
  softSkills: 0.15,
} as const;

export type SubMetric = {
  key: string;
  label: string;
  score: number;
  weight: number;
  reason: string;
};

export type AnswerFeedback = {
  questionId: number;
  score: number;
  strength: string;
  improvement: string;
};

/** How clearly one STAR element came through in a behavioural answer. */
export type StarLevel = "clear" | "weak" | "missing";

export type StarBreakdown = {
  questionId: number;
  prompt: string;
  situation: StarLevel;
  task: StarLevel;
  action: StarLevel;
  result: StarLevel;
  advice: string;
};

export type AcousticSummary = {
  hasAudio: boolean;
  audioCount: number;
  textCount: number;
  avgWpm: number;
  wpmStatus: "ideal" | "hesitant" | "rushed";
  totalFillers: number;
  fillerBreakdown: Record<string, number>;
  totalPauses: number;
  totalSpeakingTimeSeconds: number;
};

export type Report = {
  readiness: number;
  metrics: SubMetric[];
  /** Present when the AI coach scored the answers. */
  aiScored?: boolean;
  feedback?: AnswerFeedback[];
  /** STAR analysis of behavioural answers. */
  star?: StarBreakdown[];
  personalizedTasks?: Task[] | undefined;
  acousticSummary?: AcousticSummary;
};

/** AI coach output used in place of the local text heuristics when available. */
export type AiScoreOverride = {
  answerQuality: number;
  softSkills: number;
  answerReason: string;
  softReason: string;
  perAnswer: AnswerFeedback[];
  star?: StarBreakdown[];
  personalizedTasks?: Task[] | undefined;
};

const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

function computeOfflineStar(answers: AnswerRecord[]): StarBreakdown[] {
  return answers
    .filter((a) => a.cls === "Behavioral")
    .map((a) => {
      const lower = a.text.toLowerCase();
      const wordCount = a.text.trim().split(/\s+/).filter(Boolean).length;

      const hasSituation =
        /when|while|during|project|client|company|role|team/i.test(lower) || wordCount > 25;
      const hasTask =
        /needed to|goal was|task|responsible|problem|objective|challenge|had to/i.test(lower) ||
        wordCount > 35;
      const hasAction =
        /i built|i designed|i implemented|i decided|i resolved|i led|i created|i coordinated|i took/i.test(
          lower,
        ) || wordCount > 40;
      const hasResult =
        /result|saved|increased|improved|reduced|delivered|metric|percent|%|achieved|outcome/i.test(
          lower,
        );

      const sit: StarLevel = hasSituation ? "clear" : wordCount > 15 ? "weak" : "missing";
      const task: StarLevel = hasTask ? "clear" : wordCount > 20 ? "weak" : "missing";
      const act: StarLevel = hasAction ? "clear" : wordCount > 25 ? "weak" : "missing";
      const res: StarLevel = hasResult ? "clear" : wordCount > 30 ? "weak" : "missing";

      let advice =
        "Structure your story with a concrete metric or business outcome to complete the STAR framework.";
      if (res === "missing" || res === "weak") {
        advice =
          "State the final quantifiable outcome (% improved, time saved, or revenue protected) so your story closes strongly.";
      } else if (act === "missing" || act === "weak") {
        advice =
          "Clarify what YOU personally did (use 'I designed/implemented') instead of speaking generally about the team.";
      } else if (sit === "missing" || sit === "weak") {
        advice =
          "Set the initial context in the first sentence: name the situation, team size, and main challenge.";
      }

      return {
        questionId: a.questionId,
        prompt: a.prompt || "Behavioral question",
        situation: sit,
        task,
        action: act,
        result: res,
        advice,
      };
    });
}

function computeOfflineFeedback(answers: AnswerRecord[]): AnswerFeedback[] {
  return answers.map((a) => {
    const wordCount = a.text.trim().split(/\s+/).filter(Boolean).length;
    let score = 72;
    let strength = "Addressed the core intent of the question with relevant context.";
    let improvement = "Incorporate specific quantitative metrics and concrete execution steps.";

    if (wordCount < 20) {
      score = 55;
      strength = "Direct answer.";
      improvement = "Elaborate further with real-world examples and step-by-step actions.";
    } else if (wordCount > 60) {
      score = 86;
      strength = "Thorough detail demonstrating solid domain comprehension and ownership.";
      improvement =
        "Practice summarizing key takeaways concisely to maintain interviewer engagement.";
    }

    return {
      questionId: a.questionId,
      score,
      strength,
      improvement,
    };
  });
}

export function buildReport(
  fit: number,
  answers: AnswerRecord[],
  ai?: AiScoreOverride | null,
  gaps?: string[],
  role?: string,
): Report {
  const totalWords = answers.reduce(
    (n, a) => n + a.text.trim().split(/\s+/).filter(Boolean).length,
    0,
  );
  const avgWords = answers.length ? totalWords / answers.length : 0;
  const structured = answers.filter((a) =>
    /because|result|so that|led to|we then|therefore|increased|reduced/i.test(a.text),
  ).length;

  const answerQuality = clamp(
    Math.min(70, (avgWords / 90) * 70) + (answers.length ? (structured / answers.length) * 30 : 0),
  );

  const audioAnswers = answers.filter((a) => a.mode === "audio");
  const textAnswers = answers.filter((a) => a.mode === "text");
  const hasAudio = audioAnswers.length > 0;

  const fillers = audioAnswers.reduce((n, a) => n + a.fillerWords, 0);
  const pauses = audioAnswers.reduce((n, a) => n + a.longPauses, 0);
  const wpmList = audioAnswers.filter((a) => a.wordsPerMinute > 0).map((a) => a.wordsPerMinute);
  const avgWpm = wpmList.length ? wpmList.reduce((a, b) => a + b, 0) / wpmList.length : 0;

  let delivery: number;
  let deliveryReason: string;

  if (hasAudio) {
    const pacePenalty = avgWpm > 0 ? Math.min(35, Math.abs(avgWpm - 135) / 2) : 0;
    delivery = clamp(100 - fillers * 4 - pauses * 5 - pacePenalty);
    deliveryReason = `${fillers} filler words, ${pauses} long pauses, average pace ${Math.round(avgWpm)} wpm (target 120-150).`;
  } else {
    // Written responses: evaluate concise structure & professional elaboration
    const concisenessScore = clamp(
      Math.min(75, (avgWords / 70) * 75) +
        (answers.length ? (structured / answers.length) * 25 : 0),
    );
    delivery = concisenessScore;
    deliveryReason = `Written responses averaged ${Math.round(avgWords)} words per answer with structured clarity. (Acoustic metrics active in Voice Mode).`;
  }

  const softSkills = clamp(
    50 +
      answers.filter((a) => a.cls === "Behavioral" && a.text.length > 180).length * 15 +
      answers.filter((a) => /team|customer|stakeholder|mentor|listen/i.test(a.text)).length * 6 -
      fillers * 2,
  );

  // The AI coach, when it ran, replaces the two content scores. Delivery stays
  // measured, and resume fit stays computed from the actual resume text.
  const finalAnswerQuality = ai ? clamp(ai.answerQuality) : answerQuality;
  const finalSoftSkills = ai ? clamp(ai.softSkills) : softSkills;

  const metrics: SubMetric[] = [
    {
      key: "resumeFit",
      label: "Resume-Job Fit",
      score: clamp(fit),
      weight: WEIGHTS.resumeFit,
      reason:
        fit >= 70
          ? "Most required skills appear with real project evidence."
          : "Several must-have skills from the job description are missing or unevidenced.",
    },
    {
      key: "answerQuality",
      label: "Interview Answer Quality",
      score: finalAnswerQuality,
      weight: WEIGHTS.answerQuality,
      reason:
        ai?.answerReason ||
        (answerQuality >= 70
          ? "Answers were detailed and connected action to outcome."
          : `Answers averaged ${Math.round(avgWords)} words with limited cause-and-effect language.`),
    },
    {
      key: "delivery",
      label: hasAudio ? "Voice / Delivery Metrics" : "Written Response Cadence",
      score: delivery,
      weight: WEIGHTS.delivery,
      reason: deliveryReason,
    },
    {
      key: "softSkills",
      label: "Soft Skills",
      score: finalSoftSkills,
      weight: WEIGHTS.softSkills,
      reason:
        ai?.softReason ||
        (softSkills >= 70
          ? "Collaboration and ownership came through in behavioural answers."
          : "Behavioural answers lacked concrete people, conflict or ownership detail."),
    },
  ];

  const readiness = clamp(metrics.reduce((sum, m) => sum + m.score * m.weight, 0));
  const fallbackStar = computeOfflineStar(answers);
  const fallbackFeedback = computeOfflineFeedback(answers);
  const starToUse = ai?.star?.length ? ai.star : fallbackStar;

  const fallbackTasks = generateDiagnosticPracticeTasks({
    role,
    gaps,
    answers,
    metrics,
    star: starToUse,
  });

  const fillerBreakdown: Record<string, number> = {};
  audioAnswers.forEach((a) => {
    if (a.fillerBreakdown) {
      Object.entries(a.fillerBreakdown).forEach(([word, count]) => {
        fillerBreakdown[word] = (fillerBreakdown[word] || 0) + count;
      });
    }
  });

  const totalSpeakingTimeSeconds = audioAnswers.reduce((n, a) => n + a.seconds, 0);
  const roundedWpm = Math.round(avgWpm);
  const wpmStatus: "ideal" | "hesitant" | "rushed" =
    roundedWpm >= 120 && roundedWpm <= 150 ? "ideal" : roundedWpm < 120 ? "hesitant" : "rushed";

  const acousticSummary: AcousticSummary = {
    hasAudio,
    audioCount: audioAnswers.length,
    textCount: textAnswers.length,
    avgWpm: roundedWpm,
    wpmStatus,
    totalFillers: fillers,
    fillerBreakdown,
    totalPauses: pauses,
    totalSpeakingTimeSeconds,
  };

  return {
    readiness,
    metrics,
    aiScored: Boolean(ai),
    feedback: ai?.perAnswer?.length ? ai.perAnswer : fallbackFeedback,
    star: starToUse,
    personalizedTasks:
      ai?.personalizedTasks && ai.personalizedTasks.length > 0
        ? ai.personalizedTasks
        : fallbackTasks,
    acousticSummary,
  };
}

export type Task = { title: string; detail: string; minutes: number; tag?: string };

export function generateDiagnosticPracticeTasks(params: {
  role?: string | undefined;
  gaps?: string[] | undefined;
  answers: AnswerRecord[];
  metrics: SubMetric[];
  star?: StarBreakdown[] | undefined;
}): Task[] {
  const { role = "Target Role", gaps = [], answers, metrics, star = [] } = params;
  const tasks: Task[] = [];

  // 1. Diagnostics from Actual Missing Resume Skills
  if (gaps.length > 0) {
    const topGaps = gaps.slice(0, 2);
    topGaps.forEach((gap) => {
      tasks.push({
        title: `Build a proof-of-concept for ${gap}`,
        detail: `Create a standalone GitHub demo project applying ${gap} in a ${role} scenario to turn this resume gap into an active interview talking point.`,
        minutes: 45,
        tag: `Skill Gap: ${gap}`,
      });
    });
  }

  // 2. Diagnostics from Speech & Acoustic Patterns
  const totalFillers = answers.reduce((n, a) => n + a.fillerWords, 0);
  if (totalFillers >= 3) {
    tasks.push({
      title: `Eliminate ${totalFillers} filler words with silent breath resets`,
      detail: `You used ${totalFillers} verbal crutches ('um', 'like', 'uh'). Practice 3 reps of answering behavioral questions, pausing silently for 1 second instead of voicing a filler.`,
      minutes: 20,
      tag: `Acoustics: ${totalFillers} Fillers Detected`,
    });
  }

  const wpmList = answers.filter((a) => a.wordsPerMinute > 0).map((a) => a.wordsPerMinute);
  const avgWpm = wpmList.length
    ? Math.round(wpmList.reduce((a, b) => a + b, 0) / wpmList.length)
    : 0;
  if (avgWpm > 0 && avgWpm < 115) {
    tasks.push({
      title: `Delivery cadence: Accelerate from ${avgWpm} to 135 WPM`,
      detail: `Your delivery averaged ${avgWpm} WPM (target is 120–150). Practice speaking with a timer to build confident, brisk momentum without hesitations.`,
      minutes: 15,
      tag: `Pacing: ${avgWpm} WPM (Hesitant)`,
    });
  } else if (avgWpm > 155) {
    tasks.push({
      title: `Delivery cadence: Decelerate from ${avgWpm} to 140 WPM`,
      detail: `You spoke at a fast pace of ${avgWpm} WPM. Practice adding deliberate micro-pauses after key concepts so interviewers have time to absorb architectural points.`,
      minutes: 15,
      tag: `Pacing: ${avgWpm} WPM (Rushed)`,
    });
  }

  const totalPauses = answers.reduce((n, a) => n + a.longPauses, 0);
  if (totalPauses >= 3) {
    tasks.push({
      title: `Structuring drill: Eliminate ${totalPauses} extended dead-air pauses`,
      detail: `You had ${totalPauses} pauses longer than 2.5s. Practice outlining your answer with a 3-part roadmap before speaking to prevent awkward silences.`,
      minutes: 20,
      tag: `Delivery: ${totalPauses} Long Pauses`,
    });
  }

  // 3. Diagnostics from Behavioral STAR Deficits
  const weakResult = star.find((s) => s.result === "missing" || s.result === "weak");
  if (weakResult) {
    tasks.push({
      title: `Quantify Result for "${weakResult.prompt.slice(0, 32)}..."`,
      detail:
        weakResult.advice ||
        "Conclude your behavioral story with explicit metrics: specify % efficiency gained, hours saved, or incidents prevented.",
      minutes: 25,
      tag: "STAR Deficit: Result Missing",
    });
  }

  const weakAction = star.find((s) => s.action === "missing" || s.action === "weak");
  if (weakAction && weakAction !== weakResult) {
    tasks.push({
      title: `Claim ownership: Shift 'We' to 'I' in behavioural story`,
      detail: `In "${weakAction.prompt.slice(0, 32)}...", highlight your personal technical decisions and individual ownership rather than describing general team actions.`,
      minutes: 20,
      tag: "STAR Deficit: Action Weak",
    });
  }

  // 4. Diagnostics from Technical Depth / Word Count
  const totalWords = answers.reduce(
    (n, a) => n + a.text.trim().split(/\s+/).filter(Boolean).length,
    0,
  );
  const avgWords = answers.length ? Math.round(totalWords / answers.length) : 0;
  if (avgWords < 45 && answers.length > 0) {
    tasks.push({
      title: `Elaborate technical responses beyond ${avgWords} words`,
      detail: `Your answers averaged only ${avgWords} words. Adopt the 'Context → Technical Mechanism → Production Impact' framework to deliver complete 90–130 word answers.`,
      minutes: 30,
      tag: "Depth: Short Answers",
    });
  }

  // Fallback to weakest pillar tasks if list is small
  const weakest = [...metrics].sort((a, b) => a.score - b.score)[0];
  if (tasks.length < 3 && weakest && TASKS_BY_METRIC[weakest.key]) {
    TASKS_BY_METRIC[weakest.key]!.forEach((t) => {
      if (!tasks.some((existing) => existing.title === t.title)) {
        tasks.push({ ...t, tag: `Priority: ${weakest.label}` });
      }
    });
  }

  return tasks.slice(0, 4);
}

export const TASKS_BY_METRIC: Record<string, Task[]> = {
  resumeFit: [
    {
      title: "Rewrite 5 resume bullets against the JD",
      detail:
        "Take the top 5 missing skills and rewrite one bullet each using: action + tool + measurable result.",
      minutes: 40,
    },
    {
      title: "Ship one small proof project",
      detail:
        "Build a tiny public repo that demonstrates your biggest gap skill, then link it in the resume header.",
      minutes: 120,
    },
    {
      title: "Keyword pass",
      detail: "Mirror the exact JD vocabulary in your skills section — no synonyms.",
      minutes: 20,
    },
  ],
  answerQuality: [
    {
      title: "STAR-ify three stories",
      detail:
        "Write Situation, Task, Action, Result for your three strongest projects. Cap each at 150 words.",
      minutes: 45,
    },
    {
      title: "Answer-length drill",
      detail:
        "Re-record your two shortest answers, targeting 90-140 words with one concrete metric each.",
      minutes: 30,
    },
    {
      title: "Close the loop",
      detail: "End every answer with the measurable outcome and what you'd do differently.",
      minutes: 15,
    },
  ],
  delivery: [
    {
      title: "Filler-word silence drill",
      detail:
        "Speak for 2 minutes and replace every 'um/like/basically' with a full stop and a breath. 5 reps.",
      minutes: 20,
    },
    {
      title: "Metronome pacing",
      detail: "Read a 200-word passage aloud timed to land between 120-150 words per minute.",
      minutes: 15,
    },
    {
      title: "Pause budgeting",
      detail: "Cap thinking pauses at 3 seconds; buy time with a one-line restatement instead.",
      minutes: 20,
    },
  ],
  softSkills: [
    {
      title: "Conflict story bank",
      detail:
        "Draft two disagreement stories where you name the other person's view before your own.",
      minutes: 30,
    },
    {
      title: "Ownership rewrite",
      detail: "Convert every 'we' in your behavioural answers into a specific 'I did X'.",
      minutes: 20,
    },
    {
      title: "Listening reps",
      detail: "Practise repeating the question back in one sentence before answering.",
      minutes: 15,
    },
  ],
};
