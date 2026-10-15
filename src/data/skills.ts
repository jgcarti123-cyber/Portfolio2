// Agent skills (SKILL.md packages for Claude Code and other coding agents).
// Install most of them with: npx skills add <owner>/<repo> --skill <name>
// Picked from the skills.sh leaderboard and official vendor repos, October 2026.

export type Skill = { name: string; description: string; href: string };

export const skillGroups: { label: string; column: "left" | "right"; skills: Skill[] }[] = [
  {
    label: "AI Engineering",
    column: "left",
    skills: [
      {
        name: "brag",
        description: "Turn a project into a launch video",
        href: "https://github.com/latent-spaces/brag",
      },
      {
        name: "claude-api",
        description: "Build on the Claude API and SDKs",
        href: "https://github.com/anthropics/skills",
      },
      {
        name: "mcp-builder",
        description: "Design and ship MCP servers",
        href: "https://skills.sh/anthropics/skills/mcp-builder",
      },
      {
        name: "skill-creator",
        description: "Author, test and tune new skills",
        href: "https://skills.sh/anthropics/skills/skill-creator",
      },
      {
        name: "agent-browser",
        description: "Browser automation for agents",
        href: "https://skills.sh/vercel-labs/agent-browser/agent-browser",
      },
      {
        name: "webapp-testing",
        description: "Drive and test live web apps",
        href: "https://skills.sh/anthropics/skills/webapp-testing",
      },
      {
        name: "superpowers",
        description: "Plan-first, test-driven agent workflow",
        href: "https://github.com/obra/superpowers",
      },
      {
        name: "last30days",
        description: "Research topics from the last 30 days",
        href: "https://github.com/mvanhorn/last30days-skill",
      },
      {
        name: "find-skills",
        description: "Discover and install skills",
        href: "https://skills.sh/vercel-labs/skills/find-skills",
      },
    ],
  },
  {
    label: "Full-Stack",
    column: "right",
    skills: [
      {
        name: "frontend-design",
        description: "Production-grade UI components",
        href: "https://skills.sh/anthropics/skills/frontend-design",
      },
      {
        name: "vercel-react-best-practices",
        description: "React and Next.js performance",
        href: "https://skills.sh/vercel-labs/agent-skills/vercel-react-best-practices",
      },
      {
        name: "web-design-guidelines",
        description: "Web interface design review",
        href: "https://skills.sh/vercel-labs/agent-skills/web-design-guidelines",
      },
      {
        name: "shadcn",
        description: "Add and compose shadcn/ui",
        href: "https://ui.shadcn.com",
      },
      {
        name: "supabase-postgres-best-practices",
        description: "Postgres schema and query tuning",
        href: "https://supabase.com/docs/guides/getting-started/ai-skills",
      },
      {
        name: "emil-design-engineering",
        description: "Polished web interface patterns",
        href: "https://animations.dev/learn/emil-skill",
      },
    ],
  },
  {
    label: "Engineering Habits",
    column: "right",
    skills: [
      {
        name: "tdd",
        description: "Red, green, refactor with an agent",
        href: "https://skills.sh/mattpocock/skills/tdd",
      },
      {
        name: "grill-me",
        description: "Stress-test a plan before building",
        href: "https://skills.sh/mattpocock/skills/grill-me",
      },
      {
        name: "improve-codebase-architecture",
        description: "Find deeper modules and seams",
        href: "https://skills.sh/mattpocock/skills/improve-codebase-architecture",
      },
      {
        name: "diagnosing-bugs",
        description: "Reproduce, isolate, then fix",
        href: "https://skills.sh/mattpocock/skills/diagnosing-bugs",
      },
      {
        name: "code-review",
        description: "Structured pre-merge review",
        href: "https://skills.sh/mattpocock/skills/code-review",
      },
    ],
  },
];
