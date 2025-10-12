import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { Sparkles, Plus } from 'lucide-react';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import CoursePreview from '@/components/CoursePreview';
import SEO from '@/components/SEO';
import { useToast } from '@/hooks/use-toast';
import { serverURL } from '@/constants';
import axios from 'axios';

const courseFormSchema = z.object({
  topic: z.string().min(3, { message: "Topic must be at least 3 characters" }),
  subtopics: z.array(z.string()),
  topicsLimit: z.enum(["4", "8"]),
  courseType: z.enum(["Text & Image Course", "Video & Text Course"]),
  language: z.string().min(1, { message: "Please select a language" })
});

type CourseFormValues = z.infer<typeof courseFormSchema>;

const GenerateCourse = () => {
  const [subtopicInput, setSubtopicInput] = useState('');
  const [subtopics, setSubtopics] = useState<string[]>([]);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [generatedTopics, setGeneratedTopics] = useState({});
  const maxSubtopics = 5;
  const [selectedValue, setSelectedValue] = useState('4');
  const [selectedType, setSelectedType] = useState('Text & Image Course');
  const [paidMember, setPaidMember] = useState(false);
  const [lang, setLang] = useState('English');
  const { toast } = useToast();

  const languages = [
    { "code": "en", "name": "English" },
    { "code": "ar", "name": "Arabic" },
    { "code": "bn", "name": "Bengali" },
    { "code": "bg", "name": "Bulgarian" },
    { "code": "zh", "name": "Chinese" },
    { "code": "hr", "name": "Croatian" },
    { "code": "cs", "name": "Czech" },
    { "code": "da", "name": "Danish" },
    { "code": "nl", "name": "Dutch" },
    { "code": "et", "name": "Estonian" },
    { "code": "fi", "name": "Finnish" },
    { "code": "fr", "name": "French" },
    { "code": "de", "name": "German" },
    { "code": "el", "name": "Greek" },
    { "code": "he", "name": "Hebrew" },
    { "code": "hi", "name": "Hindi" },
    { "code": "hu", "name": "Hungarian" },
    { "code": "id", "name": "Indonesian" },
    { "code": "it", "name": "Italian" },
    { "code": "ja", "name": "Japanese" },
    { "code": "ko", "name": "Korean" },
    { "code": "lv", "name": "Latvian" },
    { "code": "lt", "name": "Lithuanian" },
    { "code": "no", "name": "Norwegian" },
    { "code": "pl", "name": "Polish" },
    { "code": "pt", "name": "Portuguese" },
    { "code": "ro", "name": "Romanian" },
    { "code": "ru", "name": "Russian" },
    { "code": "sr", "name": "Serbian" },
    { "code": "sk", "name": "Slovak" },
    { "code": "sl", "name": "Slovenian" },
    { "code": "es", "name": "Spanish" },
    { "code": "sw", "name": "Swahili" },
    { "code": "sv", "name": "Swedish" },
    { "code": "th", "name": "Thai" },
    { "code": "tr", "name": "Turkish" },
    { "code": "uk", "name": "Ukrainian" },
    { "code": "vi", "name": "Vietnamese" }
  ];

  useEffect(() => {

    if (sessionStorage.getItem('type') !== 'free') {
      setPaidMember(true);
    }

  }, []);

  const form = useForm<CourseFormValues>({
    resolver: zodResolver(courseFormSchema),
    defaultValues: {
      topic: '',
      subtopics: [],
      topicsLimit: "4",
      courseType: "Text & Image Course",
      language: "English"
    }
  });

  const paidToad = () => {
    if (!paidMember) {
      toast({
        title: "Go Premium",
        description: "Access all features with a Premium upgrade."
      });
    }
  };


  const addSubtopic = () => {
    if (subtopics.length < maxSubtopics) {
      if (subtopicInput.trim() === '') return;
      setSubtopics([...subtopics, subtopicInput.trim()]);
      setSubtopicInput('');
      form.setValue('subtopics', [...subtopics, subtopicInput.trim()]);
    } else {
      toast({
        title: "Upgrade to Premium",
        description: "You are limited to adding only 5 subtopics."
      });
    }
  };

  const onSubmit = async (data: CourseFormValues) => {
    setIsLoading(true);
    setIsSubmitted(true);

    const subtopics = [];
    data.subtopics.forEach(subtopic => {
      subtopics.push(subtopic);
    });

    const mainTopic = data.topic;
    const lang = data.language;
    const number = data.topicsLimit;

    const prompt = `Strictly in ${lang}, Generate a list of Strict ${number} topics and any number sub topic for each topic for main title ${mainTopic.toLowerCase()}, everything in single line. Those ${number} topics should Strictly include these topics :- ${subtopics.join(', ').toLowerCase()}. Strictly Keep theory, youtube, image field empty. Generate in the form of JSON in this format {
            "${mainTopic.toLowerCase()}": [
       {
       "title": "Topic Title",
       "subtopics": [
        {
        "title": "Sub Topic Title",
        "theory": "",
        "youtube": "",
        "image": "",
        "done": false
        },
        {
        "title": "Sub Topic Title",
        "theory": "",
        "youtube": "",
        "image": "",
        "done": false
        }
       ]
       },
       {
       "title": "Topic Title",
       "subtopics": [
        {
        "title": "Sub Topic Title",
        "theory": "",
        "youtube": "",
        "image": "",
        "done": false
        },
        {
        "title": "Sub Topic Title",
        "theory": "",
        "youtube": "",
        "image": "",
        "done": false
        }
       ]
       }
      ]
      }`;

    sendPrompt(prompt);
  };

  async function sendPrompt(prompt: string) {
    const dataToSend = {
      prompt: prompt,
    };
    try {
      const postURL = serverURL + '/api/prompt';
      const res = await axios.post(postURL, dataToSend);
      const generatedText = res.data.generatedText;
      const cleanedJsonString = generatedText.replace(/```json/g, '').replace(/```/g, '');
      try {
        const parsedJson = JSON.parse(cleanedJsonString);
        setGeneratedTopics(parsedJson)
        setIsLoading(false);
      } catch (error) {
        console.error(error);
        setIsLoading(false);
        toast({
          title: "Error",
          description: "Internal Server Error",
        });
      }

    } catch (error) {
      console.error(error);
      setIsLoading(false);
      toast({
        title: "Error",
        description: "Internal Server Error",
      });
    }
  }

  const handleEditTopics = () => {
    setIsSubmitted(false);
  };

  if (isSubmitted) {
    return (
      <>
        <SEO
          title="Generate Course - Preview"
          description="Preview your AI-generated course before creation"
          keywords="course generation, preview, AI learning"
        />
        <CoursePreview
          isLoading={isLoading}
          courseName={form.getValues('topic').toLowerCase()}
          topics={generatedTopics}
          type={selectedType}
          lang={lang.toLowerCase()}
          onClose={handleEditTopics}
        />
      </>
    );
  }

  return (
    <>
      <SEO
        title="Generate Course"
        description="Create a customized AI-generated course"
        keywords="course generation, AI learning, custom education"
      />
      <div className="space-y-8 animate-fade-in max-w-3xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-gradient bg-gradient-to-r from-primary to-indigo-500 mb-4">Generate Course</h1>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Type the topic on which you want to Generate course.
            Also, you can enter a list of subtopics, which are the
            specifics you want to learn.
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-6">
                  <FormField
                    control={form.control}
                    name="topic"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Topic</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter main topic" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <div className="space-y-2">
                    <FormLabel>Sub Topic (Optional)</FormLabel>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Enter subtopic"
                        value={subtopicInput}
                        onChange={(e) => setSubtopicInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addSubtopic();
                          }
                        }}
                      />
                      <Button
                        type="button"
                        onClick={addSubtopic}
                        className="bg-black text-white hover:bg-gray-800"
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Add Sub-Topic
                      </Button>
                    </div>

                    {subtopics.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {subtopics.map((topic, index) => (
                          <div key={index} className="flex items-center gap-2 p-2 bg-muted rounded-md">
                            <span className="text-sm">{topic}</span>
                            <Button
                            type="button"
                              variant="ghost"
                              size="sm"
                              className="ml-auto h-7 w-7 p-0"
                              onClick={() => {
                                const newSubtopics = subtopics.filter((_, i) => i !== index);
                                setSubtopics(newSubtopics);
                                form.setValue('subtopics', newSubtopics);
                              }}
                            >
                              ×
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <FormLabel>Select Number Of Sub Topic</FormLabel>
                    <FormField
                      control={form.control}
                      name="topicsLimit"
                      render={({ field }) => (
                        <FormItem className="mt-2">
                          <FormControl>
                            <RadioGroup
                              value={selectedValue}
                              onValueChange={(selectedValue) => {
                                setSelectedValue(selectedValue);
                                field.onChange(selectedValue);
                              }}
                              className="space-y-2"
                            >
                              <div className="flex items-center space-x-2 border p-3 rounded-md">
                                <RadioGroupItem defaultChecked value="4" id="r1" />
                                <FormLabel htmlFor="r1" className="mb-0">5</FormLabel>
                              </div>
                              <div onClick={paidToad} className="flex items-center space-x-2 border p-3 rounded-md">
                                <RadioGroupItem disabled={!paidMember} value="8" id="r2" />
                                <FormLabel htmlFor="r2" className="mb-0">10</FormLabel>
                              </div>
                            </RadioGroup>
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  <div>
                    <FormLabel>Select Course Type</FormLabel>
                    <FormField
                      control={form.control}
                      name="courseType"
                      render={({ field }) => (
                        <FormItem className="mt-2">
                          <FormControl>
                            <RadioGroup
                              value={selectedType}
                              onValueChange={(selectedValue) => {
                                setSelectedType(selectedValue);
                                field.onChange(selectedValue);
                              }}
                              className="space-y-2"
                            >
                              <div className="flex items-center space-x-2 border p-3 rounded-md">
                                <RadioGroupItem defaultChecked value="Text & Image Course" id="ct1" />
                                <FormLabel htmlFor="ct1" className="mb-0">Theory & Image Course</FormLabel>
                              </div>
                              <div onClick={paidToad} className="flex items-center space-x-2 border p-3 rounded-md">
                                <RadioGroupItem disabled={!paidMember} value="Video & Text Course" id="ct2" />
                                <FormLabel htmlFor="ct2" className="mb-0">Video & Theory Course</FormLabel>
                              </div>
                            </RadioGroup>
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="language"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Course Language</FormLabel>
                        <Select onValueChange={(selectedValue) => {
                          if (!paidMember) {
                            paidToad();
                          } else {
                            setLang(selectedValue);
                            field.onChange(selectedValue);
                          }
                        }} value={lang}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select language" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {languages.map((country) => (
                              <SelectItem key={country.code} value={country.name}>{country.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />

                  <Button
                    onClick={() => onSubmit}
                    type="submit"
                    className="w-full bg-black text-white hover:bg-gray-800"
                  >
                    <Sparkles className="mr-2 h-4 w-4" />
                    Submit
                  </Button>
                </div>
              </CardContent>
            </Card>
          </form>
        </Form>
      </div>
    </>
  );
};

export default GenerateCourse;