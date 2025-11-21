import React, { useState } from 'react';
import { BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CourseImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallbackClassName?: string;
}

const CourseImage = ({ src, alt, className, fallbackClassName, ...props }: CourseImageProps) => {
  const [error, setError] = useState(false);

  if (error || !src) {
    return (
      <div 
        className={cn(
          "w-full h-full flex items-center justify-center bg-gradient-to-br from-secondary/80 to-secondary/40", 
          className,
          fallbackClassName
        )}
      >
        <BookOpen className="h-10 w-10 text-muted-foreground/50" />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setError(true)}
      {...props}
    />
  );
};

export default CourseImage;
