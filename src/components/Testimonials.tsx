
import React, { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Star } from 'lucide-react';
import { appName } from '@/constants';

const testimonials = [
  {
    quote: `${appName} saved me at least 40 hours of work on my last course. What used to take weeks now takes minutes, and the quality is even better.`,
    author: "Sarah Johnson",
    title: "Online Course Creator",
    stars: 5
  },
  {
    quote: `As a university professor, I was skeptical about AI-generated content. But ${appName} perfectly structured my research into a comprehensive course for my students.`,
    author: "Prof. David Chen",
    title: "Computer Science Department",
    stars: 5
  },
  {
    quote: `Our training team uses ${appName} to create onboarding content for new employees. We've reduced development time by 80% while improving engagement metrics.`,
    author: "Michael Rodriguez",
    title: "Head of L&D, TechCorp",
    stars: 5
  },
  {
    quote: "The quiz generation feature alone is worth the subscription. It creates thoughtful assessments that actually test comprehension, not just memorization.",
    author: "Emma Wilson",
    title: "Educational Consultant",
    stars: 4
  }
];

const Testimonials = () => {
  const testimonialsRef = useRef<HTMLDivElement>(null);
  
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
    
    const titleEl = document.querySelector('.testimonials-title');
    if (titleEl) observer.observe(titleEl);
    
    const elements = testimonialsRef.current?.querySelectorAll('.testimonial-item');
    elements?.forEach((el, index) => {
      // Add staggered delay
      el.setAttribute('style', `transition-delay: ${index * 100}ms`);
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
    <section className="py-20 md:py-32 px-6 md:px-10 bg-secondary/50 relative">
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16 md:mb-24">
          <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary mb-4">
            Testimonials
          </span>
          <h2 className="testimonials-title opacity-0 font-display text-3xl md:text-4xl lg:text-5xl font-bold">
            Trusted by <span className="text-primary">Educators</span> &<br className="hidden md:block" />
            <span className="text-primary">Learning Professionals</span>
          </h2>
        </div>
        
        <div 
          ref={testimonialsRef} 
          className="grid md:grid-cols-2 gap-8"
        >
          {testimonials.map((testimonial, index) => (
            <div 
              key={index} 
              className="testimonial-item opacity-0 bg-card shadow-sm hover:shadow-md transition-all duration-300 rounded-xl p-8 border border-border/50 flex flex-col"
            >
              <div className="flex mb-4">
                {Array.from({ length: testimonial.stars }).map((_, i) => (
                  <Star key={i} className="h-5 w-5 fill-primary text-primary" />
                ))}
                {Array.from({ length: 5 - testimonial.stars }).map((_, i) => (
                  <Star key={i} className="h-5 w-5 text-muted-foreground" />
                ))}
              </div>
              <blockquote className="flex-1 text-lg font-medium mb-6">
                "{testimonial.quote}"
              </blockquote>
              <div>
                <p className="font-semibold">{testimonial.author}</p>
                <p className="text-muted-foreground text-sm">{testimonial.title}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
