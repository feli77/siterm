import { describe, expect, it } from 'vitest'
import { parsePostFile } from './postMarkdown'
import { findPost, posts } from './posts'

describe('Markdown posts', () => {
  it('loads every article file newest first', () => {
    expect(posts.map((post) => post.slug)).toEqual([
      'software-that-leaves-room',
      'notes-on-small-systems',
      'a-home-on-the-command-line',
    ])
    expect(posts[0]).toMatchObject({
      title: 'Software That Leaves Room',
      excerpt:
        'Why the best tools make their users feel more capable, not more managed.',
      date: '2026-08-18',
      readingTime: '5 min',
      tags: ['design', 'software'],
    })
  })

  it('converts the supported Markdown blocks without changing their order', () => {
    expect(posts[0].content.map((section) => section.type)).toEqual([
      'paragraph',
      'heading',
      'paragraph',
      'quote',
      'paragraph',
      'heading',
      'list',
      'paragraph',
    ])
    expect(posts[1].content[3]).toEqual({
      type: 'code',
      language: 'text',
      code: 'one obvious entry point\n+one place for configuration\n+one command that proves it still works',
    })
  })

  it('keeps number, title, and slug-prefix lookup behavior', () => {
    expect(findPost('1')?.slug).toBe('software-that-leaves-room')
    expect(findPost('Notes on Small Systems')?.slug).toBe(
      'notes-on-small-systems',
    )
    expect(findPost('a-home-on')?.slug).toBe('a-home-on-the-command-line')
  })

  it('reports invalid article metadata with the source filename', () => {
    expect(() =>
      parsePostFile(
        './invalid.md',
        `---
title: Missing metadata
---

Some content.
`,
      ),
    ).toThrow('[post ./invalid.md] front matter requires excerpt')
  })
})
