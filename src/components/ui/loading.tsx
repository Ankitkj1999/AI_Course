import React from 'react';
import { cn } from '@/lib/utils';

// Spinner component
export const Spinner = ({ className, size = 'default' }: { 
  className?: string; 
  size?: 'sm' | 'default' | 'lg' 
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    default: 'h-6 w-6',
    lg: 'h-8 w-8'
  };

  return (
    <div
      className={cn(
        'animate-spin rounded-full border-2 border-gray-300 border-t-blue-600',
        sizeClasses[size],
        className
      )}
    />
  );
};

// Loading button
export const LoadingButton = ({ 
  children, 
  loading, 
  disabled, 
  className,
  ...props 
}: {
  children: React.ReactNode;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
  [key: string]: any;
}) => {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-md',
        'bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        className
      )}
      disabled={loading || disabled}
      aria-busy={loading}
      {...props}
    >
      {loading && <Spinner size="sm" className="mr-2" aria-hidden="true" />}
      {children}
    </button>
  );
};

// Skeleton components for loading states
export const Skeleton = ({ className }: { className?: string }) => {
  return (
    <div
      className={cn(
        'animate-pulse rounded-md bg-gray-200 dark:bg-gray-700',
        className
      )}
    />
  );
};

export const CourseCardSkeleton = () => {
  return (
    <div className="border rounded-lg p-6 space-y-4">
      <Skeleton className="h-48 w-full" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
      <div className="flex justify-between items-center">
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="h-8 w-20" />
      </div>
    </div>
  );
};

export const CourseListSkeleton = ({ count = 6 }: { count?: number }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <CourseCardSkeleton key={i} />
      ))}
    </div>
  );
};

// Page loading overlay
export const PageLoader = ({ message = 'Loading...' }: { message?: string }) => {
  return (
    <div className="fixed inset-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="text-center">
        <Spinner size="lg" className="mx-auto mb-4" />
        <p className="text-gray-600 dark:text-gray-400">{message}</p>
      </div>
    </div>
  );
};

// Inline loading state
export const InlineLoader = ({ 
  message = 'Loading...', 
  className 
}: { 
  message?: string; 
  className?: string; 
}) => {
  return (
    <div className={cn('flex items-center justify-center py-8', className)}>
      <div className="text-center">
        <Spinner className="mx-auto mb-2" />
        <p className="text-sm text-gray-600 dark:text-gray-400">{message}</p>
      </div>
    </div>
  );
};

// Course generation specific loader
export const CourseGenerationLoader = ({ 
  stage = 'Generating course content...',
  progress = 0 
}: { 
  stage?: string;
  progress?: number;
}) => {
  const stages = [
    'Analyzing topic...',
    'Generating course structure...',
    'Creating lesson content...',
    'Adding examples and exercises...',
    'Finalizing course...'
  ];

  return (
    <div className="fixed inset-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-8 max-w-md w-full mx-4 shadow-xl">
        <div className="text-center mb-6">
          <div className="relative">
            <Spinner size="lg" className="mx-auto mb-4" />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs font-medium text-blue-600">
                {Math.round(progress)}%
              </span>
            </div>
          </div>
          <h3 className="text-lg font-semibold mb-2">Creating Your Course</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">{stage}</p>
        </div>
        
        {/* Progress bar */}
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-4">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        
        {/* Stage indicators */}
        <div className="space-y-2">
          {stages.map((stageText, index) => (
            <div 
              key={index}
              className={cn(
                'flex items-center text-xs',
                stage === stageText 
                  ? 'text-blue-600 font-medium' 
                  : 'text-gray-400'
              )}
            >
              <div className={cn(
                'w-2 h-2 rounded-full mr-2',
                stage === stageText 
                  ? 'bg-blue-600 animate-pulse' 
                  : 'bg-gray-300'
              )} />
              {stageText}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};