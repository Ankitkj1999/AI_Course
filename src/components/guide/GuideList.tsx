import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Eye, 
  Calendar, 
  Trash2, 
  ExternalLink, 
  BookOpen,
  Plus,
  Loader2,
  Tag
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { guideService } from '@/services/guideService';
import { Guide } from '@/types/guide';
import { Link } from 'react-router-dom';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const GuideList: React.FC = () => {
  const [guides, setGuides] = useState<Guide[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const { toast } = useToast();

  const userId = localStorage.getItem('uid');

  const fetchGuides = async (page: number = 1) => {
    if (!userId) return;

    try {
      setIsLoading(true);
      const response = await guideService.getUserGuides(userId, page, 9);
      
      if (response.success) {
        setGuides(response.guides);
        setCurrentPage(response.pagination.currentPage);
        setTotalPages(response.pagination.totalPages);
      }
    } catch (error: any) {
      console.error('Error fetching guides:', error);
      toast({
        title: "Error",
        description: "Failed to load guides. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGuides();
  }, [userId]);

  const handleDelete = async (slug: string, title: string) => {
    if (!userId) return;

    setIsDeleting(slug);
    try {
      const response = await guideService.deleteGuide(slug, userId);
      
      if (response.success) {
        toast({
          title: "Deleted",
          description: `"${title}" has been deleted successfully.`,
        });
        
        // Refresh the list
        fetchGuides(currentPage);
      }
    } catch (error: any) {
      console.error('Error deleting guide:', error);
      toast({
        title: "Error",
        description: "Failed to delete guide. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            My Study Guides
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Manage and access your comprehensive study guides
          </p>
        </div>
        <Button asChild className="bg-gradient-to-r from-primary to-blue-600 hover:from-blue-600 hover:to-primary">
          <Link to="/dashboard/create-guide">
            <Plus className="mr-2 h-4 w-4" />
            Create New
          </Link>
        </Button>
      </div>

      {guides.length === 0 ? (
        <Card className="bg-white dark:bg-gray-800 text-center py-12">
          <CardContent>
            <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No study guides yet
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Create your first study guide to start learning!
            </p>
            <Button asChild className="bg-gradient-to-r from-primary to-blue-600 hover:from-blue-600 hover:to-primary">
              <Link to="/dashboard/create-guide">
                <Plus className="mr-2 h-4 w-4" />
                Create Study Guide
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {guides.map((guide) => (
              <Card key={guide._id} className="bg-white dark:bg-gray-800 hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white line-clamp-2">
                        {guide.title}
                      </CardTitle>
                      <CardDescription className="text-gray-600 dark:text-gray-300 mt-1">
                        {guide.keyword}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {guide.relatedTopics && guide.relatedTopics.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {guide.relatedTopics.slice(0, 3).map((topic, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            <Tag className="h-3 w-3 mr-1" />
                            {topic}
                          </Badge>
                        ))}
                        {guide.relatedTopics.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{guide.relatedTopics.length - 3} more
                          </Badge>
                        )}
                      </div>
                    )}

                    <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex items-center gap-1">
                        <Eye className="h-4 w-4" />
                        {guide.viewCount}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {formatDate(guide.createdAt)}
                      </div>
                    </div>

                    <div className="flex gap-2 justify-between items-center">
                      <Button asChild variant="default" size="sm" className="flex-1">
                        <Link to={`/dashboard/guide/${guide.slug}`}>
                          <ExternalLink className="mr-2 h-4 w-4" />
                          Read Guide
                        </Link>
                      </Button>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            disabled={isDeleting === guide.slug}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                          >
                            {isDeleting === guide.slug ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="bg-white dark:bg-gray-800">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="text-gray-900 dark:text-white">
                              Delete Study Guide
                            </AlertDialogTitle>
                            <AlertDialogDescription className="text-gray-600 dark:text-gray-300">
                              Are you sure you want to delete "{guide.title}"? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600">
                              Cancel
                            </AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(guide.slug, guide.title)}
                              className="bg-red-600 hover:bg-red-700 text-white"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              <Button
                variant="outline"
                onClick={() => fetchGuides(currentPage - 1)}
                disabled={currentPage === 1}
                className="dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600"
              >
                Previous
              </Button>
              <span className="flex items-center px-4 text-gray-600 dark:text-gray-300">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                onClick={() => fetchGuides(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600"
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default GuideList;