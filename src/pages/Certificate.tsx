import React, { useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Award, Download, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import SEO from '@/components/SEO';
import certificate from '../res/certificate.png';
import logo from '../res/logo.svg';
import { toPng } from 'html-to-image';
import { appName, serverURL } from '@/constants';
import axios from 'axios';

const Certificate = () => {

  const navigate = useNavigate();
  const { toast } = useToast();
  const [processing, setProcessing] = useState(false);
  const userName = localStorage.getItem('mName');
  const { state } = useLocation();
  const { courseId } = useParams();
  const [courseData, setCourseData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch course data from API
  const fetchCourseFromAPI = async () => {
    try {
      const userId = localStorage.getItem('uid');
      if (!courseId) {
        throw new Error('Missing course ID');
      }
      
      if (!userId) {
        console.warn('No user ID found in session storage');
        // Still try to fetch without user ID or use a different approach
        throw new Error('User not authenticated');
      }

      // Try to fetch course data from API
      let response;
      
      if (userId) {
        // If user is authenticated, use the user-specific endpoint
        response = await axios.get(`${serverURL}/api/courses?userId=${userId}`);
      } else {
        // If no user ID, try to get course info from a public endpoint or different approach
        // For now, we'll create a fallback with the courseId
        response = await axios.get(`${serverURL}/api/course/${courseId}`);
      }
      
      if (response.data) {
        let course;
        
        if (Array.isArray(response.data)) {
          // Find the specific course by ID (from user courses endpoint)
          course = response.data.find(c => c._id === courseId);
        } else if (response.data.course) {
          // Single course response (from public endpoint)
          course = response.data.course;
        } else {
          course = response.data;
        }
        
        if (course) {
          // Parse course content to get main topic
          const jsonData = JSON.parse(course.content);
          const mainTopic = Object.keys(jsonData)[0];
          
          setCourseData({
            courseTitle: mainTopic,
            end: course.end || new Date().toLocaleDateString("en-GB")
          });
        } else {
          throw new Error('Course not found');
        }
      } else {
        throw new Error('Invalid API response');
      }
    } catch (error) {
      console.error('Error fetching course data:', error);
      // Fallback to generic data
      setCourseData({
        courseTitle: 'Course',
        end: new Date().toLocaleDateString("en-GB")
      });
    } finally {
      setLoading(false);
    }
  };

  // Get data from navigation state or fetch from session/API
  const getCourseData = async () => {
    if (state?.courseTitle && state?.end) {
      // Data available from navigation state
      setCourseData({
        courseTitle: state.courseTitle,
        end: state.end
      });
      setLoading(false);
    } else {
      // Try to get data from session storage first
      const jsonData = localStorage.getItem('jsonData');
      const storedEnd = localStorage.getItem('courseEndDate');
      
      if (jsonData) {
        try {
          const parsed = JSON.parse(jsonData);
          const mainTopic = Object.keys(parsed)[0];
          
          setCourseData({
            courseTitle: mainTopic,
            end: storedEnd || new Date().toLocaleDateString("en-GB")
          });
          setLoading(false);
          return;
        } catch (error) {
          console.error('Error parsing session data:', error);
        }
      }
      
      // Check if user is authenticated before making API call
      const userId = localStorage.getItem('uid');
      if (userId && courseId) {
        // If user is authenticated, try to fetch from API
        await fetchCourseFromAPI();
      } else {
        // If not authenticated or no courseId, show generic certificate
        console.warn('No authentication or course data available, showing generic certificate');
        setCourseData({
          courseTitle: 'Course Completion',
          end: new Date().toLocaleDateString("en-GB")
        });
        setLoading(false);
      }
    }
  };

  React.useEffect(() => {
    getCourseData();
  }, [state, courseId]);

  const pdfRef = useRef(null);

  const handleDownload = async () => {
    setProcessing(true);
    toPng(pdfRef.current, { cacheBust: false })
      .then((dataUrl) => {
        const link = document.createElement("a");
        link.download = "certificate.png";
        link.href = dataUrl;
        link.click();
        toast({
          title: "Certificate Downloaded",
          description: "Your certificate has been downloaded successfully.",
        });
        setProcessing(false);
      })
      .catch((err) => {
        //DO NOTHING
        setProcessing(false);
      });
  };

  function isValidFormat(dateString) {
    // Regex to check if date is in D/M/YYYY format (DD/MM/YYYY)
    const regex = /^([0-2]?[0-9]|3[01])\/([1-9]|1[0-2])\/\d{4}$/;
    return regex.test(dateString);
  }

  function formatDateToMDYY(dateString) {
    try {
      // If the date is already in DD/MM/YYYY format, parse it correctly
      if (isValidFormat(dateString)) {
        const [day, month, year] = dateString.split('/');
        return `${month}/${day}/${year.slice(-2)}`;
      }
      
      // Parse the ISO date string directly into a Date object
      const dateObj = new Date(dateString);

      // Handle invalid date scenarios
      if (isNaN(dateObj.getTime())) {
        // Return current date as fallback
        const today = new Date();
        const month = today.getMonth() + 1;
        const day = today.getDate();
        const year = today.getFullYear().toString().slice(-2);
        return `${month}/${day}/${year}`;
      }

      // Format the date to M/D/YY (using local date components)
      const monthFormatted = dateObj.getMonth() + 1; // Months are 0-indexed
      const dayFormatted = dateObj.getDate();
      const yearFormatted = dateObj.getFullYear().toString().slice(-2); // Last two digits

      return `${monthFormatted}/${dayFormatted}/${yearFormatted}`;
    } catch (error) {
      console.error('Date formatting error:', error);
      // Return current date as fallback
      const today = new Date();
      const month = today.getMonth() + 1;
      const day = today.getDate();
      const year = today.getFullYear().toString().slice(-2);
      return `${month}/${day}/${year}`;
    }
  }
  
  function checkAndFormatDate(dateString) {
    if (!dateString) {
      // Return current date if no date provided
      const today = new Date();
      const month = today.getMonth() + 1;
      const day = today.getDate();
      const year = today.getFullYear().toString().slice(-2);
      return `${month}/${day}/${year}`;
    }
    
    return formatDateToMDYY(dateString);
  }


  if (loading) {
    return (
      <div className="min-h-screen bg-background py-12 px-4 sm:px-6 flex flex-col items-center justify-center">
        <div className="text-center">
          <Award className="h-16 w-16 mx-auto text-primary mb-4 animate-pulse" />
          <p className="text-muted-foreground">Loading your certificate...</p>
        </div>
      </div>
    );
  }

  if (!courseData) {
    return (
      <div className="min-h-screen bg-background py-12 px-4 sm:px-6 flex flex-col items-center justify-center">
        <div className="text-center">
          <Award className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-2xl font-bold mb-2">Certificate Not Found</h2>
          <p className="text-muted-foreground mb-4">Unable to load certificate data.</p>
          <Button onClick={() => navigate('/dashboard')}>
            Return to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEO
        title={`${courseData.courseTitle} Course Certificate`}
        description={`Congratulations on completing the ${courseData.courseTitle} course. Download your certificate of completion.`}
        keywords={`certificate, ${courseData.courseTitle}, course completion, online learning, achievement`}
      />
      <div className="min-h-screen bg-background py-12 px-4 sm:px-6 flex flex-col items-center justify-center">
        <Card className="w-full max-w-3xl shadow-lg">
          <CardContent className="p-0">
            <div className="text-center p-8 border-b relative overflow-hidden">
              <div className="absolute inset-0 bg-primary/5 z-0"></div>
              <Award className="h-16 w-16 mx-auto text-primary mb-4 relative z-10" />
              <h2 className="text-3xl font-bold mb-2 relative z-10">Congratulations!</h2>
              <p className="text-muted-foreground relative z-1 capitalize">
                You've successfully completed the {courseData.courseTitle} course.
              </p>
            </div>

            <div className={cn(
              "border-8 border-muted m-6 relative",
              "bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))]",
              "from-background via-background/95 to-background/90",
              "h-full"
            )}>
              <div className='w-full'>
                <div ref={pdfRef}>
                  <img src={certificate} className="w-full h-full" alt="logo" />
                  <p className='absolute text-3xl font-black italic max-lg:text-2xl max-md:text-lg' style={{ top: '47%', left: '50%', transform: 'translate(-50%, -50%)' }}>
                    {localStorage.getItem('mName')}
                  </p>
                  <p className='absolute text-xs font-medium max-md:text-[8px]' style={{ color: '#0f4bac', top: '63.5%', left: '50%', transform: 'translate(-50%, -50%)' }}>
                    on {checkAndFormatDate(courseData.end)}
                  </p>
                  <div className='absolute' style={{ top: '59%', left: '50%', transform: 'translate(-50%, -50%)' }}>
                    <p className='text-base font-bold capitalize max-md:text-[8px]'>
                      {courseData.courseTitle}
                    </p>
                  </div>
                  <div className='absolute rounded-md bg-primary max-lg:h-7 max-lg:w-7 h-10 w-10 flex items-center justify-center' style={{ top: '83%', left: '50%', transform: 'translate(-50%, -50%)' }}>
                    <img className='h-6 w-6 max-lg:h-4 max-lg:w-4' src={logo} />
                  </div>
                  <p style={{ top: '92%', left: '50%', transform: 'translate(-50%, -50%)' }} className='absolute text-xs justify-center self-center text-center font-semibold max-lg:text-xs max-md:text-[8px]'>
                    {appName}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 flex flex-col sm:flex-row justify-between items-center gap-4">
              <Button
                variant="outline"
                onClick={() => window.history.back()}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Course
              </Button>

              <Button onClick={handleDownload}>
                <Download className="mr-2 h-4 w-4" />
                {processing ? 'Downloading...' : 'Download Certificate'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default Certificate;
