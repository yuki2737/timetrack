import type { Skill } from '../types'

export const SKILL_LABEL: Record<Skill, string> = {
  speaking: 'Speaking',
  listening: 'Listening',
  writing: 'Writing',
  reading: 'Reading',
}

export const SKILL_COLOR: Record<Skill, string> = {
  speaking: '#8b5cf6',
  listening: '#06b6d4',
  writing: '#f97316',
  reading: '#22c55e',
}

export const CATEGORY_PRESETS: Record<Skill, string[]> = {
  speaking: ['Part 2', 'Shadowing', 'Reading aloud'],
  listening: ['Sec 1–4 full', 'Map / diagram', 'Multiple choice', 'Dictation'],
  writing: ['Task 2', 'Review / edit', 'Templates'],
  reading: ['Close reading', 'TFNG'],
}
