import { Play } from "@phosphor-icons/react/dist/ssr";
import type { ShelfLink } from "@/data/shelf";

const rgb = ([r, g, b]: [number, number, number], alpha = 1) => `rgb(${r} ${g} ${b} / ${alpha})`;

/** "52 min 20 sec", or "5 hr 34 min" for long playlists, as Spotify writes it. */
function total(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return h ? `${h} hr ${m} min` : `${m} min ${s} sec`;
}

const clock = (seconds: number) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;

/** Spotify-style playlist header: cover, big title, stats and top tracks on the cover's own colour. */
export function PlaylistCard({ link }: { link: ShelfLink }) {
  const p = link.playlist!;
  const cover = link.image ?? link.avatar;
  const subdued = { color: rgb(p.subdued) };
  const more = p.songs - p.tracks.length;

  return (
    <a
      href={link.href}
      target="_blank"
      rel="noreferrer"
      aria-label={`${link.name}, Spotify playlist by ${p.owner}, ${p.songs} songs`}
      data-pulse
      className="group relative block h-full overflow-hidden rounded-xl text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.08),0_16px_40px_-20px_rgb(0_0_0/0.6)] outline-none transition-transform duration-300 ease-out hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-neutral-400 active:scale-[0.995]"
      style={{ background: `linear-gradient(180deg, ${rgb(p.color)} 0%, ${rgb(p.tint)} 62%, #121212 140%)` }}
    >
      {/* Soft light from the top right, so the colour doesn't read flat. */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ background: "radial-gradient(90% 70% at 100% 0%, rgb(255 255 255 / 0.10), transparent 60%)" }}
      />

      <div className="relative flex items-end gap-3.5 p-3.5">
        <div className="relative isolate size-[76px] shrink-0 sm:size-[84px]">
          {/* The cover, blurred, as a glow behind itself. */}
          {cover && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={cover}
              alt=""
              aria-hidden
              className="absolute inset-0 -z-10 size-full scale-125 rounded-lg object-cover opacity-70 blur-2xl saturate-150 transition-opacity duration-300 group-hover:opacity-90"
            />
          )}
          {cover && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={cover}
              alt=""
              className="size-full rounded-[5px] object-cover shadow-[0_6px_16px_rgb(0_0_0/0.45)] transition-transform duration-300 ease-out group-hover:scale-[1.02]"
            />
          )}
          <span className="absolute bottom-1.5 right-1.5 flex size-7 translate-y-1.5 items-center justify-center rounded-full bg-[#1ed760] text-black opacity-0 shadow-[0_8px_16px_rgb(0_0_0/0.35)] transition-all duration-300 ease-out group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100">
            <Play size={11} weight="fill" />
          </span>
        </div>

        <div className="min-w-0 flex-1 pb-1">
          <p className="text-[10px] font-medium uppercase tracking-wider" style={subdued}>
            Public Playlist
          </p>
          <h3 className="mt-0.5 truncate pb-0.5 text-2xl font-extrabold leading-[1.1] tracking-[-0.03em] sm:text-[28px]">
            {link.name}
          </h3>
          <p className="mt-1 text-[11px]" style={subdued}>
            <span className="font-semibold text-white">{p.owner}</span>
            <span className="hidden sm:inline"> • </span>
            <span className="block whitespace-nowrap sm:inline">
              {p.songs} songs, {total(p.seconds)}
            </span>
          </p>
        </div>
      </div>

      <ol className="relative border-t border-white/10 px-3.5 py-2">
        {p.tracks.map((t, i) => (
          <li key={t.title} className="grid grid-cols-[0.875rem_1fr_auto] items-baseline gap-2 py-[3px] text-xs">
            <span className="text-[11px] tabular-nums" style={subdued}>
              {i + 1}
            </span>
            <span className="min-w-0 truncate">
              <span className="text-white">{t.title}</span>
              <span style={subdued}> · {t.artist}</span>
            </span>
            <span className="text-[11px] tabular-nums" style={subdued}>
              {clock(t.seconds)}
            </span>
          </li>
        ))}
        {more > 0 && (
          <li className="pt-0.5 text-[10px]" style={subdued}>
            + {more} more {more === 1 ? "song" : "songs"}
          </li>
        )}
      </ol>
    </a>
  );
}
