import { siteConfig } from '../../config/site'

export function Prompt({ command }: { command?: string }) {
  return (
    <span className="prompt" aria-hidden="true">
      <span className="prompt-user">
        {siteConfig.handle}@{siteConfig.hostname}
      </span>
      <span className="prompt-path">:~</span>
      <span className="prompt-symbol">$</span>
      {command ? <span className="prompt-command"> {command}</span> : null}
    </span>
  )
}
