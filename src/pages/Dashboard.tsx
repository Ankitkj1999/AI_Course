import React, { useCallback, useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, Sparkles, ArrowRight, BookPlus, FileQuestion, MoreVertical, Share, Trash2, Grid3X3, List } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Link, useNavigate } from 'react-router-dom';
import SEO from '@/components/SEO';
import { appLogo, serverURL, websiteURL } from '@/constants';
import axios from 'axios';
import { Skeleton } from '@/components/ui/skeleton';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import ShareOnSocial from 'react-share-on-social';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import CourseImage from '@/components/CourseImage';
import { Progress } from '@/components/ui/progress';
import { CourseAPI } from '@/services/courseApi';

interface HierarchySection {
  title: string;
  children?: HierarchySection[];
  content?: {
    markdown?: {
      text?: string;
    };
    html?: {
      text?: string;
    };
  };
}

interface HierarchyResponse {
  hierarchy: HierarchySection[];
}

// Helper function to convert new hierarchy format to legacy format
const convertHierarchyToLegacyFormat = (hierarchyData: HierarchyResponse, mainTopic: string): CourseData => {
  const legacyFormat: CourseData = {
    [mainTopic.toLowerCase()]: []
  };

  if (hierarchyData && hierarchyData.hierarchy && Array.isArray(hierarchyData.hierarchy)) {
    legacyFormat[mainTopic.toLowerCase()] = hierarchyData.hierarchy.map((section: HierarchySection) => ({
      title: section.title,
      subtopics: section.children && Array.isArray(section.children) 
        ? section.children.map((child: HierarchySection) => ({
            title: child.title,
            done: false, // Default to not done
            content: child.content?.markdown?.text || child.content?.html?.text || ''
          }))
        : []
    }));
  }

  return legacyFormat;
};

// Type definitions for course content structure
interface CourseSubtopic {
  done?: boolean;
  [key: string]: unknown;
}

interface CourseTopic {
  subtopics?: CourseSubtopic[];
  [key: string]: unknown;
}

interface CourseData {
  [key: string]: CourseTopic[];
}

interface ProgressMap {
  [courseId: string]: number;
}

interface Course {
  _id: string;
  mainTopic: string;
  type: string;
  content?: string | null;
  completed: boolean;
  end: string;
  slug: string;
  photo: string;
  description?: string;
}

