import { useLayoutEffect, type RefObject } from 'react'
import type { TerminalEntry } from '../types/terminal'

export function useLatestPostScroll(
  entries: readonly TerminalEntry[],
  transcriptRef: RefObject<HTMLElement | null>,
): void {
  useLayoutEffect(() => {
    const latestEntry = entries[entries.length - 1]
    if (latestEntry?.result.kind !== 'post') return

    const headings = transcriptRef.current?.querySelectorAll<HTMLElement>(
      '.article-header h2',
    )
    headings?.[headings.length - 1]?.scrollIntoView({
      block: 'start',
      behavior: 'auto',
    })
  }, [entries, transcriptRef])
}
