"use client";

import { useMemo, useState } from "react";
import {
  ArrowUpRight,
  BookOpen,
  CaretDown,
  ChartLineUp,
  Cloud,
  Database,
  GraduationCap,
  ListBullets,
  MusicNotes,
  Plug,
  Robot,
  SquaresFour,
  Stack,
  TreeStructure,
  Wrench,
  YoutubeLogo,
} from "@phosphor-icons/react/dist/ssr";
import type { Icon as PhosphorIcon } from "@phosphor-icons/react";
import { shelfGroups, type ShelfIcon, type ShelfLink, type ShelfList } from "@/data/shelf";
import { useHydrated } from "@/lib/hooks";
import { tellMascot } from "@/lib/mascot";
import { PlaylistCard } from "./PlaylistCard";
import { delay, SectionLabel } from "./Section";

const icons: Record<ShelfIcon, PhosphorIcon> = {
  robot: Robot,
  plug: Plug,
  graph: TreeStructure,
  stack: Stack,
  database: Database,
  cloud: Cloud,
  wrench: Wrench,
  graduation: GraduationCap,
  book: BookOpen,
  youtube: YoutubeLogo,
  music: MusicNotes,
  chart: ChartLineUp,
};

type View = "grid" | "list";

function storedView(): View {
  try {
    return localStorage.getItem("shelf-view") === "list" ? "list" : "grid";
  } catch {
    return "grid";
  }
}

function host(href: string) {
  try {
    return new URL(href).hostname.replace(/^www\./, "");
  } catch {
    return href;
  }
}

function Favicon({ href, size, className = "" }: { href: string; size: number; className?: string }) {
  const [failed, setFailed] = useState(false);
  const h = host(href);
  if (failed) {
    return (
      <span
        className={`flex items-center justify-center rounded-md bg-neutral-200 text-[10px] font-semibold uppercase text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400 ${className}`}
        style={{ width: size, height: size }}
      >
        {h[0]}
      </span>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`https://www.google.com/s2/favicons?domain=${h}&sz=128`}
      alt=""
      width={size}
      height={size}
      loading="lazy"
      className={`rounded-[4px] ${className}`}
      onError={() => setFailed(true)}
    />
  );
}

/** Sites whose favicon is identical for every entry; never used as a stand-in for a real picture. */
const GENERIC_HOSTS = ["youtube.com", "youtu.be", "spotify.com"];
const isGeneric = (href: string) => GENERIC_HOSTS.some((h) => host(href).endsWith(h));

/** Neutral initial for entries that have neither a picture nor a distinctive favicon. */
function Monogram({ name, size, className = "" }: { name: string; size: number; className?: string }) {
  return (
    <span
      className={`flex shrink-0 items-center justify-center bg-neutral-200 font-semibold uppercase text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400 ${className}`}
      style={{ width: size, height: size, fontSize: size * 0.45 }}
    >
      {name.trim()[0]}
    </span>
  );
}

/** Small leading icon: avatar or badge when there is one, otherwise the site's favicon (if distinctive). */
function LinkIcon({ link, size = 16 }: { link: ShelfLink; size?: number }) {
  const src = link.badge ?? link.avatar;
  const rounded = link.square ? "rounded-[4px]" : "rounded-full";
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt="" width={size} height={size} loading="lazy" className={`shrink-0 object-cover ${rounded}`} />
    );
  }
  if (isGeneric(link.href)) return null;
  return <Favicon href={link.href} size={size} />;
}

function GridCard({ link }: { link: ShelfLink }) {
  const generic = isGeneric(link.href);
  return (
    <a
      href={link.href}
      target="_blank"
      rel="noreferrer"
      title={link.description}
      className="group block outline-none"
    >
      <span
        data-pulse
        className="relative flex aspect-[19/10] items-center justify-center overflow-hidden rounded-xl bg-neutral-50 shadow-[0_0_0_1px_rgb(0_0_0/0.06)] transition-all duration-200 group-hover:bg-neutral-100 group-focus-visible:ring-2 group-focus-visible:ring-neutral-300 group-active:scale-[0.98] dark:bg-neutral-900 dark:shadow-[0_0_0_1px_rgb(255_255_255/0.06)] dark:group-hover:bg-neutral-800"
      >
        {link.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={link.image}
            alt=""
            className="absolute inset-0 size-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
          />
        ) : link.avatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={link.avatar}
            alt=""
            loading="lazy"
            className={`size-16 object-cover shadow-sm ring-1 ring-black/5 transition-transform duration-200 group-hover:scale-110 dark:ring-white/10 ${
              link.square ? "rounded-xl" : "rounded-full"
            }`}
          />
        ) : generic ? (
          <Monogram name={link.name} size={56} className="rounded-full transition-transform duration-200 group-hover:scale-110" />
        ) : (
          <Favicon
            href={link.href}
            size={40}
            className="shadow-sm transition-transform duration-200 group-hover:scale-110"
          />
        )}
        <ArrowUpRight
          size={14}
          weight="bold"
          className={`absolute right-3 top-3 opacity-0 transition-all duration-200 group-hover:opacity-100 ${
            link.image ? "text-white drop-shadow" : "text-neutral-400"
          }`}
        />
      </span>
      <span className="mt-2.5 flex items-center gap-2">
        <LinkIcon link={link} />
        <span className="truncate text-sm font-medium text-foreground">{link.name}</span>
      </span>
    </a>
  );
}

