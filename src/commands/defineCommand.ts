import type { CommandResult, ParseContext } from '../types/command'

export type HelpGroupName = 'read' | 'session' | 'connect'

export interface CommandHelp {
  group: HelpGroupName
  usage: string
  description: string
}

export interface CommandDefinition {
  name: string
  aliases: readonly string[]
  help?: CommandHelp
  parse: (args: readonly string[], context: ParseContext) => CommandResult
}

export function defineCommand(definition: CommandDefinition): CommandDefinition {
  return definition
}
