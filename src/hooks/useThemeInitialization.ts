import { useEffect } from 'react';

export function useThemeInitialization() {
  useEffect(() => {
    // Initialize theme color from localStorage on app startup
    const savedColor = localStorage.getItem('theme-color');
    if (savedColor) {
      document.documentElement.style.setProperty('--primary', savedColor);
    }

    // Initialize font size from localStorage on app startup
    const savedFontSize = localStorage.getItem('font-size');
    if (savedFontSize) {
      document.documentElement.style.setProperty('--base-font-size', savedFontSize);
      document.body.style.fontSize = savedFontSize;
    }
  }, []);
}