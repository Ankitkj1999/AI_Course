import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Sparkles, Plus, Info } from "lucide-react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import CoursePreview from "@/components/CoursePreview";
import SEO from "@/components/SEO";
import { useToast } from "@/hooks/use-toast";
import { serverURL } from "@/constants";
import axios from "axios";
import ProviderSelector from "@/components/ProviderSelector";
import { useProviderPreferences, setGlobalProviderPreferences } from "@/hooks/useProviderPreferences";

const courseFormSchema = z.object({
  topic: z.string().min(3, { message: "Topic must be at least 3 characters" }),
  subtopics: z.array(z.string()),
  topicsLimit: z.enum(["4", "8"]),
  courseType: z.enum(["Text & Image Course", "Video & Text Course"]),
  language: z.string().min(1, { message: "Please select a language" }),
});

type CourseFormValues = z.infer<typeof courseFormSchema>;

const GenerateCourse = () => {
  const [subtopicInput, setSubtopicInput] = useState("");
  const [subtopics, setSubtopics] = useState<string[]>([]);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [generatedTopics, setGeneratedTopics] = useState({});
  const maxSubtopics = 5;
  const [selectedValue, setSelectedValue] = useState("4");
  const [selectedType, setSelectedType] = useState("Text & Image Course");
  const [paidMember, setPaidMember] = useState(false);
  const [lang, setLang] = useState("English");
  const { toast } = useToast();
  
  // Use provider preferences hook for course generation
  const {
    selectedProvider,
    selectedModel,
    setSelectedProvider: setSelectedProviderInternal,
    setSelectedModel: setSelectedModelInternal
  } = useProviderPreferences('course');

  // Wrapper functions that also sync to global preferences
  const setSelectedProvider = (provider: string) => {
    setSelectedProviderInternal(provider);
    setGlobalProviderPreferences({ provider });
  };

  const setSelectedModel = (model: string) => {
    setSelectedModelInternal(model);
    setGlobalProviderPreferences({ model });
  };

  const languages = [
    { code: "en", name: "English" },
    { code: "ar", name: "Arabic" },
    { code: "bn", name: "Bengali" },
    { code: "bg", name: "Bulgarian" },
    { code: "zh", name: "Chinese" },
    { code: "hr", name: "Croatian" },
    { code: "cs", name: "Czech" },
    { code: "da", name: "Danish" },
    { code: "nl", name: "Dutch" },
    { code: "et", name: "Estonian" },
    { code: "fi", name: "Finnish" },
    { code: "fr", name: "French" },
    { code: "de", name: "German" },
    { code: "el", name: "Greek" },
    { code: "he", name: "Hebrew" },
    { code: "hi", name: "Hindi" },
    { code: "hu", name: "Hungarian" },
    { code: "id", name: "Indonesian" },
    { code: "it", name: "Italian" },
    { code: "ja", name: "Japanese" },
    { code: "ko", name: "Korean" },
    { code: "lv", name: "Latvian" },
    { code: "lt", name: "Lithuanian" },
    { code: "no", name: "Norwegian" },
    { code: "pl", name: "Polish" },
    { code: "pt", name: "Portuguese" },
    { code: "ro", name: "Romanian" },
    { code: "ru", name: "Russian" },
    { code: "sr", name: "Serbian" },
    { code: "sk", name: "Slovak" },
    { code: "sl", name: "Slovenian" },
    { code: "es", name: "Spanish" },
    { code: "sw", name: "Swahili" },
    { code: "sv", name: "Swedish" },
    { code: "th", name: "Thai" },
    { code: "tr", name: "Turkish" },
    { code: "uk", name: "Ukrainian" },
    { code: "vi", name: "Vietnamese" },
  ];

  useEffect(() => {
    if (localStorage.getItem("type") !== "free") {
      setPaidMember(true);
    }
  }, []);

  const form = useForm<CourseFormValues>({
    resolver: zodResolver(courseFormSchema),
    defaultValues: {
      topic: "",
      subtopics: [],
      topicsLimit: "4",
      courseType: "Text & Image Course",
      language: "English",
    },
  });

  const paidToad = () => {
    if (!paidMember) {
      toast({
        title: "Go Premium",
        description: "Access all features with a Premium upgrade.",
      });
    }
  };

  const addSubtopic = () => {
    if (subtopics.length < maxSubtopics) {
      if (subtopicInput.trim() === "") return;
      setSubtopics([...subtopics, subtopicInput.trim()]);
      setSubtopicInput("");
      form.setValue("subtopics", [...subtopics, subtopicInput.trim()]);
    } else {
      toast({
        title: "Upgrade to Premium",
        description: "You are limited to adding only 5 subtopics.",
      });
    }
  };

  const onSubmit = async (data: CourseFormValues) => {
    setIsLoading(true);
    setIsSubmitted(true);

    const subtopics = [];
    data.subtopics.forEach((subtopic) => {
      subtopics.push(subtopic);
    });

    const mainTopic = data.topic;
    const lang = data.language;
    const number = data.topicsLimit;

    const prompt = `Strictly in ${lang}, Generate a list of Strict ${number} topics and any number sub topic for each topic for main title ${mainTopic.toLowerCase()}, everything in single line. Those ${number} topics should Strictly include these topics :- ${subtopics
      .join(", ")
      .toLowerCase()}. Strictly Keep theory, youtube, image field empty. Generate in the form of JSON in this format {
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
      provider: selectedProvider || undefined, // Include provider if selected
      model: selectedModel || undefined, // Include model if selected
      temperature: 0.7 // Default temperature for course generation
    };
    
    try {
      const postURL = serverURL + "/api/prompt";
      const res = await axios.post(postURL, dataToSend, {
        withCredentials: true,
      });
      
      const generatedText = res.data.generatedText;
      
      // Log provider metadata if available (for debugging)
      if (res.data.metadata) {
        console.log("Course generated using:", res.data.metadata);
      }
      
      const cleanedJsonString = generatedText
        .replace(/```json/g, "")
        .replace(/```/g, "");
      try {
        const parsedJson = JSON.parse(cleanedJsonString);
        setGeneratedTopics(parsedJson);
        setIsLoading(false);
      } catch (error) {
        console.error("JSON parsing error:", error);
        setIsLoading(false);
        toast({
          title: "Error",
          description: "Failed to parse course content. Please try again.",
        });
      }
    } catch (error) {
      console.error("API request error:", error);
      setIsLoading(false);
      
      // Provide more specific error messages
      const errorMessage = error.response?.data?.message || "Internal Server Error";
      toast({
        title: "Error",
        description: errorMessage,
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
          courseName={form.getValues("topic").toLowerCase()}
          topics={generatedTopics}
          type={selectedType}
          lang={lang.toLowerCase()}
          onClose={handleEditTopics}
          selectedProvider={selectedProvider}
          selectedModel={selectedModel}
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
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Generate Course
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Create AI-powered courses for any topic to enhance learning
          </p>
        </div>

        <Card className="bg-white dark:bg-gray-800 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
              <Sparkles className="h-5 w-5 text-primary" />
              Course Generator
            </CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-300">
              Enter a topic and subtopics to generate comprehensive courses
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addSubtopic();
                          }
                        }}
                      />
                      <Button
                        type="button"
                        onClick={addSubtopic}
                        variant="outline"
                        size="sm"
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Add Sub-Topic
                      </Button>
                    </div>

                    {subtopics.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {subtopics.map((topic, index) => (
                          <div
                            key={index}
                            className="flex items-center gap-2 p-2 bg-muted rounded-md"
                          >
                            <span className="text-sm">{topic}</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="ml-auto h-7 w-7 p-0"
                              onClick={() => {
                                const newSubtopics = subtopics.filter(
                                  (_, i) => i !== index
                                );
                                setSubtopics(newSubtopics);
                                form.setValue("subtopics", newSubtopics);
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
                                <RadioGroupItem
                                  defaultChecked
                                  value="4"
                                  id="r1"
                                />
                                <FormLabel htmlFor="r1" className="mb-0">
                                  5
                                </FormLabel>
                              </div>
                              <div
                                onClick={paidToad}
                                className="flex items-center space-x-2 border p-3 rounded-md"
                              >
                                <RadioGroupItem
                                  disabled={!paidMember}
                                  value="8"
                                  id="r2"
                                />
                                <FormLabel htmlFor="r2" className="mb-0">
                                  10
                                </FormLabel>
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
                                <RadioGroupItem
                                  defaultChecked
                                  value="Text & Image Course"
                                  id="ct1"
                                />
                                <FormLabel htmlFor="ct1" className="mb-0">
                                  Theory & Image Course
                                </FormLabel>
                              </div>
                              <div
                                onClick={paidToad}
                                className="flex items-center space-x-2 border p-3 rounded-md"
                              >
                                <RadioGroupItem
                                  disabled={!paidMember}
                                  value="Video & Text Course"
                                  id="ct2"
                                />
                                <FormLabel htmlFor="ct2" className="mb-0">
                                  Video & Theory Course
                                </FormLabel>
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
                        <Select
                          onValueChange={(selectedValue) => {
                            if (!paidMember) {
                              paidToad();
                            } else {
                              setLang(selectedValue);
                              field.onChange(selectedValue);
                            }
                          }}
                          value={lang}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select language" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {languages.map((country) => (
                              <SelectItem
                                key={country.code}
                                value={country.name}
                              >
                                {country.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />

                  {/* Provider Selection */}
                  <div className="space-y-2">
                    <FormLabel>AI Provider (Optional)</FormLabel>
                    <ProviderSelector
                      selectedProvider={selectedProvider}
                      selectedModel={selectedModel}
                      onProviderChange={setSelectedProvider}
                      onModelChange={setSelectedModel}
                      showHealthStatus={false}
                      showModelSelector={true}
                      showPerformanceIndicators={true}
                      showCostInfo={true}
                      className="border-0 shadow-none"
                    />
                    <p className="text-sm text-muted-foreground">
                      Choose your preferred AI provider for course generation. Performance and cost information is shown to help you decide.
                    </p>
                  </div>

                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="font-medium text-blue-900 dark:text-blue-400 mb-1">
                          What you'll get:
                        </h4>
                        <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-1">
                          <li>• Complete course with modules and lessons</li>
                          <li>• AI-generated content with theory and examples</li>
                          <li>• Progress tracking and completion status</li>
                          <li>• Shareable course with unique link</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={() => onSubmit}
                    type="submit"
                    className="w-full bg-gradient-to-r from-primary to-indigo-500 hover:from-indigo-500 hover:to-primary"
                  >
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate Course
                  </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default GenerateCourse;
