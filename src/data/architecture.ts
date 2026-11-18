// How each project is built, shown as an exploded stack of layers when a project is opened.
// Layers run top (what people touch) to bottom (what it stands on). Mark the model's layer with `model`,
// and the top layer with `video` to play the project's demo on it. Keep `line` to one sentence: it is the
// only prose the view shows for a layer.

export type PartKind =
  | "actor"
  | "source"
  | "service"
  | "model"
  | "tool"
  | "guard"
  | "human"
  | "store"
  | "output"
  | "quality"
  | "hardware";

export type Layer = {
  name: string;
  line: string;
  parts: { label: string; sub: string; kind: PartKind }[];
  model?: boolean;
  video?: boolean;
};

export type Arch = {
  stats: { value: string; label: string }[];
  layers: Layer[];
  /** One line under the stack: what keeps the whole thing honest. */
  footnote?: string;
  /** The ideas the build rests on, as short lines. Hints, not a walkthrough. */
  principles?: string[];
};

export const architectures: Record<string, Arch> = {
  aiva: {
    stats: [
      { value: "25+", label: "engineers use it" },
      { value: "35+", label: "agent tools" },
      { value: "2,600+", label: "automated tests" },
      { value: "~1 min", label: "per test case" },
      { value: "6", label: "vehicle programs" },
    ],
    footnote: "Underneath it all: 2,600+ tests and golden replays on every prompt change.",
    principles: [
      "The model proposes. Code decides.",
      "One call builds the whole context.",
      "Every prompt change replays the golden set.",
    ],
    layers: [
      {
        name: "Interface",
        line: "Where engineers ask, review and release.",
        video: true,
        parts: [{ label: "React 19 workspace", sub: "Role-based sign-in", kind: "actor" }],
      },
      {
        name: "Guardrails",
        line: "The model proposes, code decides. Nothing releases itself.",
        parts: [
          { label: "Harness", sub: "Every step logged", kind: "guard" },
          { label: "Human gates", sub: "4 checks per case", kind: "human" },
          { label: "MCP allowlist", sub: "Read-only tools", kind: "guard" },
          { label: "Write guard", sub: "On real data", kind: "guard" },
        ],
      },
      {
        name: "Model",
        line: "Claude Haiku 4.5 on AWS Bedrock picks the tools and drafts the case.",
        model: true,
        parts: [{ label: "Claude Haiku 4.5", sub: "AWS Bedrock", kind: "model" }],
      },
      {
        name: "Tools & context",
        line: "One call gathers everything; 35+ tools, each with a contract.",
        parts: [
          { label: "Context builder", sub: "One call per turn", kind: "service" },
          { label: "35+ agent tools", sub: "With contracts", kind: "tool" },
          { label: "FastAPI", sub: "Secrets stay server-side", kind: "service" },
        ],
      },
      {
        name: "Knowledge",
        line: "Grounded in real requirements, signals and scenarios.",
        parts: [
          { label: "Requirements", sub: "700 chunks", kind: "source" },
          { label: "Signals & scenarios", sub: "3,200+ cases", kind: "source" },
          { label: "Jira + Confluence", sub: "Via Rovo MCP", kind: "source" },
        ],
      },
    ],
  },

  "prim-pets": {
    principles: [
      "Answers come from documents, not memory.",
      "Every pet keeps its own history.",
      "Hardened in production, not in theory.",
    ],
    stats: [
      { value: "200+", label: "veterinary documents" },
      { value: "Hybrid", label: "vector + keyword search" },
      { value: "Per pet", label: "memory across chats" },
    ],
    layers: [
      {
        name: "Interface",
        line: "Owners ask anything about their pet's health and care.",
        parts: [{ label: "Pet owner chat", sub: "Live on Render", kind: "actor" }],
      },
      {
        name: "Hardening",
        line: "Fixed in production: stored XSS, rate limits, an out-of-memory crash.",
        parts: [
          { label: "Rate limiting", sub: "Per user", kind: "guard" },
          { label: "XSS-safe output", sub: "Sanitised", kind: "guard" },
        ],
      },
      {
        name: "Model",
        line: "Writes every answer from retrieved passages and the pet's history.",
        model: true,
        parts: [{ label: "LLM", sub: "Grounded answers", kind: "model" }],
      },
      {
        name: "Retrieval & tools",
        line: "Hybrid search finds the passage; concierge tools act on it.",
        parts: [
          { label: "Hybrid search", sub: "Vector + keyword", kind: "tool" },
          { label: "Pet memory", sub: "History per pet", kind: "store" },
          { label: "Concierge", sub: "Vet bookings, places", kind: "tool" },
        ],
      },
      {
        name: "Knowledge",
        line: "200+ veterinary documents in PostgreSQL.",
        parts: [{ label: "Vet knowledge base", sub: "200+ docs · PostgreSQL", kind: "source" }],
      },
    ],
  },

  "swiggy-agent": {
    principles: [
      "Rules first, model only when needed.",
      "It fills the cart. You place the order.",
      "A photo is enough to start.",
    ],
    stats: [
      { value: "98%", label: "less latency" },
      { value: "129s → 2s", label: "per interaction" },
      { value: "0", label: "orders placed by the agent" },
    ],
    layers: [
      {
        name: "Interface",
        line: "Type what you want, or drop a photo of a dish or a list.",
        parts: [{ label: "React app", sub: "Chat + live cart", kind: "actor" }],
      },
      {
        name: "Guardrails",
        line: "It fills the cart. Placing the order is always yours.",
        parts: [
          { label: "Never checks out", sub: "Cart only", kind: "guard" },
          { label: "Idempotent retries", sub: "No double adds", kind: "guard" },
        ],
      },
      {
        name: "Router",
        line: "Rules first, model only when needed: 129s down to about 2s.",
        parts: [{ label: "Deterministic router", sub: "Rules first", kind: "service" }],
      },
      {
        name: "Model & tools",
        line: "Vision turns a screenshot into a shopping list; recipes come from the web.",
        model: true,
        parts: [
          { label: "Llama-4 Scout", sub: "Groq · vision", kind: "model" },
          { label: "Recipe engine", sub: "Tavily search", kind: "tool" },
        ],
      },
      {
        name: "Commerce",
        line: "Swiggy's official MCP servers for real Food and Instamart catalogues.",
        parts: [
          { label: "Swiggy MCP", sub: "Food + Instamart", kind: "tool" },
          { label: "Scheduler", sub: "SQLite", kind: "store" },
        ],
      },
    ],
  },

  "hil-runner": {
    principles: [
      "Real hardware, reachable from anywhere.",
      "Every run is queued and recorded.",
      "Failures file their own tickets.",
    ],
    stats: [{ value: "220+", label: "Jira tickets logged" }],
    layers: [
      {
        name: "Interface",
        line: "Pick a test, start it, watch it run, from anywhere.",
        parts: [{ label: "Web dashboard", sub: "Full-stack", kind: "actor" }],
      },
      {
        name: "Pipeline",
        line: "Every run goes through CI/CD: queued, repeatable, recorded.",
        parts: [{ label: "CI/CD", sub: "Queues the run", kind: "service" }],
      },
      {
        name: "Hardware",
        line: "The hardware-in-the-loop bench the tests actually run on.",
        model: true,
        parts: [{ label: "HIL rig", sub: "Real hardware", kind: "hardware" }],
      },
      {
        name: "Reporting",
        line: "Failures become Jira tickets on their own: 220+ so far.",
        parts: [
          { label: "Results", sub: "Logs + verdicts", kind: "output" },
          { label: "Jira API", sub: "220+ tickets", kind: "output" },
        ],
      },
    ],
  },

  "docs-rag": {
    principles: [
      "Answer only from what was retrieved.",
      "Every answer shows its source.",
      "Embed once, search by meaning.",
    ],
    stats: [
      { value: "300+", label: "technical documents" },
      { value: "20–30", label: "engineers, 2 teams" },
    ],
    layers: [
      {
        name: "Interface",
        line: "Validation and telematics engineers ask in plain language.",
        parts: [{ label: "Chat", sub: "2 teams", kind: "actor" }],
      },
      {
        name: "Model",
        line: "Answers only from the retrieved passages, with sources.",
        model: true,
        parts: [{ label: "LLM", sub: "Cites its sources", kind: "model" }],
      },
      {
        name: "Retrieval",
        line: "Finds the passages that answer the question.",
        parts: [{ label: "Retriever", sub: "Top passages", kind: "tool" }],
      },
      {
        name: "Index",
        line: "Every passage embedded once and searchable by meaning.",
        parts: [
          { label: "Chunk + embed", sub: "Ingestion", kind: "service" },
          { label: "Vector index", sub: "Passages", kind: "store" },
        ],
      },
      {
        name: "Knowledge",
        line: "The specs and manuals people used to search by hand.",
        parts: [{ label: "Technical docs", sub: "300+ documents", kind: "source" }],
      },
    ],
  },

  "yaml-generator": {
    principles: [
      "Every mapping points at a real signal.",
      "Edge cases are generated, not forgotten.",
      "Replace the vendor tool, keep the format.",
    ],
    stats: [{ value: "1", label: "vendor tool replaced" }],
    layers: [
      {
        name: "Output",
        line: "YAML config plus happy-path and edge-case scenarios, ready to run.",
        parts: [
          { label: "YAML config", sub: "Replaces a vendor tool", kind: "output" },
          { label: "Scenarios", sub: "Happy path + edge", kind: "tool" },
        ],
      },
      {
        name: "Model",
        line: "Maps a vehicle feature to the CAN signals behind it.",
        model: true,
        parts: [{ label: "LLM mapper", sub: "Feature → signals", kind: "model" }],
      },
      {
        name: "Grounding",
        line: "Real signal definitions, so every mapping points at a signal that exists.",
        parts: [{ label: "CAN database", sub: "Signal definitions", kind: "store" }],
      },
      {
        name: "Input",
        line: "The vehicle feature to be tested, as written.",
        parts: [{ label: "Feature spec", sub: "Python pipeline", kind: "source" }],
      },
    ],
  },
};
