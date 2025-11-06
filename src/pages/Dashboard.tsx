// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import React, { useCallback, useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, Users, BookOpen, Sparkles, ArrowRight, BookPlus, FileQuestion, Loader, MoreVertical, Share, Trash2, Grid3X3, List } from 'lucide-react';
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

const Dashboard = () => {

  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const userId = localStorage.getItem('uid');
  const [courseProgress, setCourseProgress] = useState({});
  const [modules, setTotalModules] = useState({});
  const [lessons, setTotalLessons] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const { toast } = useToast();

  function redirectCreate() {
    navigate("/dashboard/generate-course");
  }

  async function redirectCourse(content: string, mainTopic: string, type: string, courseId: string, completed: string, end: string) {
    const postURL = serverURL + '/api/getmyresult';
    const response = await axios.post(postURL, { courseId });
    if (response.data.success) {
      const jsonData = JSON.parse(content);
      localStorage.setItem('courseId', courseId);
      localStorage.setItem('first', completed);
      localStorage.setItem('jsonData', JSON.stringify(jsonData));
      let ending = '';
      if (completed) ending = end;
      navigate('/course/' + courseId, {
        state: {
          jsonData,
          mainTopic: mainTopic.toUpperCase(),
          type: type.toLowerCase(),
          courseId,
          end: ending,
          pass: response.data.message,
          lang: response.data.lang
        }
      });
    } else {
      const jsonData = JSON.parse(content);
      localStorage.setItem('courseId', courseId);
      localStorage.setItem('first', completed);
      localStorage.setItem('jsonData', JSON.stringify(jsonData));
      let ending = '';
      if (completed) ending = end;
      navigate('/course/' + courseId, {
        state: {
          jsonData,
          mainTopic: mainTopic.toUpperCase(),
          type: type.toLowerCase(),
          courseId,
          end: ending,
          pass: false,
          lang: response.data.lang
        }
      });
    }
  }

  const handleDeleteCourse = async (courseId: number) => {
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

  const fetchUserCourses = useCallback(async () => {
    setIsLoading(page === 1);
    setLoadingMore(page > 1);
    const postURL = `${serverURL}/api/courses?userId=${userId}&page=${page}&limit=9`;
    try {
      const response = await axios.get(postURL);
      if (response.data.length === 0) {
        setHasMore(false);
      } else {
        const progressMap = { ...courseProgress }; // Spread existing state
        const modulesMap = { ...modules }; // Spread existing state
        const lessonsMap = { ...lessons }; // Spread existing state
        for (const course of response.data) {
          const progress = await CountDoneTopics(course.content, course.mainTopic, course._id);
          const totalModules = await CountTotalModules(course.content, course.mainTopic);
          const totalLessons = await CountTotalLessons(course.content, course.mainTopic);
          progressMap[course._id] = progress;
          modulesMap[course._id] = totalModules;
          lessonsMap[course._id] = totalLessons;
        }
        setCourseProgress(progressMap);
        setTotalModules(modulesMap);
        setTotalLessons(lessonsMap);
        await setCourses((prevCourses) => [...prevCourses, ...response.data]);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
      setLoadingMore(false);
    }
  }, [userId, page]);

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

  const CountDoneTopics = async (json: string, mainTopic: string, courseId: string) => {
    try {
      const jsonData = JSON.parse(json);
      let doneCount = 0;
      let totalTopics = 0;
      jsonData[mainTopic.toLowerCase()].forEach((topic: { subtopics: string[]; }) => {
        topic.subtopics.forEach((subtopic) => {
          if (subtopic.done) {
            doneCount++;
          }
          totalTopics++;
        });
      });
      const quizCount = await getQuiz(courseId);
      totalTopics = totalTopics + 1;
      if (quizCount) {
        totalTopics = totalTopics - 1;
      }
      const completionPercentage = Math.round((doneCount / totalTopics) * 100);
      return completionPercentage;
    } catch (error) {
      console.error(error);
      return 0;
    }
  }

  const CountTotalModules = async (json: string, mainTopic: string) => {
    try {
      const jsonData = JSON.parse(json);
      return jsonData[mainTopic.toLowerCase()].length;
    } catch (error) {
      console.error(error);
      return 0;
    }
  }

  const CountTotalLessons = async (json: string, mainTopic: string) => {
    try {
      const jsonData = JSON.parse(json);
      return jsonData[mainTopic.toLowerCase()].reduce(
        (total, topic) => total + topic.subtopics.length,
        0
      );
    } catch (error) {
      console.error(error);
      return 0;
    }
  }

  async function getQuiz(courseId: string) {
    const postURL = serverURL + '/api/getmyresult';
    const response = await axios.post(postURL, { courseId });
    if (response.data.success) {
      return response.data.message;
    } else {
      return false;
    }
  }

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
            <h1 className="text-3xl font-bold tracking-tight text-gradient bg-gradient-to-r from-primary to-indigo-500">My Courses</h1>
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
            <Button onClick={() => redirectCreate()} className="shadow-md bg-gradient-to-r from-primary to-indigo-500 hover:from-indigo-500 hover:to-primary hover:shadow-lg transition-all">
              <Sparkles className="mr-2 h-4 w-4" />
              Generate New Course
            </Button>
          </div>
        </div>
        {isLoading ? (
          viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
        )
          :
          <>
            {courses.length > 0 ? (
              viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {courses.map((course) => (
                    <Card key={course._id} className="overflow-hidden hover:shadow-md transition-all duration-200 border-border/40 hover:border-primary/30 group bg-card/50 backdrop-blur-sm">
                      <div className="aspect-[16/10] relative overflow-hidden">
                        <img
                          src={course.photo}
                          alt={course.mainTopic}
                          className="object-cover w-full h-full group-hover:scale-[1.02] transition-transform duration-300"
                        />
                        <div className="absolute top-3 right-3">
                          <Badge variant={course.completed === true ? 'default' : 'secondary'} className="text-xs px-2 py-1">
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
                          <div className="h-1.5 bg-secondary/60 rounded-full">
                            <div
                              className="h-1.5 bg-gradient-to-r from-primary to-indigo-500 rounded-full transition-all duration-300"
                              style={{ width: `${courseProgress[course._id] || 0}%` }}
                            ></div>
                          </div>
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
                          onClick={() => redirectCourse(course.content, course.mainTopic, course.type, course._id, course.completed, course.end)}
                          variant="ghost"
                          size="sm"
                          className="w-full group-hover:bg-primary/5 transition-colors justify-between text-xs h-8"
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
                          <img
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
                                <Badge variant={course.completed === true ? 'default' : 'secondary'} className="text-xs px-2 py-1">
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
                              <div className="h-1.5 bg-secondary/60 rounded-full">
                                <div
                                  className="h-1.5 bg-gradient-to-r from-primary to-indigo-500 rounded-full transition-all duration-300"
                                  style={{ width: `${courseProgress[course._id] || 0}%` }}
                                ></div>
                              </div>
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
                              onClick={() => redirectCourse(course.content, course.mainTopic, course.type, course._id, course.completed, course.end)}
                              variant="ghost"
                              size="sm"
                              className="group-hover:bg-primary/5 transition-colors justify-between text-xs h-8 px-4"
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
        }

      </div>
    </>
  );
};

export default Dashboard;