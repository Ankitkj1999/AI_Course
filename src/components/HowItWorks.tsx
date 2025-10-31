
import React, { useEffect, useRef } from 'react';
import { PenTool, Sparkles, Globe, Rocket, CreditCard, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

const steps = [
  {
    icon: <PenTool className="h-7 w-7" />,
    title: "Define Your Learning Path",
    description: "Enter your topic and subtopics. Our AI understands your learning goals and creates a structured curriculum tailored to your needs.",
    features: ["Custom topics", "Subtopic planning", "Learning objectives"],
    gradient: "from-blue-500/20 to-primary/10"
  },
  {
    icon: <Sparkles className="h-7 w-7" />,
    title: "AI Content Generation",
    description: "Choose your preferred format and watch our AI create comprehensive courses with theory, visuals, and interactive elements.",
    features: ["Text & Image courses", "Video & Theory courses", "Interactive quizzes"],
    gradient: "from-primary/20 to-purple-500/10"
  },
  {
    icon: <Globe className="h-7 w-7" />,
    title: "Global Accessibility",
    description: "Generate courses in 23+ languages with AI-powered translation, making learning accessible to a global audience.",
    features: ["23+ languages", "Cultural adaptation", "Localized content"],
    gradient: "from-green-500/20 to-primary/10"
  },
  {
    icon: <CreditCard className="h-7 w-7" />,
    title: "Enhanced Learning Tools",
    description: "Access advanced features like flashcards, study guides, and AI teacher chat for a complete learning experience.",
    features: ["Smart flashcards", "Study guides", "AI teacher chat"],
    gradient: "from-orange-500/20 to-primary/10"
  },
  {
    icon: <Rocket className="h-7 w-7" />,
    title: "Launch & Learn",
    description: "Your course is ready! Study online, download for offline access, or install as a PWA for the ultimate learning experience.",
    features: ["PWA support", "Offline access", "Progress tracking"],
    gradient: "from-primary/20 to-pink-500/10"
  }
];

const HowItWorks = () => {
  const stepsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: '0px',
      threshold: 0.1,
    };
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-fade-up');
          entry.target.classList.remove('opacity-0');
          observer.unobserve(entry.target);
        }
      });
    }, observerOptions);
    
    const titleEl = document.querySelector('.how-it-works-title');
    if (titleEl) observer.observe(titleEl);
    
    const elements = stepsRef.current?.querySelectorAll('.step-item');
    elements?.forEach((el, index) => {
      // Add staggered delay based on index
      el.setAttribute('style', `transition-delay: ${index * 150}ms`);
      observer.observe(el);
    });
    
    return () => {
      if (titleEl) observer.unobserve(titleEl);
      elements?.forEach(el => {
        observer.unobserve(el);
      });
    };
  }, []);

  return (
    <section id="how-it-works" className="py-20 md:py-32 px-6 md:px-10 relative">
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16 md:mb-20">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary mb-4">
            <Sparkles className="h-3.5 w-3.5 mr-1.5" />
            How It Works
          </span>
          <h2 className="how-it-works-title opacity-0 font-display text-3xl md:text-4xl lg:text-5xl font-bold">
            From Idea to <br className="hidden md:block" />
            <span className="text-primary">Complete Course</span> in Minutes
          </h2>
          <p className="mt-4 text-muted-foreground text-lg max-w-2xl mx-auto">
            Our AI-powered platform transforms your learning goals into comprehensive, interactive courses with just a few clicks.
          </p>
        </div>
        
        <div ref={stepsRef} className="relative">
          {/* Modern flowing connector */}
          <div className="hidden lg:block absolute left-8 top-20 bottom-20 w-0.5 bg-gradient-to-b from-primary/50 via-primary/20 to-primary/50 z-0"></div>
          
          <div className="grid gap-8 lg:gap-12">
            {steps.map((step, index) => (
              <div key={index} className="step-item opacity-0 group relative">
                <div className="flex flex-col lg:flex-row lg:items-start gap-6 lg:gap-8">
                  {/* Step indicator */}
                  <div className="flex-shrink-0 relative">
                    <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary/15 to-primary/5 group-hover:from-primary/25 group-hover:to-primary/15 flex items-center justify-center transition-all duration-500 group-hover:scale-110 shadow-lg group-hover:shadow-xl group-hover:shadow-primary/25">
                      <div className="text-primary transition-transform duration-500 group-hover:scale-110">
                        {step.icon}
                      </div>
                    </div>
                    {/* Step number badge */}
                    <div className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
                      {index + 1}
                    </div>
                  </div>
                  
                  {/* Content card */}
                  <div className="flex-1 group relative bg-card rounded-2xl p-6 lg:p-8 border border-border/50 transition-all duration-300 hover:shadow-lg overflow-hidden">
                    {/* Subtle edge glow on hover */}
                    <div className="absolute -inset-px bg-gradient-to-r from-primary/20 via-primary/5 to-primary/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10" />
                    
                    <div className="space-y-4">
                      <h3 className="font-display text-xl lg:text-2xl font-semibold group-hover:text-primary transition-colors duration-300">
                        {step.title}
                      </h3>
                      
                      <p className="text-muted-foreground group-hover:text-foreground/80 transition-colors duration-300 leading-relaxed">
                        {step.description}
                      </p>
                      
                      {/* Feature highlights */}
                      <div className="flex flex-wrap gap-2 pt-2">
                        {step.features.map((feature, idx) => (
                          <span 
                            key={idx}
                            className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20"
                          >
                            {feature}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    {/* Gradient accent */}
                    <div className={cn(
                      "absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl opacity-20 group-hover:opacity-30 transition-opacity duration-500 rounded-2xl",
                      step.gradient
                    )} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
