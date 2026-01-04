import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GitFork } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { apiPost } from '@/utils/api';
import { storePendingFork } from '@/utils/forkRedirect';
import type { ContentType, ForkResponse } from '@/types/content-sharing';

interface ForkButtonProps {
  contentType: ContentType;
  slug: string;
  isAuthenticated: boolean;
  isOwner: boolean;
  onForkSuccess?: (forkedContent: { _id: string; slug: string; title: string }) => void;
  className?: string;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export const ForkButton: React.FC<ForkButtonProps> = ({
  contentType,
  slug,
  isAuthenticated,
  isOwner,
  onForkSuccess,
  className = '',
  variant = 'default',
  size = 'default',
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleForkClick = async () => {
    // Check authentication first
    if (!isAuthenticated) {
      // Store the intended fork operation using the utility
      const returnUrl = window.location.pathname;
      storePendingFork(contentType, slug, returnUrl);

      // Redirect to login with return URL
      navigate(`/login?returnUrl=${encodeURIComponent(returnUrl)}`);
      return;
    }

    // Don't allow owners to fork their own content
    if (isOwner) {
      toast({
        title: 'Cannot Fork',
        description: 'You cannot fork your own content.',
        variant: 'destructive',
      });
      return;
    }

    // Perform fork operation
    await performFork();
  };

  const performFork = async () => {
    setIsLoading(true);

    try {
      const response = await apiPost(`/${contentType}/${slug}/fork`);
      const data: ForkResponse = await response.json();

      if (data.success && data.forkedContent) {
        toast({
          title: 'Fork Successful!',
          description: (
            <div>
              <p>{data.message}</p>
              <button
                onClick={() => navigate(`/${contentType}/${data.forkedContent.slug}`)}
                className="mt-2 text-sm underline hover:no-underline"
              >
                View your forked {contentType}
              </button>
            </div>
          ),
          variant: 'default',
        });

        // Call success callback if provided
        if (onForkSuccess) {
          onForkSuccess(data.forkedContent);
        }
      } else {
        throw new Error(data.message || 'Failed to fork content');
      }
    } catch (error) {
      console.error('Error forking content:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to fork content. Please try again.';
      
      toast({
        title: 'Fork Failed',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Don't render button for content owners
  if (isOwner) {
    return null;
  }

  return (
    <Button
      onClick={handleForkClick}
      disabled={isLoading}
      variant={variant}
      size={size}
      className={className}
    >
      <GitFork className="w-4 h-4 mr-2" />
      {isLoading ? 'Forking...' : 'Fork'}
    </Button>
  );
};