const Dashboard = () => {

  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const userId = localStorage.getItem('uid');
  const [courseProgress, setCourseProgress] = useState<Record<string, number>>({});
  const [modules, setTotalModules] = useState<Record<string, number>>({});
  const [lessons, setTotalLessons] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const { toast } = useToast();

  const fetchUserCourses = useCallback(async () => {
    setIsLoading(page === 1);
    setLoadingMore(page > 1);
    const postURL = `${serverURL}/api/courses?userId=${userId}&page=${page}&limit=9`;
    try {
      console.log('Fetching courses from:', postURL);
      const response = await axios.get(postURL);
      console.log('API Response received:', response.data);
      const coursesData = response.data.courses || response.data || [];
      console.log('Courses data length:', coursesData.length);

      if (coursesData.length === 0) {
        setHasMore(false);
      } else {
        const progressMap: ProgressMap = {}; // Create fresh state
        const modulesMap: ProgressMap = {}; // Create fresh state
        const lessonsMap: ProgressMap = {}; // Create fresh state

        // Calculate progress data synchronously to avoid API calls
        coursesData.forEach((course: Course) => {
          try {
            if (!course.content) {
              // For courses without legacy content, set default values
              progressMap[course._id] = 0;
              modulesMap[course._id] = 0;
              lessonsMap[course._id] = 0;
              return;
            }
            
            const jsonData: CourseData = JSON.parse(course.content);
            const mainTopicKey = course.mainTopic.toLowerCase();

            // Count done topics
            let doneCount = 0;
            let totalTopics = 0;
            if (jsonData[mainTopicKey] && Array.isArray(jsonData[mainTopicKey])) {
              jsonData[mainTopicKey].forEach((topic: CourseTopic) => {
                if (topic.subtopics && Array.isArray(topic.subtopics)) {
                  topic.subtopics.forEach((subtopic: CourseSubtopic) => {
                    if (subtopic.done) {
                      doneCount++;
                    }
                    totalTopics++;
                  });
                }
              });
            }
            const completionPercentage = totalTopics > 0 ? Math.round((doneCount / totalTopics) * 100) : 0;
            progressMap[course._id] = completionPercentage;

            // Count modules
            modulesMap[course._id] = jsonData[mainTopicKey] && Array.isArray(jsonData[mainTopicKey]) ? jsonData[mainTopicKey].length : 0;

            // Count lessons
            lessonsMap[course._id] = jsonData[mainTopicKey] && Array.isArray(jsonData[mainTopicKey]) ?
              jsonData[mainTopicKey].reduce((total: number, topic: CourseTopic) => total + (topic.subtopics ? topic.subtopics.length : 0), 0) : 0;

          } catch (error) {
            console.error('Error parsing course content:', error);
            progressMap[course._id] = 0;
            modulesMap[course._id] = 0;
            lessonsMap[course._id] = 0;
          }
        });
        setCourseProgress(progressMap);
        setTotalModules(modulesMap);
        setTotalLessons(lessonsMap);
        setCourses((prevCourses) => {
          const existingIds = new Set(prevCourses.map((course: Course) => course._id));
          const newCourses = coursesData.filter((course: Course) => !existingIds.has(course._id));
          return [...prevCourses, ...newCourses];
        });
        console.log('Courses state updated, isLoading should be false now');
      }
    } catch (error) {
      console.error('API Error:', error);
    } finally {
      console.log('Setting loading states to false');
      setIsLoading(false);
      setLoadingMore(false);
    }
  }, [page, userId]);

  useEffect(() => {
    fetchUserCourses();
  }, [fetchUserCourses]);

  const handleScroll = useCallback(() => {
    if (!hasMore || loadingMore) return;
    const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
    if (scrollTop + clientHeight >= scrollHeight - 100) {
      setPage((prevPage) => prevPage + 1);
    }
  }, [hasMore, loadingMore]);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  function redirectCreate() {
    navigate("/dashboard/generate-course");
  }

  async function redirectCourse(content: string | null, mainTopic: string, type: string, courseId: string, completed: boolean, end: string, slug: string) {
    console.log('🎯 Starting course navigation for:', courseId);
    
    try {
      // Use the new CourseAPI to get course progress
      console.log('📡 Calling CourseAPI.getCourseProgress...');
      const progressResponse = await CourseAPI.getCourseProgress(courseId);
      
      console.log('📊 Progress response received:', progressResponse);
      
      if (progressResponse.success) {
        // Handle both legacy and new architecture courses
        let jsonData: CourseData;
        if (content) {
          // Legacy course with monolithic content
          jsonData = JSON.parse(content);
        } else {
          // New architecture course - fetch hierarchy and convert to legacy format
          try {
            console.log('📡 Fetching course hierarchy for new architecture course...');
            const hierarchyResponse = await fetch(`${serverURL}/api/v2/courses/${courseId}/hierarchy?includeContent=true`);
            const hierarchyData = await hierarchyResponse.json();
            
            if (hierarchyData.success && hierarchyData.hierarchy) {
              // Convert new hierarchy to legacy format
              jsonData = convertHierarchyToLegacyFormat(hierarchyData, mainTopic);
              console.log('🔄 Converted hierarchy to legacy format:', jsonData);
            } else {
              // Fallback to empty structure
              jsonData = {
                [mainTopic.toLowerCase()]: []
              };
            }
          } catch (hierarchyError) {
            console.error('❌ Error fetching course hierarchy:', hierarchyError);
            // Fallback to empty structure
            jsonData = {
              [mainTopic.toLowerCase()]: []
            };
          }
        }
        
        localStorage.setItem('courseId', courseId);
        localStorage.setItem('first', completed.toString());
        localStorage.setItem('jsonData', JSON.stringify(jsonData));
        let ending = '';
        if (completed) ending = end;
        
        const navigationState = {
          jsonData,
          mainTopic: mainTopic.toUpperCase(),
          type: type.toLowerCase(),
          courseId,
          end: ending,
          pass: progressResponse.progress.examPassed,
          lang: progressResponse.language
        };
        
        console.log('🧭 Navigating to course with state:', navigationState);
        
        // Use slug for navigation (consistent with Courses.tsx)
        navigate('/course/' + slug, { state: navigationState });
      } else {
        console.warn('⚠️ Progress API returned success: false, using fallback');
        // Fallback behavior if progress API fails
        let jsonData: CourseData;
        if (content) {
          jsonData = JSON.parse(content);
        } else {
          // New architecture course - try to fetch hierarchy
          try {
            console.log('📡 Fetching course hierarchy for new architecture course (fallback)...');
            const hierarchyResponse = await fetch(`${serverURL}/api/v2/courses/${courseId}/hierarchy?includeContent=true`);
            const hierarchyData = await hierarchyResponse.json();
            
            if (hierarchyData.success && hierarchyData.hierarchy) {
              jsonData = convertHierarchyToLegacyFormat(hierarchyData, mainTopic);
            } else {
              jsonData = {
                [mainTopic.toLowerCase()]: []
              };
            }
          } catch (hierarchyError) {
            console.error('❌ Error fetching course hierarchy (fallback):', hierarchyError);
            jsonData = {
              [mainTopic.toLowerCase()]: []
            };
          }
        }
        
        localStorage.setItem('courseId', courseId);
        localStorage.setItem('first', completed.toString());
        localStorage.setItem('jsonData', JSON.stringify(jsonData));
        let ending = '';
        if (completed) ending = end;
        
        navigate('/course/' + slug, {
          state: {
            jsonData,
            mainTopic: mainTopic.toUpperCase(),
            type: type.toLowerCase(),
            courseId,
            end: ending,
            pass: false,
            lang: 'English'
          }
        });
      }
    } catch (error) {
      console.error('❌ Error getting course progress:', error);
      // Fallback to legacy behavior
      let jsonData: CourseData;
      if (content) {
        try {
          jsonData = JSON.parse(content);
        } catch (parseError) {
          console.error('Error parsing content:', parseError);
          jsonData = {
            [mainTopic.toLowerCase()]: []
          };
        }
      } else {
        // New architecture course - try to fetch hierarchy
        try {
          console.log('📡 Fetching course hierarchy for new architecture course (error fallback)...');
          const hierarchyResponse = await fetch(`${serverURL}/api/v2/courses/${courseId}/hierarchy?includeContent=true`);
          const hierarchyData = await hierarchyResponse.json();
          
          if (hierarchyData.success && hierarchyData.hierarchy) {
            jsonData = convertHierarchyToLegacyFormat(hierarchyData, mainTopic);
          } else {
            jsonData = {
              [mainTopic.toLowerCase()]: []
            };
          }
        } catch (hierarchyError) {
          console.error('❌ Error fetching course hierarchy (error fallback):', hierarchyError);
          jsonData = {
            [mainTopic.toLowerCase()]: []
          };
        }
      }
      
      localStorage.setItem('courseId', courseId);
      localStorage.setItem('first', completed.toString());
      localStorage.setItem('jsonData', JSON.stringify(jsonData));
      let ending = '';
      if (completed) ending = end;
      
      console.log('🔄 Using fallback navigation');
      navigate('/course/' + slug, {
        state: {
          jsonData,
          mainTopic: mainTopic.toUpperCase(),
          type: type.toLowerCase(),
          courseId,
          end: ending,
          pass: false,
          lang: 'English'
        }
      });
    }
  }

  const handleDeleteCourse = async (courseId: string) => {
    setIsLoading(true);
    const postURL = serverURL + '/api/deletecourse';
    const response = await axios.post(postURL, { courseId: courseId });
    if (response.data.success) {
      setIsLoading(false);
      toast({
        title: "Course deleted",
        description: "The course has been deleted successfully.",
      });
      location.reload();
    } else {
      setIsLoading(false);
      toast({
        title: "Error",
        description: "Internal Server Error",
      });
    }
  };




  return (
    <>
      <SEO
        title="My Courses"
        description="View and manage your CourseGenie AI-generated courses"
        keywords="dashboard, courses, learning, education, AI-generated courses"
      />
      <div className="space-y-8 animate-fade-in">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">My Courses</h1>
            <p className="text-muted-foreground mt-1">Continue learning where you left off</p>
          </div>
          <div className="flex items-center gap-3">
            <TooltipProvider>
              <div className="flex items-center border rounded-lg p-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={viewMode === 'grid' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('grid')}
                      className="h-8 px-3"
                    >
                      <Grid3X3 className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Grid View</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={viewMode === 'list' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('list')}
                      className="h-8 px-3"
                    >
                      <List className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>List View</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </TooltipProvider>
            <Button size="lg" className="shadow-md hover:shadow-lg" onClick={() => redirectCreate()}>
              <Sparkles className="mr-2 h-4 w-4" />
              Generate New Course
            </Button>
          </div>
        </div>
        {isLoading ? (
          viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="overflow-hidden border-border/40 bg-card/50">
                  <div className="aspect-[16/10] relative overflow-hidden">
                    <Skeleton className="w-full h-full" />
                  </div>
                  <CardHeader className="pb-3 pt-4">
                    <Skeleton className="w-3/4 h-5 mb-2" />
                    <Skeleton className="w-1/2 h-3" />
                  </CardHeader>
                  <CardContent className="pb-3 pt-0">
                    <Skeleton className="w-full h-1.5 mb-3" />
                    <div className="flex items-center gap-2">
                      <Skeleton className="w-16 h-3" />
                      <Skeleton className="w-16 h-3" />
                    </div>
                  </CardContent>
                  <CardFooter className="pt-0">
                    <Skeleton className="w-full h-8" />
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="overflow-hidden border-border/40 bg-card/50">
                  <div className="flex min-h-[140px]">
                    <div className="w-48">
                      <Skeleton className="w-full h-full" />
                    </div>
                    <div className="flex-1 flex flex-col">
                      <CardHeader className="pb-2 pt-4">
                        <Skeleton className="w-3/4 h-5 mb-2" />
                        <Skeleton className="w-1/2 h-3" />
                      </CardHeader>
                      <CardContent className="pb-3 pt-0 flex-1">
                        <Skeleton className="w-full h-1.5 mb-3" />
                        <div className="flex items-center gap-2">
                          <Skeleton className="w-16 h-3" />
                          <Skeleton className="w-16 h-3" />
                        </div>
                      </CardContent>
                      <CardFooter className="pt-0">
                        <Skeleton className="w-32 h-8" />
                      </CardFooter>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )
        ) : (
          <>
            {courses.length > 0 ? (
              viewMode === 'grid' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {courses.map((course) => (
                    <Card key={course._id} className="group bg-card/50 backdrop-blur-sm border-border/40">
                      <div className="aspect-[16/10] relative overflow-hidden">
                        <CourseImage
                          src={course.photo}
                          alt={course.mainTopic}
                          className="object-cover w-full h-full group-hover:scale-[1.02] transition-transform duration-300"
                        />
                        <div className="absolute top-3 right-3">
                          <Badge variant={course.completed === true ? 'success' : 'secondary'}>
                            {course.completed === true ? 'Completed' : 'In Progress'}
                          </Badge>
                        </div>
                        <div className="absolute top-3 left-3">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7 bg-background/90 backdrop-blur-sm hover:bg-background">
                                <MoreVertical className="h-3.5 w-3.5" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-36">
                              <ShareOnSocial
                                textToShare={localStorage.getItem('mName') + " shared you course on " + course.mainTopic}
                                link={websiteURL + '/shareable?id=' + course._id}
                                linkTitle={localStorage.getItem('mName') + " shared you course on " + course.mainTopic}
                                linkMetaDesc={localStorage.getItem('mName') + " shared you course on " + course.mainTopic}
                                linkFavicon={appLogo}
                                noReferer
                              >
                                <DropdownMenuItem className="text-xs">
                                  <Share className="h-3.5 w-3.5 mr-2" />
                                  Share
                                </DropdownMenuItem>
                              </ShareOnSocial>
                              <DropdownMenuItem onClick={() => handleDeleteCourse(course._id)} className="text-xs">
                                <Trash2 className="h-3.5 w-3.5 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                      <CardHeader className="pb-3 pt-4">
                        <CardTitle className="text-lg leading-tight capitalize line-clamp-1">{course.mainTopic}</CardTitle>
                        <CardDescription className="text-xs capitalize line-clamp-1">{course.type}</CardDescription>
                      </CardHeader>
                      <CardContent className="pb-3 pt-0">
                        <div className="mb-3">
                          <Progress value={courseProgress[course._id] || 0} className="h-1.5" />
                          <p className="text-xs text-muted-foreground mt-1.5">{courseProgress[course._id] || 0}% complete</p>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <div className="flex items-center">
                            <BookOpen className="mr-1 h-3.5 w-3.5" />
                            {modules[course._id] || 0} modules
                          </div>
                          <span>•</span>
                          <span>{lessons[course._id] || 0} lessons</span>
                        </div>
                      </CardContent>
                      <CardFooter className="pt-0">
                        <Button
                          onClick={() => redirectCourse(course.content, course.mainTopic, course.type, course._id, course.completed, course.end, course.slug)}
                          variant="ghost"
                          size="sm"
                          className="w-full bg-accent/10 border border-border/50 group-hover:bg-accent transition-colors justify-between text-xs h-8"
                        >
                          Continue Learning
                          <ArrowRight className="h-3.5 w-3.5 ml-2 group-hover:translate-x-0.5 transition-transform" />
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {courses.map((course) => (
                    <Card key={course._id} className="overflow-hidden hover:shadow-md transition-all duration-200 border-border/40 hover:border-primary/30 group bg-card/50 backdrop-blur-sm">
                      <div className="flex min-h-[140px]">
                        <div className="w-32 sm:w-48 relative overflow-hidden flex-shrink-0">
                          <CourseImage
                            src={course.photo}
                            alt={course.mainTopic}
                            className="object-cover w-full h-full group-hover:scale-[1.02] transition-transform duration-300"
                          />
                        </div>
                        <div className="flex-1 flex flex-col">
                          <CardHeader className="pb-2 pt-4">
                            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between">
                              <div className="flex-1">
                                <CardTitle className="text-lg leading-tight capitalize line-clamp-1">{course.mainTopic}</CardTitle>
                                <CardDescription className="text-xs capitalize mt-1">{course.type}</CardDescription>
                              </div>
                              <div className="flex items-center justify-between w-full sm:w-auto mt-2 sm:mt-0 sm:ml-4 sm:gap-2">
                                  <Badge variant={course.completed === true ? 'success' : 'secondary'}>
                                    {course.completed === true ? 'Completed' : 'In Progress'}
                                  </Badge>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-muted">
                                      <MoreVertical className="h-3.5 w-3.5" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent className="w-36">
                                    <ShareOnSocial
                                      textToShare={localStorage.getItem('mName') + " shared you course on " + course.mainTopic}
                                      link={websiteURL + '/shareable?id=' + course._id}
                                      linkTitle={localStorage.getItem('mName') + " shared you course on " + course.mainTopic}
                                      linkMetaDesc={localStorage.getItem('mName') + " shared you course on " + course.mainTopic}
                                      linkFavicon={appLogo}
                                      noReferer
                                    >
                                      <DropdownMenuItem className="text-xs">
                                        <Share className="h-3.5 w-3.5 mr-2" />
                                        Share
                                      </DropdownMenuItem>
                                    </ShareOnSocial>
                                    <DropdownMenuItem onClick={() => handleDeleteCourse(course._id)} className="text-xs">
                                      <Trash2 className="h-3.5 w-3.5 mr-2" />
                                      Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="pb-3 pt-0 flex-1">
                            <div className="mb-3">
                              <Progress value={courseProgress[course._id] || 0} className="h-1.5" />
                              <p className="text-xs text-muted-foreground mt-1.5">{courseProgress[course._id] || 0}% complete</p>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <div className="flex items-center">
                                <BookOpen className="mr-1 h-3.5 w-3.5" />
                                {modules[course._id] || 0} modules
                              </div>
                              <span>•</span>
                              <span>{lessons[course._id] || 0} lessons</span>
                            </div>
                          </CardContent>
                          <CardFooter className="pt-0">
                            <Button
                              onClick={() => redirectCourse(course.content, course.mainTopic, course.type, course._id, course.completed, course.end, course.slug)}
                              variant="ghost"
                              size="sm"
                              className="bg-accent/10 border border-border/50 group-hover:bg-accent transition-colors justify-between text-xs h-8 px-4"
                            >
                              Continue Learning
                              <ArrowRight className="h-3.5 w-3.5 ml-2 group-hover:translate-x-0.5 transition-transform" />
                            </Button>
                          </CardFooter>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="bg-muted/50 rounded-full p-8 mb-6">
                  <FileQuestion className="h-16 w-16 text-muted-foreground/60" />
                </div>
                <h2 className="text-2xl font-bold mb-2">No Courses Created Yet</h2>
                <p className="text-muted-foreground max-w-md mb-6">
                  You haven't created any courses yet. Generate your first AI-powered course to start learning.
                </p>
                <Button size="lg" className="shadow-lg" asChild>
                  <Link to="/dashboard/generate-course">
                    <BookPlus className="mr-2 h-5 w-5" />
                    Create Your First Course
                  </Link>
                </Button>
              </div>
            )}
            {loadingMore && (
              viewMode === 'grid' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {[1, 2, 3].map((i) => (
                    <Card key={i} className="overflow-hidden border-border/40 bg-card/50">
                      <div className="aspect-[16/10] relative overflow-hidden">
                        <Skeleton className="w-full h-full" />
                      </div>
                      <CardHeader className="pb-3 pt-4">
                        <Skeleton className="w-3/4 h-5 mb-2" />
                        <Skeleton className="w-1/2 h-3" />
                      </CardHeader>
                      <CardContent className="pb-3 pt-0">
                        <Skeleton className="w-full h-1.5 mb-3" />
                        <div className="flex items-center gap-2">
                          <Skeleton className="w-16 h-3" />
                          <Skeleton className="w-16 h-3" />
                        </div>
                      </CardContent>
                      <CardFooter className="pt-0">
                        <Skeleton className="w-full h-8" />
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Card key={i} className="overflow-hidden border-border/40 bg-card/50">
                      <div className="flex min-h-[140px]">
                        <div className="w-48">
                          <Skeleton className="w-full h-full" />
                        </div>
                        <div className="flex-1 flex flex-col">
                          <CardHeader className="pb-2 pt-4">
                            <Skeleton className="w-3/4 h-5 mb-2" />
                            <Skeleton className="w-1/2 h-3" />
                          </CardHeader>
                          <CardContent className="pb-3 pt-0 flex-1">
                            <Skeleton className="w-full h-1.5 mb-3" />
                            <div className="flex items-center gap-2">
                              <Skeleton className="w-16 h-3" />
                              <Skeleton className="w-16 h-3" />
                            </div>
                          </CardContent>
                          <CardFooter className="pt-0">
                            <Skeleton className="w-32 h-8" />
                          </CardFooter>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )
            )}
          </>
        )}

      </div>
    </>
  );
};

export default Dashboard;