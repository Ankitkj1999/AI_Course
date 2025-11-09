import React from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { GitFork, User, Calendar, AlertCircle } from 'lucide-react';
import { ForkedFrom } from '@/types/quiz';
import { ContentType } from '@/types/content-sharing';

interface ContentAttributionProps {
  forkedFrom?: ForkedFrom;
  contentType: ContentType;
  className?: string;
}

export const ContentAttribution: React.FC<ContentAttributionProps> = ({
  forkedFrom,
  contentType,
  className = '',
}) => {
  // Don't render if content is not forked
  if (!forkedFrom || !forkedFrom.contentId) {
    return null;
  }

  const { originalOwnerName, forkedAt, contentId } = forkedFrom;

  // Format the fork timestamp
  const formatDate = (dateString: string | null) => {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return '';
    }
  };

  // Construct the link to the original content
  // We'll try to link to the public content, but handle cases where it might not be available
  const getOriginalContentLink = () => {
    // For now, we'll link to the public content browser with a filter
    // In a real implementation, you might want to check if the content is still public
    return `/public/${contentType}/${contentId}`;
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Badge 
        variant="outline" 
        className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300"
      >
        <GitFork className="h-3.5 w-3.5" />
        <span className="font-medium">Forked from</span>
        
        {originalOwnerName && (
          <>
            <span className="text-blue-600 dark:text-blue-400">•</span>
            <div className="flex items-center gap-1">
              <User className="h-3 w-3" />
              <span>{originalOwnerName}</span>
            </div>
          </>
        )}
        
        {forkedAt && (
          <>
            <span className="text-blue-600 dark:text-blue-400">•</span>
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>{formatDate(forkedAt)}</span>
            </div>
          </>
        )}
      </Badge>
      
      {/* Try to link to original content, but show a note if it might not be available */}
      {contentId && (
        <Link
          to={getOriginalContentLink()}
          className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
          onClick={(e) => {
            // We'll let the link try to navigate, and the target page will handle if content is not found
          }}
        >
          View original
        </Link>
      )}
    </div>
  );
};

// Alternative compact version for smaller spaces
export const ContentAttributionCompact: React.FC<ContentAttributionProps> = ({
  forkedFrom,
  contentType,
  className = '',
}) => {
  if (!forkedFrom || !forkedFrom.contentId) {
    return null;
  }

  const { originalOwnerName } = forkedFrom;

  return (
    <div className={`flex items-center gap-1.5 text-sm text-muted-foreground ${className}`}>
      <GitFork className="h-3.5 w-3.5" />
      <span>
        Forked from{' '}
        <span className="font-medium text-foreground">{originalOwnerName || 'Unknown'}</span>
      </span>
    </div>
  );
};
