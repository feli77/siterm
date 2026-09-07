import { describe, expect, it } from 'vitest'
import { commandDefinitions, commandNames, helpGroups } from './catalog'
import { parseCommand } from './parser'

describe('command catalog', () => {
  it('registers every command name and alias exactly once', () => {
    const declaredNames = commandDefinitions.flatMap((definition) => [
      definition.name,
      ...definition.aliases,
    ])

    expect(commandNames).toEqual(declaredNames)
    expect(new Set(commandNames).size).toBe(commandNames.length)
  })

  it('keeps primary help curated and every help command executable', () => {
    expect(helpGroups.map((group) => group.name)).toEqual([
      'read',
      'session',
      'connect',
    ])

    for (const group of helpGroups) {
      for (const command of group.commands) {
        const name = command.usage.split(' ')[0]
        expect(parseCommand(name, { history: [] }).kind).not.toBe('unknown')
      }
    }

    const helpUsages = helpGroups.flatMap((group) =>
      group.commands.map((command) => command.usage),
    )
    expect(helpUsages).not.toContain('date')
    expect(helpUsages).not.toContain('sudo')
  })
})
