// Everything personal on the home page lives here. Edit freely.

export const profile = {
  name: "John George",
  firstName: "John",
  roles: ["AI Engineer", "Agentic Systems Builder", "Senior Manager at Tata Motors"],
  email: "johngeorge242001@gmail.com",
  location: "Kochi, IN",
  timeZone: "Asia/Kolkata",
  github: "jgcarti123-cyber",
  summary:
    "AI Engineer and Agentic Systems Builder, and Senior Manager at Tata Motors, building intelligent solutions that solve real-world business problems.",
};

export type Project = {
  slug: string;
  title: string;
  tagline: string;
  icon: IconName;
  year: string;
  role?: string;
  /** Screenshot in /public/work. Without one, a typographic tile is drawn. Points may use **bold**. */
  image?: string;
  /** Filled automatically from every image in /public/work/<slug>/ (see src/lib/gallery.ts). */
  images?: string[];
  /** A demo video, picked up from /public/work/<slug>/ like the images. */
  video?: string;
  /** Wider detail sheet with points in two columns (for big projects with a video). */
  wide?: boolean;
  /** Tint for the generated tile. */
  accent?: string;
  links?: { label: string; href: string }[];
  /** A live website: its first screen stands in for the demo video and opens the site when clicked. */
  site?: { href: string; preview: string };
  stack: string[];
  points: string[];
};

export type IconName =
  | "paw"
  | "robot"
  | "check"
  | "bag"
  | "cpu"
  | "chat"
  | "code"
  | "car"
  | "graduation"
  | "envelope"
  | "github"
  | "linkedin";

/**
 * Company project, so there is no public link. The demo video and any screenshots are read from
 * public/work/aiva/ (aiva.mp4, 1.png, 2.png, …) and appear in the preview card and the detail sheet.
 * Keep hostnames, names and internal identifiers out of the screenshots, the repo is public.
 */
const aiva: Project = {
  slug: "aiva",
  title: "AIVA",
  tagline: "Agentic Validation",
  icon: "robot",
  year: "2026",
  role: "Tata Motors",
  accent: "#14b8a6",
  wide: true,
  stack: ["Claude Haiku 4.5", "AWS Bedrock", "MCP", "FastAPI", "React 19", "GitLab CI", "AWS"],
  points: [
    "**Agentic validation** for connected cars: turns requirement documents, signal catalogs and real scenarios into executable **hardware-in-the-loop test cases**. Used by **25+ engineers**.",
    "**Harness**: the model proposes, code decides. Deterministic layers wrap every model call, so it never invents a signal or saves a file on its own, and **every step is logged**.",
    "**Tools**: **35+ agent tools**, each with a contract for when to call it and what it returns. One research call replaces four to six lookups, and a blocked call explains why.",
    "**MCP**: Jira and Confluence through **Atlassian's Rovo MCP server**, using a hand-written JSON-RPC client that refuses any tool not on a **read-only allowlist**.",
    "**Context**: each turn starts with one call that gathers requirements, docs, Jira tests and signals, grounded in **700 requirement chunks** and **3,200+ real scenarios**.",
    "**Security**: credentials live only in the server's environment, never in the browser, repo or logs. **Role-based sign-in**, sandboxed reports and a **write guard** on real data.",
    "**Human in the loop**: four gates on every case (grounding, executable steps, duplicates, review). Nothing releases itself, and a **HIL run** needs a person's click.",
    "**Quality**: **2,600+ automated tests**, golden conversations replayed after every prompt change, and about **a minute per case** across **6 vehicle programs**.",
  ],
};

export const featured: Project[] = [
  aiva,
  {
    slug: "prim-pets",
    title: "Prim Pets",
    tagline: "Concierge AI for pet care",
    icon: "paw",
    year: "2026",
    role: "Personal",
    accent: "#8b5cf6",
    links: [{ label: "Visit site", href: "https://whoof-chatbot-nict.vercel.app" }],
    site: { href: "https://whoof-chatbot-nict.vercel.app", preview: "/work/prim-pets-site.jpg" },
    stack: ["Node.js", "PostgreSQL", "Hybrid RAG", "Render"],
    points: [
      "An AI assistant for pet owners, answering questions from a knowledge base of 200+ veterinary documents using hybrid vector + keyword search.",
      "Persistent memory remembers each pet's history across conversations without reprocessing past chats.",
      "Concierge features like vet booking drafts and nearby-place recommendations, grounded in verified data.",
      "Hardened in production: fixed a stored-XSS bug, added rate limiting, and resolved an out-of-memory crash under load.",
    ],
  },
  {
    slug: "swiggy-agent",
    title: "Swiggy MCP Agent",
    tagline: "Screenshot-to-cart shopping",
    icon: "bag",
    year: "2026",
    role: "Personal",
    accent: "#fc8019",
    links: [
      { label: "View on GitHub", href: "https://github.com/jgcarti123-cyber/Swiggy_agent" },
    ],
    stack: ["Node.js", "React", "SQLite", "MCP", "Groq Llama-4 Scout", "Tavily"],
    points: [
      "Shopping assistant on Swiggy's official MCP servers that turns free text and photos into real Food and Instamart orders.",
      "Cut interaction latency by 98% (129s → ~2s) by moving to a deterministic-first hybrid architecture.",
      "Screenshot-to-cart vision pipeline, a web-grounded recipe engine, and a fail-safe scheduler with idempotent retries — it can add to a cart but never place an order.",
    ],
  },
];

export const work: Project[] = [aiva];

export const experience = [
  {
    title: "AI Full-Stack Engineer",
    subtitle: "Tata Motors · Senior Manager",
    period: "2025 — Now",
    icon: "car" as IconName,
  },
  {
    title: "Graduate Engineer Trainee",
    subtitle: "Tata Motors · Telematics",
    period: "2024 — 25",
    icon: "car" as IconName,
  },
  {
    title: "NIT Calicut",
    subtitle: "B.Tech, Electrical & Electronics",
    period: "2020 — 24",
    icon: "graduation" as IconName,
  },
];

export const connect = [
  {
    title: profile.email,
    subtitle: "Email",
    href: `mailto:${profile.email}`,
    icon: "envelope" as IconName,
  },
  {
    title: profile.github,
    subtitle: "GitHub",
    href: `https://github.com/${profile.github}`,
    icon: "github" as IconName,
  },
  {
    title: "john-george",
    subtitle: "LinkedIn",
    href: "https://www.linkedin.com/in/john-george-0239b723a",
    icon: "linkedin" as IconName,
  },
];
