import { defineCommand } from '../defineCommand'

export const tagsCommand = defineCommand({
  name: 'tags',
  aliases: [],
  help: {
    group: 'read',
    usage: 'tags',
    description: 'list the archive by subject',
  },
  parse: () => ({ kind: 'tags' }),
})
