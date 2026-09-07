import { defineCommand } from '../defineCommand'
import { signMessageError } from '../errors'

export const signCommand = defineCommand({
  name: 'sign',
  aliases: [],
  help: {
    group: 'connect',
    usage: 'sign "message"',
    description: 'leave a note in this browser',
  },
  parse: (args) => {
    const message = args.join(' ').trim()
    return message
      ? { kind: 'sign', message }
      : signMessageError('sign needs a message')
  },
})
