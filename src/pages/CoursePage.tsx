// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import React, { useEffect, useState, useRef, useCallback } from "react";
import { useParams, Link, useNavigate, useLocation } from "react-router-dom";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Content } from "@tiptap/react";
import { MinimalTiptapEditor } from "../minimal-tiptap";
import YouTube from "react-youtube";
import { Button } from "@/components/ui/button";
import {
  ChevronDown,
  Home,
  Share,
  Download,
  MessageCircle,
  ClipboardCheck,
  Menu,
  Award,
  ChevronLeft,
  ChevronRight,
  X,
  MoreHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getProviderPreferencesWithFallback } from '@/hooks/useProviderPreferences';
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Skeleton } from "@/components/ui/skeleton";
import { useIsMobile } from "@/hooks/use-mobile";
import { appLogo, companyName, serverURL, websiteURL } from "@/constants";
import axios from "axios";
import ShareOnSocial from "react-share-on-social";
import { prepareContentForRendering } from "@/utils/contentHandler";
import StyledText from "@/components/styledText";
import { ContentAttribution } from "@/components/ContentAttribution";
import html2pdf from "html2pdf.js";

const CoursePage = () => {
  //ADDED FROM v4.0
  const { state } = useLocation();
  const { slug: urlSlug } = useParams(); // Changed from courseId to slug

  // Handle navigation from Discover screen - fetch course data if not in state
  const [courseData, setCourseData] = useState(null);
  const [isFetchingCourse, setIsFetchingCourse] = useState(false);

  const jsonData = JSON.parse(localStorage.getItem("jsonData"));
  const [selected, setSelected] = useState("");
  const [theory, setTheory] = useState("");
  const [contentType, setContentType] = useState("html"); // Track content type for proper rendering
  const [media, setMedia] = useState("");
  const [percentage, setPercentage] = useState(0);
  const [isComplete, setIsCompleted] = useState(false);
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [exporting, setExporting] = useState(false);
  const [saving, setSaving] = useState(false);

  // State variables for course data when fetched from server
  const [mainTopic, setMainTopic] = useState(state?.mainTopic || "");
  const [type, setType] = useState(state?.type || "");
  const [courseId, setCourseId] = useState(state?.courseId || "");
  const [courseSlug, setCourseSlug] = useState(urlSlug || "");
  const [end, setEnd] = useState(state?.end || "");
  const [pass, setPass] = useState(state?.pass || false);
  const [lang, setLang] = useState(state?.lang || "english");

  const defaultMessage = `Hey there! I'm your AI teacher. If you have any questions about your ${mainTopic || 'this'} course, whether it's about videos, images, or theory, just ask me. I'm here to clear your doubts.`;
  const defaultPrompt = `I have a doubt about this topic :- ${mainTopic || 'this topic'}. Please clarify my doubt in very short :- `;

  const [isMenuOpen, setIsMenuOpen] = useState(true);
  const [isChatOpen, setIsChatOpen] = useState(true);
  const [isNotesOpen, setIsNotesOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const initializedRef = useRef(false);
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const mainContentRef = useRef<HTMLDivElement>(null);
  const [value, setValue] = useState<Content>("");
  const [activeAccordionItem, setActiveAccordionItem] = useState("");

  const getTotalLessons = () => {
    if (!jsonData || !mainTopic || !jsonData[mainTopic.toLowerCase()]) return 0;
    return jsonData[mainTopic.toLowerCase()].reduce(
      (total, topic) => total + topic.subtopics.length,
      0
    );
  };

  const getCurrentLessonNumber = () => {
    if (!jsonData || !mainTopic || !selected || !jsonData[mainTopic.toLowerCase()]) return 0;
    let lessonNumber = 0;
    let found = false;
    for (const topic of jsonData[mainTopic.toLowerCase()]) {
      for (const subtopic of topic.subtopics) {
        lessonNumber++;
        if (subtopic.title === selected) {
          found = true;
          break;
        }
      }
      if (found) break;
    }
    return lessonNumber;
  };

  const formatTitle = (title = "") => {
    if (!title) return "";
    return title
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  };

  const calculateTopicProgress = (topic) => {
    if (!topic?.subtopics?.length) return 0;
    const doneCount = topic.subtopics.filter((st) => st.done).length;
    return (doneCount / topic.subtopics.length) * 100;
  };

  const getNotes = useCallback(async () => {
    try {
      const postURL = serverURL + "/api/getnotes";
      const response = await axios.post(postURL, { course: courseId });
      if (response.data.success) {
        setValue(response.data.message);
      }
    } catch (error) {
      console.error(error);
    }
  }, [courseId]);

  const handleSaveNote = async () => {
    const postURL = serverURL + "/api/savenotes";
    const response = await axios.post(postURL, {
      course: courseId,
      notes: value,
    });
    if (response.data.success) {
      toast({
        title: "Note saved",
        description: "Your note has been saved successfully.",
      });
    } else {
      toast({
        title: "Error",
        description: "Internal Server Error",
      });
    }
  };

  // Loading skeleton for course content
  const CourseContentSkeleton = () => (
    <div className="space-y-6 animate-pulse">
      <Skeleton className="h-8 w-3/4 mb-8" />

      <div className="space-y-6">
        <div>
          <Skeleton className="h-7 w-1/2 mb-4" />
          <Skeleton className="h-5 w-full mb-2" />
          <Skeleton className="h-5 w-full mb-2" />
          <Skeleton className="h-5 w-3/4" />
        </div>

        <div>
          <Skeleton className="h-7 w-1/3 mb-4" />
          <Skeleton className="h-5 w-full mb-2" />
          <Skeleton className="h-5 w-full mb-2" />
          <Skeleton className="h-5 w-5/6" />
        </div>

        <div>
          <Skeleton className="h-7 w-2/5 mb-4" />
          <Skeleton className="h-5 w-full mb-2" />
          <Skeleton className="h-5 w-full mb-2" />
          <Skeleton className="h-36 w-full rounded-md bg-muted/30" />
        </div>
      </div>
    </div>
  );

  //FROM v4.0
  const opts = {
    height: "390",
    width: "640",
  };

  const optsMobile = {
    height: "250px",
    width: "100%",
  };

  const storeLocal = useCallback(async (messages) => {
    try {
      localStorage.setItem(mainTopic, JSON.stringify(messages));
    } catch (error) {
      console.error(error);
    }
  }, [mainTopic]);

  const loadMessages = useCallback(async () => {
    try {
      const jsonValue = localStorage.getItem(mainTopic);
      if (jsonValue !== null) {
        setMessages(JSON.parse(jsonValue));
      } else {
        const newMessages = [
          ...messages,
          { text: defaultMessage, sender: "bot" },
        ];
        setMessages(newMessages);
        await storeLocal(newMessages);
      }
    } catch (error) {
      console.error(error);
    }
  }, [mainTopic, messages, defaultMessage, storeLocal]);

  // Initial setup effect - runs once on mount
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    loadMessages();
    getNotes();

    // Ensure the page starts at the top when loaded
    if (mainContentRef.current) {
      mainContentRef.current.scrollTop = 0;
    }
    window.scrollTo(0, 0);
  }, [loadMessages, getNotes]);

  // Mobile effect
  useEffect(() => {
    if (isMobile) {
      setIsChatOpen(false);
    }
  }, [isMobile]);

  // Fetch course data if navigating from Discover screen or direct URL
  useEffect(() => {
    const fetchCourseData = async () => {
      // Skip if we already have mainTopic from state
      if (mainTopic) {
        setIsLoading(false);
        return;
      }

      // Determine if we have a slug or ID to fetch
      const identifier = urlSlug;
      if (!identifier) {
        console.log("No identifier found, redirecting to discover");
        navigate("/discover");
        return;
      }

      try {
        setIsFetchingCourse(true);
        console.log("Fetching course data for:", identifier);
        
        // Try fetching by slug first (primary method)
        const response = await fetch(`${serverURL}/api/course/${identifier}`, {
          credentials: 'include'
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log("Course API response:", data);

          if (data.success && data.course) {
            const course = data.course;
            setCourseData(course);
            console.log("Course data fetched:", course);
            
            // Parse the content JSON
            const parsedContent = JSON.parse(course.content);
            localStorage.setItem('jsonData', JSON.stringify(parsedContent));
            localStorage.setItem('courseId', course._id);
            
            // Set all course state
            setMainTopic(course.mainTopic);
            setType(course.type);
            setCourseId(course._id);
            setCourseSlug(course.slug);
            setEnd(course.end || "");
            setLang(course.lang || "english");
            
            // Check if course is completed
            setIsCompleted(course.completed || false);
            
            setIsLoading(false);
          } else {
            console.error("Invalid response structure:", data);
            toast({
              title: "Error",
              description: "Failed to load course data",
              variant: "destructive",
            });
            navigate("/discover");
          }
        } else if (response.status === 403) {
          toast({
            title: "Access Denied",
            description: "This course is private",
            variant: "destructive",
          });
          navigate("/discover");
        } else if (response.status === 404) {
          toast({
            title: "Not Found",
            description: "Course not found",
            variant: "destructive",
          });
          navigate("/discover");
        } else {
          console.error('Failed to fetch course data, status:', response.status);
          toast({
            title: "Error",
            description: "Failed to load course",
            variant: "destructive",
          });
          navigate("/discover");
        }
      } catch (error) {
        console.error('Error fetching course data:', error);
        toast({
          title: "Error",
          description: "Failed to load course",
          variant: "destructive",
        });
        navigate("/discover");
      } finally {
        setIsFetchingCourse(false);
      }
    };

    fetchCourseData();
  }, [mainTopic, urlSlug, navigate, toast]);

  // Main topic validation effect - only redirect if we're not fetching course data
  useEffect(() => {
    console.log("Main topic validation - mainTopic:", mainTopic, "isFetchingCourse:", isFetchingCourse, "urlSlug:", urlSlug);
    // Only redirect if we don't have mainTopic, not fetching, and no slug to fetch
    if (!mainTopic && !isFetchingCourse && !urlSlug) {
      console.log("Navigating to /discover because no mainTopic and no slug to fetch");
      navigate("/discover");
    }
  }, [mainTopic, navigate, isFetchingCourse, urlSlug]);

  // Data processing effect - runs when jsonData changes initially
  useEffect(() => {
    if (!mainTopic || !jsonData || !jsonData[mainTopic.toLowerCase()]) {
      return;
    }

    const mainTopicData = jsonData[mainTopic.toLowerCase()][0];
    if (!mainTopicData || !mainTopicData.subtopics || mainTopicData.subtopics.length === 0) {
      return;
    }

    // Only set initial selection and content if nothing is selected yet
    if (!selected) {
      const firstSubtopic = mainTopicData.subtopics[0];
      
      setSelected(firstSubtopic.title);
      setActiveAccordionItem(mainTopicData.title);

      // Properly prepare content
      const prepared = prepareContentForRendering(
        firstSubtopic.theory,
        firstSubtopic.contentType
      );

      setTheory(prepared.content);
      setContentType(prepared.type);

      if (type === "video & text course") {
        setMedia(firstSubtopic.youtube);
      } else {
        setMedia(firstSubtopic.image);
      }
    }

    setIsLoading(false);
    localStorage.setItem("jsonData", JSON.stringify(jsonData));
  }, [jsonData, mainTopic, type, selected]);

  // Separate effect for counting done topics
  useEffect(() => {
    if (!mainTopic || !jsonData || !jsonData[mainTopic.toLowerCase()]) {
      return;
    }

    const CountDoneTopics = () => {
      let doneCount = 0;
      let totalTopics = 0;

      jsonData[mainTopic.toLowerCase()].forEach((topic) => {
        topic.subtopics.forEach((subtopic) => {
          if (subtopic.done) {
            doneCount++;
          }
          totalTopics++;
        });
      });

      totalTopics = totalTopics + 1;
      if (pass) {
        doneCount = doneCount + 1;
      }

      const completionPercentage = Math.round((doneCount / totalTopics) * 100);
      setPercentage(completionPercentage);
      if (completionPercentage >= 100) {
        setIsCompleted(true);
      }
    };

    CountDoneTopics();
  }, [jsonData, mainTopic, pass]);

  // Completion check effect
  useEffect(() => {
    if (percentage >= 100) {
      setIsCompleted(true);
    }
  }, [percentage]);

  const toggleDoneState = (done) => {
    const { currentTopicIndex, currentSubtopicIndex } =
      findCurrentLessonPosition();
    if (currentTopicIndex !== -1 && currentSubtopicIndex !== -1) {
      jsonData[mainTopic.toLowerCase()][currentTopicIndex].subtopics[
        currentSubtopicIndex
      ].done = done;
      updateCourse();
    }
  };





  const sendMessage = async () => {
    if (newMessage.trim() === "") return;

    const userMessage = { text: newMessage, sender: "user" };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    await storeLocal(updatedMessages);
    setNewMessage("");

    const mainPrompt = defaultPrompt + newMessage;
    const preferences = getProviderPreferencesWithFallback('course');
    const dataToSend = { 
      prompt: mainPrompt,
      provider: preferences.provider,
      model: preferences.model,
      temperature: 0.7
    };
    const url = serverURL + "/api/chat";

    try {
      const response = await axios.post(url, dataToSend, {
        withCredentials: true
      });
      if (response.data.success === false) {
        toast({
          title: "Error",
          description: "Internal Server Error",
        });
      } else {
        const botMessage = { text: response.data.text, sender: "bot" };
        const updatedMessagesWithBot = [...updatedMessages, botMessage];
        setMessages(updatedMessagesWithBot);
        await storeLocal(updatedMessagesWithBot);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Internal Server Error",
      });
      console.error(error);
    }
  };

  const CountDoneTopics = () => {
    let doneCount = 0;
    let totalTopics = 0;

    // Count completed lessons
    jsonData[mainTopic.toLowerCase()].forEach((topic) => {
      topic.subtopics.forEach((subtopic) => {
        if (subtopic.done) {
          doneCount++;
        }
        totalTopics++;
      });
    });

    // Add quiz to total count
    totalTopics = totalTopics + 1;

    // Add quiz to done count if passed
    if (pass) {
      doneCount = doneCount + 1;
    }

    const completionPercentage = Math.round((doneCount / totalTopics) * 100);
    setPercentage(completionPercentage);
    if (completionPercentage >= 100) {
      setIsCompleted(true);
    }
  };

  // Find current lesson position
  const findCurrentLessonPosition = () => {
    if (!mainTopic || !jsonData || !jsonData[mainTopic.toLowerCase()]) {
      return { currentTopicIndex: -1, currentSubtopicIndex: -1 };
    }
    let currentTopicIndex = -1;
    let currentSubtopicIndex = -1;

    jsonData[mainTopic.toLowerCase()].forEach((topic, topicIndex) => {
      topic.subtopics.forEach((subtopic, subtopicIndex) => {
        if (subtopic.title === selected) {
          currentTopicIndex = topicIndex;
          currentSubtopicIndex = subtopicIndex;
        }
      });
    });

    return { currentTopicIndex, currentSubtopicIndex };
  };

  // Check if there's a previous lesson
  const hasPreviousLesson = () => {
    const { currentTopicIndex, currentSubtopicIndex } =
      findCurrentLessonPosition();

    // If we're at the first subtopic of the first topic, there's no previous lesson
    if (currentTopicIndex === 0 && currentSubtopicIndex === 0) {
      return false;
    }

    return true;
  };

  // Check if there's a next lesson or quiz
  const hasNextLesson = () => {
    if (!jsonData || !mainTopic || !jsonData[mainTopic.toLowerCase()]) return false;
    const { currentTopicIndex, currentSubtopicIndex } =
      findCurrentLessonPosition();
    const topics = jsonData[mainTopic.toLowerCase()];

    // If we're at the last subtopic of the last topic, check if quiz is available
    if (currentTopicIndex === topics.length - 1) {
      const lastTopic = topics[currentTopicIndex];
      if (currentSubtopicIndex === lastTopic.subtopics.length - 1) {
        // Return true if quiz is available (not completed yet)
        return !pass;
      }
    }

    return true;
  };

  // Check if we're on the last lesson (should show "Take Quiz" instead of "Next Lesson")
  const isLastLesson = () => {
    if (!jsonData || !mainTopic || !jsonData[mainTopic.toLowerCase()]) return false;
    const { currentTopicIndex, currentSubtopicIndex } =
      findCurrentLessonPosition();
    const topics = jsonData[mainTopic.toLowerCase()];

    if (currentTopicIndex === topics.length - 1) {
      const lastTopic = topics[currentTopicIndex];
      return currentSubtopicIndex === lastTopic.subtopics.length - 1;
    }

    return false;
  };

  // Handle navigation between lessons
  const handleNavigateLesson = (direction) => {
    if (!jsonData || !mainTopic || !jsonData[mainTopic.toLowerCase()]) return;
    const { currentTopicIndex, currentSubtopicIndex } =
      findCurrentLessonPosition();
    const topics = jsonData[mainTopic.toLowerCase()];

    if (direction === "next" && hasNextLesson()) {
      toggleDoneState(true);
      const currentTopic = topics[currentTopicIndex];

      // If we're on the last lesson and quiz is available, go to quiz
      if (isLastLesson() && !pass) {
        redirectExam();
        return;
      }

      // If there are more subtopics in the current topic
      if (currentSubtopicIndex < currentTopic.subtopics.length - 1) {
        const nextSubtopic = currentTopic.subtopics[currentSubtopicIndex + 1];
        handleSelect(currentTopic.title, nextSubtopic.title);
      }
      // Otherwise, move to the first subtopic of the next topic
      else if (currentTopicIndex < topics.length - 1) {
        const nextTopic = topics[currentTopicIndex + 1];
        const firstSubtopic = nextTopic.subtopics[0];
        handleSelect(nextTopic.title, firstSubtopic.title);
      }
    } else if (direction === "prev" && hasPreviousLesson()) {
      const currentTopic = topics[currentTopicIndex];

      // If we're not at the first subtopic of the current topic
      if (currentSubtopicIndex > 0) {
        const prevSubtopic = currentTopic.subtopics[currentSubtopicIndex - 1];
        handleSelect(currentTopic.title, prevSubtopic.title);
      }
      // Otherwise, move to the last subtopic of the previous topic
      else if (currentTopicIndex > 0) {
        const prevTopic = topics[currentTopicIndex - 1];
        const lastSubtopic =
          prevTopic.subtopics[prevTopic.subtopics.length - 1];
        handleSelect(prevTopic.title, lastSubtopic.title);
      }
    }

    // Ensure the page scrolls to the top when navigating
    if (mainContentRef.current) {
      mainContentRef.current.scrollTop = 0;
    }
    window.scrollTo(0, 0);
  };

  const handleSelect = (topics, sub) => {
    setActiveAccordionItem(topics);
    if (!isLoading) {
      const mTopic = jsonData[mainTopic.toLowerCase()].find(
        (topic) => topic.title === topics
      );
      const mSubTopic = mTopic?.subtopics.find(
        (subtopic) => subtopic.title === sub
      );

      if (
        mSubTopic.theory === "" ||
        mSubTopic.theory === undefined ||
        mSubTopic.theory === null
      ) {
        if (type === "video & text course") {
          const query = `${mSubTopic.title} ${mainTopic} in english`;
          setIsLoading(true);
          sendVideo(query, topics, sub, mSubTopic.title);
        } else {
          const prompt = `Strictly in ${lang}, Explain me about this subtopic of ${mainTopic} with examples :- ${mSubTopic.title}. Please Strictly Don't Give Additional Resources And Images.`;
          const promptImage = `Example of ${mSubTopic.title} in ${mainTopic}`;
          setIsLoading(true);
          sendPrompt(prompt, promptImage, topics, sub);
        }
      } else {
        setSelected(mSubTopic.title);

        // Prepare content properly before setting
        const prepared = prepareContentForRendering(
          mSubTopic.theory,
          mSubTopic.contentType
        );

        setTheory(prepared.content);
        setContentType(prepared.type);

        if (type === "video & text course") {
          setMedia(mSubTopic.youtube);
        } else {
          setMedia(mSubTopic.image);
        }
      }
    }
  };

  async function sendPrompt(prompt, promptImage, topics, sub) {
    const preferences = getProviderPreferencesWithFallback('course');
    const dataToSend = {
      prompt: prompt,
      provider: preferences.provider,
      model: preferences.model,
      temperature: 0.7
    };
    try {
      const postURL = serverURL + "/api/generate";
      const res = await axios.post(postURL, dataToSend, {
        withCredentials: true
      });
      const generatedText = res.data.text;
      const contentType = res.data.contentType || "html"; // Default to HTML for backward compatibility
      const htmlContent = generatedText;
      try {
        const parsedJson = htmlContent;
        // Pass content type to sendImage for proper handling
        sendImage(parsedJson, promptImage, topics, sub, contentType);
      } catch (error) {
        console.error(error);
        toast({
          title: "Error",
          description: "Internal Server Error",
        });
        setIsLoading(false);
      }
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Internal Server Error",
      });
      setIsLoading(false);
    }
  }

  async function sendImage(
    parsedJson,
    promptImage,
    topics,
    sub,
    contentType = "html"
  ) {
    const dataToSend = {
      prompt: promptImage,
    };
    try {
      const postURL = serverURL + "/api/image";
      const res = await axios.post(postURL, dataToSend);
      try {
        const generatedText = res.data.url;
        sendData(generatedText, parsedJson, topics, sub, contentType);
      } catch (error) {
        console.error(error);
        toast({
          title: "Error",
          description: "Internal Server Error",
        });
        setIsLoading(false);
      }
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Internal Server Error",
      });
      setIsLoading(false);
    }
  }

  async function sendData(image, theory, topics, sub, contentType = "html") {
    const mTopic = jsonData[mainTopic.toLowerCase()].find(
      (topic) => topic.title === topics
    );
    const mSubTopic = mTopic?.subtopics.find(
      (subtopic) => subtopic.title === sub
    );

    // Prepare the content before storing
    const prepared = prepareContentForRendering(theory, contentType);

    mSubTopic.theory = prepared.content;
    mSubTopic.contentType = prepared.type;
    mSubTopic.image = image;

    setSelected(mSubTopic.title);
    setIsLoading(false);
    setTheory(prepared.content);
    setContentType(prepared.type);

    if (type === "video & text course") {
      setMedia(mSubTopic.youtube);
    } else {
      setMedia(image);
    }

    updateCourse();
  }

  async function sendDataVideo(
    image,
    theory,
    topics,
    sub,
    contentType = "html"
  ) {
    const mTopic = jsonData[mainTopic.toLowerCase()].find(
      (topic) => topic.title === topics
    );
    const mSubTopic = mTopic?.subtopics.find(
      (subtopic) => subtopic.title === sub
    );

    // Prepare the content before storing
    const prepared = prepareContentForRendering(theory, contentType);

    mSubTopic.theory = prepared.content;
    mSubTopic.contentType = prepared.type;
    mSubTopic.youtube = image;

    setSelected(mSubTopic.title);
    setIsLoading(false);
    setTheory(prepared.content);
    setContentType(prepared.type);

    if (type === "video & text course") {
      setMedia(image);
    } else {
      setMedia(mSubTopic.image);
    }

    updateCourse();
  }

  async function updateCourse() {
    CountDoneTopics();
    localStorage.setItem("jsonData", JSON.stringify(jsonData));
    const dataToSend = {
      content: JSON.stringify(jsonData),
      courseId: courseId,
    };
    try {
      const postURL = serverURL + "/api/update";
      await axios.post(postURL, dataToSend);
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Internal Server Error",
      });
      setIsLoading(false);
    }
  }

  async function sendVideo(query, mTopic, mSubTopic, subtop) {
    const dataToSend = {
      prompt: query,
    };
    try {
      const postURL = serverURL + "/api/yt";
      const res = await axios.post(postURL, dataToSend);

      try {
        const generatedText = res.data.url;
        sendTranscript(generatedText, mTopic, mSubTopic, subtop);
      } catch (error) {
        console.error(error);
        toast({
          title: "Error",
          description: "Internal Server Error",
        });
        setIsLoading(false);
      }
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Internal Server Error",
      });
      setIsLoading(false);
    }
  }

  async function sendTranscript(url, mTopic, mSubTopic, subtop) {
    const dataToSend = {
      prompt: url,
    };
    try {
      const postURL = serverURL + "/api/transcript";
      const res = await axios.post(postURL, dataToSend);

      try {
        const generatedText = res.data.url;
        const allText = generatedText.map((item) => item.text);
        const concatenatedText = allText.join(" ");
        const prompt = `Strictly in ${lang}, Summarize this theory in a teaching way :- ${concatenatedText}.`;
        sendSummery(prompt, url, mTopic, mSubTopic);
      } catch (error) {
        console.error(error);
        const prompt = `Strictly in ${lang}, Explain me about this subtopic of ${mainTopic} with examples :- ${subtop}. Please Strictly Don't Give Additional Resources And Images.`;
        sendSummery(prompt, url, mTopic, mSubTopic);
      }
    } catch (error) {
      console.error(error);
      const prompt = `Strictly in ${lang}, Explain me about this subtopic of ${mainTopic} with examples :- ${subtop}.  Please Strictly Don't Give Additional Resources And Images.`;
      sendSummery(prompt, url, mTopic, mSubTopic);
    }
  }

  async function sendSummery(prompt, url, mTopic, mSubTopic) {
    const preferences = getProviderPreferencesWithFallback('course');
    const dataToSend = {
      prompt: prompt,
      provider: preferences.provider,
      model: preferences.model,
      temperature: 0.7
    };
    try {
      const postURL = serverURL + "/api/generate";
      const res = await axios.post(postURL, dataToSend, {
        withCredentials: true
      });
      const generatedText = res.data.text;
      const contentType = res.data.contentType || "html"; // Default to HTML for backward compatibility
      const htmlContent = generatedText;
      try {
        const parsedJson = htmlContent;
        sendDataVideo(url, parsedJson, mTopic, mSubTopic, contentType);
      } catch (error) {
        console.error(error);
        toast({
          title: "Error",
          description: "Internal Server Error",
        });
        setIsLoading(false);
      }
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Internal Server Error",
      });
      setIsLoading(false);
    }
  }

  async function htmlDownload() {
    setExporting(true);
    // Generate the combined HTML content
    if (!jsonData || !mainTopic || !jsonData[mainTopic.toLowerCase()]) return;
    const combinedHtml = await getCombinedHtml(
      mainTopic,
      jsonData[mainTopic.toLowerCase()]
    );

    // Create a temporary div element
    const tempDiv = document.createElement("div");
    tempDiv.style.width = "100%"; // Ensure div is 100% width
    tempDiv.style.height = "100%"; // Ensure div is 100% height
    tempDiv.innerHTML = combinedHtml;
    document.body.appendChild(tempDiv);

    // Create the PDF options
    const options = {
      filename: `${mainTopic}.pdf`,
      image: { type: "jpeg", quality: 1 },
      margin: [15, 15, 15, 15],
      pagebreak: { mode: ["avoid-all", "css", "legacy"] },
      html2canvas: {
        scale: 2,
        logging: false,
        scrollX: 0,
        scrollY: 0,
        useCORS: true,
      },
      jsPDF: { unit: "pt", format: "a4", orientation: "portrait" },
    };

    // Generate the PDF
    html2pdf()
      .from(tempDiv)
      .set(options)
      .save()
      .then(() => {
        // Save the PDF
        document.body.removeChild(tempDiv);
        setExporting(false);
      });
  }

  async function getCombinedHtml(mainTopic, topics) {
    async function toDataUrl(url) {
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        xhr.onload = function () {
          const reader = new FileReader();
          reader.onloadend = function () {
            resolve(reader.result);
          };
          reader.readAsDataURL(xhr.response);
        };

        xhr.onerror = function () {
          reject({
            status: xhr.status,
            statusText: xhr.statusText,
          });
        };

        xhr.open("GET", url);
        xhr.responseType = "blob";
        xhr.send();
      }).catch((error) => {
        console.error(`Failed to fetch image at ${url}:`, error);
        return ""; // Fallback or placeholder
      });
    }

    const topicsHtml = topics
      .map(
        (topic) => `
        <h3 style="font-size: 18pt; font-weight: bold; margin: 0; margin-top: 15px;">${topic.title
          }</h3>
        ${topic.subtopics
            .map(
              (subtopic) => `
            <p style="font-size: 16pt; margin-top: 10px;">${subtopic.title}</p>
        `
            )
            .join("")}
    `
      )
      .join("");

    const theoryPromises = topics.map(async (topic) => {
      const subtopicPromises = topic.subtopics.map(
        async (subtopic, index, array) => {
          const imageUrl =
            type === "text & image course"
              ? await toDataUrl(subtopic.image)
              : ``;
          return `
            <div>
                <p style="font-size: 16pt; margin-top: 20px; font-weight: bold;">
                    ${subtopic.title}
                </p>
                <div style="font-size: 12pt; margin-top: 15px;">
                    ${subtopic.done
              ? `
                            ${type === "text & image course"
                ? imageUrl
                  ? `<img style="margin-top: 10px;" src="${imageUrl}" alt="${subtopic.title} image">`
                  : `<a style="color: #0000FF;" href="${subtopic.image}" target="_blank">View example image</a>`
                : `<a style="color: #0000FF;" href="https://www.youtube.com/watch?v=${subtopic.youtube}" target="_blank" rel="noopener noreferrer">Watch the YouTube video on ${subtopic.title}</a>`
              }
                            <div style="margin-top: 10px;">${subtopic.theory
              }</div>
                        `
              : `<div style="margin-top: 10px;">Please visit ${subtopic.title} topic to export as PDF. Only topics that are completed will be added to the PDF.</div>`
            }
                </div>
            </div>
        `;
        }
      );
      const subtopicHtml = await Promise.all(subtopicPromises);
      return `
            <div style="margin-top: 30px;">
                <h3 style="font-size: 18pt; text-align: center; font-weight: bold; margin: 0;">
                    ${topic.title}
                </h3>
                ${subtopicHtml.join("")}
            </div>
        `;
    });
    const theoryHtml = await Promise.all(theoryPromises);

    return `
    <div class="html2pdf__page-break" 
         style="display: flex; align-items: center; justify-content: center; text-align: center; margin: 0 auto; max-width: 100%; height: 11in;">
        <h1 style="font-size: 30pt; font-weight: bold; margin: 0;">
            ${mainTopic}
        </h1>
    </div>
    <div class="html2pdf__page-break" style="text-align: start; margin-top: 30px; margin-right: 16px; margin-left: 16px;">
        <h2 style="font-size: 24pt; font-weight: bold; margin: 0;">Index</h2>
        <br>
        <hr>
        ${topicsHtml}
    </div>
    <div style="text-align: start; margin-right: 16px; margin-left: 16px;">
        ${theoryHtml.join("")}
    </div>
    `;
  }

  async function redirectExam() {
    if (!isLoading) {
      setIsLoading(true);
      if (!jsonData || !mainTopic || !jsonData[mainTopic.toLowerCase()]) return;
      const mainTopicExam = jsonData[mainTopic.toLowerCase()];
      let subtopicsString = "";
      mainTopicExam.map((topicTemp) => {
        const titleOfSubTopic = topicTemp.title;
        subtopicsString = subtopicsString + " , " + titleOfSubTopic;
      });
      const postURL = serverURL + "/api/aiexam";
      const response = await axios.post(postURL, {
        courseId,
        mainTopic,
        subtopicsString,
        lang,
      }, {
        withCredentials: true
      });
      if (response.data.success) {
        setIsLoading(false);
        const questions = JSON.parse(response.data.message);
        navigate("/course/" + courseId + "/quiz", {
          state: { topic: mainTopic, courseId: courseId, questions: questions },
        });
      } else {
        setIsLoading(false);
        toast({
          title: "Error",
          description: "Internal Server Error",
        });
      }
    }
  }

  const renderTopicsAndSubtopics = (topics) => {
    let subtopicCounter = 0;
    return (
      <Accordion
        type="single"
        collapsible
        className="w-full"
        value={activeAccordionItem}
        onValueChange={setActiveAccordionItem}
      >
        {topics.map((topic, topicIndex) => {
          const progress = calculateTopicProgress(topic);
          const circumference = 2 * Math.PI * 11; // Adjusted for new radius
          const offset = circumference * (1 - progress / 100);
          const isActiveTopic = activeAccordionItem === topic.title;

          return (
            <AccordionItem
              key={topic.title}
              value={topic.title}
              className={cn(
                "border-b",
                isActiveTopic && "bg-accent/50 rounded-md"
              )}
            >
              <AccordionTrigger className="py-2 px-3 text-left hover:bg-accent/50 rounded-md">
                <div className="flex items-center gap-3">
                  <div className="relative size-6 shrink-0">
                    <svg className="absolute h-full w-full -rotate-90">
                      <circle
                        cx="12"
                        cy="12"
                        r="11"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        fill="none"
                        className="text-gray-200 dark:text-gray-700"
                      />
                      <circle
                        cx="12"
                        cy="12"
                        r="11"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        fill="none"
                        className="text-black dark:text-white"
                        style={{
                          strokeDasharray: circumference,
                          strokeDashoffset: offset,
                          transition: "stroke-dashoffset 0.3s",
                        }}
                      />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-gray-800 dark:text-gray-200">
                      {topicIndex + 1}
                    </span>
                  </div>
                  <span className="font-medium">{topic.title}</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pl-4 pb-2">
                {topic.subtopics.map((subtopic) => {
                  subtopicCounter++;
                  const isSelected = subtopic.title === selected;
                  return (
                    <div
                      onClick={() => handleSelect(topic.title, subtopic.title)}
                      key={subtopic.title}
                      className={cn(
                        "flex items-center gap-3 px-4 py-2 rounded-md hover:bg-accent/80 transition-colors cursor-pointer",
                        isSelected && "bg-primary/10 text-primary font-semibold"
                      )}
                    >
                      {subtopic.done ? (
                        <svg
                          className="relative size-5 shrink-0 text-green-500"
                          stroke="currentColor"
                          fill="currentColor"
                          strokeWidth="0"
                          viewBox="0 0 16 16"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zm-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z"></path>
                        </svg>
                      ) : (
                        <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700 text-xs font-medium text-gray-800 dark:text-gray-200">
                          {subtopicCounter}
                        </span>
                      )}
                      <span className="text-sm">{subtopic.title}</span>
                    </div>
                  );
                })}
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    );
  };

  function certificateCheck() {
    if (isComplete) {
      finish();
    } else {
      toast({
        title: "Completion Certificate",
        description: "Complete course to get certificate",
      });
    }
  }

  async function finish() {
    if (localStorage.getItem("first") === "true") {
      if (!end) {
        const today = new Date();
        const formattedDate = today.toLocaleDateString("en-GB");
        navigate("/course/" + courseId + "/certificate", {
          state: { courseTitle: mainTopic, end: formattedDate },
        });
      } else {
        navigate("/course/" + courseId + "/certificate", {
          state: { courseTitle: mainTopic, end: end },
        });
      }
    } else {
      const dataToSend = {
        courseId: courseId,
      };
      try {
        const postURL = serverURL + "/api/finish";
        const response = await axios.post(postURL, dataToSend);
        if (response.data.success) {
          const today = new Date();
          const formattedDate = today.toLocaleDateString("en-GB");
          localStorage.setItem("first", "true");
          localStorage.setItem("courseEndDate", formattedDate);
          sendEmail(formattedDate);
        }
      } catch (error) {
        console.error(error);
      }
    }
  }

  async function sendEmail(formattedDate) {
    const userName = localStorage.getItem("mName");
    const email = localStorage.getItem("email");
    const html = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
                  <meta http-equiv="Content-Type" content="text/html charset=UTF-8" />
                  <html lang="en">
                  
                    <head></head>
                   <div id="__react-email-preview" style="display:none;overflow:hidden;line-height:1px;opacity:0;max-height:0;max-width:0;">Certificate<div>&nbsp;</div>
                   </div>
                  
                    <body style="padding:20px; margin-left:auto;margin-right:auto;margin-top:auto;margin-bottom:auto;background-color:#f6f9fc;font-family:ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, Roboto, &quot;Helvetica Neue&quot;, Arial, &quot;Noto Sans&quot;, sans-serif, &quot;Apple Color Emoji&quot;, &quot;Segoe UI Emoji&quot;, &quot;Segoe UI Symbol&quot;, &quot;Noto Color Emoji&quot;">
                      <table align="center" role="presentation" cellSpacing="0" cellPadding="0" border="0" height="80%" width="100%" style="max-width:37.5em;max-height:80%; margin-left:auto;margin-right:auto;margin-top:80px;margin-bottom:80px;width:465px;border-radius:0.25rem;border-width:1px;background-color:#fff;padding:20px">
                        <tr style="width:100%">
                          <td>
                            <table align="center" border="0" cellPadding="0" cellSpacing="0" role="presentation" width="100%" style="margin-top:32px">
                              <tbody>
                                <tr>
                                  <td><img alt="Vercel" src="${appLogo}" width="40" height="37" style="display:block;outline:none;border:none;text-decoration:none;margin-left:auto;margin-right:auto;margin-top:0px;margin-bottom:0px" /></td>
                                </tr>
                              </tbody>
                            </table>
                            <h1 style="margin-left:0px;margin-right:0px;margin-top:30px;margin-bottom:30px;padding:0px;text-align:center;font-size:24px;font-weight:400;color:rgb(0,0,0)">Completion Certificate </h1>
                            <p style="font-size:14px;line-height:24px;margin:16px 0;color:rgb(0,0,0)">Hello <strong>${userName}</strong>,</p>
                            <p style="font-size:14px;line-height:24px;margin:16px 0;color:rgb(0,0,0)">We are pleased to inform you that you have successfully completed the ${mainTopic} and are now eligible for your course completion certificate. Congratulations on your hard work and dedication throughout the course!</p>
                            <table align="center" border="0" cellPadding="0" cellSpacing="0" role="presentation" width="100%" style="margin-bottom:32px;margin-top:32px;text-align:center">
                              <tbody>
                                <tr>
                                  <td><a href="${websiteURL}" target="_blank" style="p-x:20px;p-y:12px;line-height:100%;text-decoration:none;display:inline-block;max-width:100%;padding:12px 20px;border-radius:0.25rem;background-color: hsl(var(--primary));text-align:center;font-size:12px;font-weight:600;color:hsl(var(--primary-foreground));text-decoration-line:none"><span></span><span style="p-x:20px;p-y:12px;max-width:100%;display:inline-block;line-height:120%;text-decoration:none;text-transform:none;mso-padding-alt:0px;mso-text-raise:9px"><span>Get Certificate</span></a></td>
                                </tr>
                              </tbody>
                            </table>
                            <p style="font-size:14px;line-height:24px;margin:16px 0;color:rgb(0,0,0)">Best,<p target="_blank" style="color:rgb(0,0,0);text-decoration:none;text-decoration-line:none">The <strong>${companyName}</strong> Team</p></p>
                            </td>
                        </tr>
                      </table>
                    </body>
                  
                  </html>`;

    try {
      const postURL = serverURL + "/api/sendcertificate";
      await axios
        .post(postURL, { html, email })
        .then((res) => {
          navigate("/course/" + courseId + "/certificate", {
            state: { courseTitle: mainTopic, end: formattedDate },
          });
        })
        .catch((error) => {
          console.error(error);
          navigate("/course/" + courseId + "/certificate", {
            state: { courseTitle: mainTopic, end: formattedDate },
          });
        });
    } catch (error) {
      console.error(error);
      navigate("/course/" + courseId + "/certificate", {
        state: { courseTitle: mainTopic, end: formattedDate },
      });
    }
  }

  const renderTopicsAndSubtopicsMobile = (topics) => {
    let subtopicCounter = 0;
    return (
      <Accordion
        type="single"
        collapsible
        className="w-full"
        value={activeAccordionItem}
        onValueChange={setActiveAccordionItem}
      >
        {topics.map((topic, topicIndex) => {
          const progress = calculateTopicProgress(topic);
          const circumference = 2 * Math.PI * 11; // Adjusted for new radius
          const offset = circumference * (1 - progress / 100);
          const isActiveTopic = activeAccordionItem === topic.title;

          return (
            <AccordionItem
              key={topic.title}
              value={topic.title}
              className={cn(
                "border-b",
                isActiveTopic && "bg-accent/50 rounded-md"
              )}
            >
              <AccordionTrigger className="py-2 px-3 text-left hover:bg-accent/50 rounded-md">
                <div className="flex items-center gap-3">
                  <div className="relative size-6 shrink-0">
                    <svg className="absolute h-full w-full -rotate-90">
                      <circle
                        cx="12"
                        cy="12"
                        r="11"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        fill="none"
                        className="text-gray-200 dark:text-gray-700"
                      />
                      <circle
                        cx="12"
                        cy="12"
                        r="11"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        fill="none"
                        className="text-black dark:text-white"
                        style={{
                          strokeDasharray: circumference,
                          strokeDashoffset: offset,
                          transition: "stroke-dashoffset 0.3s",
                        }}
                      />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-gray-800 dark:text-gray-200">
                      {topicIndex + 1}
                    </span>
                  </div>
                  <span className="font-medium">{topic.title}</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pl-4 pb-2">
                {topic.subtopics.map((subtopic) => {
                  subtopicCounter++;
                  const isSelected = subtopic.title === selected;
                  return (
                    <div
                      onClick={() => handleSelect(topic.title, subtopic.title)}
                      key={subtopic.title}
                      className={cn(
                        "flex items-center gap-3 px-4 py-2 rounded-md hover:bg-accent/80 transition-colors cursor-pointer",
                        isSelected && "bg-primary/10 text-primary font-semibold"
                      )}
                    >
                      {subtopic.done ? (
                        <svg
                          className="relative size-5 shrink-0 text-green-500"
                          stroke="currentColor"
                          fill="currentColor"
                          strokeWidth="0"
                          viewBox="0 0 16 16"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zm-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z"></path>
                        </svg>
                      ) : (
                        <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700 text-xs font-medium text-gray-800 dark:text-gray-200">
                          {subtopicCounter}
                        </span>
                      )}
                      <span className="text-sm">{subtopic.title}</span>
                    </div>
                  );
                })}
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    );
  };
  // Show loading state while fetching course data
  if (isFetchingCourse) {
    return (
      <div className="flex flex-col h-screen bg-background overflow-hidden">
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading course...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      <header className="border-b border-border/40 py-3 px-4 flex justify-between items-center sticky top-0 z-10 bg-background/95 backdrop-blur-sm">
        {/* Left side - Course info and navigation */}
        <div className="flex items-center gap-4">
          <div className="flex flex-col min-w-0 flex-1 max-w-md">
            <h1 className="text-lg font-bold truncate">{formatTitle(mainTopic)}</h1>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <span>Lesson {getCurrentLessonNumber()} of {getTotalLessons()}</span>
              <span>•</span>
              <span>{jsonData && mainTopic && jsonData[mainTopic.toLowerCase()] ? jsonData[mainTopic.toLowerCase()].length : 0} modules</span>
              <span>•</span>
              <span className="text-green-600 font-semibold">
                {percentage}% complete
              </span>
            </div>
            {/* Progress bar */}
            <div className="w-full bg-secondary/60 rounded-full h-1.5">
              <div
                className="bg-gradient-to-r from-primary to-green-500 h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${percentage}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Right side - Actions */}
        <div className="flex items-center gap-2">
          {/* Primary actions */}
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" asChild className="hidden md:flex">
              <Link to="/dashboard">
                <Home className="h-4 w-4" />
                <span className="hidden sm:inline ml-1">Home</span>
              </Link>
            </Button>

            {isComplete && (
              <Button onClick={certificateCheck} variant="ghost" size="sm" className="hidden md:flex">
                <Award className="h-4 w-4" />
                <span className="hidden sm:inline ml-1">Certificate</span>
              </Button>
            )}
          </div>

          {/* Quick lesson navigation */}
          <div className="hidden lg:flex items-center gap-1 border-r pr-2 mr-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleNavigateLesson("prev")}
                    disabled={!hasPreviousLesson()}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Previous Lesson</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleNavigateLesson("next")}
                    disabled={!hasNextLesson()}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {isLastLesson() && !pass ? "Take Quiz" : "Next Lesson"}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {/* Secondary actions - grouped with tooltips on desktop */}
          <div className="hidden md:flex items-center gap-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm" onClick={() => setIsChatOpen(!isChatOpen)}>
                    <MessageCircle className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Chat Assistant</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm" onClick={() => setIsNotesOpen(true)}>
                    <ClipboardCheck className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Course Notes</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {/* More actions dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="hidden md:flex">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={htmlDownload} disabled={exporting}>
                <Download className="h-4 w-4 mr-2" />
                {exporting ? "Exporting..." : "Export PDF"}
              </DropdownMenuItem>
              <ShareOnSocial
                textToShare={
                  localStorage.getItem("mName") +
                  " shared you course on " +
                  (mainTopic || "this course")
                }
                link={websiteURL + "/shareable?id=" + courseId}
                linkTitle={
                  localStorage.getItem("mName") +
                  " shared you course on " +
                  (mainTopic || "this course")
                }
                linkMetaDesc={
                  localStorage.getItem("mName") +
                  " shared you course on " +
                  (mainTopic || "this course")
                }
                linkFavicon={appLogo}
                noReferer
              >
                <DropdownMenuItem>
                  <Share className="h-4 w-4 mr-2" />
                  Share Course
                </DropdownMenuItem>
              </ShareOnSocial>
              <DropdownMenuSeparator className="md:hidden" />
              <DropdownMenuItem className="md:hidden" onClick={() => setIsChatOpen(true)}>
                <MessageCircle className="h-4 w-4 mr-2" />
                Chat Assistant
              </DropdownMenuItem>
              <DropdownMenuItem className="md:hidden" onClick={() => setIsNotesOpen(true)}>
                <ClipboardCheck className="h-4 w-4 mr-2" />
                Course Notes
              </DropdownMenuItem>
              {!isComplete && (
                <DropdownMenuItem className="md:hidden" onClick={certificateCheck}>
                  <Award className="h-4 w-4 mr-2" />
                  Certificate
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Utility actions */}
          <div className="flex items-center gap-1 border-l pl-2 ml-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="hidden md:flex"
            >
              <Menu className="h-4 w-4" />
            </Button>
            <div className="hidden md:block">
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      <ResizablePanelGroup
        direction="horizontal"
        className="flex-1 overflow-hidden"
      >
        <ResizablePanel
          defaultSize={isChatOpen && !isMobile ? 75 : 100}
          minSize={50}
        >
          <div className="flex h-full">
            <div
              className={cn(
                "bg-sidebar border-r border-border/40 transition-all duration-300 overflow-hidden hidden md:block",
                isMenuOpen ? "w-64" : "w-0"
              )}
            >
              <ScrollArea className="h-full">
                <div className="p-4">
                  {jsonData && mainTopic && jsonData[mainTopic.toLowerCase()] &&
                    renderTopicsAndSubtopicsMobile(
                      jsonData[mainTopic.toLowerCase()]
                    )}
                  <p
                    onClick={redirectExam}
                    className="py-2 text-left px-3 hover:bg-accent/50 rounded-md cursor-pointer normal-case"
                  >
                    {pass === true ? (
                      <span className="mr-2 text-primary">✓</span>
                    ) : (
                      <></>
                    )}
                    {mainTopic ? mainTopic
                      .toLowerCase()
                      .split(" ")
                      .map(
                        (word) => word.charAt(0).toUpperCase() + word.slice(1)
                      )
                      .join(" ") : "Course"}{" "}
                    Quiz
                  </p>
                </div>
              </ScrollArea>
            </div>

            <div className="flex-1 overflow-hidden min-w-0">
              <ScrollArea className="h-full" viewportRef={mainContentRef}>
                <main className="p-6 max-w-5xl mx-auto w-full">
                  {isLoading ? (
                    <CourseContentSkeleton />
                  ) : (
                    <>
                      <div className="flex justify-between items-start mb-6">
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">
                            Lesson {getCurrentLessonNumber()} of{" "}
                            {getTotalLessons()}
                          </p>
                          <h1 className="text-3xl font-bold">{selected}</h1>
                        </div>
                        <div>
                          {jsonData && mainTopic && jsonData[mainTopic.toLowerCase()]
                            .flatMap((topic) => topic.subtopics)
                            .find((subtopic) => subtopic.title === selected)
                            ?.done ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => toggleDoneState(false)}
                            >
                              Mark as Undone
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => toggleDoneState(true)}
                            >
                              Mark as Done
                            </Button>
                          )}
                        </div>
                      </div>
                      <div className="space-y-4">
                        {type === "video & text course" ? (
                          <div>
                            <YouTube
                              key={media}
                              className="mb-5"
                              videoId={media}
                              opts={isMobile ? optsMobile : opts}
                            />
                          </div>
                        ) : (
                          <div>
                            <img
                              className="w-full h-auto rounded-md"
                              src={media}
                              alt="Media"
                            />
                          </div>
                        )}
                        <StyledText
                          text={theory}
                          contentType={contentType}
                          className="mt-6"
                        />
                      </div>

                      {/* Navigation buttons */}
                      <div className="flex justify-between mt-16 mb-32 md:mb-4">
                        <Button
                          variant="outline"
                          onClick={() => handleNavigateLesson("prev")}
                          disabled={!hasPreviousLesson()}
                          className="rounded-full flex items-center gap-2"
                        >
                          <ChevronLeft className="h-4 w-4" /> Previous Lesson
                        </Button>
                        <Button
                          onClick={() => handleNavigateLesson("next")}
                          disabled={!hasNextLesson()}
                          className="rounded-full flex items-center gap-2"
                          variant={isLastLesson() && !pass ? "default" : "outline"}
                        >
                          {isLastLesson() && !pass ? (
                            <>
                              Take Final Quiz <Award className="h-4 w-4 ml-1" />
                            </>
                          ) : (
                            <>
                              Next Lesson <ChevronRight className="h-4 w-4" />
                            </>
                          )}
                        </Button>
                      </div>
                    </>
                  )}
                </main>
              </ScrollArea>
            </div>
          </div>
        </ResizablePanel>

        {isChatOpen && !isMobile && (
          <>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={25} minSize={15}>
              <div className="flex flex-col h-full p-4">
                <div className="flex justify-between items-center border-b pb-2 mb-2">
                  <h2 className="text-lg font-semibold">Course Assistant</h2>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsChatOpen(false)}
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
                <ScrollArea className="flex-1 pr-4 mb-4">
                  <div className="space-y-4 pt-2">
                    {messages.map((message, index) => (
                      <div
                        key={index}
                        className={cn(
                          "flex max-w-[80%] flex-col gap-2 rounded-lg px-3 py-2 text-sm",
                          message.sender === "user"
                            ? "ml-auto bg-primary text-primary-foreground"
                            : "bg-muted"
                        )}
                      >
                        <StyledText text={message.text} />
                      </div>
                    ))}
                  </div>
                </ScrollArea>

                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Type your message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        sendMessage();
                      }
                    }}
                    className="flex-1"
                  />
                  <Button onClick={sendMessage}>Send</Button>
                </div>
              </div>
            </ResizablePanel>
          </>
        )}
      </ResizablePanelGroup>

      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t border-border p-3 flex justify-between items-center">
        {/* Left side - Navigation */}
        <div className="flex items-center gap-2">
          <Drawer>
            <DrawerTrigger asChild>
              <Button variant="ghost" size="sm">
                <Menu className="h-5 w-5" />
              </Button>
            </DrawerTrigger>
            <DrawerContent className="max-h-[80vh]">
              <div className="p-4">
                <h2 className="text-xl font-bold mb-4">Course Content</h2>
                <ScrollArea className="h-[60vh]">
                  <div className="pr-4">
                    {jsonData && mainTopic && jsonData[mainTopic.toLowerCase()] &&
                      renderTopicsAndSubtopics(
                        jsonData[mainTopic.toLowerCase()]
                      )}
                    <p
                      onClick={redirectExam}
                      className="py-2 text-left px-3 hover:bg-accent/50 rounded-md cursor-pointer normal-case"
                    >
                      {pass === true ? (
                        <span className="mr-2 text-primary">✓</span>
                      ) : (
                        <></>
                      )}
                      {mainTopic ? mainTopic : "Course"} Quiz
                    </p>
                  </div>
                </ScrollArea>
              </div>
            </DrawerContent>
          </Drawer>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleNavigateLesson("prev")}
            disabled={!hasPreviousLesson()}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant={isLastLesson() && !pass ? "default" : "ghost"}
            size="sm"
            onClick={() => handleNavigateLesson("next")}
            disabled={!hasNextLesson()}
          >
            {isLastLesson() && !pass ? (
              <Award className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Center - Primary actions */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/dashboard">
              <Home className="h-4 w-4" />
            </Link>
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setIsChatOpen(true)}>
            <MessageCircle className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setIsNotesOpen(true)}>
            <ClipboardCheck className="h-4 w-4" />
          </Button>
        </div>

        {/* Right side - More actions */}
        <Drawer>
          <DrawerTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DrawerTrigger>
          <DrawerContent className="max-h-[80vh]">
            <div className="p-4">
              <h3 className="text-lg font-semibold mb-4">Course Actions</h3>
              <div className="flex flex-col gap-2">
                {isComplete && (
                  <Button
                    onClick={certificateCheck}
                    variant="ghost"
                    className="w-full justify-start"
                  >
                    <Award className="h-4 w-4 mr-2" /> Get Certificate
                  </Button>
                )}
                <Button
                  onClick={htmlDownload}
                  disabled={exporting}
                  variant="ghost"
                  className="w-full justify-start"
                >
                  <Download className="h-4 w-4 mr-2" />
                  {exporting ? "Exporting..." : "Export PDF"}
                </Button>
                <ShareOnSocial
                  textToShare={
                    sessionStorage.getItem("mName") +
                    " shared you course on " +
                    (mainTopic || "this course")
                  }
                  link={websiteURL + "/shareable?id=" + courseId}
                  linkTitle={
                    sessionStorage.getItem("mName") +
                    " shared you course on " +
                    (mainTopic || "this course")
                  }
                  linkMetaDesc={
                    sessionStorage.getItem("mName") +
                    " shared you course on " +
                    (mainTopic || "this course")
                  }
                  linkFavicon={appLogo}
                  noReferer
                >
                  <Button variant="ghost" className="w-full justify-start">
                    <Share className="h-4 w-4 mr-2" /> Share Course
                  </Button>
                </ShareOnSocial>
                <ThemeToggle showLabel variant="ghost" className="w-full" />
              </div>
            </div>
          </DrawerContent>
        </Drawer>
      </div>

      {isMobile && (
        <Sheet open={isChatOpen} onOpenChange={setIsChatOpen}>
          <SheetContent side="bottom" className="h-[90vh] sm:max-w-full p-0">
            <div className="flex flex-col h-full p-4">
              <div className="py-2 px-4 border-b border-border mb-2">
                <h2 className="text-lg font-semibold">Course Assistant</h2>
              </div>
              <ScrollArea className="flex-1 pr-4 mb-4">
                <div className="space-y-4 pt-2 px-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={cn(
                        "flex w-max max-w-[80%] flex-col gap-2 rounded-lg px-3 py-2 text-sm",
                        message.sender === "user"
                          ? "ml-auto bg-primary text-primary-foreground"
                          : "bg-muted"
                      )}
                    >
                      <StyledText text={message.text} />
                    </div>
                  ))}
                </div>
              </ScrollArea>

              <div className="flex items-center gap-2 p-4 border-t border-border">
                <Input
                  placeholder="Type your message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      sendMessage();
                    }
                  }}
                  className="flex-1"
                />
                <Button onClick={sendMessage}>Send</Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      )}

      {isMobile ? (
        <Sheet open={isNotesOpen} onOpenChange={setIsNotesOpen}>
          <SheetContent side="bottom" className="h-[90vh] sm:max-w-full p-0">
            <div className="flex flex-col h-full p-4">
              <div className="py-2 px-4 border-b border-border mb-2">
                <h2 className="text-lg font-semibold">Course Notes</h2>
              </div>
              <ScrollArea className="flex-1 pr-4 mb-4">
                <div className="space-y-4 pt-2 px-4">
                  <MinimalTiptapEditor
                    value={value}
                    onChange={setValue}
                    className="w-full"
                    editorContentClassName="p-5"
                    output="html"
                    placeholder="No notes yet. Start taking notes for this course."
                    autofocus={true}
                    editable={true}
                    editorClassName="focus:outline-none"
                  />
                </div>
              </ScrollArea>

              <div className="p-4 border-t border-border">
                <div className="flex justify-end">
                  <Button disabled={saving} onClick={handleSaveNote}>
                    {saving ? "Saving..." : "Save Note"}
                  </Button>
                </div>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      ) : (
        <Dialog open={isNotesOpen} onOpenChange={setIsNotesOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogTitle>Course Notes</DialogTitle>
            <div className="flex flex-col h-[60vh]">
              <ScrollArea className="flex-1 pr-4 mb-4">
                <div className="space-y-4 pt-2">
                  <MinimalTiptapEditor
                    value={value}
                    onChange={setValue}
                    className="w-full"
                    editorContentClassName="p-5"
                    output="html"
                    placeholder="No notes yet. Start taking notes for this course."
                    autofocus={true}
                    editable={true}
                    editorClassName="focus:outline-none"
                  />
                </div>
              </ScrollArea>

              <div>
                <div className="flex justify-end">
                  <Button disabled={saving} onClick={handleSaveNote}>
                    {saving ? "Saving..." : "Save Note"}
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default CoursePage;
