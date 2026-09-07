export function HistoryOutput({ commands }: { commands: readonly string[] }) {
  return (
    <ol className="output-block history-list">
      {commands.map((command, index) => (
        <li key={`${command}-${index}`}>
          <span>{String(index + 1).padStart(3, ' ')}</span> {command}
        </li>
      ))}
    </ol>
  )
}
