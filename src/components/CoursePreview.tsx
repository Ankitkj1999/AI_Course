
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { CheckCircle, Loader } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { serverURL } from '@/constants';
import axios from 'axios';
import { useToast } from '@/hooks/use-toast';


interface CoursePreviewProps {
    isLoading: boolean;
    courseName: string;
    topics: unknown,
    type: string,
    lang: string,
    onClose?: () => void;
}

const CoursePreview: React.FC<CoursePreviewProps> = ({
    isLoading,
    courseName,
    topics,
    type,
    lang,
    onClose,
}) => {
    const navigate = useNavigate();
    const [isLoadingCourse, setIsLoadingCourse] = useState(false);
    const { toast } = useToast();

    function handleCreateCourse() {

        const mainTopicData = topics[courseName.toLowerCase()][0];

        const firstSubtopic = mainTopicData.subtopics[0];

        if (type === 'Video & Text Course') {

            const query = `${firstSubtopic.title} ${courseName} in english`;
            sendVideo(query, firstSubtopic.title);
            setIsLoadingCourse(true);

        } else {

            const prompt = `Strictly in ${lang}, Explain me about this subtopic of ${courseName} with examples :- ${firstSubtopic.title}. Please Strictly Don't Give Additional Resources And Images.`;
            const promptImage = `Example of ${firstSubtopic.title} in ${courseName}`;
            setIsLoadingCourse(true);
            sendPrompt(prompt, promptImage);

        }

    }

    async function sendPrompt(prompt, promptImage) {
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
                sendImage(parsedJson, promptImage);
            } catch (error) {
                setIsLoadingCourse(false);
                console.error(error);
                toast({
                    title: "Error",
                    description: "Internal Server Error",
                });
            }

        } catch (error) {
            setIsLoadingCourse(false);
            console.error(error);
            toast({
                title: "Error",
                description: "Internal Server Error",
            });
        }
    }

    async function sendImage(parsedJson, promptImage) {
        const dataToSend = {
            prompt: promptImage,
        };
        try {
            const postURL = serverURL + '/api/image';
            const res = await axios.post(postURL, dataToSend);
            try {
                const generatedText = res.data.url;
                sendData(generatedText, parsedJson);
                setIsLoadingCourse(false);
            } catch (error) {
                setIsLoadingCourse(false);
                console.error(error);
                toast({
                    title: "Error",
                    description: "Internal Server Error",
                });
            }

        } catch (error) {
            setIsLoadingCourse(false);
            console.error(error);
            toast({
                title: "Error",
                description: "Internal Server Error",
            });
        }
    }

    async function sendData(image, theory) {
        topics[courseName.toLowerCase()][0].subtopics[0].theory = theory;
        topics[courseName.toLowerCase()][0].subtopics[0].image = image;

        const user = sessionStorage.getItem('uid');
        const content = JSON.stringify(topics);
        const postURL = serverURL + '/api/course';
        const response = await axios.post(postURL, { user, content, type, mainTopic: courseName, lang });

        if (response.data.success) {
            sessionStorage.setItem('courseId', response.data.courseId);
            sessionStorage.setItem('first', response.data.completed);
            sessionStorage.setItem('jsonData', JSON.stringify(topics));
            navigate('/course/' + response.data.courseId, {
                state: {
                    jsonData: topics,
                    mainTopic: courseName.toUpperCase(),
                    type: type.toLowerCase(),
                    courseId: response.data.courseId,
                    end: '',
                    pass: false,
                    lang: lang
                }
            });
        } else {
            setIsLoadingCourse(false);
            toast({
                title: "Error",
                description: "Internal Server Error",
            });
        }

    }

    async function sendDataVideo(image, theory) {
        topics[courseName.toLowerCase()][0].subtopics[0].theory = theory;
        topics[courseName.toLowerCase()][0].subtopics[0].youtube = image;

        const user = sessionStorage.getItem('uid');
        const content = JSON.stringify(topics);
        const postURL = serverURL + '/api/course';
        const response = await axios.post(postURL, { user, content, type, mainTopic: courseName, lang });

        if (response.data.success) {
            sessionStorage.setItem('courseId', response.data.courseId);
            sessionStorage.setItem('first', response.data.completed);
            sessionStorage.setItem('jsonData', JSON.stringify(topics));
            navigate('/course/' + response.data.courseId, {
                state: {
                    jsonData: topics,
                    mainTopic: courseName.toUpperCase(),
                    type: type.toLowerCase(),
                    courseId: response.data.courseId,
                    end: '',
                    pass: false,
                    lang: lang
                }
            });
        } else {
            setIsLoadingCourse(false);
            toast({
                title: "Error",
                description: "Internal Server Error",
            });
        }

    }

    async function sendVideo(query, subtopic) {
        const dataToSend = {
            prompt: query,
        };
        try {
            const postURL = serverURL + '/api/yt';
            const res = await axios.post(postURL, dataToSend);
            try {
                const generatedText = res.data.url;
                sendTranscript(generatedText, subtopic);
            } catch (error) {
                setIsLoadingCourse(false);
                console.error(error);
                toast({
                    title: "Error",
                    description: "Internal Server Error",
                });
            }

        } catch (error) {
            setIsLoadingCourse(false);
            console.error(error);
            toast({
                title: "Error",
                description: "Internal Server Error",
            });
        }
    }

    async function sendTranscript(url, subtopic) {
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
                const prompt = `Strictly in ${lang}, Summarize this theory in a teaching way and :- ${concatenatedText}.`;
                sendSummery(prompt, url);
            } catch (error) {
                const prompt = `Strictly in ${lang}, Explain me about this subtopic of ${courseName} with examples :- ${subtopic}. Please Strictly Don't Give Additional Resources And Images.`;
                sendSummery(prompt, url);
            }

        } catch (error) {
            const prompt = `Strictly in ${lang}, Explain me about this subtopic of ${courseName} with examples :- ${subtopic}. Please Strictly Don't Give Additional Resources And Images.`;
            sendSummery(prompt, url);
        }
    }

    async function sendSummery(prompt, url) {
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
                setIsLoadingCourse(false);
                sendDataVideo(url, parsedJson);
            } catch (error) {
                setIsLoadingCourse(false);
                console.error(error);
                toast({
                    title: "Error",
                    description: "Internal Server Error",
                });
            }

        } catch (error) {
            setIsLoadingCourse(false);
            console.error(error);
            toast({
                title: "Error",
                description: "Internal Server Error",
            });
        }
    }

    if (isLoading) {
        return (
            <div className="space-y-6 py-8 animate-fade-in">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold tracking-tight mb-4">
                        <Skeleton className="h-10 w-3/4 mx-auto" />
                    </h1>
                    <p className="text-muted-foreground max-w-lg mx-auto">
                        <Skeleton className="h-4 w-full mx-auto" />
                    </p>
                </div>

                <div className="space-y-6 max-w-3xl mx-auto">
                    {[1, 2, 3, 4].map((section) => (
                        <div key={section} className="space-y-2">
                            <Skeleton className="h-10 w-full bg-muted-foreground/10" />
                            {[1, 2, 3].map((item) => (
                                <Skeleton key={item} className="h-12 w-full" />
                            ))}
                        </div>
                    ))}
                </div>

                <div className="flex justify-center mt-8">
                    <div className="flex items-center space-x-2">
                        <Loader className="animate-spin h-5 w-5 text-primary" />
                        <span>Generating your course structure...</span>
                    </div>
                </div>
            </div>
        );
    }

    const renderTopicsAndSubtopics = (topicss) => {
        return (
            <>
                {topicss.map((topic, index) => (
                    <div key={index} className="space-y-2">
                        <Card className="bg-black text-white">
                            <CardContent className="p-4 font-bold">
                                {topic.title}
                            </CardContent>
                        </Card>
                        {topic.subtopics.map((subtopic, idx) => (
                            <Card key={idx} className="border">
                                <CardContent className="p-4">
                                    {subtopic.title}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ))}
            </>
        );
    };


    return (
        <div className="space-y-6 py-8 animate-fade-in">
            <div className="text-center mb-8">
                <h1 className="text-3xl font-bold tracking-tight text-gradient bg-gradient-to-r from-primary to-indigo-500 mb-4">
                    {courseName.toUpperCase()}
                </h1>
                <p className="text-muted-foreground max-w-lg mx-auto">
                    List of topics and subtopics course will cover
                </p>
            </div>

            <ScrollArea className="px-4">
                <div className="space-y-6 max-w-3xl mx-auto pb-6">
                    {topics && renderTopicsAndSubtopics(topics[courseName.toLowerCase()])}
                </div>
            </ScrollArea>

            <div className="flex justify-center gap-4 mt-8">
                <Button
                    disabled={isLoadingCourse}
                    variant="outline"
                    onClick={onClose}
                    className="w-40"
                >
                    Cancel
                </Button>
                <Button
                    disabled={isLoadingCourse}
                    onClick={handleCreateCourse}
                    className="w-40 bg-black text-white hover:bg-gray-800"
                >
                    {isLoadingCourse ?
                        <Loader className="animate-spin mr-2 h-4 w-4" />
                        :
                        <CheckCircle className="mr-2 h-4 w-4" />
                    }
                    {isLoadingCourse ? 'Generating...' : 'Generate Course'}
                </Button>
            </div>
        </div>
    );
};

export default CoursePreview;