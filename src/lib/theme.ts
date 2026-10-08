import { useSyncExternalStore } from 'react'

export type Theme = 'light' | 'dark' | 'system'
const KEY = 'paidup-theme'
const listeners = new Set<() => void>()

export function getTheme(): Theme {
  const v = localStorage.getItem(KEY)
  return v === 'light' || v === 'dark' ? v : 'system'
}

function prefersDark() {
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false
}

export function applyTheme(theme: Theme = getTheme()) {
  const dark = theme === 'dark' || (theme === 'system' && prefersDark())
  document.documentElement.classList.toggle('dark', dark)
}

export function setTheme(theme: Theme) {
  if (theme === 'system') localStorage.removeItem(KEY)
  else localStorage.setItem(KEY, theme)
  applyTheme(theme)
  listeners.forEach((l) => l())
}

function subscribe(cb: () => void) {
  listeners.add(cb)
  const mq = window.matchMedia?.('(prefers-color-scheme: dark)')
  const onChange = () => {
    applyTheme()
    cb()
  }
  mq?.addEventListener('change', onChange)
  return () => {
    listeners.delete(cb)
    mq?.removeEventListener('change', onChange)
  }
}

export function useTheme() {
  const theme = useSyncExternalStore(subscribe, getTheme, () => 'system' as Theme)
  return { theme, setTheme }
}
