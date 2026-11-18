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
  /** `detail` is what the part card says when someone taps it: one or two plain sentences. */
  parts: { label: string; sub: string; kind: PartKind; detail?: string }[];
  model?: boolean;
  video?: boolean;
};

export type Arch = {
  stats: { value: string; label: string }[];
  layers: Layer[];
  /** One line under the stack: what keeps the whole thing honest. */
  footnote?: string;
  /**
   * The ideas the build rests on. Hovering one lights the parts it lives in (`parts`, as "layer:part" indexes),
   * and `proof` is the one line that backs it up.
   */
  principles?: { text: string; proof: string; parts: string[] }[];
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
      { text: "The model proposes. Code decides.", proof: "Every call passes the harness and a read-only allowlist; people sign off at four gates.", parts: ["2:0", "1:0", "1:2", "1:3", "1:1"] },
      { text: "One call builds the whole context.", proof: "Requirements, signals and tickets arrive together in a single turn.", parts: ["3:0", "4:0", "4:1", "4:2"] },
      { text: "Every prompt change replays the golden set.", proof: "2,600+ tests and recorded runs catch a regression before it ships.", parts: ["1:0", "2:0", "3:1"] },
    ],
    layers: [
      {
        name: "Interface",
        line: "Where engineers ask, review and release.",
        video: true,
        parts: [{ label: "React 19 workspace", sub: "Role-based sign-in", kind: "actor", detail: "Engineers ask for cases, review drafts and release them here. What each person can do depends on their role." }],
      },
      {
        name: "Guardrails",
        line: "The model proposes, code decides. Nothing releases itself.",
        parts: [
          { label: "Harness", sub: "Every step logged", kind: "guard", detail: "Wraps every model call. It logs each step, retries safely and stops a run that drifts off-spec." },
          { label: "Human gates", sub: "4 checks per case", kind: "human", detail: "Four sign-offs per test case. Nothing reaches the suite until an engineer approves it." },
          { label: "MCP allowlist", sub: "Read-only tools", kind: "guard", detail: "The agent can only reach tools on a short, read-only list. Anything else is refused before it runs." },
          { label: "Write guard", sub: "On real data", kind: "guard", detail: "Blocks any write to real vehicle data unless a person has approved it first." },
        ],
      },
      {
        name: "Model",
        line: "Claude Haiku 4.5 on AWS Bedrock picks the tools and drafts the case.",
        model: true,
        parts: [{ label: "Claude Haiku 4.5", sub: "AWS Bedrock", kind: "model", detail: "Reads the context, picks the tools it needs and drafts the test case. It suggests; it never decides." }],
      },
      {
        name: "Tools & context",
        line: "One call gathers everything; 35+ tools, each with a contract.",
        parts: [
          { label: "Context builder", sub: "One call per turn", kind: "service", detail: "Gathers the requirement, its signals and past cases in a single call, so the model sees everything at once." },
          { label: "35+ agent tools", sub: "With contracts", kind: "tool", detail: "Small tools with strict inputs and outputs: search signals, read logs, look up tickets." },
          { label: "FastAPI", sub: "Secrets stay server-side", kind: "service", detail: "The backend between the model and the tools. API keys and credentials never leave the server." },
        ],
      },
      {
        name: "Knowledge",
        line: "Grounded in real requirements, signals and scenarios.",
        parts: [
          { label: "Requirements", sub: "700 chunks", kind: "source", detail: "700 requirement chunks, split and indexed so the right paragraph can be found in one search." },
          { label: "Signals & scenarios", sub: "3,200+ cases", kind: "source", detail: "3,200+ real vehicle signals and test scenarios that every draft is checked against." },
          { label: "Jira + Confluence", sub: "Via Rovo MCP", kind: "source", detail: "Tickets and team docs, read through the Rovo MCP server." },
        ],
      },
    ],
  },

  "prim-pets": {
    principles: [
      { text: "Answers come from documents, not memory.", proof: "Hybrid search finds the passage; the model only rewrites it.", parts: ["2:0", "3:0", "4:0"] },
      { text: "Every pet keeps its own history.", proof: "Memory is stored per pet and read on every chat.", parts: ["3:1", "0:0"] },
      { text: "Hardened in production, not in theory.", proof: "Fixed live: stored XSS, rate limits, an out-of-memory crash.", parts: ["1:0", "1:1"] },
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
        parts: [{ label: "Pet owner chat", sub: "Live on Render", kind: "actor", detail: "Owners ask about health, food or care in plain words, and every answer is about their own pet." }],
      },
      {
        name: "Hardening",
        line: "Fixed in production: stored XSS, rate limits, an out-of-memory crash.",
        parts: [
          { label: "Rate limiting", sub: "Per user", kind: "guard", detail: "Caps how often one user can call the model, which keeps costs and abuse in check." },
          { label: "XSS-safe output", sub: "Sanitised", kind: "guard", detail: "Every answer is sanitised before it renders, a fix for a stored-XSS bug found in production." },
        ],
      },
      {
        name: "Model",
        line: "Writes every answer from retrieved passages and the pet's history.",
        model: true,
        parts: [{ label: "LLM", sub: "Grounded answers", kind: "model", detail: "Writes the answer only from retrieved passages and the pet's history, never from memory alone." }],
      },
      {
        name: "Retrieval & tools",
        line: "Hybrid search finds the passage; concierge tools act on it.",
        parts: [
          { label: "Hybrid search", sub: "Vector + keyword", kind: "tool", detail: "Vector search finds meaning; keyword search catches exact terms such as drug names. Both results are merged." },
          { label: "Pet memory", sub: "History per pet", kind: "store", detail: "Remembers each pet's history across chats, so owners never repeat themselves." },
          { label: "Concierge", sub: "Vet bookings, places", kind: "tool", detail: "Tools that act on an answer: find a vet, book a slot, suggest pet-friendly places." },
        ],
      },
      {
        name: "Knowledge",
        line: "200+ veterinary documents in PostgreSQL.",
        parts: [{ label: "Vet knowledge base", sub: "200+ docs · PostgreSQL", kind: "source", detail: "200+ veterinary documents in PostgreSQL, the only source answers are drawn from." }],
      },
    ],
  },

  "swiggy-agent": {
    principles: [
      { text: "Rules first, model only when needed.", proof: "The router answers common requests itself: 129s down to about 2s.", parts: ["2:0", "3:0"] },
      { text: "It fills the cart. You place the order.", proof: "Checkout is out of the agent’s reach, and retries can’t double an item.", parts: ["1:0", "1:1", "4:0"] },
      { text: "A photo is enough to start.", proof: "Vision turns a dish or a handwritten list into a cart.", parts: ["3:0", "3:1", "0:0"] },
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
        parts: [{ label: "React app", sub: "Chat + live cart", kind: "actor", detail: "Chat on one side, the live cart on the other. Type a craving or drop a photo of a dish or list." }],
      },
      {
        name: "Guardrails",
        line: "It fills the cart. Placing the order is always yours.",
        parts: [
          { label: "Never checks out", sub: "Cart only", kind: "guard", detail: "The agent can fill the cart but cannot place an order. That button is always yours." },
          { label: "Idempotent retries", sub: "No double adds", kind: "guard", detail: "A retried request can never add the same item twice." },
        ],
      },
      {
        name: "Router",
        line: "Rules first, model only when needed: 129s down to about 2s.",
        parts: [{ label: "Deterministic router", sub: "Rules first", kind: "service", detail: "Handles common requests with plain rules and calls the model only when it must. That cut 129s to about 2s." }],
      },
      {
        name: "Model & tools",
        line: "Vision turns a screenshot into a shopping list; recipes come from the web.",
        model: true,
        parts: [
          { label: "Llama-4 Scout", sub: "Groq · vision", kind: "model", detail: "Vision model on Groq. Turns a photo of a dish or a handwritten list into items to search for." },
          { label: "Recipe engine", sub: "Tavily search", kind: "tool", detail: "Finds a recipe on the web with Tavily and turns it into a shopping list." },
        ],
      },
      {
        name: "Commerce",
        line: "Swiggy's official MCP servers for real Food and Instamart catalogues.",
        parts: [
          { label: "Swiggy MCP", sub: "Food + Instamart", kind: "tool", detail: "Swiggy's official MCP servers for the real Food and Instamart catalogues." },
          { label: "Scheduler", sub: "SQLite", kind: "store", detail: "Saves repeat orders and reminders in SQLite." },
        ],
      },
    ],
  },

  "hil-runner": {
    principles: [
      { text: "Real hardware, reachable from anywhere.", proof: "The dashboard drives a physical rig over the pipeline.", parts: ["0:0", "2:0"] },
      { text: "Every run is queued and recorded.", proof: "CI/CD makes each run repeatable, with results kept.", parts: ["1:0", "3:0"] },
      { text: "Failures file their own tickets.", proof: "220+ Jira tickets raised with logs attached, no copy-paste.", parts: ["3:1"] },
    ],
    stats: [{ value: "220+", label: "Jira tickets logged" }],
    layers: [
      {
        name: "Interface",
        line: "Pick a test, start it, watch it run, from anywhere.",
        parts: [{ label: "Web dashboard", sub: "Full-stack", kind: "actor", detail: "Pick a test, start it and watch it run on real hardware from anywhere." }],
      },
      {
        name: "Pipeline",
        line: "Every run goes through CI/CD: queued, repeatable, recorded.",
        parts: [{ label: "CI/CD", sub: "Queues the run", kind: "service", detail: "Queues every run so tests on the rig are repeatable and recorded." }],
      },
      {
        name: "Hardware",
        line: "The hardware-in-the-loop bench the tests actually run on.",
        model: true,
        parts: [{ label: "HIL rig", sub: "Real hardware", kind: "hardware", detail: "The hardware-in-the-loop bench: real vehicle electronics the tests run against." }],
      },
      {
        name: "Reporting",
        line: "Failures become Jira tickets on their own: 220+ so far.",
        parts: [
          { label: "Results", sub: "Logs + verdicts", kind: "output", detail: "Logs and a pass or fail verdict for every run, kept for later comparison." },
          { label: "Jira API", sub: "220+ tickets", kind: "output", detail: "Failures become Jira tickets on their own, with logs attached. 220+ so far." },
        ],
      },
    ],
  },

  "docs-rag": {
    principles: [
      { text: "Answer only from what was retrieved.", proof: "The model sees just the top passages, nothing else.", parts: ["1:0", "2:0"] },
      { text: "Every answer shows its source.", proof: "Each line links back to the document it came from.", parts: ["1:0", "4:0"] },
      { text: "Embed once, search by meaning.", proof: "Documents are indexed a single time and searched by vector.", parts: ["3:0", "3:1"] },
    ],
    stats: [
      { value: "300+", label: "technical documents" },
      { value: "20–30", label: "engineers, 2 teams" },
    ],
    layers: [
      {
        name: "Interface",
        line: "Validation and telematics engineers ask in plain language.",
        parts: [{ label: "Chat", sub: "2 teams", kind: "actor", detail: "Validation and telematics engineers ask in plain language instead of searching manuals." }],
      },
      {
        name: "Model",
        line: "Answers only from the retrieved passages, with sources.",
        model: true,
        parts: [{ label: "LLM", sub: "Cites its sources", kind: "model", detail: "Answers only from the passages it was given and shows which document each line came from." }],
      },
      {
        name: "Retrieval",
        line: "Finds the passages that answer the question.",
        parts: [{ label: "Retriever", sub: "Top passages", kind: "tool", detail: "Finds the few passages most likely to answer the question." }],
      },
      {
        name: "Index",
        line: "Every passage embedded once and searchable by meaning.",
        parts: [
          { label: "Chunk + embed", sub: "Ingestion", kind: "service", detail: "Splits every document into passages and turns each into a vector, once." },
          { label: "Vector index", sub: "Passages", kind: "store", detail: "Stores the passages so they can be searched by meaning, not just keywords." },
        ],
      },
      {
        name: "Knowledge",
        line: "The specs and manuals people used to search by hand.",
        parts: [{ label: "Technical docs", sub: "300+ documents", kind: "source", detail: "300+ specs and manuals that people used to search by hand." }],
      },
    ],
  },

  "yaml-generator": {
    principles: [
      { text: "Every mapping points at a real signal.", proof: "The CAN database grounds each feature-to-signal match.", parts: ["1:0", "2:0"] },
      { text: "Edge cases are generated, not forgotten.", proof: "Scenarios cover the unhappy paths too.", parts: ["0:1"] },
      { text: "Replace the vendor tool, keep the format.", proof: "Output matches the YAML the old tool produced.", parts: ["0:0"] },
    ],
    stats: [{ value: "1", label: "vendor tool replaced" }],
    layers: [
      {
        name: "Output",
        line: "YAML config plus happy-path and edge-case scenarios, ready to run.",
        parts: [
          { label: "YAML config", sub: "Replaces a vendor tool", kind: "output", detail: "A ready-to-run test config, in the same format the old vendor tool produced." },
          { label: "Scenarios", sub: "Happy path + edge", kind: "tool", detail: "Happy-path and edge-case scenarios generated alongside the config." },
        ],
      },
      {
        name: "Model",
        line: "Maps a vehicle feature to the CAN signals behind it.",
        model: true,
        parts: [{ label: "LLM mapper", sub: "Feature → signals", kind: "model", detail: "Reads a feature description and maps it to the CAN signals behind it." }],
      },
      {
        name: "Grounding",
        line: "Real signal definitions, so every mapping points at a signal that exists.",
        parts: [{ label: "CAN database", sub: "Signal definitions", kind: "store", detail: "Real signal definitions, so every mapping points at a signal that exists." }],
      },
      {
        name: "Input",
        line: "The vehicle feature to be tested, as written.",
        parts: [{ label: "Feature spec", sub: "Python pipeline", kind: "source", detail: "The vehicle feature to test, written the way engineers already write it." }],
      },
    ],
  },
};
