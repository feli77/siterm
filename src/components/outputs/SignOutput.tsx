import type { GuestbookEntry } from '../../types/guestbook'
import { GuestbookEntryOutput } from './GuestbookOutput'

export function SignOutput({ entry }: { entry: GuestbookEntry }) {
  return (
    <section className="output-block signed-entry-output">
      <p className="success-text">
        entry added to this session. thanks for leaving a trace.
      </p>
      <GuestbookEntryOutput entry={entry} />
    </section>
  )
}
