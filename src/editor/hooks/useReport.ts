/**
 * useReport Hook - Shows real-time speech recognition feedback
 * Based on Lexical playground implementation
 */

import { useCallback, useEffect, useRef } from 'react';

const getElement = (): HTMLElement => {
  let element = document.getElementById('speech-report-container');

  if (element === null) {
    element = document.createElement('div');
    element.id = 'speech-report-container';
    element.style.position = 'fixed';
    element.style.top = '50%';
    element.style.left = '50%';
    element.style.fontSize = '28px';
    element.style.transform = 'translate(-50%, -50px)';
    element.style.padding = '16px 24px';
    element.style.background = 'rgba(255, 255, 255, 0.95)';
    element.style.color = '#374151';
    element.style.borderRadius = '12px';
    element.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.06)';
    element.style.border = '1px solid rgba(0, 0, 0, 0.1)';
    element.style.zIndex = '9999';
    element.style.maxWidth = '80vw';
    element.style.overflowWrap = 'break-word';
    element.style.textAlign = 'center';
    element.style.fontFamily = 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif';
    element.style.fontWeight = '500';
    element.style.backdropFilter = 'blur(8px)';

    if (document.body) {
      document.body.appendChild(element);
    }
  }

  return element;
};

export default function useReport(): (
  content: string,
) => ReturnType<typeof setTimeout> {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  const cleanup = useCallback(() => {
    if (timer.current !== null) {
      clearTimeout(timer.current);
      timer.current = null;
    }

    const element = document.getElementById('speech-report-container');
    if (element && document.body) {
      document.body.removeChild(element);
    }
  }, []);

  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  return useCallback(
    (content: string) => {
      // Don't show empty content
      if (!content.trim()) {
        return timer.current;
      }

      const element = getElement();
      
      if (timer.current !== null) {
        clearTimeout(timer.current);
      }

      // Detect dark mode and adjust styling accordingly
      const isDarkMode = document.documentElement.classList.contains('dark') || 
                        window.matchMedia('(prefers-color-scheme: dark)').matches;
      
      if (isDarkMode) {
        element.style.background = 'rgba(31, 41, 55, 0.95)';
        element.style.color = '#f9fafb';
        element.style.border = '1px solid rgba(255, 255, 255, 0.1)';
      } else {
        element.style.background = 'rgba(255, 255, 255, 0.95)';
        element.style.color = '#374151';
        element.style.border = '1px solid rgba(0, 0, 0, 0.1)';
      }

      // Simple, clean display - just the content
      element.innerHTML = content;
      
      // Auto-hide after 1 second like the playground
      timer.current = setTimeout(cleanup, 1000);
      
      return timer.current;
    },
    [cleanup],
  );
}