import type { CommandResult } from '../../types/command'
import type { GuestbookEntry } from '../../types/guestbook'
import type { ThemeName } from '../../types/terminal'
import { Notice } from '../common/Notice'
import { AboutOutput } from './AboutOutput'
import { ContactOutput } from './ContactOutput'
import { ErrorOutput } from './ErrorOutput'
import { GuestbookOutput } from './GuestbookOutput'
import { HelpOutput } from './HelpOutput'
import { HistoryOutput } from './HistoryOutput'
import { PostOutput } from './PostOutput'
import { PostsOutput } from './PostsOutput'
import { SignOutput } from './SignOutput'
import { TagsOutput } from './TagsOutput'
import { TerminalProfilesOutput } from './TerminalProfilesOutput'
import { UnknownOutput } from './UnknownOutput'
import { WelcomeOutput } from './WelcomeOutput'

interface OutputProps {
  result: CommandResult
  theme: ThemeName
  guestbook: readonly GuestbookEntry[]
  onRun: (command: string) => void
}

export function Output({ result, theme, guestbook, onRun }: OutputProps) {
  switch (result.kind) {
    case 'noop':
    case 'clear':
      return null
    case 'welcome':
      return <WelcomeOutput onRun={onRun} />
    case 'help':
      return <HelpOutput onRun={onRun} />
    case 'about':
      return <AboutOutput onRun={onRun} />
    case 'posts':
      return <PostsOutput tag={result.tag} onRun={onRun} />
    case 'post':
      return <PostOutput post={result.post} onRun={onRun} />
    case 'tags':
      return <TagsOutput onRun={onRun} />
    case 'theme':
      return (
        <TerminalProfilesOutput
          activeProfile={theme}
          selected={result.selected}
          invalid={result.invalid}
          onRun={onRun}
        />
      )
    case 'guestbook':
      return <GuestbookOutput entries={guestbook} onRun={onRun} />
    case 'sign':
      return result.entry ? <SignOutput entry={result.entry} /> : null
    case 'contact':
      return <ContactOutput />
    case 'history':
      return <HistoryOutput commands={result.commands} />
    case 'text':
      return <Notice tone={result.tone}>{result.text}</Notice>
    case 'error':
      return <ErrorOutput error={result} onRun={onRun} />
    case 'unknown':
      return (
        <UnknownOutput
          command={result.command}
          suggestion={result.suggestion}
          onRun={onRun}
        />
      )
  }
}
