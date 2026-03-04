'use client';
import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext(null);

export function useTheme() {
    return useContext(ThemeContext);
}

export const THEMES = [
    { id: 'dark', label: 'Gelap', icon: '🌑', colors: ['#0a0e1a', '#6366f1', '#1e293b'] },
    { id: 'blue-white', label: 'Biru Putih', icon: '☀️', colors: ['#f0f4ff', '#1d4ed8', '#ffffff'] },
];

export default function ThemeProvider({ children }) {
    const [theme, setThemeState] = useState('dark');
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        const saved = localStorage.getItem('crm-theme') || 'dark';
        setThemeState(saved);
        document.documentElement.setAttribute('data-theme', saved);
        setMounted(true);
    }, []);

    function setTheme(name) {
        setThemeState(name);
        document.documentElement.setAttribute('data-theme', name);
        localStorage.setItem('crm-theme', name);
    }

    // Prevent flash of wrong theme
    if (!mounted) {
        return null;
    }

    return (
        <ThemeContext.Provider value={{ theme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}
