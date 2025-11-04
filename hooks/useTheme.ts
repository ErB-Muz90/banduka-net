import { useEffect } from 'react';

type Theme = 'light' | 'dark';

export const useTheme = (): [Theme, () => void] => {
    useEffect(() => {
        const root = window.document.documentElement;
        // Force light theme as per new design request
        root.classList.remove('dark');
        root.classList.add('light');
    }, []); // Empty dependency array, runs once

    // Toggle function is a no-op as theme is fixed.
    const toggleTheme = () => {
        console.warn('Theme toggling is disabled.');
    };

    return ['light', toggleTheme];
};
