import { useState, useCallback } from 'react';

export function useCopyText() {
  const [isCopied, setIsCopied] = useState(false);

  const copyText = useCallback((text: string) => {
    if (!text) {
      return;
    }

    navigator.clipboard.writeText(text).then(() => {
      setIsCopied(true);
      setTimeout(() => {
        setIsCopied(false);
      }, 2000);
    });
  }, []);

  return { isCopied, copyText };
}
