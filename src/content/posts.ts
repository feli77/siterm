import type { Post } from '../types'

export const posts: readonly Post[] = [
  {
    slug: 'software-that-leaves-room',
    title: 'Software That Leaves Room',
    excerpt: 'Why the best tools make their users feel more capable, not more managed.',
    date: '2026-08-18',
    readingTime: '5 min',
    tags: ['design', 'software'],
    content: [
      {
        type: 'paragraph',
        text: 'There is a kind of software that seems to tighten around you as you use it. Every path is anticipated, every choice is framed, and every quiet moment becomes a notification. It is efficient in the narrowest sense and exhausting in every other one.',
      },
      {
        type: 'heading',
        text: 'Tools should create capacity',
      },
      {
        type: 'paragraph',
        text: 'A good tool does not merely complete a task. It enlarges the space in which its user can think. It exposes enough of its model to be understood, then gets out of the way. The terminal remains a useful example: small vocabulary, visible state, composable results.',
      },
      {
        type: 'quote',
        text: 'The interface is finished when the user can form an intention the designer did not predict.',
      },
      {
        type: 'paragraph',
        text: 'This does not mean every interface should become a command line. It means our interfaces should respect the people operating them. Defaults can guide without becoming walls. Automation can assist without concealing cause and effect.',
      },
      {
        type: 'heading',
        text: 'Three practical tests',
      },
      {
        type: 'list',
        items: [
          'Can a curious person discover how the system behaves?',
          'Can an experienced person move faster without fighting the defaults?',
          'Can someone leave without their work being held hostage?',
        ],
      },
      {
        type: 'paragraph',
        text: 'Software that passes these tests feels unusually calm. It leaves room for judgment, and that room is where people do their best work.',
      },
    ],
  },
  {
    slug: 'notes-on-small-systems',
    title: 'Notes on Small Systems',
    excerpt: 'A field guide to keeping personal software understandable as it grows.',
    date: '2026-07-03',
    readingTime: '7 min',
    tags: ['engineering', 'systems'],
    content: [
      {
        type: 'paragraph',
        text: 'Small systems are not miniature large systems. They have different economics: fewer people, longer memory, less ceremony, and a much smaller budget for accidental complexity.',
      },
      {
        type: 'heading',
        text: 'Optimize for return visits',
      },
      {
        type: 'paragraph',
        text: 'The most expensive moment in a personal project is often returning after six months. Names have blurred and dependencies have shifted. The system succeeds when it can quickly explain itself to its future maintainer.',
      },
      {
        type: 'code',
        language: 'text',
        code: 'one obvious entry point\n+one place for configuration\n+one command that proves it still works',
      },
      {
        type: 'paragraph',
        text: 'Prefer boring seams over clever layers. Put volatile integrations at the edge. Preserve the story of irreversible decisions. These habits are not bureaucracy; they are compressed memory.',
      },
      {
        type: 'heading',
        text: 'A maintenance budget',
      },
      {
        type: 'list',
        items: [
          'Delete a dependency when a platform primitive becomes sufficient.',
          'Keep the happy path executable from a clean checkout.',
          'Treat documentation as a map, not a mirror of every implementation detail.',
        ],
      },
    ],
  },
  {
    slug: 'a-home-on-the-command-line',
    title: 'A Home on the Command Line',
    excerpt: 'Building a personal site that rewards curiosity instead of scrolling.',
    date: '2026-05-22',
    readingTime: '4 min',
    tags: ['web', 'terminal', 'design'],
    content: [
      {
        type: 'paragraph',
        text: 'Most personal sites are arranged like magazines. I wanted mine to feel closer to visiting a workshop: a place with tools in reach, half-finished thoughts on the bench, and labels that invite you to open drawers.',
      },
      {
        type: 'heading',
        text: 'The command is the navigation',
      },
      {
        type: 'paragraph',
        text: 'A terminal interface turns navigation into a tiny conversation. Typing posts is a request, not a click target. The response can contain links and buttons, but the grammar makes the whole site feel coherent.',
      },
      {
        type: 'quote',
        text: 'Interaction is not decoration. It is the voice of the place.',
      },
      {
        type: 'paragraph',
        text: 'The trick is to keep the playfulness without demanding prior knowledge. Every important command is also visible as a button, keyboard focus is never trapped, and the help command is always one short word away.',
      },
    ],
  },
]

export function findPost(query: string): Post | undefined {
  const normalized = query.trim().toLowerCase()
  const numericIndex = Number(normalized)

  if (Number.isInteger(numericIndex) && numericIndex > 0) {
    return posts[numericIndex - 1]
  }

  return posts.find(
    (post) =>
      post.slug === normalized ||
      post.title.toLowerCase() === normalized ||
      post.slug.startsWith(normalized),
  )
}
