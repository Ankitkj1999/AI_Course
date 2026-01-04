import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
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
  Globe,
  Lock,
  GitFork
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
import { Skeleton } from '@/components/ui/skeleton';

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
    } catch (error: unknown) {
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
    } catch (error: unknown) {
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
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              My Study Guides
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage and access your comprehensive study guides
            </p>
          </div>
          <Button asChild>
            <Link to="/dashboard/create-guide">
              <Plus className="mr-2 h-4 w-4" />
              Create New
            </Link>
          </Button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="overflow-hidden border-border/40 bg-card/50">
              <CardHeader className="pb-3 pt-4">
                <div className="flex justify-between items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <Skeleton className="w-3/4 h-5 mb-2" />
                    <Skeleton className="w-1/2 h-3" />
                  </div>
                  <Skeleton className="h-5 w-5 rounded" />
                </div>
              </CardHeader>
              <CardContent className="pb-3 pt-0">
                <div className="flex flex-wrap gap-1 mb-3">
                  <Skeleton className="w-16 h-5 rounded-full" />
                  <Skeleton className="w-20 h-5 rounded-full" />
                </div>
                <div className="flex items-center gap-3 mb-4">
                  <Skeleton className="w-12 h-3" />
                  <Skeleton className="w-16 h-3" />
                </div>
                <Skeleton className="w-16 h-5 rounded-full" />
              </CardContent>
              <CardFooter className="pt-0 flex gap-2">
                <Skeleton className="flex-1 h-8" />
                <Skeleton className="h-8 w-8" />
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            My Study Guides
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage and access your comprehensive study guides
          </p>
        </div>
        <Button asChild>
          <Link to="/dashboard/create-guide">
            <Plus className="mr-2 h-4 w-4" />
            Create New
          </Link>
        </Button>
      </div>

      {guides.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">
              No study guides yet
            </h3>
            <p className="text-muted-foreground mb-6">
              Create your first study guide to start learning!
            </p>
            <Button asChild>
              <Link to="/dashboard/create-guide">
                <Plus className="mr-2 h-4 w-4" />
                Create Study Guide
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {guides.map((guide) => (
              <Card key={guide._id} className="group bg-card/50 backdrop-blur-sm border-border/40 flex flex-col">
                <CardHeader className="pb-3 pt-4">
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg leading-tight line-clamp-2">{guide.title}</CardTitle>
                      <CardDescription className="text-xs mt-1 line-clamp-1">{guide.keyword}</CardDescription>
                    </div>
                    <BookOpen className="h-5 w-5 text-primary shrink-0" />
                  </div>
                </CardHeader>
                <CardContent className="pb-3 pt-0 flex-1 flex flex-col">
                  <div className="space-y-3 flex-1">
                    {guide.relatedTopics && guide.relatedTopics.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {guide.relatedTopics.slice(0, 2).map((topic, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {topic}
                          </Badge>
                        ))}
                        {guide.relatedTopics.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{guide.relatedTopics.length - 2}
                          </Badge>
                        )}
                      </div>
                    )}

                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Eye className="h-3.5 w-3.5" />
                        {guide.viewCount}
                      </div>
                      <span>•</span>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {formatDate(guide.createdAt)}
                      </div>
                      {guide.isPublic && guide.forkCount > 0 && (
                        <>
                          <span>•</span>
                          <div className="flex items-center gap-1">
                            <GitFork className="h-3.5 w-3.5" />
                            {guide.forkCount}
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-4">
                    {guide.isPublic !== undefined && (
                      <Badge 
                        variant={guide.isPublic ? 'success' : 'secondary'} 
                        className="text-xs"
                      >
                        {guide.isPublic ? (
                          <>
                            <Globe className="h-3 w-3 mr-1" />
                            Public
                          </>
                        ) : (
                          <>
                            <Lock className="h-3 w-3 mr-1" />
                            Private
                          </>
                        )}
                      </Badge>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="pt-0 flex gap-2">
                  <Button asChild variant="outline" size="sm" className="flex-1 bg-accent/10 border border-border/50 group-hover:bg-accent transition-colors text-xs h-8">
                    <Link to={`/dashboard/guide/${guide.slug}`}>
                      <ExternalLink className="mr-2 h-3.5 w-3.5" />
                      Read Guide
                    </Link>
                  </Button>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={isDeleting === guide.slug}
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        {isDeleting === guide.slug ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          Delete Study Guide
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete "{guide.title}"? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>
                          Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(guide.slug, guide.title)}
                          className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </CardFooter>
              </Card>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              <Button
                variant="outline"
                onClick={() => fetchGuides(currentPage - 1)}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <span className="flex items-center px-4 text-muted-foreground">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                onClick={() => fetchGuides(currentPage + 1)}
                disabled={currentPage === totalPages}
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