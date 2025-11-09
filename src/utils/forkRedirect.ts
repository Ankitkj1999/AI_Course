/**
 * Fork Redirect Handler
 * 
 * Manages the fork operation context during authentication flow.
 * Stores pending fork operations in sessionStorage and restores them after login.
 */

import type { ContentType } from '@/types/content-sharing';

export interface PendingForkOperation {
  contentType: ContentType;
  slug: string;
  returnUrl: string;
  timestamp: number;
}

const STORAGE_KEY = 'pendingFork';
const MAX_AGE_MS = 30 * 60 * 1000; // 30 minutes

/**
 * Store a pending fork operation in sessionStorage
 */
export const storePendingFork = (
  contentType: ContentType,
  slug: string,
  returnUrl: string
): void => {
  const pendingFork: PendingForkOperation = {
    contentType,
    slug,
    returnUrl,
    timestamp: Date.now(),
  };

  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(pendingFork));
    console.log('Stored pending fork operation:', pendingFork);
  } catch (error) {
    console.error('Failed to store pending fork operation:', error);
  }
};

/**
 * Retrieve a pending fork operation from sessionStorage
 * Returns null if no valid operation exists or if it has expired
 */
export const getPendingFork = (): PendingForkOperation | null => {
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return null;
    }

    const pendingFork: PendingForkOperation = JSON.parse(stored);

    // Check if the operation has expired
    const age = Date.now() - pendingFork.timestamp;
    if (age > MAX_AGE_MS) {
      console.log('Pending fork operation expired, clearing...');
      clearPendingFork();
      return null;
    }

    return pendingFork;
  } catch (error) {
    console.error('Failed to retrieve pending fork operation:', error);
    clearPendingFork();
    return null;
  }
};

/**
 * Clear the pending fork operation from sessionStorage
 */
export const clearPendingFork = (): void => {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
    console.log('Cleared pending fork operation');
  } catch (error) {
    console.error('Failed to clear pending fork operation:', error);
  }
};

/**
 * Check if there is a pending fork operation
 */
export const hasPendingFork = (): boolean => {
  return getPendingFork() !== null;
};
