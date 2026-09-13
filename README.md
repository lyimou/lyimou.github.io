# lyimou.github.io

Personal site and technical blog of **Huang For Wa, Andy** ([@lyimou](https://github.com/lyimou)) — Computer Science student at HKUST.

Built with **Astro 7**, TypeScript, and Tailwind CSS 4, deployed to GitHub Pages at <https://lyimou.github.io>.

The site is deliberately **light-first, desktop-first, and low-JS**: the whole JS budget is a short, explicit list of islands, and everything else is static HTML.

---

## Status

This project is being built in stages. Current state:

| Stage | Scope | State |
| --- | --- | --- |
| T1 | Project skeleton: config, i18n routing, content schemas, base layout, placeholder routes | ✅ done |
| T2 | Design system: tokens, dark mode, typography, atomic components | ⏳ next |
| T3 | Page implementation (home, projects, blog, about, search, 404) | — |
| T4 | Interactive islands (typing effect, project filter, TOC, reading progress, code copy, Pagefind) | — |
| T5 | Real content | — |
| T6 | SEO, RSS, OG images, deployment verification | — |

The authoritative specification lives outside this repository in `website-requirements.md`.

---

## Requirements

- Node.js **>= 22.12** (developed on 24.x)
- npm

## Local development

```bash
npm install
npm run dev        # http://localhost:4321
```

## Build

```bash
npm run build      # runs `astro check` (types) then builds to dist/
npm run preview    # serve the built output locally
```

`npm run build:only` skips type checking when you just want output quickly.

## Project structure

```text
/
├── public/
│   ├── .nojekyll          # REQUIRED by GitHub Pages (see below)
│   ├── favicon.ico
│   └── favicon.svg
├── src/
│   ├── components/        # atomic UI pieces (added in T2)
│   ├── layouts/
│   │   └── BaseLayout.astro   # head, nav, footer, i18n switch, theme bootstrap
│   ├── pages/
│   │   ├── index.astro
│   │   ├── 404.astro
│   │   ├── search.astro
│   │   ├── projects/index.astro
│   │   ├── blog/index.astro
│   │   └── zh/            # Chinese mirror of the routes above
│   ├── content/
│   │   ├── projects/{en,zh}/*.mdx
│   │   └── blog/{en,zh}/*.mdx
│   ├── i18n/
│   │   └── ui.ts          # all chrome strings + locale path helpers
│   ├── styles/
│   │   └── global.css     # design tokens (@theme) + base layer
│   └── content.config.ts  # collection schemas (zod)
├── astro.config.mjs
├── tsconfig.json
└── .github/workflows/     # CI + Pages deploy
```

## Internationalisation

- English is the default and lives at `/`.
- Chinese lives under `/zh/`.
- Content pairs are linked by a `translationKey` field rather than by filename.
- All user-facing chrome text belongs in `src/i18n/ui.ts` — do not hard-code strings in components.
- A page with only one language is shown in that language and simply does not appear in the other language's lists; there is no automatic redirect.

## Deployment (GitHub Pages)

The site deploys from this repository's `main` branch via GitHub Actions.

Two details matter:

1. **`public/.nojekyll` must exist.** GitHub Pages runs Jekyll by default, and Jekyll ignores directories beginning with an underscore — which would drop Astro's `/_astro/` assets. CI fails the build if the file is missing from the output.
2. **`site` is set to `https://lyimou.github.io` with no `base`.** This repository is named exactly `lyimou.github.io`, so it is served from the domain root rather than a subpath.

To enable: **Settings → Pages → Source: GitHub Actions**.

### Custom domain

Not configured yet. When one is chosen, add a `public/CNAME` file containing the bare domain and configure DNS at the registrar.

## Conventions

- **Default zero JS.** Every hydrated island must be justified and listed in the specification; the initial-JS budget is 2 KB gzipped.
- **Accessibility target is WCAG AA.** Colour pairs are verified with a script rather than estimated.
- **No invented content.** Project write-ups must be traceable to something the author actually did.
- **MDX uses `{/* */}` for comments** — `<!-- -->` is a syntax error in MDX (it is fine in `.md`).

## License

Code: MIT. Written content and images: © Huang For Wa, Andy — please ask before reusing.
