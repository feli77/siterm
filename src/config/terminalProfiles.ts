import type { ThemeName } from '../types/terminal'

export const terminalProfiles = [
  { name: 'amber', description: 'warm default' },
  { name: 'green', description: 'low-glare green' },
  { name: 'mono', description: 'neutral grayscale' },
] as const satisfies readonly { name: ThemeName; description: string }[]

export const themeNames: readonly ThemeName[] = terminalProfiles.map(
  (profile) => profile.name,
)
