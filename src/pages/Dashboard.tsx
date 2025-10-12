// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import React, { useCallback, useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, Users, BookOpen, Sparkles, ArrowRight, BookPlus, FileQuestion, Loader, MoreVertical, Share, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Link, useNavigate } from 'react-router-dom';
import SEO from '@/components/SEO';
import { appLogo, serverURL, websiteURL } from '@/constants';
import axios from 'axios';
import { Skeleton } from '@/components/ui/skeleton';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import ShareOnSocial from 'react-share-on-social';

const Dashboard = () => {

  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const userId = sessionStorage.getItem('uid');
  const [courseProgress, setCourseProgress] = useState({});
  const [modules, setTotalModules] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  function redirectCreate() {
    navigate("/dashboard/generate-course");
  }

  async function redirectCourse(content: string, mainTopic: string, type: string, courseId: string, completed: string, end: string) {
    const postURL = serverURL + '/api/getmyresult';
    const response = await axios.post(postURL, { courseId });
    if (response.data.success) {
      const jsonData = JSON.parse(content);
      sessionStorage.setItem('courseId', courseId);
      sessionStorage.setItem('first', completed);
      sessionStorage.setItem('jsonData', JSON.stringify(jsonData));
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
      sessionStorage.setItem('courseId', courseId);
      sessionStorage.setItem('first', completed);
      sessionStorage.setItem('jsonData', JSON.stringify(jsonData));
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
        for (const course of response.data) {
          const progress = await CountDoneTopics(course.content, course.mainTopic, course._id);
          const totalModules = await CountTotalTopics(course.content, course.mainTopic, course._id);
          progressMap[course._id] = progress;
          modulesMap[course._id] = totalModules;
        }
        setCourseProgress(progressMap);
        setTotalModules(modulesMap);
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

  const CountTotalTopics = async (json: string, mainTopic: string, courseId: string) => {
    try {
      const jsonData = JSON.parse(json);
      let totalTopics = 0;
      jsonData[mainTopic.toLowerCase()].forEach((topic: { subtopics: string[]; }) => {
        topic.subtopics.forEach((subtopic) => {
          totalTopics++;
        });
      });
      return totalTopics;
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
          <Button onClick={() => redirectCreate()} className="shadow-md  bg-gradient-to-r from-primary to-indigo-500 hover:from-indigo-500 hover:to-primary hover:shadow-lg transition-all">
            <Sparkles className="mr-2 h-4 w-4" />
            Generate New Course
          </Button>
        </div>
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="overflow-hidden border-border/50">
                <div className="aspect-video relative overflow-hidden">
                  <Skeleton className="w-full h-full" />
                </div>
                <CardHeader className="pb-2">
                  <Skeleton className="w-3/4 h-6 mb-2" />
                  <Skeleton className="w-full h-4" />
                </CardHeader>
                <CardContent className="pb-2">
                  <Skeleton className="w-full h-2 mb-4" />
                  <div className="flex items-center justify-between">
                    <Skeleton className="w-1/4 h-4" />
                    <Skeleton className="w-1/4 h-4" />
                    <Skeleton className="w-1/4 h-4" />
                  </div>
                </CardContent>
                <CardFooter>
                  <Skeleton className="w-full h-10" />
                </CardFooter>
              </Card>
            ))}
          </div>
        )
          :
          <>
            {courses.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {courses.map((course) => (
                  <Card key={course._id} className="overflow-hidden hover:shadow-lg transition-all duration-300 border-border/50 hover:border-primary/20 group">
                    <div className="aspect-video relative overflow-hidden">
                      <img
                        src={course.photo}
                        alt={course.mainTopic}
                        className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute top-2 right-2">
                        <Badge variant={course.status === 'Completed' ? 'destructive' : 'secondary'}>
                          {course.completed === true ? 'Completed' : 'Pending'}
                        </Badge>
                      </div>
                      <div className="absolute top-2 left-2">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 bg-background/80 backdrop-blur-sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="w-40">
                            <ShareOnSocial
                              textToShare={sessionStorage.getItem('mName') + " shared you course on " + course.mainTopic}
                              link={websiteURL + '/shareable?id=' + course._id}
                              linkTitle={sessionStorage.getItem('mName') + " shared you course on " + course.mainTopic}
                              linkMetaDesc={sessionStorage.getItem('mName') + " shared you course on " + course.mainTopic}
                              linkFavicon={appLogo}
                              noReferer
                            >
                              <DropdownMenuItem>
                                <Share className="h-4 w-4 mr-2" />
                                Share
                              </DropdownMenuItem>
                            </ShareOnSocial>
                            <DropdownMenuItem onClick={() => handleDeleteCourse(course._id)}>
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xl leading-tight capitalize">{course.mainTopic}</CardTitle>
                      <CardDescription className="line-clamp-2 capitalize">{course.type}</CardDescription>
                    </CardHeader>
                    <CardContent className="pb-2">
                      <div className="mb-3">
                        <div className="h-2 bg-secondary rounded-full">
                          <div
                            className="h-2 bg-gradient-to-r from-primary to-indigo-500 rounded-full"
                            style={{ width: `${courseProgress[course._id] || 0}%` }}
                          ></div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{courseProgress[course._id] || 0}% complete</p>
                      </div>
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <div className="flex items-center">
                          <BookOpen className="mr-1 h-4 w-4" />
                          {modules[course._id] || 0} modules
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button
                        onClick={() => redirectCourse(course.content, course.mainTopic, course.type, course._id, course.completed, course.end)}
                        variant="ghost"
                        className="w-full group-hover:bg-primary/10 transition-colors justify-between"
                        asChild
                      >
                        <div>
                          Continue Learning
                          <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="overflow-hidden border-border/50">
                    <div className="aspect-video relative overflow-hidden">
                      <Skeleton className="w-full h-full" />
                    </div>
                    <CardHeader className="pb-2">
                      <Skeleton className="w-3/4 h-6 mb-2" />
                      <Skeleton className="w-full h-4" />
                    </CardHeader>
                    <CardContent className="pb-2">
                      <Skeleton className="w-full h-2 mb-4" />
                      <div className="flex items-center justify-between">
                        <Skeleton className="w-1/4 h-4" />
                        <Skeleton className="w-1/4 h-4" />
                        <Skeleton className="w-1/4 h-4" />
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Skeleton className="w-full h-10" />
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </>
        }

      </div>
    </>
  );
};

export default Dashboard;