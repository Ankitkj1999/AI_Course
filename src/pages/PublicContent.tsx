import React from 'react';
import { PublicContentBrowser } from '@/components/PublicContentBrowser';
import SEO from '@/components/SEO';

const PublicContent: React.FC = () => {
  return (
    <>
      <SEO
        title="Discover Public Content"
        description="Browse and explore learning materials shared by the community. Find courses, quizzes, and flashcards created by other users."
        keywords="public content, learning materials, courses, quizzes, flashcards, community"
      />
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <PublicContentBrowser />
      </div>
    </>
  );
};

export default PublicContent;
