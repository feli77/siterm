interface UnknownOutputProps {
  command: string
  suggestion?: string
  onRun: (command: string) => void
}

export function UnknownOutput({
  command,
  suggestion,
  onRun,
}: UnknownOutputProps) {
  return (
    <div className="output-block notice notice-error">
      <p>error: command not found: {command}</p>
      {suggestion ? (
        <p>
          hint: did you mean{' '}
          <button
            className="inline-command"
            type="button"
            onClick={() => onRun(suggestion)}
          >
            {suggestion}
          </button>
          ?
        </p>
      ) : (
        <p>
          hint: run{' '}
          <button
            className="inline-command"
            type="button"
            onClick={() => onRun('help')}
          >
            help
          </button>{' '}
          to see available commands
        </p>
      )}
    </div>
  )
}
