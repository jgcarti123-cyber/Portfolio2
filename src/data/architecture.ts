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
  /**
   * The ideas the build rests on, each told as a short path through the stack. `part` is "layer:part"; `name` and
   * `caption` are the plain words shown under that step.
   */
  principles?: { tab: string; text: string; proof: string; steps: { part: string; name: string; caption: string }[] }[];
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
      {
        tab: "Safety",
        text: "The AI suggests. Code decides.",
        proof: "Every call passes the harness and a read-only allowlist; people sign off at four gates.",
        steps: [
          { part: "2:0", name: "Claude drafts", caption: "Suggests a test case" },
          { part: "1:0", name: "Harness", caption: "Logs and checks every step" },
          { part: "1:2", name: "Allowlist", caption: "Read-only tools only" },
          { part: "1:3", name: "Write guard", caption: "No writes to real data" },
          { part: "1:1", name: "Engineer", caption: "Signs off at 4 gates" },
        ],
      },
      {
        tab: "Context",
        text: "All the facts in one call.",
        proof: "Requirements, signals and tickets arrive together in a single turn.",
        steps: [
          { part: "3:0", name: "Context builder", caption: "One call per turn" },
          { part: "4:0", name: "Requirements", caption: "700 requirement chunks" },
          { part: "4:1", name: "Signals", caption: "3,200+ real scenarios" },
          { part: "4:2", name: "Jira + Confluence", caption: "Tickets via Rovo MCP" },
          { part: "2:0", name: "Claude", caption: "Drafts with every fact in hand" },
        ],
      },
      {
        tab: "Testing",
        text: "Retested on every change.",
        proof: "2,600+ tests and recorded runs catch a regression before it ships.",
        steps: [
          { part: "2:0", name: "Prompt change", caption: "Someone edits a prompt" },
          { part: "1:0", name: "Golden replay", caption: "Recorded runs play again" },
          { part: "3:1", name: "Tool contracts", caption: "All 35+ tools checked" },
          { part: "1:1", name: "Release", caption: "Only if nothing regressed" },
        ],
      },
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
      {
        tab: "Grounded",
        text: "Answers come from documents, not memory.",
        proof: "Hybrid search finds the passage; the model only rewrites it.",
        steps: [
          { part: "0:0", name: "Owner asks", caption: "A question about their pet" },
          { part: "3:0", name: "Hybrid search", caption: "Vector and keyword together" },
          { part: "4:0", name: "Vet knowledge", caption: "200+ veterinary documents" },
          { part: "2:0", name: "LLM", caption: "Rewrites what it found" },
        ],
      },
      {
        tab: "Memory",
        text: "Every pet keeps its own history.",
        proof: "Memory is stored per pet and read on every chat.",
        steps: [
          { part: "0:0", name: "Owner chats", caption: "Mentions their pet" },
          { part: "3:1", name: "Pet memory", caption: "Recalls past notes" },
          { part: "2:0", name: "LLM", caption: "Answers with that history" },
        ],
      },
      {
        tab: "Hardening",
        text: "Hardened in production, not in theory.",
        proof: "Fixed live: stored XSS, rate limits, an out-of-memory crash.",
        steps: [
          { part: "1:1", name: "Safe output", caption: "Fixed a stored-XSS bug" },
          { part: "1:0", name: "Rate limiting", caption: "Stops floods per user" },
          { part: "0:0", name: "Live on Render", caption: "Survived an out-of-memory crash" },
        ],
      },
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
      {
        tab: "Speed",
        text: "Rules first, model only when needed.",
        proof: "The router answers common requests itself: 129s down to about 2s.",
        steps: [
          { part: "0:0", name: "You ask", caption: "“Add milk and eggs”" },
          { part: "2:0", name: "Router", caption: "Handles common requests by rules" },
          { part: "3:0", name: "Llama-4 Scout", caption: "Only for the hard ones" },
        ],
      },
      {
        tab: "Safety",
        text: "It fills the cart. You place the order.",
        proof: "Checkout is out of the agent’s reach, and retries can’t double an item.",
        steps: [
          { part: "4:0", name: "Swiggy MCP", caption: "Adds items to your cart" },
          { part: "1:1", name: "Safe retries", caption: "Never doubles an item" },
          { part: "1:0", name: "No checkout", caption: "Out of the agent’s reach" },
          { part: "0:0", name: "You", caption: "Review and place the order" },
        ],
      },
      {
        tab: "Vision",
        text: "A photo is enough to start.",
        proof: "Vision turns a dish or a handwritten list into a cart.",
        steps: [
          { part: "0:0", name: "You snap", caption: "A dish or a handwritten list" },
          { part: "3:0", name: "Llama-4 Scout", caption: "Reads the photo" },
          { part: "3:1", name: "Recipe engine", caption: "Works out the ingredients" },
          { part: "4:0", name: "Swiggy MCP", caption: "Fills the cart" },
        ],
      },
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
};
