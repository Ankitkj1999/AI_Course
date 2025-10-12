
import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { appName } from '@/constants';
import { useNavigate } from 'react-router-dom';

const CTA = () => {
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

    const ctaEl = document.querySelector('.cta-container');
    if (ctaEl) observer.observe(ctaEl);

    return () => {
      if (ctaEl) observer.unobserve(ctaEl);
    };
  }, []);

  return (
    <section className="py-20 md:py-32 px-6 md:px-10 bg-primary/5 relative">
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      <div className="max-w-5xl mx-auto">
        <div className="cta-container opacity-0 bg-card rounded-2xl p-8 md:p-12 border border-border/50 shadow-xl overflow-hidden relative">
          {/* Abstract shapes */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary/5 rounded-full translate-y-1/2 -translate-x-1/2"></div>

          <div className="text-center max-w-3xl mx-auto relative z-10">
            <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
              Transform your content into engaging courses today
            </h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join thousands of educators, trainers, and content creators who are saving time and creating better learning experiences with {appName}.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Button onClick={() => navigate("/dashboard")} size="lg" className="font-medium">
                Start Creating Now
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section >
  );
};

export default CTA;
