// The Shelf: tools, resources and things I enjoy.
// Each card shows the site's favicon. Add `image` for a full-bleed preview or `avatar` for a centered picture.
// Entries marked `sample: true` are placeholders — swap in your own picks.

type RGB = [number, number, number];

/** Spotify playlist details. Generate with: node scripts/spotify-playlist.mjs <playlist url> */
export type Playlist = {
  owner: string;
  songs: number;
  seconds: number;
  /** Spotify's own colours for the cover: header colour, darker tint, and soft text colour. */
  color: RGB;
  tint: RGB;
  subdued: RGB;
  tracks: { title: string; artist: string; seconds: number }[];
};

export type ShelfLink = {
  name: string;
  href: string;
  description: string;
  /** Full-bleed preview (e.g. a video thumbnail). */
  image?: string;
  /** Centered picture (e.g. a channel avatar), round by default. */
  avatar?: string;
  /** Small round icon beside the name when there is no avatar (e.g. a video's channel). */
  badge?: string;
  /** Draw the avatar or badge as a rounded square (album and playlist art). */
  square?: boolean;
  /** Renders the link as a Spotify-style playlist card. */
  playlist?: Playlist;
  sample?: boolean;
};

export type ShelfIcon =
  | "robot"
  | "plug"
  | "graph"
  | "stack"
  | "database"
  | "cloud"
  | "wrench"
  | "graduation"
  | "book"
  | "youtube"
  | "music"
  | "chart";

export type ShelfList = {
  slug: string;
  label: string;
  icon: ShelfIcon;
  /** Lists with the same group are nested under one heading in the sidebar. */
  group?: string;
  links: ShelfLink[];
};

/** Groups: heading shown in the sidebar and the slug that shows all its lists at once. */
export const shelfGroups: Record<string, { slug: string; icon: ShelfIcon }> = {
  Watch: { slug: "watch", icon: "youtube" },
};

