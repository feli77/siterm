import { posts } from '../../content/posts'
import type { Post } from '../../types/content'
import { CommandButton } from '../common/CommandButton'
import { OutputHeading } from '../common/OutputHeading'

interface PostsOutputProps {
  tag?: string
  onRun: (command: string) => void
}

export function PostsOutput({ tag, onRun }: PostsOutputProps) {
  const filtered = tag
    ? posts.filter((post) => post.tags.includes(tag))
    : posts
  const summary = `${filtered.length} ${filtered.length === 1 ? 'post' : 'posts'} · newest first`

  return (
    <section className="output-block posts-output">
      <OutputHeading
        eyebrow={tag ? `~/notes --tag ${tag}` : '~/notes'}
        title={tag ? `Notes tagged “${tag}”` : 'Field notes'}
      />
      <p className="post-list-summary">
        {summary} · open with <code>open &lt;n|slug&gt;</code>
      </p>
      {filtered.length === 0 ? (
        <div className="empty-result notice notice-error">
          <p>error: no posts tagged “{tag}”</p>
          <p>
            hint: run <CommandButton command="tags" onRun={onRun} /> to browse
            available tags
          </p>
        </div>
      ) : (
        <>
          <table className="posts-table" aria-label="Published posts">
            <colgroup>
              <col className="post-number-column" />
              <col className="post-date-column" />
              <col />
              <col className="post-read-column" />
            </colgroup>
            <thead>
              <tr>
                <th scope="col">NO.</th>
                <th scope="col">DATE</th>
                <th scope="col">TITLE</th>
                <th scope="col">READ</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((post) => (
                <PostTableRow key={post.slug} post={post} onRun={onRun} />
              ))}
            </tbody>
          </table>
          <ol className="posts-priority" aria-label="Published posts">
            {filtered.map((post) => (
              <PostPriorityItem key={post.slug} post={post} onRun={onRun} />
            ))}
          </ol>
        </>
      )}
    </section>
  )
}

function postNumber(post: Post): string {
  return String(posts.indexOf(post) + 1).padStart(2, '0')
}

function PostTitleButton({
  post,
  onRun,
}: {
  post: Post
  onRun: (command: string) => void
}) {
  return (
    <button
      className="post-title-command"
      type="button"
      onClick={() => onRun(`open ${post.slug}`)}
    >
      {post.title}
    </button>
  )
}

function PostTableRow({
  post,
  onRun,
}: {
  post: Post
  onRun: (command: string) => void
}) {
  return (
    <tr>
      <td className="post-number">{postNumber(post)}</td>
      <td>
        <time dateTime={post.date}>{post.date}</time>
      </td>
      <td className="post-title-cell">
        <PostTitleButton post={post} onRun={onRun} />
        <span className="post-tags">
          {post.tags.map((item) => `#${item}`).join('  ')}
        </span>
      </td>
      <td>{post.readingTime}</td>
    </tr>
  )
}

function PostPriorityItem({
  post,
  onRun,
}: {
  post: Post
  onRun: (command: string) => void
}) {
  return (
    <li>
      <span className="post-number">
        <span className="sr-only">Number </span>
        {postNumber(post)}
      </span>
      <span className="post-priority-title">
        <span className="sr-only">Title </span>
        <PostTitleButton post={post} onRun={onRun} />
      </span>
      <span className="post-priority-read">
        <span className="sr-only">Reading time </span>
        {post.readingTime}
      </span>
      <span className="post-tags">
        <span className="sr-only">Tags </span>
        {post.tags.map((item) => `#${item}`).join('  ')}
      </span>
    </li>
  )
}
