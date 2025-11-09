/**
 * usePendingFork Hook
 * 
 * Handles automatic execution of pending fork operations after authentication.
 * This hook should be used in content viewer pages to check for and execute
 * pending fork operations when the user returns from login.
 */

import { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useAuthState } from '@/hooks/useAuthState';
import { getPendingFork, clearPendingFork } from '@/utils/forkRedirect';
import { apiPost } from '@/utils/api';
import type { ForkResponse } from '@/types/content-sharing';

export const usePendingFork = () => {
  const { isAuthenticated } = useAuthState();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const hasCheckedRef = useRef(false);

  useEffect(() => {
    // Only check once per page load and only if authenticated
    if (hasCheckedRef.current || !isAuthenticated) {
      return;
    }

    hasCheckedRef.current = true;

    const executePendingFork = async () => {
      const pendingFork = getPendingFork();

      if (!pendingFork) {
        return;
      }

      // Check if we're on the correct page for the pending fork
      const expectedPath = `/${pendingFork.contentType}/${pendingFork.slug}`;
      if (location.pathname !== expectedPath) {
        console.log('Not on the correct page for pending fork, skipping...');
        return;
      }

      console.log('Executing pending fork operation:', pendingFork);

      // Clear the pending fork immediately to prevent duplicate executions
      clearPendingFork();

      try {
        // Show loading toast
        toast({
          title: 'Forking Content',
          description: 'Creating your copy...',
        });

        // Execute the fork operation
        const response = await apiPost(
          `/${pendingFork.contentType}/${pendingFork.slug}/fork`
        );
        const data: ForkResponse = await response.json();

        if (data.success && data.forkedContent) {
          // Show success toast
          toast({
            title: 'Fork Successful!',
            description: `${data.message || 'Successfully forked content'}. Redirecting to your copy...`,
            variant: 'default',
          });

          // Automatically navigate to the forked content after a short delay
          setTimeout(() => {
            navigate(`/${pendingFork.contentType}/${data.forkedContent.slug}`);
          }, 1500);
        } else {
          throw new Error(data.message || 'Failed to fork content');
        }
      } catch (error) {
        console.error('Error executing pending fork:', error);

        const errorMessage =
          error instanceof Error
            ? error.message
            : 'Failed to fork content. Please try again.';

        toast({
          title: 'Fork Failed',
          description: errorMessage,
          variant: 'destructive',
        });
      }
    };

    executePendingFork();
  }, [isAuthenticated, location.pathname, navigate, toast]);
};