export const shelf: ShelfList[] = [
  {
    slug: "ai-tools",
    label: "AI Tools",
    icon: "robot",
    links: [
      { name: "Claude", href: "https://claude.ai", description: "Thinking partner for everything" },
      { name: "Claude Code", href: "https://www.claude.com/product/claude-code", description: "Agentic coding in the terminal" },
      { name: "Claude Design", href: "https://claude.ai/design", description: "Prototypes and visual design with Claude" },
      { name: "ChatGPT", href: "https://chatgpt.com", description: "General-purpose assistant" },
      { name: "Codex", href: "https://openai.com/codex", description: "OpenAI's coding agent" },
      { name: "Kiro", href: "https://kiro.dev", description: "Spec-driven agentic IDE" },
      { name: "Pi", href: "https://pi.dev", description: "Minimal, extensible coding agent harness" },
      { name: "Perplexity", href: "https://www.perplexity.ai", description: "Answer engine with sources" },
      { name: "NotebookLM", href: "https://notebooklm.google", description: "Research over your own docs" },
      { name: "Ollama", href: "https://ollama.com", description: "Run open models locally" },
      { name: "Higgsfield", href: "https://higgsfield.ai", description: "AI video and image generation" },
    ],
  },
  {
    slug: "models",
    label: "Models & APIs",
    icon: "plug",
    links: [
      { name: "Claude API", href: "https://platform.claude.com", description: "Anthropic developer platform" },
      { name: "Groq", href: "https://groq.com", description: "Very fast open-model inference" },
      { name: "OpenRouter", href: "https://openrouter.ai", description: "One API for every model" },
      { name: "Hugging Face", href: "https://huggingface.co", description: "Models, datasets and Spaces" },
      { name: "OpenAI Platform", href: "https://platform.openai.com", description: "GPT and embeddings APIs" },
      { name: "Tavily", href: "https://tavily.com", description: "Search API built for agents" },
      { name: "AWS Bedrock", href: "https://aws.amazon.com/bedrock", description: "Managed model access behind AIVA" },
      { name: "Claude Haiku 4.5", href: "https://www.anthropic.com/claude/haiku", description: "The fast, low-cost model behind AIVA" },
      { name: "Voyage AI", href: "https://www.voyageai.com", description: "Embeddings for requirement search" },
    ],
  },
  {
    slug: "agents",
    label: "Agent Frameworks",
    icon: "graph",
    links: [
      { name: "LangGraph", href: "https://www.langchain.com/langgraph", description: "Stateful multi-agent graphs" },
      { name: "Model Context Protocol", href: "https://modelcontextprotocol.io", description: "Open standard for tool access" },
      { name: "Claude Agent SDK", href: "https://github.com/anthropics/claude-agent-sdk-python", description: "The harness behind Claude Code" },
      { name: "Vercel AI SDK", href: "https://ai-sdk.dev", description: "TypeScript toolkit for AI apps" },
      { name: "LangChain", href: "https://www.langchain.com", description: "LLM application building blocks" },
      { name: "LlamaIndex", href: "https://www.llamaindex.ai", description: "Data framework for RAG" },
      { name: "LangSmith", href: "https://smith.langchain.com", description: "Tracing and evals" },
      { name: "Atlassian Rovo MCP", href: "https://www.atlassian.com/platform/remote-mcp-server", description: "Read-only Jira and Confluence for agents" },
    ],
  },
  {
    slug: "frameworks",
    label: "Frameworks",
    icon: "stack",
    links: [
      { name: "Next.js", href: "https://nextjs.org", description: "The React framework" },
      { name: "React", href: "https://react.dev", description: "UI library" },
      { name: "TypeScript", href: "https://www.typescriptlang.org", description: "Typed JavaScript" },
      { name: "Node.js", href: "https://nodejs.org", description: "JavaScript runtime" },
      { name: "FastAPI", href: "https://fastapi.tiangolo.com", description: "Modern Python APIs" },
      { name: "Flask", href: "https://flask.palletsprojects.com", description: "Minimal Python web framework" },
      { name: "Tailwind CSS", href: "https://tailwindcss.com", description: "Utility-first CSS" },
      { name: "shadcn/ui", href: "https://ui.shadcn.com", description: "Copy-paste components" },
      { name: "Python", href: "https://www.python.org", description: "The language of the AIVA backend" },
      { name: "Pydantic", href: "https://docs.pydantic.dev", description: "Typed models for every API response" },
      { name: "Vite", href: "https://vite.dev", description: "Fast builds for the AIVA front end" },
      { name: "React Router", href: "https://reactrouter.com", description: "Routing for the AIVA portal" },
    ],
  },
  {
    slug: "databases",
    label: "Databases",
    icon: "database",
    links: [
      { name: "PostgreSQL", href: "https://www.postgresql.org", description: "The default database" },
      { name: "pgvector", href: "https://github.com/pgvector/pgvector", description: "Vector search in Postgres" },
      { name: "Supabase", href: "https://supabase.com", description: "Postgres with batteries" },
      { name: "Chroma", href: "https://www.trychroma.com", description: "Open-source vector database" },
      { name: "SQLite", href: "https://sqlite.org", description: "Small, fast, everywhere" },
      { name: "MongoDB", href: "https://www.mongodb.com", description: "Document database" },
      { name: "Redis", href: "https://redis.io", description: "In-memory data store" },
      { name: "Drizzle ORM", href: "https://orm.drizzle.team", description: "Type-safe SQL for TypeScript" },
    ],
  },
  {
    slug: "cloud",
    label: "Cloud & DevOps",
    icon: "cloud",
    links: [
      { name: "Vercel", href: "https://vercel.com", description: "Frontend cloud" },
      { name: "Render", href: "https://render.com", description: "Simple app hosting" },
      { name: "Microsoft Azure", href: "https://azure.microsoft.com", description: "Enterprise cloud" },
      { name: "Docker", href: "https://www.docker.com", description: "Containers" },
      { name: "Kubernetes", href: "https://kubernetes.io", description: "Container orchestration" },
      { name: "GitHub Actions", href: "https://github.com/features/actions", description: "CI/CD in the repo" },
      { name: "Cloudflare", href: "https://www.cloudflare.com", description: "Edge network and Workers" },
      { name: "AWS", href: "https://aws.amazon.com/ec2/", description: "EC2 hosting for AIVA" },
      { name: "GitLab CI", href: "https://docs.gitlab.com/ci/", description: "On-demand pipelines that run tests on the HIL rig" },
      { name: "nginx", href: "https://nginx.org", description: "Serves the portal in front of the API" },
    ],
  },
  {
    slug: "tools",
    label: "Dev Tools",
    icon: "wrench",
    links: [
      { name: "VS Code", href: "https://code.visualstudio.com", description: "Editor" },
      { name: "Ghostty", href: "https://ghostty.org", description: "Fast native terminal" },
      { name: "Raycast", href: "https://www.raycast.com", description: "Launcher for everything" },
      { name: "Postman", href: "https://www.postman.com", description: "API client" },
      { name: "GitHub", href: "https://github.com", description: "Where the code lives" },
      { name: "Arc", href: "https://arc.net", description: "Browser" },
      { name: "Obsidian", href: "https://obsidian.md", description: "Local-first notes" },
      { name: "Notion", href: "https://www.notion.com", description: "Docs and wikis" },
      { name: "Excalidraw", href: "https://excalidraw.com", description: "Hand-drawn diagrams" },
      { name: "pytest", href: "https://pytest.org", description: "2,600+ tests behind AIVA" },
      { name: "cantools", href: "https://cantools.readthedocs.io", description: "Parse CAN DBC files in Python" },
    ],
  },
  {
    slug: "learn",
    label: "Learn",
    icon: "graduation",
    links: [
      { name: "Neural Networks: Zero to Hero", href: "https://karpathy.ai/zero-to-hero.html", description: "Andrej Karpathy's course" },
      { name: "DeepLearning.AI", href: "https://www.deeplearning.ai", description: "Short courses on LLMs and agents" },
      { name: "Anthropic Courses", href: "https://github.com/anthropics/courses", description: "Prompting and tool use" },
      { name: "Hugging Face Learn", href: "https://huggingface.co/learn", description: "LLM and agents courses" },
      { name: "fast.ai", href: "https://www.fast.ai", description: "Practical deep learning" },
      { name: "Full Stack Open", href: "https://fullstackopen.com/en/", description: "Modern web development" },
      { name: "System Design Primer", href: "https://github.com/donnemartin/system-design-primer", description: "Large-scale systems" },
      { name: "roadmap.sh", href: "https://roadmap.sh", description: "Developer roadmaps" },
    ],
  },
  {
    slug: "read",
    label: "Read",
    icon: "book",
    links: [
      { name: "Building Effective Agents", href: "https://www.anthropic.com/engineering/building-effective-agents", description: "Anthropic on agent patterns" },
      { name: "LLM Powered Autonomous Agents", href: "https://lilianweng.github.io/posts/2023-06-23-agent/", description: "Lilian Weng" },
      { name: "Patterns for LLM Systems", href: "https://eugeneyan.com/writing/llm-patterns/", description: "Eugene Yan" },
      { name: "Simon Willison's Weblog", href: "https://simonwillison.net", description: "Daily notes on LLMs" },
      { name: "Latent Space", href: "https://www.latent.space", description: "The AI engineer newsletter" },
      { name: "Designing Data-Intensive Applications", href: "https://dataintensive.net", description: "Martin Kleppmann" },
      { name: "The Pragmatic Engineer", href: "https://newsletter.pragmaticengineer.com", description: "Gergely Orosz" },
    ],
  },
  {
    slug: "watch-ai",
    label: "AI & Information",
    icon: "youtube",
    group: "Watch",
    links: [
      { name: "Andrej Karpathy", href: "https://www.youtube.com/@AndrejKarpathy", description: "LLMs, from first principles", avatar: "/shelf/karpathy.jpg" },
      { name: "IBM Technology", href: "https://www.youtube.com/channel/UCKWaEZ-_VweaEx1j62do_vQ", description: "AI and tech, clearly explained", avatar: "/shelf/ibm-technology.jpg" },
      { name: "AI Engineer", href: "https://www.youtube.com/@aiDotEngineer", description: "Talks from the AI Engineer conferences", avatar: "/shelf/ai-engineer.jpg" },
      { name: "Nick Saraev", href: "https://www.youtube.com/@nicksaraev/videos", description: "AI automation and agents", avatar: "/shelf/nick-saraev.jpg" },
    ],
  },
  {
    slug: "watch-music",
    label: "Music",
    icon: "youtube",
    group: "Watch",
    links: [
      { name: "Fred again.. · Boiler Room London", href: "https://www.youtube.com/watch?v=c0-hvjV2A5Y", description: "Live set, Boiler Room London", image: "/shelf/fred-again.jpg", badge: "/shelf/boiler-room.jpg" },
      { name: "Kettama · The Lot Radio NYC", href: "https://www.youtube.com/watch?v=qqyH9p8mT2c", description: "Coast 2 Coast takeover, The Lot Radio", image: "/shelf/kettama.jpg", badge: "/shelf/steel-city.jpg" },
      { name: "Yousuke Yukimatsu · Boiler Room Tokyo", href: "https://www.youtube.com/watch?v=T1tcUfUhR5U", description: "Live set, Boiler Room Tokyo", image: "/shelf/yousuke.jpg", badge: "/shelf/boiler-room.jpg" },
    ],
  },
  {
    slug: "watch-investing",
    label: "Investing & General",
    icon: "youtube",
    group: "Watch",
    links: [
      { name: "Think School", href: "https://www.youtube.com/@ThinkSchool", description: "Business, money and markets", avatar: "/shelf/think-school.jpg" },
      { name: "Taiki Maeda · Crypto is Bottoming", href: "https://www.youtube.com/watch?v=_wTmGFHhUUY", description: "Crypto is Bottoming. Why HYPE and ZEC will go PARABOLIC", image: "/shelf/taiki.jpg", badge: "/shelf/taiki-channel.jpg" },
      { name: "Akshat Shrivastava", href: "https://www.youtube.com/@AkshatZayn", description: "Business and investing, in Hindi", avatar: "/shelf/akshat.jpg" },
      { name: "Coin Bureau", href: "https://www.youtube.com/@CoinBureau", description: "Crypto news and research", avatar: "/shelf/coin-bureau.jpg" },
    ],
  },
  {
    slug: "music",
    label: "On Repeat",
    icon: "music",
    links: [
      {
        name: "10",
        href: "https://open.spotify.com/playlist/2etPcZkmUE89qraxY5JRWD",
        description: "Spotify playlist",
        image: "/shelf/playlist-10.jpg",
        badge: "/shelf/playlist-10.jpg",
        square: true,
        playlist: {
          owner: "Jon",
          songs: 10,
          seconds: 3140,
          color: [0, 90, 106],
          tint: [0, 55, 69],
          subdued: [134, 218, 235],
          tracks: [
            { title: "Johnny P's Caddy", artist: "Benny The Butcher, J. Cole", seconds: 225 },
            { title: "Strong", artist: "Romy, Fred again..", seconds: 234 },
            { title: "Mirrors", artist: "Justin Timberlake", seconds: 486 },
          ],
        },
      },
      {
        name: "🫳",
        href: "https://open.spotify.com/playlist/2jZWT2k7a3MzjAOuE5DVN4",
        description: "Spotify playlist",
        image: "/shelf/playlist-hand.jpg",
        badge: "/shelf/playlist-hand.jpg",
        square: true,
        playlist: {
          owner: "Jon",
          songs: 100,
          seconds: 20044,
          color: [77, 84, 91],
          tint: [45, 52, 58],
          subdued: [198, 206, 214],
          tracks: [
            { title: "Embarrassed (feat. Travis Scott)", artist: "Don Toliver, Travis Scott", seconds: 193 },
            { title: "Flight's Booked", artist: "Drake", seconds: 254 },
            { title: "Portabella", artist: "Young Nudy", seconds: 216 },
          ],
        },
      },
      {
        name: "OG",
        href: "https://open.spotify.com/playlist/2NOW5vLGolpnSmuDXDRjo0",
        description: "Spotify playlist",
        image: "/shelf/playlist-og.jpg",
        badge: "/shelf/playlist-og.jpg",
        square: true,
        playlist: {
          owner: "Jon",
          songs: 28,
          seconds: 7103,
          color: [159, 0, 14],
          tint: [97, 0, 0],
          subdued: [255, 189, 181],
          tracks: [
            { title: "Truly Madly Deeply", artist: "Savage Garden", seconds: 277 },
            { title: "No Air (TMP Remix)", artist: "Jordin Sparks, Chris Brown", seconds: 215 },
            { title: "No Promises", artist: "Shayne Ward", seconds: 222 },
          ],
        },
      },
      {
        name: "Mal gibson",
        href: "https://open.spotify.com/playlist/11I74O6nSZYb3FHbVqdfkv",
        description: "Spotify playlist",
        image: "/shelf/playlist-mal-gibson.jpg",
        badge: "/shelf/playlist-mal-gibson.jpg",
        square: true,
        playlist: {
          owner: "Jon",
          songs: 58,
          seconds: 14676,
          color: [56, 85, 120],
          tint: [24, 51, 84],
          subdued: [175, 208, 249],
          tracks: [
            { title: "Vathilil", artist: "Haricharan", seconds: 370 },
            { title: "Uyire", artist: "Ankit Menon, Sid Sriram, Vinayak Sasikumar", seconds: 200 },
            { title: "High Speed Drifting", artist: "Shubranil Sarkar, Rajesh Murugesan", seconds: 208 },
          ],
        },
      },
      {
        name: "Hindi",
        href: "https://open.spotify.com/playlist/6UP2DdhFQ8cknlx3VNn5X5",
        description: "Spotify playlist",
        image: "/shelf/playlist-hindi.jpg",
        badge: "/shelf/playlist-hindi.jpg",
        square: true,
        playlist: {
          owner: "Jon",
          songs: 47,
          seconds: 13077,
          color: [83, 83, 83],
          tint: [51, 51, 51],
          subdued: [205, 205, 205],
          tracks: [
            { title: "Isq Risk", artist: "Sohail Sen, Rahat Fateh Ali Khan", seconds: 295 },
            { title: "Sadqay", artist: "Aashir Wajahat, NAYEL, Nehaal Naseem", seconds: 154 },
            { title: "Ban Ja Rani", artist: "Guru Randhawa, Rajat Nagpal", seconds: 226 },
          ],
        },
      },
    ],
  },
  {
    slug: "investing",
    label: "Investing",
    icon: "chart",
    links: [
      { name: "Zerodha Varsity", href: "https://zerodha.com/varsity/", description: "Markets, from basics up", sample: true },
      { name: "Screener", href: "https://www.screener.in", description: "Indian stock fundamentals", sample: true },
      { name: "Tickertape", href: "https://www.tickertape.in", description: "Stock and fund research", sample: true },
      { name: "Value Research", href: "https://www.valueresearchonline.com", description: "Mutual fund analysis", sample: true },
      { name: "Aswath Damodaran", href: "https://pages.stern.nyu.edu/~adamodar/", description: "Valuation, by the expert", sample: true },
      { name: "Collab Fund Blog", href: "https://collabfund.com/blog/", description: "Morgan Housel on money", sample: true },
      { name: "Berkshire Letters", href: "https://www.berkshirehathaway.com/letters/letters.html", description: "Buffett's shareholder letters", sample: true },
    ],
  },
];
