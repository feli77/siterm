import { defineCommand } from '../defineCommand'

export const sudoCommand = defineCommand({
  name: 'sudo',
  aliases: [],
  parse: () => ({
    kind: 'text',
    text: 'Permission denied with style. This incident will not be reported.',
    tone: 'error',
  }),
})
