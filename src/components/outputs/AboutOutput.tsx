import { siteConfig } from '../../config/site'
import { CommandButton } from '../common/CommandButton'
import { OutputHeading } from '../common/OutputHeading'

export function AboutOutput({ onRun }: { onRun: (command: string) => void }) {
  return (
    <section className="output-block about-output">
      <OutputHeading eyebrow="~/about" title="Operator profile" />
      <div className="profile-grid">
        <div className="profile-mark" aria-hidden="true">
          <span>╭────────╮</span>
          <span>│ {siteConfig.monogram.padEnd(6, ' ')} │</span>
          <span>│  ◉  ◉  │</span>
          <span>│   ──   │</span>
          <span>╰────────╯</span>
        </div>
        <dl className="profile-facts">
          <div>
            <dt>name</dt>
            <dd>{siteConfig.name}</dd>
          </div>
          <div>
            <dt>role</dt>
            <dd>{siteConfig.role}</dd>
          </div>
          <div>
            <dt>base</dt>
            <dd>{siteConfig.location}</dd>
          </div>
          <div>
            <dt>focus</dt>
            <dd>{siteConfig.interests.join(' · ')}</dd>
          </div>
          <div>
            <dt>status</dt>
            <dd className="success-text">{siteConfig.status}</dd>
          </div>
        </dl>
      </div>
      <div className="command-suggestions">
        <span>continue:</span>
        <CommandButton command="posts" onRun={onRun} />
        <CommandButton command="contact" onRun={onRun} />
      </div>
    </section>
  )
}
