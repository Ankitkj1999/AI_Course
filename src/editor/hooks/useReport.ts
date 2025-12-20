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
    element.style.fontSize = '24px';
    element.style.transform = 'translate(-50%, -50px)';
    element.style.padding = '16px 24px';
    element.style.background = 'rgba(59, 130, 246, 0.9)';
    element.style.color = 'white';
    element.style.borderRadius = '12px';
    element.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
    element.style.zIndex = '9999';
    element.style.maxWidth = '80vw';
    element.style.wordWrap = 'break-word';
    element.style.textAlign = 'center';
    element.style.fontFamily = 'Inter, -apple-system, BlinkMacSystemFont, sans-serif';
    element.style.fontWeight = '500';
    element.style.backdropFilter = 'blur(8px)';
    element.style.border = '1px solid rgba(255, 255, 255, 0.2)';

    if (document.body) {
      document.body.appendChild(element);
    }
  }

  return element;
};

export default function useReport(): (
  content: string,
  isInterim?: boolean,
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
    (content: string, isInterim: boolean = false) => {
      const element = getElement();
      
      if (timer.current !== null) {
        clearTimeout(timer.current);
      }

      // Don't show empty content
      if (!content.trim()) {
        return timer.current;
      }

      // Style the element based on whether it's interim or final
      if (isInterim) {
        element.style.background = 'rgba(59, 130, 246, 0.7)';
        element.style.opacity = '0.8';
        element.innerHTML = `🎤 <em style="font-style: italic; opacity: 0.9;">${content}</em>`;
      } else {
        element.style.background = 'rgba(34, 197, 94, 0.9)';
        element.style.opacity = '1';
        element.innerHTML = `✓ <strong>${content}</strong>`;
      }

      // Auto-hide after delay (longer for final results)
      const hideDelay = isInterim ? 300 : 1200;
      timer.current = setTimeout(cleanup, hideDelay);
      
      return timer.current;
    },
    [cleanup],
  );
}