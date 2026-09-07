import { siteConfig } from '../../config/site'
import { CommandButton } from '../common/CommandButton'

const fullBootMark = String.raw`  _____ ___ _____ _____ ____  __  __
 / ___//  _/_  __/ ____/ __ \/  |/  /
 \__ \ / /  / / / __/ / /_/ / /|_/ /
___/ // /  / / / /___/ _, _/ /  / /
/____/___/ /_/ /_____/_/ |_/_/  /_/`

const compactBootMark = String.raw` ___ ___ _____
/ __|_ _|_   _|
\__ \| |  | |
|___/___| |_|`

export function WelcomeOutput({
  onRun,
}: {
  onRun: (command: string) => void
}) {
  return (
    <section className="welcome output-block">
      <section className="boot-sequence" aria-label="Siterm boot sequence">
        <pre data-boot="full" aria-hidden="true">{fullBootMark}</pre>
        <pre data-boot="compact" aria-hidden="true">{compactBootMark}</pre>
        <p>[ personal publishing / one continuous terminal session ]</p>
      </section>
      <div className="welcome-copy">
        <p className="comment">// configured owner</p>
        <h2>Hello, I'm {siteConfig.name}.</h2>
        <p className="owner-role">{siteConfig.role}</p>
        <p>{siteConfig.bio}</p>
      </div>
      <div
        className="command-suggestions"
        role="group"
        aria-label="Suggested commands"
      >
        <span>start here:</span>
        <CommandButton command="about" onRun={onRun} />
        <CommandButton command="posts" onRun={onRun} />
        <CommandButton command="help" onRun={onRun} />
      </div>
    </section>
  )
}
