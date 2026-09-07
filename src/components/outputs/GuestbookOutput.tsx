import type { GuestbookEntry } from '../../types/guestbook'
import { CommandButton } from '../common/CommandButton'
import { OutputHeading } from '../common/OutputHeading'

interface GuestbookOutputProps {
  entries: readonly GuestbookEntry[]
  onRun: (command: string) => void
}

export function GuestbookOutput({ entries, onRun }: GuestbookOutputProps) {
  const visibleEntries = entries.slice(0, 6)

  return (
    <section className="output-block panel-output">
      <OutputHeading eyebrow="~/guestbook" title="Traces from visitors" />
      <p className="guestbook-note">
        This static demo stores new notes only in your browser.
      </p>
      {visibleEntries.length > 0 ? (
        <ol className="guestbook-list" aria-label="Guestbook entries">
          {visibleEntries.map((entry, index) => (
            <li key={entry.id}>
              <GuestbookEntryOutput entry={entry} number={index + 1} />
            </li>
          ))}
        </ol>
      ) : null}
      <p className="guestbook-summary">
        {entries.length} local {entries.length === 1 ? 'entry' : 'entries'}{' '}
        <span aria-hidden="true">·</span>{' '}
        <CommandButton command={'sign "hello"'} onRun={onRun} />
      </p>
    </section>
  )
}

export function GuestbookEntryOutput({
  entry,
  number,
}: {
  entry: GuestbookEntry
  number?: number
}) {
  return (
    <article
      className="guestbook-entry"
      aria-label={`Guestbook entry by ${entry.author}`}
    >
      <header>
        {number === undefined ? null : (
          <>
            <span>{String(number).padStart(2, '0')}</span>{' '}
          </>
        )}
        {entry.author} <span aria-hidden="true">·</span>{' '}
        <time dateTime={entry.date}>{entry.date}</time>
      </header>
      <p>{entry.message}</p>
    </article>
  )
}
