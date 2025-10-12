
import React, { useEffect, useRef } from 'react';
import { Upload, Cpu, Layout, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const steps = [
  {
    icon: <Upload className="h-6 w-6 text-primary" />,
    title: "Enter Topics",
    description: "Begin the course creation journey by entering your desired topics and a list of subtopics.",
    color: "from-primary/20 to-primary/5"
  },
  {
    icon: <Cpu className="h-6 w-6 text-primary" />,
    title: "Choose Preferences",
    description: "Choose between Image + Theory or Video + Theory formats for a personalized learning journey.",
    color: "from-primary/30 to-primary/10"
  },
  {
    icon: <Layout className="h-6 w-6 text-primary" />,
    title: "Choose Course Language",
    description: "Choose from 23+ languages in which you want to create a course.",
    color: "from-primary/40 to-primary/20"
  },
  {
    icon: <CheckCircle className="h-6 w-6 text-primary" />,
    title: "AI Magic",
    description: "Watch as our AI processes your inputs to generate a customized course.",
    color: "from-primary/50 to-primary/30"
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
          <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary mb-4">
            Process
          </span>
          <h2 className="how-it-works-title opacity-0 font-display text-3xl md:text-4xl lg:text-5xl font-bold">
            Simple <span className="text-primary">4-Step</span> Course Creation
          </h2>
        </div>
        
        <div ref={stepsRef} className="relative">
          {/* Desktop connector line */}
          <div className="hidden lg:block absolute left-1/2 top-0 bottom-0 w-0.5 bg-border -translate-x-1/2 z-0"></div>
          
          <div className="space-y-12 lg:space-y-0">
            {steps.map((step, index) => (
              <div key={index} className={cn(
                "step-item opacity-0 flex flex-col lg:flex-row lg:items-center gap-8 lg:gap-12",
                index % 2 === 1 ? "lg:flex-row-reverse" : ""
              )}>
                {/* Step number for mobile */}
                <div className="lg:hidden flex items-center gap-4 mb-4">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                    {index + 1}
                  </div>
                  <div className="h-px flex-1 bg-border"></div>
                </div>
                
                {/* Content */}
                <div className="lg:w-1/2 space-y-4">
                  <h3 className="font-display text-2xl font-semibold">{step.title}</h3>
                  <p className="text-muted-foreground text-lg">{step.description}</p>
                </div>
                
                {/* Illustration */}
                <div className="lg:w-1/2 flex justify-center relative">
                  {/* Step number for desktop */}
                  <div className="hidden lg:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 h-12 w-12 rounded-full bg-background border-4 border-primary items-center justify-center">
                    <span className="font-display font-bold text-primary">{index + 1}</span>
                  </div>
                  
                  <div className={cn(
                    "h-48 w-48 rounded-2xl bg-gradient-to-br p-px",
                    step.color
                  )}>
                    <div className="h-full w-full rounded-2xl bg-background flex items-center justify-center">
                      <div className="h-16 w-16 rounded-xl bg-primary/10 flex items-center justify-center">
                        {step.icon}
                      </div>
                    </div>
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
