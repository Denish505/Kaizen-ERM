import { createContext, useContext, useEffect, useState } from 'react'

const ThemeContext = createContext()

export function ThemeProvider({ children }) {
    const [theme, setTheme] = useState(() => {
        // Retrieve theme from localStorage or default to system
        if (typeof window !== 'undefined') {
            return localStorage.getItem('kaizen-theme') || 'dark'
        }
        return 'dark'
    })

    useEffect(() => {
        const root = window.document.documentElement

        // Remove old theme classes
        root.classList.remove('light', 'dark')

        if (theme === 'system') {
            const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
                ? 'dark'
                : 'light'
            root.classList.add(systemTheme)
        } else {
            // Add either 'light' or 'dark' class
            root.classList.add(theme)
        }
    }, [theme])

    const value = {
        theme,
        setTheme: (newTheme) => {
            localStorage.setItem('kaizen-theme', newTheme)
            setTheme(newTheme)
        }
    }

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    )
}

export const useTheme = () => {
    const context = useContext(ThemeContext)
    if (context === undefined)
        throw new Error('useTheme must be used within a ThemeProvider')
    return context
}
