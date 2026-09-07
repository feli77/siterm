import { helpGroups } from '../../commands'
import { OutputHeading } from '../common/OutputHeading'

export function HelpOutput({ onRun }: { onRun: (command: string) => void }) {
  return (
    <section className="output-block panel-output">
      <OutputHeading eyebrow="manual / index" title="Available commands" />
      <div className="help-grid">
        {helpGroups.map((group) => {
          const headingId = `help-${group.name}`
          return (
            <section
              key={group.name}
              className="help-group"
              role="group"
              aria-labelledby={headingId}
            >
              <h3 id={headingId}>{group.name}</h3>
              <table
                className="help-table"
                aria-label={`${group.name} commands`}
              >
                <tbody>
                  {group.commands.map((command) => (
                    <tr className="help-row" key={command.usage}>
                      <th className="help-command" scope="row">
                        <button
                          type="button"
                          onClick={() => onRun(command.usage.split(' ')[0])}
                        >
                          <code>{command.usage}</code>
                        </button>
                      </th>
                      <td>{command.description}</td>
                      <td className="help-aliases">
                        {command.aliases ? (
                          <small>
                            <span>alias: </span>
                            <span>{command.aliases}</span>
                          </small>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          )
        })}
      </div>
      <p
        className="output-footnote"
        aria-label="Arrow Up and Arrow Down for history, Tab to complete, slash to focus the prompt"
      >
        ↑/↓ history · Tab complete · / focus prompt
      </p>
    </section>
  )
}
