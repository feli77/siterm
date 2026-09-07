import { defineCommand } from '../defineCommand'

export const historyCommand = defineCommand({
  name: 'history',
  aliases: [],
  help: {
    group: 'session',
    usage: 'history',
    description: 'show commands from this session',
  },
  parse: (_args, context) => ({
    kind: 'history',
    commands: context.history,
  }),
})
