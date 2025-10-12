// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@/components/ui/accordion';
import { Content } from '@tiptap/react'
import { MinimalTiptapEditor } from '../minimal-tiptap'
import YouTube from 'react-youtube';
import { Button } from '@/components/ui/button';
import { ChevronDown, Home, Share, Download, MessageCircle, ClipboardCheck, Menu, Award } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Drawer, DrawerContent, DrawerTrigger } from '@/components/ui/drawer';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Skeleton } from '@/components/ui/skeleton';
import { useIsMobile } from '@/hooks/use-mobile';
import { appLogo, companyName, serverURL, websiteURL } from '@/constants';
import axios from 'axios';
import ShareOnSocial from 'react-share-on-social';
import StyledText from '@/components/styledText';
import html2pdf from 'html2pdf.js';

const CoursePage = () => {

  //ADDED FROM v4.0
  const { state } = useLocation();
  const { mainTopic, type, courseId, end, pass, lang } = state || {};
  const jsonData = JSON.parse(sessionStorage.getItem('jsonData'));
  const [selected, setSelected] = useState('');
  const [theory, setTheory] = useState('');
  const [media, setMedia] = useState('');
  const [percentage, setPercentage] = useState(0);
  const [isComplete, setIsCompleted] = useState(false);
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [exporting, setExporting] = useState(false);
  const [saving, setSaving] = useState(false);
  const defaultMessage = `<p>Hey there! I'm your AI teacher. If you have any questions about your ${mainTopic} course, whether it's about videos, images, or theory, just ask me. I'm here to clear your doubts.</p>`;
  const defaultPrompt = `I have a doubt about this topic :- ${mainTopic}. Please clarify my doubt in very short :- `;

  const [isMenuOpen, setIsMenuOpen] = useState(true);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isNotesOpen, setIsNotesOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const mainContentRef = useRef<HTMLDivElement>(null);
  const [value, setValue] = useState<Content>('')

  async function getNotes() {
    try {
      const postURL = serverURL + '/api/getnotes';
      const response = await axios.post(postURL, { course: courseId });
      if (response.data.success) {
        setValue(response.data.message);
      }
    } catch (error) {
      console.error(error)
    }
  }

  const handleSaveNote = async () => {
    const postURL = serverURL + '/api/savenotes';
    const response = await axios.post(postURL, { course: courseId, notes: value });
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
    height: '390',
    width: '640',
  };

  const optsMobile = {
    height: '250px',
    width: '100%',
  };
  useEffect(() => {
    loadMessages()
    getNotes()
    // Ensure the page starts at the top when loaded
    if (mainContentRef.current) {
      mainContentRef.current.scrollTop = 0;
    }

    // Ensure window also scrolls to top
    window.scrollTo(0, 0);
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
      if (completionPercentage >= '100') {
        setIsCompleted(true);
      }
    }

    if (!mainTopic) {
      navigate("/create");
    } else {
      if (percentage >= '100') {
        setIsCompleted(true);
      }

      const mainTopicData = jsonData[mainTopic.toLowerCase()][0];
      const firstSubtopic = mainTopicData.subtopics[0];
      firstSubtopic.done = true
      setSelected(firstSubtopic.title)
      setTheory(firstSubtopic.theory);

      if (type === 'video & text course') {
        setMedia(firstSubtopic.youtube);
      } else {
        setMedia(firstSubtopic.image)

      }
      setIsLoading(false);
      sessionStorage.setItem('jsonData', JSON.stringify(jsonData));
      CountDoneTopics();

    }

  }, []);

  const loadMessages = async () => {
    try {
      const jsonValue = sessionStorage.getItem(mainTopic);
      if (jsonValue !== null) {
        setMessages(JSON.parse(jsonValue));
      } else {
        const newMessages = [...messages, { text: defaultMessage, sender: 'bot' }];
        setMessages(newMessages);
        await storeLocal(newMessages);
      }
    } catch (error) {
      console.error(error);
    }
  };

  async function storeLocal(messages) {
    try {
      sessionStorage.setItem(mainTopic, JSON.stringify(messages));
    } catch (error) {
      console.error(error);
    }
  }

  const sendMessage = async () => {
    if (newMessage.trim() === '') return;

    const userMessage = { text: newMessage, sender: 'user' };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    await storeLocal(updatedMessages);
    setNewMessage('');

    const mainPrompt = defaultPrompt + newMessage;
    const dataToSend = { prompt: mainPrompt };
    const url = serverURL + '/api/chat';

    try {
      const response = await axios.post(url, dataToSend);
      if (response.data.success === false) {
        toast({
          title: "Error",
          description: "Internal Server Error",
        });
      } else {
        const botMessage = { text: response.data.text, sender: 'bot' };
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
      totalTopics = totalTopics - 1;
    }
    const completionPercentage = Math.round((doneCount / totalTopics) * 100);
    setPercentage(completionPercentage);
    if (completionPercentage >= '100') {
      setIsCompleted(true);
    }
  }

  const handleSelect = (topics, sub) => {
    if (!isLoading) {
      const mTopic = jsonData[mainTopic.toLowerCase()].find(topic => topic.title === topics);
      const mSubTopic = mTopic?.subtopics.find(subtopic => subtopic.title === sub);

      if (mSubTopic.theory === '' || mSubTopic.theory === undefined || mSubTopic.theory === null) {
        if (type === 'video & text course') {

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
        setSelected(mSubTopic.title)
        setTheory(mSubTopic.theory)
        if (type === 'video & text course') {
          setMedia(mSubTopic.youtube);
        } else {
          setMedia(mSubTopic.image)
        }
      }
    }
  };

  async function sendPrompt(prompt, promptImage, topics, sub) {
    const dataToSend = {
      prompt: prompt,
    };
    try {
      const postURL = serverURL + '/api/generate';
      const res = await axios.post(postURL, dataToSend);
      const generatedText = res.data.text;
      const htmlContent = generatedText;
      try {
        const parsedJson = htmlContent;
        sendImage(parsedJson, promptImage, topics, sub);
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

  async function sendImage(parsedJson, promptImage, topics, sub) {
    const dataToSend = {
      prompt: promptImage,
    };
    try {
      const postURL = serverURL + '/api/image';
      const res = await axios.post(postURL, dataToSend);
      try {
        const generatedText = res.data.url;
        sendData(generatedText, parsedJson, topics, sub);
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

  async function sendData(image, theory, topics, sub) {

    const mTopic = jsonData[mainTopic.toLowerCase()].find(topic => topic.title === topics);
    const mSubTopic = mTopic?.subtopics.find(subtopic => subtopic.title === sub);
    mSubTopic.theory = theory
    mSubTopic.image = image;
    setSelected(mSubTopic.title)

    setIsLoading(false);
    setTheory(theory)
    if (type === 'video & text course') {
      setMedia(mSubTopic.youtube);
    } else {
      setMedia(image)
    }
    mSubTopic.done = true;
    updateCourse();
  }

  async function sendDataVideo(image, theory, topics, sub) {

    const mTopic = jsonData[mainTopic.toLowerCase()].find(topic => topic.title === topics);
    const mSubTopic = mTopic?.subtopics.find(subtopic => subtopic.title === sub);
    mSubTopic.theory = theory
    mSubTopic.youtube = image;
    setSelected(mSubTopic.title)

    setIsLoading(false);
    setTheory(theory)
    if (type === 'video & text course') {
      setMedia(image);
    } else {
      setMedia(mSubTopic.image)
    }
    mSubTopic.done = true;
    updateCourse();

  }

  async function updateCourse() {
    CountDoneTopics();
    sessionStorage.setItem('jsonData', JSON.stringify(jsonData));
    const dataToSend = {
      content: JSON.stringify(jsonData),
      courseId: courseId
    };
    try {
      const postURL = serverURL + '/api/update';
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
      const postURL = serverURL + '/api/yt';
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
      const postURL = serverURL + '/api/transcript';
      const res = await axios.post(postURL, dataToSend);

      try {
        const generatedText = res.data.url;
        const allText = generatedText.map(item => item.text);
        const concatenatedText = allText.join(' ');
        const prompt = `Strictly in ${lang}, Summarize this theory in a teaching way :- ${concatenatedText}.`;
        sendSummery(prompt, url, mTopic, mSubTopic);
      } catch (error) {
        console.error(error)
        const prompt = `Strictly in ${lang}, Explain me about this subtopic of ${mainTopic} with examples :- ${subtop}. Please Strictly Don't Give Additional Resources And Images.`;
        sendSummery(prompt, url, mTopic, mSubTopic);
      }

    } catch (error) {
      console.error(error)
      const prompt = `Strictly in ${lang}, Explain me about this subtopic of ${mainTopic} with examples :- ${subtop}.  Please Strictly Don't Give Additional Resources And Images.`;
      sendSummery(prompt, url, mTopic, mSubTopic);
    }
  }

  async function sendSummery(prompt, url, mTopic, mSubTopic) {
    const dataToSend = {
      prompt: prompt,
    };
    try {
      const postURL = serverURL + '/api/generate';
      const res = await axios.post(postURL, dataToSend);
      const generatedText = res.data.text;
      const htmlContent = generatedText;
      try {
        const parsedJson = htmlContent;
        sendDataVideo(url, parsedJson, mTopic, mSubTopic);
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
    const combinedHtml = await getCombinedHtml(mainTopic, jsonData[mainTopic.toLowerCase()]);

    // Create a temporary div element
    const tempDiv = document.createElement('div');
    tempDiv.style.width = '100%';  // Ensure div is 100% width
    tempDiv.style.height = '100%';  // Ensure div is 100% height
    tempDiv.innerHTML = combinedHtml;
    document.body.appendChild(tempDiv);

    // Create the PDF options
    const options = {
      filename: `${mainTopic}.pdf`,
      image: { type: 'jpeg', quality: 1 },
      margin: [15, 15, 15, 15],
      pagebreak: { mode: ["avoid-all", "css", "legacy"] },
      html2canvas: {
        scale: 2,
        logging: false,
        scrollX: 0,
        scrollY: 0,
        useCORS: true
      },
      jsPDF: { unit: 'pt', format: 'a4', orientation: 'portrait' },
    };

    // Generate the PDF
    html2pdf().from(tempDiv).set(options).save().then(() => {
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
      }).catch(error => {
        console.error(`Failed to fetch image at ${url}:`, error);
        return ''; // Fallback or placeholder
      });
    }

    const topicsHtml = topics.map(topic => `
        <h3 style="font-size: 18pt; font-weight: bold; margin: 0; margin-top: 15px;">${topic.title}</h3>
        ${topic.subtopics.map(subtopic => `
            <p style="font-size: 16pt; margin-top: 10px;">${subtopic.title}</p>
        `).join('')}
    `).join('');

    const theoryPromises = topics.map(async topic => {
      const subtopicPromises = topic.subtopics.map(async (subtopic, index, array) => {
        const imageUrl = type === 'text & image course' ? await toDataUrl(subtopic.image) : ``;
        return `
            <div>
                <p style="font-size: 16pt; margin-top: 20px; font-weight: bold;">
                    ${subtopic.title}
                </p>
                <div style="font-size: 12pt; margin-top: 15px;">
                    ${subtopic.done
            ? `
                            ${type === 'text & image course'
              ? (imageUrl ? `<img style="margin-top: 10px;" src="${imageUrl}" alt="${subtopic.title} image">` : `<a style="color: #0000FF;" href="${subtopic.image}" target="_blank">View example image</a>`)
              : `<a style="color: #0000FF;" href="https://www.youtube.com/watch?v=${subtopic.youtube}" target="_blank" rel="noopener noreferrer">Watch the YouTube video on ${subtopic.title}</a>`
            }
                            <div style="margin-top: 10px;">${subtopic.theory}</div>
                        `
            : `<div style="margin-top: 10px;">Please visit ${subtopic.title} topic to export as PDF. Only topics that are completed will be added to the PDF.</div>`
          }
                </div>
            </div>
        `;
      });
      const subtopicHtml = await Promise.all(subtopicPromises);
      return `
            <div style="margin-top: 30px;">
                <h3 style="font-size: 18pt; text-align: center; font-weight: bold; margin: 0;">
                    ${topic.title}
                </h3>
                ${subtopicHtml.join('')}
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
        ${theoryHtml.join('')}
    </div>
    `;
  }

  async function redirectExam() {
    if (!isLoading) {
      setIsLoading(true);
      const mainTopicExam = jsonData[mainTopic.toLowerCase()];
      let subtopicsString = '';
      mainTopicExam.map((topicTemp) => {
        const titleOfSubTopic = topicTemp.title;
        subtopicsString = subtopicsString + ' , ' + titleOfSubTopic;
      });
      const postURL = serverURL + '/api/aiexam';
      const response = await axios.post(postURL, { courseId, mainTopic, subtopicsString, lang });
      if (response.data.success) {
        setIsLoading(false);
        const questions = JSON.parse(response.data.message);
        navigate('/course/'+ courseId +'/quiz', { state: { topic: mainTopic, courseId: courseId, questions: questions } });
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
    return (
      <>
        {topics.map((topic) => (
          <Accordion key={topic.title} type="single" collapsible className="mb-2">
            <AccordionItem value={topic.title} className="border-none">
              <AccordionTrigger className="py-2 px-3 text-left hover:bg-accent/50 rounded-md">
                {topic.title}
              </AccordionTrigger>
              <AccordionContent className="pl-2">
                {topic.subtopics.map((subtopic) => (
                  <div
                    onClick={() => handleSelect(topic.title, subtopic.title)}
                    key={subtopic.title}
                    className={cn(
                      "flex items-center px-4 py-2 rounded-md hover:bg-accent/50 transition-colors cursor-pointer",
                      subtopic.title === "class-objects" && "bg-accent/50 font-medium text-primary"
                    )}
                  >
                    {subtopic.done && (
                      <span className="mr-2 text-primary">✓</span>
                    )}
                    <span className="text-sm">{subtopic.title}</span>
                  </div>
                ))}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        ))}
      </>
    );
  }

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
    if (sessionStorage.getItem('first') === 'true') {
      if (!end) {
        const today = new Date();
        const formattedDate = today.toLocaleDateString('en-GB');
        navigate('/course/'+courseId+'/certificate', { state: { courseTitle: mainTopic, end: formattedDate } });
      } else {
        navigate('/course/'+courseId+'/certificate', { state: { courseTitle: mainTopic, end: end } });
      }

    } else {
      const dataToSend = {
        courseId: courseId
      };
      try {
        const postURL = serverURL + '/api/finish';
        const response = await axios.post(postURL, dataToSend);
        if (response.data.success) {
          const today = new Date();
          const formattedDate = today.toLocaleDateString('en-GB');
          sessionStorage.setItem('first', 'true');
          sendEmail(formattedDate);
        }
      } catch (error) {
        console.error(error);
      }
    }
  }

  async function sendEmail(formattedDate) {
    const userName = sessionStorage.getItem('mName');
    const email = sessionStorage.getItem('email');
    const html = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
                <meta http-equiv="Content-Type" content="text/html charset=UTF-8" />
                <html lang="en">
                
                  <head></head>
                 <div id="__react-email-preview" style="display:none;overflow:hidden;line-height:1px;opacity:0;max-height:0;max-width:0;">Certificate<div> ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿</div>
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
                                <td><a href="${websiteURL}" target="_blank" style="p-x:20px;p-y:12px;line-height:100%;text-decoration:none;display:inline-block;max-width:100%;padding:12px 20px;border-radius:0.25rem;background-color: #007BFF;text-align:center;font-size:12px;font-weight:600;color:rgb(255,255,255);text-decoration-line:none"><span></span><span style="p-x:20px;p-y:12px;max-width:100%;display:inline-block;line-height:120%;text-decoration:none;text-transform:none;mso-padding-alt:0px;mso-text-raise:9px"><span>Get Certificate</span></a></td>
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
      const postURL = serverURL + '/api/sendcertificate';
      await axios.post(postURL, { html, email }).then(res => {
        navigate('/course/'+courseId+'/certificate', { state: { courseTitle: mainTopic, end: formattedDate } });
      }).catch(error => {
        console.error(error);
        navigate('/course/'+courseId+'/certificate', { state: { courseTitle: mainTopic, end: formattedDate } });
      });

    } catch (error) {
      console.error(error);
      navigate('/course/'+courseId+'/certificate', { state: { courseTitle: mainTopic, end: formattedDate } });
    }

  }

  const renderTopicsAndSubtopicsMobile = (topics) => {
    return (
      <>
        {topics.map((topic) => (
          <Accordion key={topic.title} type="single" collapsible className="mb-2">
            <AccordionItem value={topic.title} className="border-none">
              <AccordionTrigger className="py-2 text-left px-3 hover:bg-accent/50 rounded-md">
                {topic.title}
              </AccordionTrigger>
              <AccordionContent className="pl-2">
                {topic.subtopics.map((subtopic) => (
                  <div
                    onClick={() => handleSelect(topic.title, subtopic.title)}
                    key={subtopic.title}
                    className={cn(
                      "flex items-center px-4 py-2 rounded-md hover:bg-accent/50 transition-colors cursor-pointer",
                      subtopic.title === "class-objects" && "bg-accent/50 font-medium text-primary"
                    )}
                  >
                    {subtopic.done && (
                      <span className="mr-2 text-primary">✓</span>
                    )}
                    <span className="text-sm">{subtopic.title}</span>
                  </div>
                ))}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        ))}
      </>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      <header className="border-b border-border/40 py-2 px-4 flex justify-between items-center sticky top-0 z-10 bg-background/95 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <Drawer>
            <DrawerTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </DrawerTrigger>
            <DrawerContent className="max-h-[80vh]">
              <div className="p-4">
                <h2 className="text-xl font-bold mb-4">Course Content</h2>
                <ScrollArea className="h-[60vh]">
                  <div className="pr-4">
                    {jsonData && renderTopicsAndSubtopics(jsonData[mainTopic.toLowerCase()])}
                    <p onClick={redirectExam} className='py-2 text-left px-3 hover:bg-accent/50 rounded-md cursor-pointer'>{pass === true ? <span className="mr-2 text-primary">✓</span> : <></>}{mainTopic} Quiz</p>
                  </div>
                </ScrollArea>
              </div>
            </DrawerContent>
          </Drawer>

          <div className="flex items-center gap-2">
            <div className="relative w-8 h-8">
              <svg className="w-8 h-8" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="16" fill="none" className="stroke-muted-foreground/20" strokeWidth="2" />
                <circle
                  cx="18"
                  cy="18"
                  r="16"
                  fill="none"
                  className="stroke-primary"
                  strokeWidth="2"
                  strokeDasharray="100"
                  strokeDashoffset={100 - percentage}
                  transform="rotate(-90 18 18)"
                />
                <text
                  x="18"
                  y="18"
                  dominantBaseline="middle"
                  textAnchor="middle"
                  className="fill-foreground text-[10px] font-medium"
                >
                  {percentage}%
                </text>
              </svg>
            </div>
            <h1 className="text-xl font-bold">{mainTopic}</h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="hidden md:flex"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <ToggleGroup type="single" className="hidden sm:flex">
            <Button variant="ghost" size="sm" asChild>
              <Link to='/dashboard'>
                <Home className="h-4 w-4 mr-1" /> Home
              </Link>
            </Button>
            <Button onClick={certificateCheck} variant="ghost" size="sm" asChild>
              <span className='cursor-pointer'><Award className="h-4 w-4 mr-1" /> Certificate</span>
            </Button>
            <Button onClick={htmlDownload} disabled={exporting} variant="ghost" size="sm" asChild>
              <span className='cursor-pointer'><Download className="h-4 w-4 mr-1" />{exporting ? 'Exporting...' : 'Export'}</span>
            </Button>
            <ShareOnSocial
              textToShare={sessionStorage.getItem('mName') + " shared you course on " + mainTopic}
              link={websiteURL + '/shareable?id=' + courseId}
              linkTitle={sessionStorage.getItem('mName') + " shared you course on " + mainTopic}
              linkMetaDesc={sessionStorage.getItem('mName') + " shared you course on " + mainTopic}
              linkFavicon={appLogo}
              noReferer
            >
              <Button variant="ghost" size="sm" asChild>
                <span className='cursor-pointer'><Share className="h-4 w-4 mr-1" /> Share</span>
              </Button>
            </ShareOnSocial>
          </ToggleGroup>
          <ThemeToggle />
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <div className={cn(
          "bg-sidebar border-r border-border/40 transition-all duration-300 overflow-hidden hidden md:block",
          isMenuOpen ? "w-64" : "w-0"
        )}>
          <ScrollArea className="h-full">
            <div className="p-4">
              {jsonData && renderTopicsAndSubtopicsMobile(jsonData[mainTopic.toLowerCase()])}
              <p onClick={redirectExam} className='py-2 text-left px-3 hover:bg-accent/50 rounded-md cursor-pointer'>{pass === true ? <span className="mr-2 text-primary">✓</span> : <></>}{mainTopic} Quiz</p>
            </div>
          </ScrollArea>
        </div>

        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full" viewportRef={mainContentRef}>
            <main className="p-6 max-w-5xl mx-auto">
              {isLoading ?
                <CourseContentSkeleton />
                :
                <>
                  <h1 className="text-3xl font-bold mb-6">{selected}</h1>
                  <div className="space-y-4">
                    {type === 'video & text course' ?
                      <div>
                        <YouTube key={media} className='mb-5' videoId={media} opts={opts} />
                      </div>
                      :
                      <div>
                        <img className='overflow-hidden h-96 max-md:h-64' src={media} alt="Media" />
                      </div>
                    }
                    <StyledText text={theory} />
                  </div>
                </>
              }
            </main>
          </ScrollArea>
        </div>
      </div>

      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-background border-t border-border p-2 flex justify-around items-center">
        <Button variant="ghost" size="sm">
          <Link to='/dashboard'>
            <Home className="h-5 w-5" />
          </Link>
        </Button>
        <Button onClick={certificateCheck} variant="ghost" size="sm" asChild>
          <span>
            <Award className="h-5 w-5" />
          </span>
        </Button>
        <Button onClick={htmlDownload} disabled={exporting} variant="ghost" size="sm">
          <Download className="h-5 w-5" />
        </Button>
        <ShareOnSocial
          textToShare={sessionStorage.getItem('mName') + " shared you course on " + mainTopic}
          link={websiteURL + '/shareable?id=' + courseId}
          linkTitle={sessionStorage.getItem('mName') + " shared you course on " + mainTopic}
          linkMetaDesc={sessionStorage.getItem('mName') + " shared you course on " + mainTopic}
          linkFavicon={appLogo}
          noReferer
        >
          <Button variant="ghost" size="sm">
            <Share className="h-5 w-5" />
          </Button>
        </ShareOnSocial>
      </div>

      <div className="fixed bottom-16 right-6 flex flex-col gap-3 md:bottom-6">
        <Button
          size="icon"
          className="rounded-full bg-primary shadow-lg hover:shadow-xl"
          onClick={() => setIsChatOpen(true)}
        >
          <MessageCircle className="h-5 w-5" />
        </Button>
        <Button
          size="icon"
          className="rounded-full bg-primary shadow-lg hover:shadow-xl"
          onClick={() => setIsNotesOpen(true)}
        >
          <ClipboardCheck className="h-5 w-5" />
        </Button>
      </div>

      {isMobile ? (
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
      ) : (
        <Dialog open={isChatOpen} onOpenChange={setIsChatOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogTitle>Course Assistant</DialogTitle>
            <div className="flex flex-col h-[60vh]">
              <ScrollArea className="flex-1 pr-4 mb-4">
                <div className="space-y-4 pt-2">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={cn(
                        "flex w-2/4 max-w-[80%] flex-col gap-2 rounded-lg px-3 py-2 text-sm",
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
          </DialogContent>
        </Dialog>
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
                  <Button disabled={saving} onClick={handleSaveNote}>{saving ? 'Saving...' : 'Save Note'}</Button>
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
                  <Button disabled={saving} onClick={handleSaveNote}>{saving ? 'Saving...' : 'Save Note'}</Button>
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