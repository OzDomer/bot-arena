import { useSyncExternalStore } from 'react'

type Theme = 'light' | 'dark'

// The document theme is bootstrapped before first paint by a small script
// in index.html. It lives on <html>, so every component that asks sees the
// same value and hears about a flip, wherever the toggle is.
const listeners = new Set<() => void>()

function subscribe(listener: () => void) {
    listeners.add(listener)
    return () => { listeners.delete(listener) }
}

function currentTheme(): Theme {
    return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light'
}

export default function useTheme() {
    const theme = useSyncExternalStore(subscribe, currentTheme)

    function toggleTheme() {
        const next: Theme = theme === 'dark' ? 'light' : 'dark'
        document.documentElement.dataset.theme = next
        try {
            localStorage.setItem('theme', next)
        } catch {
            // storage blocked: the choice lasts until reload
        }
        for (const listener of listeners) listener()
    }

    return { theme, toggleTheme }
}
