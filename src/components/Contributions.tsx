import { profile } from "@/data/site";
import { ContributionBars, type Day } from "./ContributionBars";

const REVALIDATE = 3600; // refresh hourly

const LEVELS: Record<string, Day["level"]> = {
  NONE: 0,
  FIRST_QUARTILE: 1,
  SECOND_QUARTILE: 2,
  THIRD_QUARTILE: 3,
  FOURTH_QUARTILE: 4,
};

type CalendarDay = { date: string; contributionCount: number; contributionLevel: string };
type Calendar = { contributionCalendar: { weeks: { contributionDays: CalendarDay[] }[] } };

async function graphql<T>(token: string, query: string, variables: Record<string, unknown>) {
  const res = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables }),
    next: { revalidate: REVALIDATE },
  });
  if (!res.ok) return null;
  const json = await res.json();
  return (json?.data ?? null) as T | null;
}

/**
 * Official GitHub GraphQL API, every year the account has contributions in.
 * Needs GITHUB_TOKEN; a fine-grained token with public read access is enough.
 */
async function fromGitHub(token: string): Promise<Day[] | null> {
  const years = await graphql<{ user: { contributionsCollection: { contributionYears: number[] } } }>(
    token,
    `query($login: String!) { user(login: $login) { contributionsCollection { contributionYears } } }`,
    { login: profile.github },
  );
  const list = years?.user?.contributionsCollection?.contributionYears;
  if (!list?.length) return null;

  // One aliased collection per year (GitHub caps each collection at one year).
  const fields = list
    .map(
      (y) =>
        `y${y}: contributionsCollection(from: "${y}-01-01T00:00:00Z", to: "${y}-12-31T23:59:59Z") {
          contributionCalendar { weeks { contributionDays { date contributionCount contributionLevel } } }
        }`,
    )
    .join("\n");
  const data = await graphql<{ user: Record<string, Calendar> }>(
    token,
    `query($login: String!) { user(login: $login) { ${fields} } }`,
    { login: profile.github },
  );
  if (!data?.user) return null;

  return Object.values(data.user).flatMap((c) =>
    c.contributionCalendar.weeks.flatMap((w) =>
      w.contributionDays.map((d) => ({
        date: d.date,
        count: d.contributionCount,
        level: LEVELS[d.contributionLevel] ?? 0,
      })),
    ),
  );
}

/** Keyless public mirror of the profile calendar; used when no token is set or GitHub fails. */
async function fromPublicMirror(): Promise<Day[] | null> {
  const res = await fetch(
    `https://github-contributions-api.jogruber.de/v4/${profile.github}?y=all`,
    { next: { revalidate: REVALIDATE } },
  );
  if (!res.ok) return null;
  const json = (await res.json()) as { contributions: Day[] };
  return json.contributions;
}

/** Full daily history up to today (in the owner's timezone), oldest first. */
async function getHistory(): Promise<Day[] | null> {
  const token = process.env.GITHUB_TOKEN;
  let days: Day[] | null = null;
  try {
    if (token) days = await fromGitHub(token);
  } catch {}
  try {
    days ??= await fromPublicMirror();
  } catch {}
  if (!days) return null;
  const today = new Date().toLocaleDateString("en-CA", { timeZone: profile.timeZone });
  const unique = new Map(days.filter((d) => d.date <= today).map((d) => [d.date, d]));
  return [...unique.values()].sort((a, b) => a.date.localeCompare(b.date));
}

/** GitHub activity with 30 / 60 / 90 day and all-time views, refreshed hourly. */
export async function Contributions() {
  const days = await getHistory();
  return <ContributionBars days={days} username={profile.github} />;
}
