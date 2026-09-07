import { useLayoutEffect, useRef, useState } from 'react'
import { siteConfig } from '../../config/site'
import type { ThemeName } from '../../types/terminal'

interface StatusLineProps {
  location: string
  localTime: string
  theme: ThemeName
}

export function StatusLine({ location, localTime, theme }: StatusLineProps) {
  const lineRef = useRef<HTMLElement>(null)
  const measureRef = useRef<HTMLSpanElement>(null)
  const sessionMeasureRef = useRef<HTMLSpanElement>(null)
  const locationMeasureRef = useRef<HTMLSpanElement>(null)
  const profileMeasureRef = useRef<HTMLSpanElement>(null)
  const timeMeasureRef = useRef<HTMLSpanElement>(null)
  const [visible, setVisible] = useState({
    location: true,
    profile: true,
    time: true,
  })

  useLayoutEffect(() => {
    const line = lineRef.current
    const measure = measureRef.current
    if (!line || !measure) return

    const fitFields = () => {
      const lineStyle = getComputedStyle(line)
      const sessionStyle = getComputedStyle(
        line.querySelector<HTMLElement>('.status-session')!,
      )
      const available =
        line.clientWidth -
        Number.parseFloat(lineStyle.paddingLeft) -
        Number.parseFloat(lineStyle.paddingRight)
      const gap = Number.parseFloat(lineStyle.columnGap)
      const sessionChrome =
        Number.parseFloat(sessionStyle.paddingLeft) +
        Number.parseFloat(sessionStyle.paddingRight) +
        Number.parseFloat(sessionStyle.borderRightWidth)
      const widths = {
        session:
          (sessionMeasureRef.current?.getBoundingClientRect().width ?? 0) +
          sessionChrome,
        location:
          locationMeasureRef.current?.getBoundingClientRect().width ?? 0,
        profile: profileMeasureRef.current?.getBoundingClientRect().width ?? 0,
        time: timeMeasureRef.current?.getBoundingClientRect().width ?? 0,
      }
      const fits = (fields: (keyof typeof widths)[]) =>
        fields.reduce((total, field) => total + widths[field], 0) +
          Math.max(0, fields.length - 1) * gap <=
        available

      let next = { location: true, profile: false, time: true }
      if (!fits(['session', 'location', 'time'])) {
        next = fits(['session', 'location'])
          ? { location: true, profile: false, time: false }
          : { location: false, profile: false, time: false }
      } else if (
        !window.matchMedia('(max-width: 370px)').matches &&
        fits(['session', 'location', 'profile', 'time'])
      ) {
        next.profile = true
      }

      setVisible((current) =>
        current.location === next.location &&
        current.profile === next.profile &&
        current.time === next.time
          ? current
          : next,
      )
    }

    fitFields()
    const observer = new ResizeObserver(fitFields)
    observer.observe(line)
    observer.observe(measure)
    return () => observer.disconnect()
  }, [localTime, location, theme])

  const compactLocation =
    location === 'home' ? 'home' : location.replace(/^post\//, 'p/')

  return (
    <footer
      ref={lineRef}
      className="status-line"
      aria-label={`Terminal session status: siterm, ${location}, ${theme} profile, ${siteConfig.location}, ${localTime}`}
    >
      <span className="status-session" data-status-field="session">
        <span className="status-wide">session:siterm</span>
        <span className="status-compact">[st]</span>
      </span>
      <span data-status-field="location" hidden={!visible.location}>
        <span className="status-wide">location:{location}</span>
        <span className="status-compact">{compactLocation}</span>
      </span>
      <span className="status-spacer" />
      <span
        className="status-profile"
        data-status-field="profile"
        hidden={!visible.profile}
      >
        profile:{theme}
      </span>
      <span
        className="status-time"
        data-status-field="time"
        hidden={!visible.time}
      >
        <span className="status-wide">Shanghai </span>
        {localTime}
      </span>

      <span className="status-measure" ref={measureRef} aria-hidden="true">
        <span ref={sessionMeasureRef}>
          <span className="status-wide">session:siterm</span>
          <span className="status-compact">[st]</span>
        </span>
        <span ref={locationMeasureRef}>
          <span className="status-wide">location:{location}</span>
          <span className="status-compact">{compactLocation}</span>
        </span>
        <span ref={profileMeasureRef}>profile:{theme}</span>
        <span ref={timeMeasureRef}>
          <span className="status-wide">Shanghai </span>
          {localTime}
        </span>
      </span>
    </footer>
  )
}
