# John George — Portfolio

A minimal personal site built with Next.js 16, Tailwind CSS 4 and Phosphor icons. The design is inspired by [ch.sh](https://ch.sh).

```bash
npm install
npm run dev     # http://localhost:3000
```

## Pages

| Route       | What it is                                                              |
| ----------- | ----------------------------------------------------------------------- |
| `/`         | Intro, featured projects, Tata Motors work, experience, contact, live GitHub activity |
| `/skills`   | Curated agent skills for AI engineering and full-stack work             |
| `/shelf`    | Tools, frameworks, reads, videos, music and investing resources          |
| `/llms.txt` | Plain-text summary for LLMs, generated from the data files               |

## Editing content

All content lives in `src/data/`, so you shouldn't need to touch the components:

- `site.ts`: bio facts, projects (shown in the detail sheets), experience and links
- `skills.ts`: skills page groups
- `shelf.ts`: shelf lists. Entries marked `sample: true` are placeholders to replace.

Project screenshots go in `public/work/` and are referenced with `image`. A project without a screenshot gets a generated tile tinted by its `accent` color.

## Details

- Light and dark themes (saved per visitor, defaults to the system setting)
- Optional synthesized UI sounds (Web Audio, no audio files)
- Live clock in IST
- GitHub contributions for the last 30 days, refreshed hourly via ISR
- The footer shows the commit SHA when deployed on Vercel
