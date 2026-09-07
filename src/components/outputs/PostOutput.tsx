import type { ReactNode } from 'react'
import { posts } from '../../content/posts'
import type { Post } from '../../types/content'
import { CommandButton } from '../common/CommandButton'

export function PostOutput({
  post,
  onRun,
}: {
  post: Post
  onRun: (command: string) => void
}) {
  const postIndex = posts.indexOf(post)
  const nextPost = postIndex >= 0 ? posts[postIndex + 1] : undefined

  return (
    <article className="output-block article-output" aria-label={post.title}>
      <header className="article-header">
        <p className="eyebrow">~/notes/{post.slug}.md</p>
        <h2>
          <MarkdownToken># </MarkdownToken>
          {post.title}
        </h2>
        <div className="article-byline">
          <time dateTime={post.date}>{post.date}</time>
          <span>{post.readingTime} read</span>
          <span>{post.tags.map((tag) => `#${tag}`).join(' ')}</span>
        </div>
        <p className="article-lede">{post.excerpt}</p>
      </header>
      <div className="article-body">
        {post.content.map((section, index) => {
          switch (section.type) {
            case 'heading':
              return (
                <h3 key={index}>
                  <MarkdownToken>## </MarkdownToken>
                  {section.text}
                </h3>
              )
            case 'paragraph':
              return <p key={index}>{section.text}</p>
            case 'quote':
              return (
                <blockquote key={index}>
                  <MarkdownToken>&gt; </MarkdownToken>
                  <span>{section.text}</span>
                </blockquote>
              )
            case 'list':
              return (
                <ul key={index}>
                  {section.items.map((item) => (
                    <li key={item}>
                      <MarkdownToken>- </MarkdownToken>
                      {item}
                    </li>
                  ))}
                </ul>
              )
            case 'code':
              return (
                <figure className="code-block" key={index}>
                  <pre>
                    <code>
                      <MarkdownToken>{`\`\`\`${section.language}`}</MarkdownToken>
                      {'\n'}
                      {section.code}
                      {'\n'}
                      <MarkdownToken>```</MarkdownToken>
                    </code>
                  </pre>
                </figure>
              )
          }
        })}
      </div>
      <footer className="article-footer">
        <span>-- END --</span>
        <span className="article-footer-commands">
          return to <CommandButton command="posts" onRun={onRun} />
          {nextPost ? (
            <>
              {' · next '}
              <CommandButton
                command={`open ${nextPost.slug}`}
                onRun={onRun}
              />
            </>
          ) : null}
        </span>
      </footer>
    </article>
  )
}

function MarkdownToken({ children }: { children: ReactNode }) {
  return (
    <span className="markdown-token" aria-hidden="true">
      {children}
    </span>
  )
}
