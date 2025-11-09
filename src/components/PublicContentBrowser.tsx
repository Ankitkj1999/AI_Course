import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiGet } from '@/utils/api';
import { InlineLoader } from '@/components/ui/loading';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Pagination, PaginationInfo } from '@/components/ui/pagination';
import { useToast } from '@/hooks/use-toast';
import { Search, BookOpen, Brain, Layers, FileText, Calendar, User, GitFork, Grid, List } from 'lucide-react';
import type { ContentType, PublicContentResponse, ContentItem } from '@/types/content-sharing';

interface PublicContentBrowserProps {
  contentType?: ContentType | 'all';
  onFork?: (content: ContentItem) => void;
}

export const PublicContentBrowser: React.FC<PublicContentBrowserProps> = ({
  contentType: initialContentType = 'all',
  onFork
}) => {
  const navigate = useNavigate();
  const { toast } = useToast();

  // State
  const [contentType, setContentType] = useState<ContentType | 'all'>(initialContentType);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sortBy, setSortBy] = useState<'recent' | 'popular' | 'forks'>('recent');
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [loading, setLoading] = useState(true);
  const [contentData, setContentData] = useState<PublicContentResponse | null>(null);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1); // Reset to first page on search
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch public content
  const fetchPublicContent = useCallback(async () => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
        sortBy,
      });

      if (contentType !== 'all') {
        params.append('type', contentType);
      }

      if (debouncedSearch) {
        params.append('search', debouncedSearch);
      }

      const response = await apiGet(`/public/content?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setContentData(data);
      } else {
        toast({
          title: 'Error',
          description: 'Failed to load public content',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error fetching public content:', error);
      toast({
        title: 'Error',
        description: 'Failed to load public content',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [currentPage, sortBy, contentType, debouncedSearch, toast]);

  useEffect(() => {
    fetchPublicContent();
  }, [fetchPublicContent]);

  // Handle content type change
  const handleContentTypeChange = (value: string) => {
    setContentType(value as ContentType | 'all');
    setCurrentPage(1);
  };

  // Handle sort change
  const handleSortChange = (value: string) => {
    setSortBy(value as 'recent' | 'popular' | 'forks');
    setCurrentPage(1);
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle content click
  const handleContentClick = (content: ContentItem) => {
    const type = getContentType(content);
    const slug = content.slug;
    navigate(`/${type}/${slug}`);
  };

  // Get content type from content item
  const getContentType = (content: ContentItem): ContentType => {
    if ('questions' in content) return 'quiz';
    if ('cards' in content) return 'flashcard';
    if ('sections' in content && 'modules' in content) return 'course';
    return 'guide';
  };

  // Get content type icon
  const getContentTypeIcon = (type: ContentType) => {
    switch (type) {
      case 'course':
        return <BookOpen className="w-4 h-4" />;
      case 'quiz':
        return <Brain className="w-4 h-4" />;
      case 'flashcard':
        return <Layers className="w-4 h-4" />;
      case 'guide':
        return <FileText className="w-4 h-4" />;
    }
  };

  // Get content type color
  const getContentTypeColor = (type: ContentType) => {
    switch (type) {
      case 'course':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'quiz':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'flashcard':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'guide':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  if (loading && !contentData) {
    return <InlineLoader message="Loading public content..." />;
  }

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Discover Public Content
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          Browse and explore learning materials shared by the community
        </p>
      </div>

      {/* Filters and Search */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="text"
              placeholder="Search by title or keyword..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Content Type Filter */}
          <Select value={contentType} onValueChange={handleContentTypeChange}>
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Content Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="course">Courses</SelectItem>
              <SelectItem value="quiz">Quizzes</SelectItem>
              <SelectItem value="flashcard">Flashcards</SelectItem>
              <SelectItem value="guide">Guides</SelectItem>
            </SelectContent>
          </Select>

          {/* Sort */}
          <Select value={sortBy} onValueChange={handleSortChange}>
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Sort By" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Most Recent</SelectItem>
              <SelectItem value="popular">Most Popular</SelectItem>
              <SelectItem value="forks">Most Forked</SelectItem>
            </SelectContent>
          </Select>

          {/* View Mode Toggle */}
          <div className="flex gap-2">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="icon"
              onClick={() => setViewMode('grid')}
            >
              <Grid className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="icon"
              onClick={() => setViewMode('list')}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center py-12">
          <InlineLoader message="Loading..." />
        </div>
      )}

      {/* Content Grid/List */}
      {!loading && contentData && (
        <>
          {contentData.data.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600 dark:text-gray-300 text-lg">
                No public content found. Try adjusting your filters.
              </p>
            </div>
          ) : (
            <>
              {/* Pagination Info */}
              <div className="mb-4">
                <PaginationInfo
                  currentPage={contentData.pagination.currentPage}
                  totalPages={contentData.pagination.totalPages}
                  totalItems={contentData.pagination.totalItems}
                  itemsPerPage={20}
                />
              </div>

              {/* Content Cards */}
              <div className={
                viewMode === 'grid'
                  ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
                  : 'space-y-4'
              }>
                {contentData.data.map((content) => {
                  const type = getContentType(content);
                  return (
                    <Card
                      key={content._id}
                      className="hover:shadow-lg transition-shadow cursor-pointer"
                      onClick={() => handleContentClick(content)}
                    >
                      <CardHeader>
                        <div className="flex items-start justify-between mb-2">
                          <Badge className={getContentTypeColor(type)}>
                            <span className="flex items-center gap-1">
                              {getContentTypeIcon(type)}
                              {type.charAt(0).toUpperCase() + type.slice(1)}
                            </span>
                          </Badge>
                          {content.forkCount > 0 && (
                            <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                              <GitFork className="w-3 h-3 mr-1" />
                              {content.forkCount}
                            </div>
                          )}
                        </div>
                        <CardTitle className="text-lg line-clamp-2">
                          {content.title}
                        </CardTitle>
                        <CardDescription className="line-clamp-2">
                          {content.keyword || 'No description available'}
                        </CardDescription>
                      </CardHeader>
                      <CardFooter className="flex flex-col items-start gap-2 text-sm text-gray-500 dark:text-gray-400">
                        <div className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          <span>{content.ownerName || 'Unknown'}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>{formatDate(content.createdAt)}</span>
                        </div>
                      </CardFooter>
                    </Card>
                  );
                })}
              </div>

              {/* Pagination */}
              {contentData.pagination.totalPages > 1 && (
                <div className="mt-8">
                  <Pagination
                    currentPage={contentData.pagination.currentPage}
                    totalPages={contentData.pagination.totalPages}
                    onPageChange={handlePageChange}
                  />
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
};
