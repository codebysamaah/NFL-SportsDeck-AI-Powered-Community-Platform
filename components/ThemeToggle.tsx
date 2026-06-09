'use client'

import { useEffect, useState } from 'react'

export function ThemeToggle() {
    const [isDark, setIsDark] = useState(true)

    useEffect(() => {
        // load saved preference, default to dark
        const saved = localStorage.getItem('theme')
        if (saved === 'light') {
            document.documentElement.classList.add('light')
            setIsDark(false)
        }
    }, [])

    const toggle = () => {
        const html = document.documentElement
        if (isDark) {
            html.classList.add('light')
            localStorage.setItem('theme', 'light')
            setIsDark(false)
        } else {
            html.classList.remove('light')
            localStorage.setItem('theme', 'dark')
            setIsDark(true)
        }
    }

    return (
        <button
            onClick={toggle}
            className="w-full px-4 py-2 rounded-lg bg-[var(--bg-secondary)] hover:bg-[var(--bg-primary)] text-[var(--text-primary)] text-sm font-medium transition flex items-center justify-center gap-2"
        >
            {isDark ? '☀️ Light Mode' : '🌙 Dark Mode'}
        </button>
    )
}