# siterm

[English](./README.md) | [简体中文](./README.zh-CN.md)

A static personal blog template expressed as one continuous, terminal-native interface. Visitors can type commands or activate the same commands directly in the Transcript, while the production build remains a collection of ordinary static files.

[Live demo](https://feli77.github.io/siterm/)

## Features

- Executable terminal commands with familiar shell aliases
- Post browsing, tag filtering, article reading, and hash-based deep links
- Three Terminal profiles—`amber`, `green`, and `mono`—with local preference persistence
- Command history, Arrow Up/Down navigation, Tab completion, and typo suggestions
- Responsive desktop and compact layouts with keyboard-accessible command targets
- A browser-local Guestbook with safe message normalization
- Automated Vitest, Playwright, production-build, and GitHub Pages deployment checks

## Requirements

Node.js 24 is recommended and is used by CI. The current Vite toolchain supports Node.js `^20.19.0` or `>=22.12.0`.

## Installation

```bash
git clone https://github.com/feli77/siterm.git
cd siterm
npm install
```

## Local development

```bash
npm run dev
```

Useful checks:

```bash
npm test
npm run test:e2e
npm run build
npm run preview
```

Install Chromium before running the browser suite for the first time:

```bash
npx playwright install chromium
```

## Customization

Most personal customization happens in two files:

- `src/config/site.ts`: name, introduction, location, timezone, contact details, interests, and default Terminal profile.
- `src/content/posts.ts`: post metadata and ordered article content blocks.

You may also replace `public/favicon.svg`. Command definitions live in `src/commands/definitions/`, Command outputs in `src/components/outputs/`, Terminal session behavior in `src/hooks/`, and the ordered visual-system entry in `src/styles.css`. See the [frontend architecture guide](./docs/architecture.md) for the complete layout and extension workflow.

The supported Terminal profiles are `amber`, `green`, and `mono`; `amber` is the default.

## Commands

| Command | Aliases | Result |
| --- | --- | --- |
| `help` | `man` | Show the command guide |
| `about` | `neofetch` | Show the configured owner profile |
| `posts [tag]` | `ls [tag]` | Browse all posts or filter by tag |
| `open <number or slug>` | `read`, `cat` | Open an article |
| `tags` | — | List available tags |
| `theme [name]` | `theme --list` | List or switch Terminal profiles |
| `guestbook` | — | Read the local Guestbook |
| `sign "message"` | — | Leave a message in the current browser |
| `contact` | `github` | Show configured contact links |
| `history` | — | Show commands from the current session |
| `home` | — | Append the welcome output and return to the root route |
| `clear` | — | Clear visible Transcript output while retaining history |
| `date` | — | Show the browser-local date and time |
| `whoami` | — | Show the current visitor identity |
| `pwd` | — | Show the playful current path |
| `echo <text>` | — | Echo text into the Transcript |
| `sudo` | — | Run the permission-denied easter egg |

## Static Guestbook behavior

A purely static site cannot store shared visitor data by itself. The default `sign` command writes entries to the visitor's `localStorage`, so those entries are visible only in the same browser. If storage is unavailable, new entries still remain visible for the current session.

A public Guestbook requires an external service such as GitHub Discussions, Giscus, Supabase, or another hosted backend. This is not a drop-in replacement of `src/lib/guestbook.ts`: an asynchronous integration must also update the state and command flow in `src/hooks/useTerminalSession.ts`.

## Deploying to GitHub Pages

The repository includes `.github/workflows/deploy.yml`. In **Settings → Pages → Build and deployment**, set **Source** to **GitHub Actions**. Every push to `main` then installs dependencies, runs the unit and browser suites, builds `dist/`, and deploys it to Pages.

Vite uses relative asset paths, so the build works for both user sites and repository subpaths. Article navigation uses URL hashes and requires no server rewrite rules.
