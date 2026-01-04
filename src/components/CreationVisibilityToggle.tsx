import { Globe, Lock, Info } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface CreationVisibilityToggleProps {
  contentType: 'course' | 'quiz' | 'flashcard' | 'guide';
  isPublic: boolean;
  onChange: (isPublic: boolean) => void;
  className?: string;
}

/**
 * CreationVisibilityToggle Component
 * 
 * A visibility toggle for content creation forms.
 * Manages local state only - no API calls.
 * 
 * Features:
 * - Toggle switch with clear Public/Private labeling
 * - Icon indicators (Globe for public, Lock for private)
 * - Informational tooltip explaining visibility implications
 * - Remembers user preference in local storage (via parent hook)
 */
export function CreationVisibilityToggle({
  contentType,
  isPublic,
  onChange,
  className = '',
}: CreationVisibilityToggleProps) {
  const contentTypeLabel = contentType.charAt(0).toUpperCase() + contentType.slice(1);

  return (
    <div className={`rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
            Visibility
          </span>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  aria-label="Visibility information"
                >
                  <Info className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <div className="space-y-2 text-sm">
                  <div>
                    <strong>Public:</strong>
                    <ul className="list-disc list-inside mt-1 space-y-1">
                      <li>Visible to all users (including non-logged-in visitors)</li>
                      <li>Can be forked by authenticated users</li>
                      <li>Appears in public content discovery</li>
                      <li>You can change to private anytime</li>
                    </ul>
                  </div>
                  <div>
                    <strong>Private:</strong>
                    <ul className="list-disc list-inside mt-1 space-y-1">
                      <li>Only visible to you</li>
                      <li>Not discoverable by other users</li>
                      <li>Can be changed to public anytime</li>
                    </ul>
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <Switch
          checked={isPublic}
          onCheckedChange={onChange}
          aria-label="Toggle content visibility between public and private"
          aria-describedby="visibility-description"
        />
      </div>
      
      <div className="flex items-center gap-2">
        {isPublic ? (
          <Globe className="h-4 w-4 text-green-600 dark:text-green-400" />
        ) : (
          <Lock className="h-4 w-4 text-gray-500 dark:text-gray-400" />
        )}
        <span className={`text-sm font-medium ${isPublic ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
          {isPublic ? 'Public' : 'Private'}
        </span>
      </div>
      
      <p id="visibility-description" className="text-xs text-gray-600 dark:text-gray-400 mt-2">
        {isPublic
          ? `Public ${contentTypeLabel.toLowerCase()} is visible to everyone and can be forked by other users.`
          : `Private ${contentTypeLabel.toLowerCase()} is only visible to you.`}
      </p>
    </div>
  );
}
