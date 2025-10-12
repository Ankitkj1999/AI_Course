
import React, { useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Logo from '../res/screenshot.png';

const Hero = () => {
  const textRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

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

    const elements = textRef.current?.querySelectorAll('.animate-on-scroll');
    elements?.forEach(el => {
      observer.observe(el);
    });

    return () => {
      elements?.forEach(el => {
        observer.unobserve(el);
      });
    };
  }, []);

  return (
    <section className="pt-32 pb-16 md:pt-40 md:pb-24 px-6 md:px-10 overflow-hidden relative">
      <div className="absolute top-0 inset-x-0 h-96 bg-gradient-to-b from-primary/5 to-transparent" />

      <div className="max-w-7xl mx-auto relative">
        <div ref={textRef} className="text-center max-w-4xl mx-auto space-y-6">
          <div className="animate-on-scroll opacity-0 flex items-center justify-center">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
              <Sparkles className="h-3.5 w-3.5 mr-1.5" />
              AI-Powered Course Creation
            </span>
          </div>

          <h1 className="animate-on-scroll opacity-0 font-display text-4xl md:text-5xl lg:text-7xl font-bold tracking-tight">
            Transform Text into
            <span className="block md:mt-2 text-primary"> Complete Courses</span>
          </h1>

          <p className="animate-on-scroll opacity-0 text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto">
            Easily create personalized courses tailored to your needs.
            Interact with an AI teacher chat, generate courses in 23+ languages, and test your knowledge with AI-generated quizzes.
            Download courses for offline access and take notes as you go. Transform your learning experience today!
          </p>

          <div className="animate-on-scroll opacity-0 flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Button onClick={() => navigate("/dashboard")} size="lg" className="w-full sm:w-auto font-medium">
              Start Creating Now
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Abstract Visualization */}
        <div className="mt-16 md:mt-20 relative max-w-5xl mx-auto rounded-xl overflow-hidden shadow-xl">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-primary/5 z-0"></div>
          <div className="relative z-10 aspect-video bg-white rounded-xl overflow-hidden">
            <div className="flex gap-6">
              <img src={Logo} alt="Screenshot" />
            </div>
          </div>
        </div>

        {/* Circle decoration */}
        <div className="absolute top-1/4 -left-20 w-40 h-40 bg-primary/5 rounded-full filter blur-3xl"></div>
        <div className="absolute bottom-1/4 -right-20 w-60 h-60 bg-primary/10 rounded-full filter blur-3xl"></div>
      </div>
    </section>
  );
};

export default Hero;
