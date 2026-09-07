import {
  terminalProfiles,
  themeNames,
} from '../../config/terminalProfiles'
import type { ThemeName } from '../../types/terminal'
import { CommandButton } from '../common/CommandButton'
import { OutputHeading } from '../common/OutputHeading'

interface TerminalProfilesOutputProps {
  activeProfile: ThemeName
  selected?: ThemeName
  invalid?: string
  onRun: (command: string) => void
}

export function TerminalProfilesOutput({
  activeProfile,
  selected,
  invalid,
  onRun,
}: TerminalProfilesOutputProps) {
  const precedingProfileNames = themeNames.slice(0, -1).join(', ')
  const lastProfileName = themeNames.at(-1)

  return (
    <section className="output-block panel-output">
      <OutputHeading eyebrow="~/preferences" title="Terminal profiles" />
      {selected && (
        <p className="success-text">profile switched to {selected}.</p>
      )}
      {invalid && (
        <div className="notice notice-error">
          <p>error: unknown profile “{invalid}”</p>
          <p>
            hint: run{' '}
            <CommandButton command="theme --list" onRun={onRun} /> to choose{' '}
            {precedingProfileNames}, or {lastProfileName}
          </p>
        </div>
      )}
      <table className="profile-table" aria-label="Terminal profiles">
        <tbody>
          {terminalProfiles.map(({ name, description }) => {
            const current = activeProfile === name
            return (
              <tr key={name} aria-current={current ? 'true' : undefined}>
                <td className="profile-marker" aria-hidden="true">
                  {current ? '*' : ''}
                </td>
                <th scope="row">
                  <button
                    type="button"
                    className="profile-option"
                    onClick={() => onRun(`theme ${name}`)}
                    aria-pressed={current}
                  >
                    {name}
                  </button>
                </th>
                <td>{description}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
      <p className="profile-guidance">
        <span aria-hidden="true">*</span> current{' '}
        <span aria-hidden="true">·</span> <code>theme &lt;name&gt;</code>
      </p>
    </section>
  )
}
