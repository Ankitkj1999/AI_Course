import React, { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import {
  Zap,
  Book,
  Layers,
  BarChart,
  PenLine,
  RotateCw,
  CreditCard,
  FileText,
} from "lucide-react";

const features = [
  {
    icon: <Zap className="h-6 w-6" />,
    title: "AI-Powered Generation",
    description:
      "Advanced AI algorithms analyze your inputs to generate comprehensive, structured courses instantly.",
  },
  {
    icon: <Book className="h-6 w-6" />,
    title: "Multiple Course Formats",
    description:
      "Choose between Image + Theory, Video + Theory, or Text-only formats for personalized learning.",
  },
  {
    icon: <CreditCard className="h-6 w-6" />,
    title: "Smart Flash Cards",
    description:
      "Auto-generate interactive flash cards from course content for effective memorization and review.",
  },
  {
    icon: <FileText className="h-6 w-6" />,
    title: "Study Guides",
    description:
      "Create comprehensive study guides with key concepts, summaries, and learning objectives.",
  },
  {
    icon: <PenLine className="h-6 w-6" />,
    title: "Interactive Quizzes",
    description:
      "Generate relevant quizzes, assessments, and practice tests to reinforce learning outcomes.",
  },
  {
    icon: <RotateCw className="h-6 w-6" />,
    title: "AI Teacher Chat",
    description:
      "Get instant answers and explanations from your personal AI tutor while studying.",
  },
  {
    icon: <Layers className="h-6 w-6" />,
    title: "23+ Languages",
    description:
      "Generate courses in multiple languages with AI-powered translation and localization.",
  },
  {
    icon: <BarChart className="h-6 w-6" />,
    title: "PWA & Offline Access",
    description:
      "Install as a mobile app and access your courses offline. Export to PDF for easy sharing and printing.",
  },
];

const Features = () => {
  const featuresRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: "0px",
      threshold: 0.1,
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("animate-fade-up");
          entry.target.classList.remove("opacity-0");
          observer.unobserve(entry.target);
        }
      });
    }, observerOptions);

    const elements = featuresRef.current?.querySelectorAll(".feature-item");
    elements?.forEach((el, index) => {
      // Add staggered delay
      el.classList.add(`delay-[${index * 100}ms]`);
      observer.observe(el);
    });

    return () => {
      elements?.forEach((el) => {
        observer.unobserve(el);
      });
    };
  }, []);

  return (
    <section
      id="features"
      className="py-20 md:py-32 px-6 md:px-10 bg-secondary/50 relative"
    >
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16 md:mb-24">
          <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary mb-4">
            Features
          </span>
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold">
            Everything You Need to Create <br className="hidden md:block" />
            <span className="text-primary">Exceptional Courses</span>
          </h2>
        </div>

        <div
          ref={featuresRef}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {features.map((feature, index) => (
            <div
              key={index}
              className="feature-item opacity-0 bg-card shadow-sm hover:shadow-lg hover:shadow-primary/10 transition-all duration-500 rounded-xl p-8 border border-border/50 hover:border-primary/20 group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-primary/0 via-primary/50 to-primary/0 group-hover:h-1 transition-all duration-500" />
              <div className="absolute bottom-0 right-0 w-0 h-0.5 bg-gradient-to-l from-primary/0 via-primary/50 to-primary/0 group-hover:w-full transition-all duration-500" />
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-5 text-primary group-hover:bg-primary/20 group-hover:scale-110 transition-all duration-500">
                {feature.icon}
              </div>
              <h3 className="font-display text-xl font-semibold mb-3 group-hover:text-primary transition-colors duration-300">
                {feature.title}
              </h3>
              <p className="text-muted-foreground group-hover:text-foreground/80 transition-colors duration-300">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