function ListRow({ link }: { link: ShelfLink }) {
  return (
    <a
      href={link.href}
      target="_blank"
      rel="noreferrer"
      className="group -mx-3 flex items-center gap-3 rounded-lg px-3 py-2 outline-none transition-all duration-150 hover:bg-neutral-100 focus-visible:bg-neutral-100 active:scale-[0.99] dark:hover:bg-neutral-900 dark:focus-visible:bg-neutral-900"
    >
      <LinkIcon link={link} />
      <span className="min-w-0 flex-1 truncate text-sm">
        <span className="font-medium text-foreground">{link.name}</span>
        <span className="text-neutral-400 dark:text-neutral-600"> · {link.description}</span>
      </span>
      <span className="hidden shrink-0 text-xs text-neutral-400 sm:block dark:text-neutral-600">{host(link.href)}</span>
    </a>
  );
}

function Links({ links, view, offset = 0 }: { links: ShelfLink[]; view: View; offset?: number }) {
  // Playlists get full-width Spotify-style cards instead of tiles.
  if (view === "grid" && links.length > 0 && links.every((l) => l.playlist)) {
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        {links.map((l, i) => (
          <div key={l.href} data-ground="card" className="fade-in" style={delay(offset + i * 60)}>
            <PlaylistCard link={l} />
          </div>
        ))}
      </div>
    );
  }
  return view === "grid" ? (
    <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:gap-x-6 lg:grid-cols-3">
      {links.map((l, i) => (
        <div key={l.href} data-ground="card" className="fade-in" style={delay(offset + i * 30)}>
          <GridCard link={l} />
        </div>
      ))}
    </div>
  ) : (
    <div className="flex flex-col">
      {links.map((l, i) => (
        <div key={l.href} data-ground="card" className="fade-in" style={delay(offset + i * 20)}>
          <ListRow link={l} />
        </div>
      ))}
    </div>
  );
}

type Group = { kind: "group"; name: string; slug: string; icon: ShelfIcon; lists: ShelfList[] };
type Entry = { kind: "list"; list: ShelfList } | Group;

/** Sidebar order: lists in sequence, with grouped lists collected under their first appearance. */
function buildEntries(lists: ShelfList[]): Entry[] {
  const entries: Entry[] = [];
  const groups = new Map<string, Group>();
  for (const list of lists) {
    if (!list.group) {
      entries.push({ kind: "list", list });
      continue;
    }
    let g = groups.get(list.group);
    if (!g) {
      const meta = shelfGroups[list.group];
      g = {
        kind: "group",
        name: list.group,
        slug: meta?.slug ?? list.group.toLowerCase(),
        icon: meta?.icon ?? list.icon,
        lists: [],
      };
      groups.set(list.group, g);
      entries.push(g);
    }
    g.lists.push(list);
  }
  return entries;
}

const countOf = (g: Group) => g.lists.reduce((n, l) => n + l.links.length, 0);

const rowBase =
  "text-sm transition-all duration-150 active:scale-[0.98]";
const rowOn = "bg-neutral-100 text-foreground dark:bg-neutral-900";
const rowOff =
  "text-neutral-500 hover:bg-neutral-50 hover:text-foreground dark:text-neutral-400 dark:hover:bg-neutral-900/60";

