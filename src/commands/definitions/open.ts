import { findPost } from '../../content/posts'
import { defineCommand } from '../defineCommand'
import { browsePostsError } from '../errors'

export const openCommand = defineCommand({
  name: 'open',
  aliases: ['read', 'cat'],
  help: {
    group: 'read',
    usage: 'open <n|slug>',
    description: 'read an article',
  },
  parse: (args) => {
    const target = args.join(' ').trim()
    if (!target) {
      return browsePostsError(
        'open needs a post number, title, slug, or slug prefix',
      )
    }

    const post = findPost(target)
    return post
      ? { kind: 'post', post }
      : browsePostsError(`no post matches “${target}”`)
  },
})
