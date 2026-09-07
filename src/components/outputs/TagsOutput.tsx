import { posts } from '../../content/posts'
import { OutputHeading } from '../common/OutputHeading'

export function TagsOutput({ onRun }: { onRun: (command: string) => void }) {
  const counts = posts.reduce<Record<string, number>>((result, post) => {
    post.tags.forEach((tag) => {
      result[tag] = (result[tag] ?? 0) + 1
    })
    return result
  }, {})

  return (
    <section className="output-block panel-output">
      <OutputHeading eyebrow="~/notes/tags" title="Subjects in the archive" />
      <ul className="tag-cloud" aria-label="Available tags">
        {Object.entries(counts)
          .sort(([left], [right]) => left.localeCompare(right))
          .map(([tag, count]) => (
            <li key={tag}>
              <button
                type="button"
                aria-label={`posts ${tag}, ${count} ${count === 1 ? 'post' : 'posts'}`}
                onClick={() => onRun(`posts ${tag}`)}
              >
                <span>#{tag}</span>
                <sup>{count}</sup>
              </button>
            </li>
          ))}
      </ul>
    </section>
  )
}
