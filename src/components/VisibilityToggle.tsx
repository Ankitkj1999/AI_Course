import React, { useState } from 'react';
import { Globe, Lock } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { apiPatch } from '@/utils/api';
import type { ContentType, VisibilityResponse } from '@/types/content-sharing';

interface VisibilityToggleProps {
  contentType: ContentType;
  slug: string;
  isPublic: boolean;
  onToggle?: (newState: boolean) => void;
  className?: string;
}

export const VisibilityToggle: React.FC<VisibilityToggleProps> = ({
  contentType,
  slug,
  isPublic,
  onToggle,
  className = '',
}) => {
  const [currentVisibility, setCurrentVisibility] = useState(isPublic);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingState, setPendingState] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleToggleClick = (checked: boolean) => {
    // If making content public, show confirmation dialog
    if (checked && !currentVisibility) {
      setPendingState(true);
      setShowConfirmDialog(true);
    } else {
      // If making content private, update immediately
      updateVisibility(false);
    }
  };

  const handleConfirmPublic = async () => {
    setShowConfirmDialog(false);
    if (pendingState !== null) {
      await updateVisibility(pendingState);
      setPendingState(null);
    }
  };

  const handleCancelPublic = () => {
    setShowConfirmDialog(false);
    setPendingState(null);
  };

  const updateVisibility = async (newState: boolean) => {
    setIsLoading(true);

    try {
      const response = await apiPatch(
        `/${contentType}/${slug}/visibility`,
        { isPublic: newState }
      );

      const data: VisibilityResponse = await response.json();

      if (data.success) {
        setCurrentVisibility(newState);
        
        toast({
          title: 'Visibility Updated',
          description: `Your ${contentType} is now ${newState ? 'public' : 'private'}.`,
          variant: 'default',
        });

        // Call the onToggle callback if provided
        if (onToggle) {
          onToggle(newState);
        }
      } else {
        throw new Error('Failed to update visibility');
      }
    } catch (error) {
      console.error('Error updating visibility:', error);
      
      toast({
        title: 'Error',
        description: `Failed to update visibility. Please try again.`,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className={`flex items-center space-x-3 ${className}`}>
        <div className="flex items-center space-x-2">
          {currentVisibility ? (
            <Globe className="h-4 w-4 text-green-600 dark:text-green-400" />
          ) : (
            <Lock className="h-4 w-4 text-gray-600 dark:text-gray-400" />
          )}
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {currentVisibility ? 'Public' : 'Private'}
          </span>
        </div>
        
        <Switch
          checked={currentVisibility}
          onCheckedChange={handleToggleClick}
          disabled={isLoading}
          aria-label="Toggle content visibility"
        />
      </div>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Make Content Public?</AlertDialogTitle>
            <AlertDialogDescription>
              This will make your {contentType} visible to everyone. Other users will be able to view and fork your content.
              You can change it back to private at any time.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelPublic}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmPublic}>
              Make Public
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
