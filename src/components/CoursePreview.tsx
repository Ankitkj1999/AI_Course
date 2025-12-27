
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
    selectedProvider?: string;
    selectedModel?: string;
    isPublic?: boolean;
}

const CoursePreview: React.FC<CoursePreviewProps> = ({
    isLoading,
    courseName,
    topics,
    type,
    lang,
    onClose,
    selectedProvider,
    selectedModel,
    isPublic = false,
}) => {
    const navigate = useNavigate();
    const [isLoadingCourse, setIsLoadingCourse] = useState(false);
    const { toast } = useToast();

    function handleCreateCourse() {
        setIsLoadingCourse(true);
        
        // Create course structure first, then generate content for first section
        createCourseStructure();
    }

    async function createCourseStructure() {
        try {
            const user = localStorage.getItem('uid');
            
            // 🔍 DIAGNOSTIC: Check if topics already have content
            console.log('🔍 DIAGNOSTIC - Topics structure before /api/course call:', {
                topicsKeys: Object.keys(topics),
                firstTopic: topics[courseName.toLowerCase()]?.[0],
                firstSubtopic: topics[courseName.toLowerCase()]?.[0]?.subtopics?.[0],
                hasTheory: !!topics[courseName.toLowerCase()]?.[0]?.subtopics?.[0]?.theory,
                theoryLength: topics[courseName.toLowerCase()]?.[0]?.subtopics?.[0]?.theory?.length || 0,
                theoryPreview: topics[courseName.toLowerCase()]?.[0]?.subtopics?.[0]?.theory?.substring(0, 100)
            });
            
            const content = JSON.stringify(topics);
            console.log('🔍 DIAGNOSTIC - Content string length being sent to /api/course:', content.length);
            
            const postURL = serverURL + '/api/course';
            
            // Create course with empty content
            const response = await axios.post(postURL, {
                user,
                content,
                type,
                mainTopic: courseName,
                lang,
                isPublic
            }, {
                withCredentials: true
            });

            if (response.data.success) {
                const courseId = response.data.courseId;
                const courseSlug = response.data.slug;
                
                // Store course info
                localStorage.setItem('courseId', courseId);
                localStorage.setItem('first', response.data.completed);
                localStorage.setItem('jsonData', JSON.stringify(topics));
                
                // Now generate content for the first section
                await generateFirstSectionContent(courseId, courseSlug);
            } else {
                setIsLoadingCourse(false);
                toast({
                    title: "Error",
                    description: "Failed to create course structure",
                });
            }
        } catch (error) {
            setIsLoadingCourse(false);
            console.error('Course creation error:', error);
            toast({
                title: "Error",
                description: "Failed to create course",
            });
        }
    }

    async function generateFirstSectionContent(courseId: string, courseSlug: string) {
        try {
            // Get course hierarchy to find first section ID
            const hierarchyResponse = await axios.get(
                `${serverURL}/api/v2/courses/${courseId}/hierarchy?includeContent=false`,
                { withCredentials: true }
            );
            
            if (!hierarchyResponse.data.success || !hierarchyResponse.data.hierarchy) {
                throw new Error('Failed to get course hierarchy');
            }
            
            // Find first section
            const firstParent = hierarchyResponse.data.hierarchy[0];
            const firstSection = firstParent?.children?.[0];
            
            if (!firstSection) {
                throw new Error('No sections found in course');
            }
            
            const sectionId = firstSection._id;
            const subtopicTitle = firstSection.title;
            
            // Generate content based on course type
            if (type === 'Video & Text Course') {
                await generateVideoContentForSection(sectionId, subtopicTitle, courseSlug);
            } else {
                await generateTextContentForSection(sectionId, subtopicTitle, courseSlug);
            }
            
        } catch (error) {
            setIsLoadingCourse(false);
            console.error('First section generation error:', error);
            toast({
                title: "Warning",
                description: "Course created but first section generation failed. You can generate it from the course page.",
            });
            
            // Navigate anyway - user can generate content from course page
            navigateToCourse(courseSlug);
        }
    }

    async function generateTextContentForSection(sectionId: string, subtopicTitle: string, courseSlug: string) {
        try {
            // Generate image first
            const promptImage = `Example of ${subtopicTitle} in ${courseName}`;
            const imageRes = await axios.post(serverURL + '/api/image', {
                prompt: promptImage
            });
            const imageUrl = imageRes.data.url;
            
            // Generate content with sectionId and metadata
            const prompt = `Strictly in ${lang}, Explain me about this subtopic of ${courseName} with examples :- ${subtopicTitle}. Please Strictly Don't Give Additional Resources And Images.`;
            const contentRes = await axios.post(serverURL + '/api/generate', {
                prompt,
                provider: selectedProvider,
                model: selectedModel,
                temperature: 0.7,
                sectionId: sectionId,  // ✨ Content saved automatically
                metadata: {
                    image: imageUrl,
                    youtube: null
                }
            }, {
                withCredentials: true
            });
            
            if (contentRes.data.metadata?.savedToSection) {
                console.log('✅ First section content generated and saved');
                setIsLoadingCourse(false);
                toast({
                    title: "Course Created!",
                    description: `Course has been created as ${isPublic ? 'public' : 'private'} content with first lesson ready.`,
                });
                navigateToCourse(courseSlug);
            } else {
                throw new Error('Content generation succeeded but save failed');
            }
            
        } catch (error) {
            setIsLoadingCourse(false);
            console.error('Text content generation error:', error);
            toast({
                title: "Warning",
                description: "Course created but content generation failed. You can generate it from the course page.",
            });
            navigateToCourse(courseSlug);
        }
    }

    async function generateVideoContentForSection(sectionId: string, subtopicTitle: string, courseSlug: string) {
        try {
            // Get video first
            const query = `${subtopicTitle} ${courseName} in english`;
            const videoRes = await axios.post(serverURL + '/api/yt', {
                prompt: query
            });
            const videoId = videoRes.data.url;
            
            // Get transcript
            let transcriptText = '';
            try {
                const transcriptRes = await axios.post(serverURL + '/api/transcript', {
                    prompt: videoId
                });
                const allText = transcriptRes.data.url.map(item => item.text);
                transcriptText = allText.join(' ');
            } catch (error) {
                console.warn('Transcript failed, using fallback');
                transcriptText = `Content about ${subtopicTitle} in ${courseName}`;
            }
            
            // Generate summary with sectionId and metadata
            const prompt = `Strictly in ${lang}, Summarize this theory in a teaching way :- ${transcriptText}.`;
            const contentRes = await axios.post(serverURL + '/api/generate', {
                prompt,
                provider: selectedProvider,
                model: selectedModel,
                temperature: 0.7,
                sectionId: sectionId,  // ✨ Content saved automatically
                metadata: {
                    image: null,
                    youtube: videoId
                }
            }, {
                withCredentials: true
            });
            
            if (contentRes.data.metadata?.savedToSection) {
                console.log('✅ First section video content generated and saved');
                setIsLoadingCourse(false);
                toast({
                    title: "Course Created!",
                    description: `Course has been created as ${isPublic ? 'public' : 'private'} content with first lesson ready.`,
                });
                navigateToCourse(courseSlug);
            } else {
                throw new Error('Content generation succeeded but save failed');
            }
            
        } catch (error) {
            setIsLoadingCourse(false);
            console.error('Video content generation error:', error);
            toast({
                title: "Warning",
                description: "Course created but content generation failed. You can generate it from the course page.",
            });
            navigateToCourse(courseSlug);
        }
    }

    function navigateToCourse(courseSlug: string) {
        navigate('/course/' + courseSlug, {
            state: {
                jsonData: topics,
                mainTopic: courseName.toUpperCase(),
                type: type.toLowerCase(),
                courseId: localStorage.getItem('courseId'),
                end: '',
                pass: false,
                lang: lang
            }
        });
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
        // Safety check for undefined or empty topics
        if (!topicss || !Array.isArray(topicss) || topicss.length === 0) {
            return (
                <div className="text-center text-muted-foreground">
                    No topics available
                </div>
            );
        }
        
        return (
            <>
                {topicss.map((topic, index) => (
                    <div key={index} className="space-y-2">
                        <Card className="bg-primary text-primary-foreground">
                            <CardContent className="p-4 font-bold">
                                {topic.title}
                            </CardContent>
                        </Card>
                        {topic.subtopics && topic.subtopics.map((subtopic, idx) => (
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
                <h1 className="text-2xl font-bold tracking-tight mb-4">
                    {courseName.toUpperCase()}
                </h1>
                <p className="text-muted-foreground max-w-lg mx-auto">
                    List of topics and subtopics course will cover
                </p>
            </div>

            <ScrollArea className="px-4">
                <div className="space-y-6 max-w-3xl mx-auto pb-6">
                    {topics && topics[courseName.toLowerCase()] && renderTopicsAndSubtopics(topics[courseName.toLowerCase()])}
                    {topics && !topics[courseName.toLowerCase()] && (
                        <div className="text-center text-muted-foreground">
                            No course structure generated yet
                        </div>
                    )}
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
                    disabled={isLoadingCourse || !topics || !topics[courseName.toLowerCase()]}
                    onClick={handleCreateCourse}
                    className="w-40"
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