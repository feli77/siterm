interface CommandButtonProps {
  command: string
  label?: string
  onRun: (command: string) => void
}

export function CommandButton({ command, label, onRun }: CommandButtonProps) {
  return (
    <button
      className="command-chip"
      type="button"
      onClick={() => onRun(command)}
    >
      {label ?? command}
    </button>
  )
}