export function ShelfBrowser({ lists }: { lists: ShelfList[] }) {
  const hydrated = useHydrated();
  const [picked, setActive] = useState<string | null>(null);
  const [pickedView, setView] = useState<View | null>(null);
  const [expandedBy, setExpandedBy] = useState<Record<string, boolean>>({});
  const [pickerOpen, setPickerOpen] = useState(true); // phones: every list as a tile, until one is picked

  const entries = useMemo(() => buildEntries(lists), [lists]);

  // Before the visitor picks anything, honour ?list= and the remembered layout.
  const requested = picked ?? (hydrated ? new URLSearchParams(window.location.search).get("list") : null);
  const view: View = pickedView ?? (hydrated ? storedView() : "grid");

  // What is on screen: the requested list. A group's own slug (an old ?list=watch link) opens its first list.
  const firstOfGroup = entries.find((e): e is Group => e.kind === "group" && e.slug === requested)?.lists[0];
  const current = lists.find((l) => l.slug === requested) ?? firstOfGroup ?? lists[0];
  const activeSlug = current.slug;

  function select(slug: string) {
    setActive(slug);
    setPickerOpen(false);
    tellMascot({ type: "shelf", slug });
    const url = new URL(window.location.href);
    url.searchParams.set("list", slug);
    window.history.replaceState(null, "", url);
  }

  // A group heading only folds and unfolds its lists; the visitor picks one from underneath.
  function toggleGroup(g: Group) {
    setExpandedBy((m) => ({ ...m, [g.slug]: !isExpanded(g) }));
  }

  // Open by default while one of its lists is showing.
  function isExpanded(g: Group) {
    return expandedBy[g.slug] ?? g.lists.some((l) => l.slug === activeSlug);
  }

  function changeView(v: View) {
    setView(v);
    try {
      localStorage.setItem("shelf-view", v);
    } catch {}
  }

  const viewToggle = (
    <div className="flex items-center gap-1" role="group" aria-label="Layout">
      {(["grid", "list"] as const).map((v) => {
        const I = v === "grid" ? SquaresFour : ListBullets;
        return (
          <button
            key={v}
            type="button"
            onClick={() => changeView(v)}
            aria-pressed={view === v}
            aria-label={v === "grid" ? "Grid view" : "List view"}
            className={`flex size-6 cursor-pointer items-center justify-center rounded-md transition-colors ${
              view === v
                ? "text-neutral-800 dark:text-neutral-200"
                : "text-neutral-300 hover:text-neutral-500 dark:text-neutral-700 dark:hover:text-neutral-500"
            }`}
          >
            <I size={16} weight={view === v ? "fill" : "bold"} />
          </button>
        );
      })}
    </div>
  );

  return (
    <div className="flex flex-col gap-8 desktop:grid desktop:grid-cols-[260px_1fr] desktop:gap-x-16">
      {/* Lists */}
      <nav aria-label="Lists">
        <SectionLabel style={delay(100)}>Lists</SectionLabel>

        {/* Phones: every list at once as tiles. Picking one folds them into a bar that opens them again. */}
        <div className="mt-4 desktop:hidden">
          <button
            type="button"
            data-picker-bar
            onClick={() => setPickerOpen((o) => !o)}
            aria-expanded={pickerOpen}
            className="flex w-full cursor-pointer items-center gap-3 rounded-xl bg-neutral-100 px-3 py-2.5 text-left text-sm outline-none transition-transform active:scale-[0.99] focus-visible:ring-2 focus-visible:ring-neutral-300 dark:bg-neutral-900"
          >
            {(() => {
              const I = icons[current.icon];
              return <I size={16} weight="fill" className="text-neutral-700 dark:text-neutral-300" />;
            })()}
            <span className="flex-1 truncate font-medium">
              {current.group ? `${current.group} · ${current.label}` : current.label}
            </span>
            <span className="text-xs tabular-nums text-neutral-400 dark:text-neutral-600">{current.links.length}</span>
            <CaretDown
              size={12}
              weight="bold"
              className={`text-neutral-400 transition-transform duration-200 dark:text-neutral-600 ${pickerOpen ? "rotate-180" : ""}`}
            />
          </button>
          <div
            className={`grid transition-[grid-template-rows] duration-200 ease-out ${pickerOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
            inert={!pickerOpen}
          >
            <div className="min-h-0 overflow-hidden">
              <div className="grid grid-cols-3 gap-2 pt-2 sm:grid-cols-4">
                {entries.flatMap((e) =>
                  e.kind === "list"
                    ? [{ list: e.list, icon: e.list.icon, group: undefined as string | undefined }]
                    : e.lists.map((l) => ({ list: l, icon: e.icon, group: e.name })),
                ).map(({ list, icon, group }) => {
                  const I = icons[icon];
                  const on = list.slug === activeSlug;
                  return (
                    <button
                      key={list.slug}
                      type="button"
                      data-slug={list.slug}
                      onClick={() => select(list.slug)}
                      aria-pressed={on}
                      className={`flex min-h-[72px] cursor-pointer flex-col justify-between gap-2 rounded-xl px-3 py-2.5 text-left text-[13px] leading-4 outline-none transition-colors focus-visible:ring-2 focus-visible:ring-neutral-300 ${
                        on
                          ? "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900"
                          : "bg-neutral-100 text-neutral-700 dark:bg-neutral-900 dark:text-neutral-300"
                      }`}
                    >
                      <span className="flex items-center justify-between">
                        <I size={16} weight="bold" />
                        <span className="text-[11px] tabular-nums opacity-60">{list.links.length}</span>
                      </span>
                      <span className="font-medium">
                        {group && <span className="block text-[10px] font-normal tracking-wide uppercase opacity-60">{group}</span>}
                        {list.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Desktop: vertical list with counts; groups fold open to their lists */}
        <ul className="mt-4 hidden flex-col gap-0.5 desktop:flex">
          {entries.map((e, i) => {
            if (e.kind === "list") {
              const I = icons[e.list.icon];
              const on = e.list.slug === activeSlug;
              return (
                <li key={e.list.slug} className="fade-in" style={delay(125 + i * 20)}>
                  <button
                    type="button"
                    data-slug={e.list.slug}
                    onClick={() => select(e.list.slug)}
                    aria-current={on ? "true" : undefined}
                    className={`group -mx-3 flex w-[calc(100%+1.5rem)] cursor-pointer items-center gap-3 rounded-lg px-3 py-1.5 text-left ${rowBase} ${on ? rowOn : rowOff}`}
                  >
                    <I
                      size={16}
                      weight={on ? "fill" : "bold"}
                      className={on ? "text-neutral-700 dark:text-neutral-300" : "text-neutral-400 dark:text-neutral-600"}
                    />
                    <span className="flex-1 font-medium">{e.list.label}</span>
                    <span className="text-xs tabular-nums text-neutral-400 dark:text-neutral-600">{e.list.links.length}</span>
                  </button>
                </li>
              );
            }

            const I = icons[e.icon];
            const open = isExpanded(e);
            const inside = e.lists.some((l) => l.slug === activeSlug);
            return (
              <li key={e.slug} className="fade-in" style={delay(125 + i * 20)}>
                <button
                  type="button"
                  onClick={() => toggleGroup(e)}
                  aria-expanded={open}
                  className={`group -mx-3 flex w-[calc(100%+1.5rem)] cursor-pointer items-center gap-3 rounded-lg px-3 py-1.5 text-left ${rowBase} ${
                    inside ? "text-foreground hover:bg-neutral-50 dark:hover:bg-neutral-900/60" : rowOff
                  }`}
                >
                  <I
                    size={16}
                    weight={inside ? "fill" : "bold"}
                    className={inside ? "text-neutral-700 dark:text-neutral-300" : "text-neutral-400 dark:text-neutral-600"}
                  />
                  <span className="flex-1 font-medium">{e.name}</span>
                  <CaretDown
                    size={12}
                    weight="bold"
                    className={`text-neutral-400 transition-transform duration-200 dark:text-neutral-600 ${open ? "" : "-rotate-90"}`}
                  />
                  <span className="w-4 text-right text-xs tabular-nums text-neutral-400 dark:text-neutral-600">{countOf(e)}</span>
                </button>

                {/* Folds with a grid-rows transition; inert keeps hidden rows out of the tab order. */}
                <div
                  className={`grid transition-[grid-template-rows] duration-200 ease-out ${open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
                  inert={!open}
                >
                  <ul className="min-h-0 overflow-hidden">
                    <li className="ml-2 mt-0.5 flex flex-col gap-0.5 border-l border-neutral-200 pl-2 dark:border-neutral-800">
                      {e.lists.map((l) => {
                        const childOn = l.slug === activeSlug;
                        return (
                          <button
                            key={l.slug}
                            type="button"
                            data-slug={l.slug}
                            onClick={() => select(l.slug)}
                            aria-current={childOn ? "true" : undefined}
                            className={`flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-1.5 text-left ${rowBase} ${childOn ? rowOn : rowOff}`}
                          >
                            <span className="flex-1 truncate font-medium">{l.label}</span>
                            <span className="text-xs tabular-nums text-neutral-400 dark:text-neutral-600">{l.links.length}</span>
                          </button>
                        );
                      })}
                    </li>
                  </ul>
                </div>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Links */}
      <section aria-label={current.label}>
        <SectionLabel style={delay(150)} right={viewToggle}>
          {current.group ? `${current.group} · ${current.label}` : current.label}
        </SectionLabel>
        <div key={`${current.slug}-${view}`} className={view === "grid" ? "mt-5" : "mt-4"}>
          <Links links={current.links} view={view} offset={view === "grid" ? 150 : 100} />
        </div>
      </section>
    </div>
  );
}
