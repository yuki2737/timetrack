import type { ComponentType, CSSProperties } from 'react'
import {
  BookOpen,
  Headphones,
  MessageCircleQuestion,
  Mic,
  NotebookPen,
  Pencil,
  UsersRound,
  type LucideIcon,
} from 'lucide-react'
import { FaDumbbell } from 'react-icons/fa'
import {
  SiDuolingo,
  SiNetflix,
  SiNotion,
  SiOpenai,
  SiQuizlet,
  SiSpotify,
  SiTed,
  SiYoutube,
} from 'react-icons/si'
import type { IconShortcut, Skill } from '../types'

export type IconEntry = {
  id: string
  /** i18n key for display name */
  labelKey: string
  Icon: ComponentType<{ className?: string; style?: CSSProperties }>
  /** Tailwind classes for the icon button background */
  buttonClass: string
  /** Icon color inside button */
  iconClass?: string
}

function EfBadge({ className }: { className?: string }) {
  return (
    <div
      className={`flex items-center justify-center rounded-md bg-blue-600 text-[10px] font-bold leading-none text-white ${className ?? ''}`}
    >
      EF
    </div>
  )
}

/** Default skill + category (English baseline; users override per locale in Settings) */
export const BUILT_IN_ICON_SHORTCUTS: Record<string, IconShortcut> = {
  Mic: { skill: 'speaking', category: 'Shadowing' },
  oneOnOne: { skill: 'speaking', category: 'Speaking' },
  Headphones: { skill: 'listening', category: 'Listening' },
  Pencil: { skill: 'writing', category: 'Writing' },
  BookOpen: { skill: 'reading', category: 'Close reading' },
  youtube: { skill: 'listening', category: 'YouTube' },
  spotify: { skill: 'listening', category: 'Spotify' },
  workout: { skill: 'speaking', category: 'Workout' },
  ef: { skill: 'listening', category: 'EF English Live' },
  thinking: { skill: 'speaking', category: 'Thinking in English' },
  duolingo: { skill: 'reading', category: 'Duolingo practice' },
  quizlet: { skill: 'reading', category: 'Quizlet' },
  chatgpt: { skill: 'writing', category: 'ChatGPT prompts' },
  ted: { skill: 'listening', category: 'TED talk' },
  netflix: { skill: 'listening', category: 'Netflix (EN subtitles)' },
  notion: { skill: 'writing', category: 'Notion English notes' },
  vocabulary: { skill: 'reading', category: 'Vocabulary notebook' },
}

export const ICON_REGISTRY: IconEntry[] = [
  {
    id: 'vocabulary',
    labelKey: 'icon.vocabulary',
    Icon: NotebookPen,
    buttonClass: 'bg-indigo-500',
    iconClass: 'text-white',
  },
  {
    id: 'youtube',
    labelKey: 'icon.youtube',
    Icon: SiYoutube,
    buttonClass:
      'bg-white shadow-[inset_0_0_0_1px_rgba(0,0,0,0.08),0_1px_4px_rgba(0,0,0,0.18)]',
    iconClass: 'text-[#FF0000]',
  },
  {
    id: 'spotify',
    labelKey: 'icon.spotify',
    Icon: SiSpotify,
    buttonClass: 'bg-[#191414] shadow-[0_1px_4px_rgba(0,0,0,0.25)]',
    iconClass: 'text-[#1DB954]',
  },
  {
    id: 'ef',
    labelKey: 'icon.ef',
    Icon: EfBadge,
    buttonClass: 'bg-blue-600',
    iconClass: 'text-white',
  },
  {
    id: 'thinking',
    labelKey: 'icon.thinking',
    Icon: MessageCircleQuestion,
    buttonClass: 'bg-violet-700',
    iconClass: 'text-white',
  },
  { id: 'Mic', labelKey: 'icon.mic', Icon: Mic, buttonClass: 'bg-violet-600' },
  {
    id: 'oneOnOne',
    labelKey: 'icon.oneOnOne',
    Icon: UsersRound,
    buttonClass: 'bg-purple-600',
    iconClass: 'text-white',
  },
  { id: 'Headphones', labelKey: 'icon.headphones', Icon: Headphones, buttonClass: 'bg-cyan-600' },
  { id: 'Pencil', labelKey: 'icon.pencil', Icon: Pencil, buttonClass: 'bg-orange-500' },
  { id: 'BookOpen', labelKey: 'icon.bookopen', Icon: BookOpen, buttonClass: 'bg-emerald-600' },
  {
    id: 'workout',
    labelKey: 'icon.workout',
    Icon: FaDumbbell,
    buttonClass: 'bg-gradient-to-br from-orange-500 to-red-600',
    iconClass: 'text-white',
  },
  {
    id: 'duolingo',
    labelKey: 'icon.duolingo',
    Icon: SiDuolingo,
    buttonClass:
      'bg-gradient-to-b from-[#66D510] to-[#58CC02] shadow-[0_1px_4px_rgba(0,0,0,0.22)]',
    iconClass: 'text-white',
  },
  {
    id: 'quizlet',
    labelKey: 'icon.quizlet',
    Icon: SiQuizlet,
    buttonClass:
      'bg-gradient-to-b from-[#4C68D9] to-[#4257B2] shadow-[0_1px_4px_rgba(0,0,0,0.22)]',
    iconClass: 'text-white',
  },
  {
    id: 'chatgpt',
    labelKey: 'icon.chatgpt',
    Icon: SiOpenai,
    buttonClass: 'bg-[#101010] shadow-[0_1px_4px_rgba(0,0,0,0.3)]',
    iconClass: 'text-white',
  },
  {
    id: 'ted',
    labelKey: 'icon.ted',
    Icon: SiTed,
    buttonClass: 'bg-[#E62B1E] shadow-[0_1px_4px_rgba(0,0,0,0.22)]',
    iconClass: 'text-white',
  },
  {
    id: 'netflix',
    labelKey: 'icon.netflix',
    Icon: SiNetflix,
    buttonClass:
      'bg-gradient-to-b from-[#1f1f1f] to-[#111111] shadow-[0_1px_4px_rgba(0,0,0,0.28)]',
    iconClass: 'text-[#E50914]',
  },
  {
    id: 'notion',
    labelKey: 'icon.notion',
    Icon: SiNotion,
    buttonClass:
      'bg-white shadow-[inset_0_0_0_1.5px_rgba(17,17,17,0.9),0_1px_4px_rgba(0,0,0,0.18)]',
    iconClass: 'text-[#111111]',
  },
]

const FALLBACK: LucideIcon = BookOpen

export function getIconEntry(id: string): IconEntry | undefined {
  return ICON_REGISTRY.find((x) => x.id === id)
}

export function getIconComponent(
  name: string,
): ComponentType<{ className?: string; style?: CSSProperties }> {
  return getIconEntry(name)?.Icon ?? FALLBACK
}

/** Merge user overrides with built-ins */
export function resolveIconShortcut(
  iconId: string,
  shortcuts: Partial<Record<string, IconShortcut>> | undefined,
): IconShortcut {
  const o = shortcuts?.[iconId]
  if (o && o.skill && typeof o.category === 'string') {
    return {
      skill: o.skill,
      category: o.category,
      ...(o.skillSplit !== undefined ? { skillSplit: o.skillSplit } : {}),
    }
  }
  const built = BUILT_IN_ICON_SHORTCUTS[iconId]
  if (built) return { ...built }
  return {
    skill: 'speaking' as Skill,
    category: '',
  }
}
