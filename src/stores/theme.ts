import { createSignal } from 'solid-js'

// Color mode (light/dark)
export type ColorMode = 'light' | 'dark' | 'system'

// Aesthetic themes
export type AestheticTheme =
  | 'editorial'
  | 'minimal'
  | 'cozy'
  | 'bold'
  | 'retro'
  | 'tokyo'

const COLOR_MODE_KEY = 'oh-my-md:color-mode-v1'
const AESTHETIC_KEY = 'oh-my-md:aesthetic-v1'

// ─────────────────────────────────────────────────────────────────────────────
// COLOR MODE (light/dark)
// ─────────────────────────────────────────────────────────────────────────────

function loadColorMode(): ColorMode {
  if (typeof window === 'undefined') return 'system'
  const stored = window.localStorage.getItem(COLOR_MODE_KEY) as ColorMode | null
  return stored && ['light', 'dark', 'system'].includes(stored)
    ? stored
    : 'system'
}

function saveColorMode(mode: ColorMode): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(COLOR_MODE_KEY, mode)
}

function getSystemPreference(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light'
}

// ─────────────────────────────────────────────────────────────────────────────
// AESTHETIC THEME
// ─────────────────────────────────────────────────────────────────────────────

function loadAesthetic(): AestheticTheme {
  if (typeof window === 'undefined') return 'editorial'
  const stored = window.localStorage.getItem(
    AESTHETIC_KEY,
  ) as AestheticTheme | null
  return stored &&
    ['editorial', 'minimal', 'cozy', 'bold', 'retro', 'tokyo'].includes(stored)
    ? stored
    : 'editorial'
}

function saveAesthetic(aesthetic: AestheticTheme): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(AESTHETIC_KEY, aesthetic)
}

// ─────────────────────────────────────────────────────────────────────────────
// SIGNALS
// ─────────────────────────────────────────────────────────────────────────────

const [colorMode, setColorModeInternal] = createSignal<ColorMode>('system')
const [resolvedColorMode, setResolvedColorMode] = createSignal<
  'light' | 'dark'
>('light')
const [aesthetic, setAestheticInternal] =
  createSignal<AestheticTheme>('editorial')
const [isInitialized, setIsInitialized] = createSignal(false)

// ─────────────────────────────────────────────────────────────────────────────
// INITIALIZATION
// ─────────────────────────────────────────────────────────────────────────────

export function initializeThemeStore(): void {
  if (typeof window === 'undefined') return
  if (isInitialized()) return

  // Load color mode
  const storedMode = loadColorMode()
  setColorModeInternal(storedMode)
  updateResolvedColorMode(storedMode)

  // Load aesthetic
  const storedAesthetic = loadAesthetic()
  setAestheticInternal(storedAesthetic)
  applyAesthetic(storedAesthetic)

  // Listen for system preference changes
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
  const handleChange = () => {
    if (colorMode() === 'system') {
      updateResolvedColorMode('system')
    }
  }
  mediaQuery.addEventListener('change', handleChange)

  setIsInitialized(true)
}

// ─────────────────────────────────────────────────────────────────────────────
// COLOR MODE FUNCTIONS
// ─────────────────────────────────────────────────────────────────────────────

function updateResolvedColorMode(mode: ColorMode): void {
  const resolved = mode === 'system' ? getSystemPreference() : mode
  setResolvedColorMode(resolved)

  if (typeof document !== 'undefined') {
    if (resolved === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }
}

export function setColorMode(newMode: ColorMode): void {
  setColorModeInternal(newMode)
  saveColorMode(newMode)
  updateResolvedColorMode(newMode)
}

// ─────────────────────────────────────────────────────────────────────────────
// AESTHETIC FUNCTIONS
// ─────────────────────────────────────────────────────────────────────────────

function applyAesthetic(theme: AestheticTheme): void {
  if (typeof document === 'undefined') return

  // Remove all aesthetic classes
  document.documentElement.classList.remove(
    'theme-editorial',
    'theme-minimal',
    'theme-cozy',
    'theme-bold',
    'theme-retro',
    'theme-tokyo',
  )

  // Add new aesthetic class
  document.documentElement.classList.add(`theme-${theme}`)
}

export function setAesthetic(newAesthetic: AestheticTheme): void {
  setAestheticInternal(newAesthetic)
  saveAesthetic(newAesthetic)
  applyAesthetic(newAesthetic)
}

// ─────────────────────────────────────────────────────────────────────────────
// LEGACY COMPATIBILITY (for existing code)
// ─────────────────────────────────────────────────────────────────────────────

// Alias for backwards compatibility
export const theme = colorMode
export const resolvedTheme = resolvedColorMode
export type Theme = ColorMode

export function setTheme(newTheme: Theme): void {
  setColorMode(newTheme)
}

export function getTheme(): Theme {
  return colorMode()
}

export function getResolvedTheme(): 'light' | 'dark' {
  return resolvedColorMode()
}

// ─────────────────────────────────────────────────────────────────────────────
// THEME DEFINITIONS
// ─────────────────────────────────────────────────────────────────────────────

export const colorModes: Array<{
  value: ColorMode
  label: string
  description: string
}> = [
  { value: 'light', label: 'Light', description: 'Bright and clean' },
  { value: 'dark', label: 'Dark', description: 'Easy on the eyes' },
  { value: 'system', label: 'System', description: 'Match your device' },
]

export const aestheticThemes: Array<{
  value: AestheticTheme
  label: string
  description: string
  preview: { accent: string; bg: string; secondary?: string }
}> = [
  {
    value: 'editorial',
    label: 'Editorial',
    description: 'Clean, confident serif for focused reading',
    preview: { accent: '#1a3a5c', bg: '#fcfcfa', secondary: '#8b4a2a' },
  },
  {
    value: 'minimal',
    label: 'Minimal',
    description: 'Clean monochrome, focused reading',
    preview: { accent: '#404040', bg: '#fafafa' },
  },
  {
    value: 'cozy',
    label: 'Cozy',
    description: 'Warm fireside reading, deep browns & amber',
    preview: { accent: '#b45930', bg: '#faf6f0', secondary: '#c77a30' },
  },
  {
    value: 'bold',
    label: 'Bold',
    description: 'Vibrant colors, readable maximalism',
    preview: { accent: '#a78bfa', bg: '#12101a', secondary: '#f472b6' },
  },
  {
    value: 'retro',
    label: 'Retro',
    description: 'Terminal nostalgia, optimized for reading',
    preview: { accent: '#7ecf7e', bg: '#0f1610', secondary: '#6ecfcf' },
  },
  {
    value: 'tokyo',
    label: 'Tokyo',
    description: "Tokyo Night - Neovim's beloved color scheme",
    preview: { accent: '#7aa2f7', bg: '#24283b', secondary: '#bb9af7' },
  },
]

// Legacy themes array for backwards compatibility
export const themes = colorModes

// ─────────────────────────────────────────────────────────────────────────────
// EXPORTS
// ─────────────────────────────────────────────────────────────────────────────

export {
  colorMode,
  resolvedColorMode,
  aesthetic,
  isInitialized as themeIsInitialized,
}
