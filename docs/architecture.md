# Frontend architecture

Siterm is one continuous Terminal session. Commands append Command outputs to a Transcript; article hashes synchronize navigation without replacing that session with conventional pages.

## Source layout

```text
src/
├── App.tsx                    # application composition only
├── commands/
│   ├── definitions/           # one definition per canonical command
│   ├── catalog.ts             # names, aliases, and primary Help metadata
│   └── parser.ts              # tokenization, lookup, completion, suggestions
├── components/
│   ├── common/                # shared presentational building blocks
│   ├── outputs/               # Command output renderers
│   └── terminal/              # Transcript, Prompt, and Status line
├── hooks/                     # Terminal session state and browser effects
├── config/                    # owner and Terminal profile configuration
├── content/                   # published posts
├── lib/                       # routing, persistence, and other browser helpers
├── styles/                    # ordered visual-system layers
└── types/                     # shared data and result contracts
```

Dependencies point toward behavior and data: terminal components use hooks and output components; hooks coordinate commands and browser helpers; command definitions return typed results without importing React. `src/styles.css` is the single ordered stylesheet entry.

## Session invariants

- Typed and clicked commands go through the same `runCommand` interface.
- Each Transcript entry snapshots the Terminal profile and Guestbook visible when it was created. Later state changes must not rewrite earlier Command outputs.
- Hash changes append a Command output and synchronize the document title; they do not replace the Transcript.
- `clear` removes visible Transcript entries while preserving command history.
- Storage failures fall back safely and must not stop the current Terminal session.
- Existing class names, data attributes, accessible names, and storage keys are compatibility surfaces covered by the Playwright suite.

## Add a command

1. Add a definition under `src/commands/definitions/` with its canonical name, aliases, optional primary Help metadata, and parser.
2. Register the definition once in `src/commands/catalog.ts`.
3. If the command needs a new result shape, add it to `CommandResult` in `src/types/command.ts`.
4. For a distinct Command output, add a renderer under `src/components/outputs/` and handle the result in `Output.tsx`. Commands returning the shared `text` result need no new renderer.
5. Add parser or catalog coverage, then run `npm test`, `npm run test:e2e`, and `npm run build`.

Aliases belong to the canonical command definition rather than separate files. Primary Help remains curated: omitting Help metadata keeps utility commands executable but out of the main guide.

## Customize content

- Edit `src/config/site.ts` for the site owner identity and default Terminal profile.
- Add or edit a Markdown file directly under `src/content/` to publish or revise a post. The filename is the URL slug; no registry needs to be updated. Use this shape:

  ```markdown
  ---
  title: Article title
  excerpt: A short summary shown above the article.
  date: 2026-09-07
  readingTime: 5 min
  tags:
    - design
    - software
  ---

  Opening paragraph.

  ## Section heading

  More article content.
  ```

  Article bodies support paragraphs, level-two headings, block quotes, unordered lists, and fenced code blocks. `src/content/posts.ts` discovers every `.md` file and orders the archive newest first by `date`.
- Add Terminal profiles in `src/config/terminalProfiles.ts`, with matching visual tokens in `src/styles/tokens.css`.
