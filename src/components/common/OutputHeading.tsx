interface OutputHeadingProps {
  eyebrow: string
  title: string
}

export function OutputHeading({ eyebrow, title }: OutputHeadingProps) {
  return (
    <header className="output-heading">
      <p className="eyebrow">{eyebrow}</p>
      <h2>{title}</h2>
    </header>
  )
}
