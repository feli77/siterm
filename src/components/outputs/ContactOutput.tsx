import { siteConfig } from '../../config/site'
import { OutputHeading } from '../common/OutputHeading'

export function ContactOutput() {
  return (
    <section className="output-block panel-output">
      <OutputHeading eyebrow="~/contact" title="Open channels" />
      <div className="contact-list">
        <a href={`mailto:${siteConfig.email}`}>
          <span>email</span>
          <strong>{siteConfig.email}</strong>
          <span>↗</span>
        </a>
        <a href={siteConfig.github}>
          <span>github</span>
          <strong>{siteConfig.github.replace('https://', '')}</strong>
          <span>↗</span>
        </a>
      </div>
      <p className="output-footnote">
        Plain text welcome. Response times vary with coffee levels.
      </p>
    </section>
  )
}
