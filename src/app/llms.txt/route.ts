import { connect, experience, featured, profile, work } from "@/data/site";
import { skillGroups } from "@/data/skills";

export const dynamic = "force-static";

// Plain-text context for LLMs and agents (https://llmstxt.org).
export function GET() {
  const lines = [
    `# ${profile.name}`,
    "",
    `> ${profile.summary}`,
    "",
    `Roles: ${profile.roles.join(", ")}. Based in ${profile.location}.`,
    "",
    "## Featured projects",
    ...featured.map(
      (p) =>
        `- ${p.title}: ${p.tagline}. ${p.points[0]} Stack: ${p.stack.join(", ")}.${
          p.links?.[0] ? ` ${p.links[0].href}` : ""
        }`,
    ),
    "",
    "## Work at Tata Motors",
    ...work.map((p) => `- ${p.title}: ${p.tagline}. ${p.points.join(" ")}`),
    "",
    "## Experience",
    ...experience.map((e) => `- ${e.title}, ${e.subtitle} (${e.period})`),
    "",
    "## Skills",
    ...skillGroups.map((g) => `- ${g.label}: ${g.skills.map((s) => s.name).join(", ")}`),
    "",
    "## Contact",
    ...connect.map((c) => `- ${c.subtitle}: ${c.href.replace("mailto:", "")}`),
    "",
  ];
  return new Response(lines.join("\n").replace(/\*\*/g, ""), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
