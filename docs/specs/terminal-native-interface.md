# Terminal-native interface specification

Status: Approved on 2026-09-05

Approval: [Approve the terminal-native implementation specification](https://github.com/feli77/siterm/issues/5)

Scope: Production UI and interaction contract

Map: [Redesign Siterm as a terminal-native publishing interface](https://github.com/feli77/siterm/issues/1)

## 1. Purpose and source authority

This document is the production handoff for redesigning Siterm as one continuous, terminal-native personal publishing interface. It specifies observable behavior; it does not prescribe the React component structure.

The approved prototype decisions and their corrected commits are the primary design sources:

1. [Quiet transcript](https://github.com/feli77/siterm/tree/prototype/terminal-native-visual-grammar) at [`1758a17`](https://github.com/feli77/siterm/commit/1758a17) defines the visual grammar and terminal profiles.
2. [Aligned transcript](https://github.com/feli77/siterm/tree/prototype/content-commands-as-transcript-output) at [`8019927`](https://github.com/feli77/siterm/commit/8019927) defines content-output grammar.
3. [Priority fold](https://github.com/feli77/siterm/tree/prototype/responsive-terminal-session) at [`07eb133`](https://github.com/feli77/siterm/commit/07eb133) defines responsive behavior and supersedes earlier prototype values where they differ.

Rejected variants and the blue prototype switchers are not product requirements. Resolve conflicts in this order: the explicit ticket resolution, this consolidated contract, then the approved variant's throwaway code as a visual reference. In particular, production uses a 920px transcript container, a 640px compact breakpoint, a 68ch article measure, and the responsive prototype's type sizes.

## 2. Experience invariants

- The viewport is one **terminal session**, not a terminal window inside a page. It contains one chronological **transcript**, one final inline prompt, and one persistent **status line**.
- Commands and their responses remain in the transcript. Opening content must not replace the transcript or enter a separate page/content mode.
- Amber is the default **terminal profile**; green and mono are the only alternatives.
- The UI is a modern **terminal-native interface**, not vintage hardware simulation. It must contain no window chrome, Mac title bar, sidebar, cards, badges, palette picker, CRT effect, scan line/noise effect, pixel font, hardware-startup language, or sci-fi dashboard treatment.
- Whitespace, alignment, restrained CSS rules, and visible terminal/Markdown punctuation establish hierarchy. Do not introduce decorative emoji or unrelated text-art styles.
- Production must not expose prototype query parameters, variant switchers, prototype-only labels, or prototype sample state.

## 3. Visual contract

### 3.1 Geometry and type

- Support viewport widths from 320px upward without horizontal page scrolling.
- Reserve 28px at the viewport bottom for the fixed status line.
- Above 640px, the transcript is `min(100% - 40px, 920px)` wide, centered, with top padding `clamp(48px, 8vh, 92px)` and at least 150px of space after its final prompt.
- At 640px and below, the transcript is `100% - 28px` wide, with 32px top padding and at least 124px of space after its final prompt.
- Use the stack `"SFMono-Regular", "Cascadia Mono", "Roboto Mono", Consolas, monospace`, with ligatures disabled.
- Above 640px, base text is 15px at 1.7 line height. At 640px and below, base text is 14px at 1.72; the editable prompt text remains 16px to prevent browser focus zoom.
- An exchange has 18px between command and response, 42px vertical padding, and a 1px solid separator. At 640px and below it uses a 14px gap and 30px vertical padding.
- Response content is indented 28px above 640px and 14px at 640px and below.

### 3.2 Terminal profile tokens

Use these exact starting tokens. Sparse semantic error text uses `#ee836f` in every profile. Selection, focus, caret, prompt user, Markdown tokens, and actionable command text use the active accent.

| Token | Amber (default) | Green | Mono |
| --- | --- | --- | --- |
| background | `#100e0a` | `#09100b` | `#101010` |
| neutral surface | `#17130c` | `#0d1710` | `#171717` |
| primary ink | `#eedfc5` | `#d2e5d5` | `#e6e6e6` |
| muted ink | `#94856c` | `#78947d` | `#989898` |
| faint/decorative ink | `#574c3b` | `#3b5741` | `#565656` |
| rule | `#403622` | `#294a31` | `#3e3e3e` |
| accent | `#f5b942` | `#74d680` | `#f4f4f4` |

Faint ink is below normal-text contrast and may only label redundant or decorative information. Any unique text must use muted or stronger ink. Status-line background is always the neutral surface, never the accent; the accent may appear there only as foreground emphasis.

### 3.3 Boot sequence

- On a fresh/root session, the boot sequence is the first transcript output and appears immediately; it is not typed, timed, or animated.
- Use the full SITERM mark above 640px and its approved compact mark at 640px and below, followed by `[ personal publishing / one continuous terminal session ]`.
- Expose the section as `Siterm boot sequence` to assistive technology and hide the visual character art from the accessibility tree so it is not read character by character.
- Follow the mark with the existing configured owner introduction and plain-text command suggestions. Do not invent hardware checks, loading states, or fake system diagnostics.

### 3.4 Prompt and status line

- Every command echo and the final input use `guest@feli:~$`, with `guest@feli` in the accent, `:~` muted, and the command/`$` in primary ink.
- The input is bare and inline: transparent background, zero border, zero radius, no wrapper fill, and no submit button. The visible prompt is its label; the editable control also has an explicit accessible name.
- Focus changes the `$` and caret emphasis without drawing a field container. Only the 7px-wide block caret animates, blinking once per second with a step transition; under `prefers-reduced-motion: reduce` it remains steadily visible.
- The status line is fixed to the visual viewport bottom, 28px high, neutral, non-interactive, single-line, and never horizontally scrollable. Its priority rules must make every retained field fit; overflow clipping may be defensive only and must not truncate a field.
- Above 640px its segments are `[siterm]`, `0:home*`, flexible space, `profile:<name>`, and `<timezone-city> HH:MM` (for the shipped configuration, `shanghai`; use the configured timezone and a 24-hour clock).
- At 640px and below, abbreviate the first two segments to `[st]` and `home*`, omit the timezone-city label, and retain profile plus time. At 370px and below—or earlier if text zoom/spacing would otherwise overflow—omit profile before allowing overflow; session, location, and time remain. Never leave a partially clipped visible field.
- When a software keyboard is open, the status line follows the visible viewport bottom. The prompt itself remains in normal transcript flow and is never fixed, docked, sticky, or duplicated.

## 4. Transcript and output grammar

### 4.1 Exchange lifecycle

- Submitting a non-empty command appends its normalized command echo and one response to the transcript; the input clears and retains focus. Activating a command target does the same but leaves keyboard focus on the activating target rather than moving it unexpectedly.
- New output appears without a reveal/fade/slide transition. Bring the new response into view without overriding a visitor who has deliberately scrolled away from the tail.
- For an article, bring the article heading to the visible top area. For other commands, bring the end of the new response and final prompt into view. Programmatic scrolling is instant; it is not an animation exception.
- The final input remains the last transcript line after every command. Previously emitted exchanges remain unchanged until `clear`.

### 4.2 Posts

- Above 640px, output a compact aligned table ordered newest first with columns `NO.`, `DATE`, `TITLE`, and `READ`: `4ch 11ch minmax(0, 1fr) 6ch`, 16px gaps, and dashed row rules.
- Format numbers as two digits. The title is a clickable plain-text command target. Show tags as a quieter continuation under the title.
- End with an explicit count, ordering note, and the canonical invocation hint `open <n|slug>`.
- Clicking a post title executes `open <slug>` verbatim. `read` and `cat` remain accepted aliases but are not the primary displayed action.
- At 640px and below, use Priority fold: `3ch minmax(0, 1fr) 5ch`; retain number, title, and reading time; put tags beneath the title; omit listing date. Do not omit the date from the article header.
- A filtered result with no posts says `0 posts tagged “<tag>”` and offers the clickable next command `tags`.

### 4.3 Articles

- Render articles as readable Markdown source with `#`, `##`, `>`, `-`, and fenced-code tokens visible in the accent but subordinate to the prose.
- The header contains title, date, reading time, and tags. The body follows the source content order and does not rewrite the published copy.
- Cap the readable measure at 68ch above 640px and use available transcript width at 640px and below.
- Prose, metadata, commands, long slugs, and code must wrap without causing horizontal page scrolling down to 320px. Code uses preserved whitespace with wrapping rather than a page-level horizontal scrollbar.
- End every article with `-- END --`, a clickable `posts` return command, and a clickable next-article command when another article exists. Omit the next command for the final article.

### 4.4 Terminal profiles

- `theme` and `theme --list` both emit aligned rows for amber, green, and mono; the command parser must accept the displayed `--list` form. Mark the active profile with `*`; label amber `warm default`, green `low-glare green`, and mono `neutral grayscale`; end with `* current` and `theme <name>` guidance. Expose the active row programmatically (for example with `aria-current`).
- `theme <name>` applies a supported profile immediately to the entire terminal session and persists it in local storage.
- Retain stored `amber` and `green` values. Treat legacy `ice`, `rose`, malformed, or unavailable storage as no valid preference: use the configured default (`amber`) and replace a writable legacy value with `amber`. `mono` becomes a valid persisted value.

### 4.5 Help and remaining commands

- `help` groups the existing friendly commands by intent. Use these rows and order:
  - `read`: `about`; `posts [tag]` (`ls`); `open <n|slug>` (`read`, `cat`); `tags`.
  - `session`: `theme [name]`; `history`; `clear`; `home`.
  - `connect`: `guestbook`; `sign "message"`; `contact` (`github`).
- Within each group, align friendly command first, description second, and aliases in a quieter final column. At 640px and below, retain command and description but hide the redundant alias column.
- End help with a muted keyboard hint: `↑/↓ history · Tab complete · / focus prompt`.
- Existing utility commands `date`, `whoami`, `echo`, `pwd`, and `sudo` remain accepted even though they are not promoted in help. Their output uses the same exchange, text, error, and hint grammar.
- `about`, `tags`, `contact`, and `history` use aligned text/list rows within the same lightly indented response. External contact destinations are real links; executable terminal targets are command buttons styled as plain text.
- `clear` clears prior transcript output, resets the hash route and document title to the root values, preserves session command history, and leaves the prompt usable with a `0 lines`/`home` recovery hint. `home` appends the boot/welcome output and resets the hash route and document title to their root values.

### 4.6 Guestbook, empty states, and errors

- `guestbook` emits the newest six entries in newest-first order and reports the total local-entry count. Each entry begins with author plus timestamp/date; its message is lightly indented below. End with a clickable `sign "hello"` hint.
- Preserve the local-only guestbook: sample entries remain visible; visitor entries use author `you@this-browser`, are stored under `siterm.guestbook.v1`, survive reloads in that browser, and appear for the current session when storage is unavailable.
- Preserve input handling for `sign`: strip control characters, collapse whitespace, trim, reject an empty result, enforce the 160-character limit, and store an `en-CA` local date.
- Empty states always begin with an explicit zero count and offer the next command where one exists.
- Recoverable failures use two lines: `error: <cause>` then `hint: <next action>`. Make the next command clickable when one exists. Unknown commands retain the current edit-distance suggestion; an invalid profile must not change active state.

## 5. Preserved interaction behavior

- Preserve the current parser behavior for friendly commands and shell aliases, post lookup by number, exact slug/title, or slug prefix, case-insensitive command names, quoted tokenization, and tag filtering.
- Every command printed as a hint or exposed as a command target must be accepted verbatim by the real parser; prototype-only simulated syntax is forbidden. The only required parser extension is `theme --list`, equivalent to `theme` with no argument.
- Enter submits. Arrow Up/Down traverses the current session's command history. Tab completes only a unique top-level friendly-command prefix. `/` focuses the prompt when the event did not originate in an editable control.
- Selecting a command target executes exactly the displayed/associated command through the same parser and produces a normal command echo; it does not navigate to a separate UI.
- Selecting blank transcript space may focus the prompt; selecting text, an article, a link, a button, or the input must not steal or change focus.
- Preserve article hash routes as `#/post/<encoded-slug>`. A direct valid route emits boot/welcome plus the article and sets `<article title> — <site name>`; an invalid or malformed route emits a recoverable error. Browser Back/Forward replays the routed result in the same transcript without a page reload.
- External contact anchors use ordinary same-context navigation; do not force a new tab. Content and configuration continue to come from `src/content/posts.ts` and `src/config/site.ts`, not prototype fixtures.
- Opening an article pushes its route; `home` and `clear` push `#/`. Profile and guestbook storage failures must degrade to a working current session.
- On narrow screens, focusing the one final prompt scrolls that existing line into the visible viewport above the software keyboard after viewport resize settles. Do not create a mobile-only input.

## 6. Accessibility contract

- Use one main transcript landmark and one labeled prompt form. Preserve logical DOM and reading order: command, response, next command, response, final prompt; the visually fixed status line must not interrupt that order.
- Announce only newly appended responses through a polite, non-atomic live region. Do not re-announce the entire transcript after every command.
- Use semantic buttons for command actions, anchors for external navigation, native table markup or a complete accessible table role hierarchy for aligned data, and list semantics with explicit text labels for compact folded rows. Assistive technology must encounter only the representation active at the current breakpoint, not duplicate desktop and compact data.
- Every actionable element has a visible 2px accent focus outline with 3px offset. Dotted plain-text affordances remain visible without relying on color alone.
- At 640px and below, or whenever `pointer: coarse` applies, every command target has at least a 44px-high hit area, uses `touch-action: manipulation`, wraps safely, and retains keyboard focus visibility. Inline desktop links may use the WCAG inline-target exception only for a fine pointer.
- Primary, muted, accent, and error text must meet WCAG AA contrast against their actual backgrounds. Faint tokens are decorative/redundant only. Information must not depend on color, position, or animation alone.
- Zoom to 200%, text spacing overrides, keyboard-only operation, and `prefers-reduced-motion: reduce` must leave every command, article, prompt, and status value usable without overlap or data loss.

## 7. Acceptance contract

Production implementation is complete only when all of the following hold:

1. Existing command parser tests pass, with added coverage for all preserved aliases, history/completion, route parsing, legacy-profile migration, guestbook validation/storage fallback, and empty/error output contracts.
2. Production build passes and production never mounts prototype components or switchers for any query string.
3. Browser checks at 1440px, 641px, 640px, 390px, 371px, 370px, and 320px show the approved desktop/compact marks, correct post folding, a 68ch-or-narrower article, a 28px status line with no partially clipped field, no horizontal page overflow, and no console/page errors.
4. Keyboard checks cover Tab order, visible focus, Enter submission, Up/Down history, unique Tab completion, `/` focus, all command targets, and browser Back/Forward routes.
5. Touch/software-keyboard checks on a real or faithfully emulated mobile viewport confirm 44px targets, 16px prompt input, one flow-positioned prompt visible above the keyboard, and the status line at the visible viewport bottom.
6. Screen-reader checks confirm a concise boot label, meaningful table/list structure, one announcement per new result, useful error/hint text, and no character-by-character reading of ASCII art.
7. Reduced-motion checks show no cursor blink, smooth scrolling, fades, slides, or other motion. Default-motion checks animate only the cursor.
8. Visual comparison against the three primary prototype commits shows no reintroduction of rejected variants or forbidden chrome.

## 8. Outside this handoff

- Rewriting the command engine, article copy, content model, or deployment pipeline.
- Adding a shared guestbook backend or any server-side service.
- Shipping prototype variant controls or preserving rejected prototype variants.
- Production implementation within the wayfinding map itself.
