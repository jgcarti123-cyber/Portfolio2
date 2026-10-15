// Prints the `playlist` details for a Spotify playlist, ready to paste into src/data/shelf.ts.
// Reads Spotify's public embed page, so it only works for public playlists.
//
//   node scripts/spotify-playlist.mjs https://open.spotify.com/playlist/<id>

const url = process.argv[2];
const id = url?.match(/playlist\/([A-Za-z0-9]+)/)?.[1];
if (!id) {
  console.error("Usage: node scripts/spotify-playlist.mjs https://open.spotify.com/playlist/<id>");
  process.exit(1);
}

const html = await fetch(`https://open.spotify.com/embed/playlist/${id}`, {
  headers: { "User-Agent": "Mozilla/5.0" },
}).then((r) => r.text());

const json = html.match(/<script id="__NEXT_DATA__" type="application\/json">(.*?)<\/script>/s)?.[1];
if (!json) {
  console.error("Could not read the playlist. Is it public?");
  process.exit(1);
}

const e = JSON.parse(json).props.pageProps.state.data.entity;
const rgb = (c) => [c.red, c.green, c.blue];
const tracks = e.trackList ?? [];
const clean = (s) => s.replace(/ /g, " ");

const playlist = {
  owner: e.subtitle,
  songs: tracks.length,
  seconds: Math.round(tracks.reduce((n, t) => n + (t.duration ?? 0), 0) / 1000),
  color: rgb(e.visualIdentity.backgroundBase),
  tint: rgb(e.visualIdentity.backgroundTintedBase),
  subdued: rgb(e.visualIdentity.textSubdued),
  tracks: tracks.slice(0, 3).map((t) => ({
    title: clean(t.title),
    artist: clean(t.subtitle),
    seconds: Math.round(t.duration / 1000),
  })),
};

console.log(`// ${e.name}\nplaylist: ${JSON.stringify(playlist, null, 2)},`);
