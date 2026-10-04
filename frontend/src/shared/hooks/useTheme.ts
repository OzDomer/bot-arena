import { useState } from "react"

type Theme = 'light' | 'dark'

// the document theme is bootstrapped before first paint by a small
// script in index.html; this hook reads and flips it
export default function useTheme() {
    const [theme, setTheme] = useState<Theme>(
        () => document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light'
    )

    function toggleTheme() {
        const next: Theme = theme === 'dark' ? 'light' : 'dark'
        document.documentElement.dataset.theme = next
        localStorage.setItem('theme', next)
        setTheme(next)
    }

    return { theme, toggleTheme }
}