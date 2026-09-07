import type { ErrorResult } from '../../types/command'
import { CommandButton } from '../common/CommandButton'

interface ErrorOutputProps {
  error: ErrorResult
  onRun: (command: string) => void
}

export function ErrorOutput({ error, onRun }: ErrorOutputProps) {
  return (
    <div className="output-block notice notice-error">
      <p>error: {error.cause}</p>
      <p>
        hint: {error.hint.before}
        <CommandButton command={error.hint.command} onRun={onRun} />
        {error.hint.after}
      </p>
    </div>
  )
}
