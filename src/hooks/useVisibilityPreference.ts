import { useState, useEffect } from 'react';

type ContentType = 'course' | 'quiz' | 'flashcard';

interface UseVisibilityPreferenceReturn {
  isPublic: boolean;
  setIsPublic: (value: boolean) => void;
}

/**
 * Custom hook to manage visibility preferences for content creation.
 * Stores and retrieves preferences from local storage per content type.
 * 
 * @param contentType - The type of content (course, quiz, flashcard)
 * @param defaultValue - Default visibility (true for public)
 * @returns Object with isPublic state and setter
 */
export function useVisibilityPreference(
  contentType: ContentType,
  defaultValue: boolean = true
): UseVisibilityPreferenceReturn {
  const storageKey = `visibility_preference_${contentType}`;

  // Initialize state from local storage or default
  const [isPublic, setIsPublicState] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored !== null) {
        return stored === 'true';
      }
    } catch (error) {
      console.warn('Failed to read visibility preference from local storage:', error);
    }
    return defaultValue;
  });

  // Update local storage when preference changes
  const setIsPublic = (value: boolean) => {
    setIsPublicState(value);
    try {
      localStorage.setItem(storageKey, String(value));
    } catch (error) {
      console.warn('Failed to save visibility preference to local storage:', error);
    }
  };

  return { isPublic, setIsPublic };
}
