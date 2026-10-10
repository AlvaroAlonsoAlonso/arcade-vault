# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Project

Arcade Vault: an online platform to play retro arcade games and compete for the highest score. UI copy and domain naming are in Spanish.

Development follows Spec Driven Design using the `/spec` and `/spec-impl` skills from https://github.com/Klerith/fernando-skills (install with `npx skills@latest add Klerith/fernando-skills`). Write a spec before implementing a feature.

## Commands

```bash
npm run dev     # next dev (Turbopack)
npm run build   # production build
npm run start   # serve the production build
npm run lint    # eslint (flat config, next core-web-vitals + typescript)
```

There is no test runner configured yet.

## Stack and config notes

- Next.js 16.4 (App Router, `app/`), React 19.3, TypeScript strict, Tailwind CSS v4.
- Next.js APIs differ from training data — check `node_modules/next/dist/docs/` before writing Next code (see AGENTS.md).
- `next.config.ts` enables `cacheComponents`, `partialPrefetching` and `experimental.agentFeedback`. Cache Components changes data-fetching/caching semantics (dynamic data must be inside `<Suspense>` or explicitly cached) — read the docs for it before writing data-fetching code.
- Tailwind v4 is wired through Turbopack via `@tailwindcss/turbopack` as a CSS loader rule in `next.config.ts` (not PostCSS). Theme tokens live in `app/globals.css` under `@theme inline`.
- Path alias `@/*` maps to the repo root.
- Layouts use the global `LayoutProps<"/">` / `PageProps` route types generated into `.next/types`.

## Current state

`app/` is still the create-next-app scaffold. The real product design lives in `references/templates/`.

## Design reference: `references/templates/`

A standalone HTML/React 18 prototype (Babel in the browser, globals on `window`, no build) that is the visual and functional spec for the app. Open `Arcade Vault.html` to view it. It is reference material to port into the Next.js app, not code to import.

- Screens / routes (hash-based routing in `app.jsx`): `biblioteca` (game library, `biblioteca.jsx`), `detalle` (game detail, `detalle.jsx`), `player` (game player with score/lives/level, `reproductor.jsx`), `auth` (login, `auth.jsx`), `salon` (hall of fame / leaderboards, `salon.jsx`), plus `nav.jsx`.
- `data.jsx` holds mock data: `GAMES` (id, title, short/long description, category, cover class, accent color, best score, plays), `CATS`, and `seededScores()` for deterministic fake leaderboards.
- Session user and saved scores are persisted in `localStorage` (`av_user`, `av_scores`) in the prototype.
- `styles.css` defines the neon/retro theme: dark palette tokens (`--bg*`, `--ink*`, `--cyan`, `--magenta`, `--yellow`, `--green`, `--gold/silver/bronze`), fonts "Press Start 2P" (`--pixel`) and JetBrains Mono (`--mono`), and `av-*` class names. Carry these tokens into the Tailwind theme when porting.
