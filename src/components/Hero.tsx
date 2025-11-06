import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";

const useTypewriter = (
  words: string[],
  typeSpeed = 150,
  deleteSpeed = 100,
  pauseTime = 2000
) => {
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [currentText, setCurrentText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    const currentWord = words[currentWordIndex];

    const timeout = setTimeout(
      () => {
        if (isPaused) {
          setIsPaused(false);
          setIsDeleting(true);
          return;
        }

        if (isDeleting) {
          if (currentText === "") {
            setIsDeleting(false);
            setCurrentWordIndex((prev) => (prev + 1) % words.length);
          } else {
            setCurrentText(currentWord.substring(0, currentText.length - 1));
          }
        } else {
          if (currentText === currentWord) {
            setIsPaused(true);
          } else {
            setCurrentText(currentWord.substring(0, currentText.length + 1));
          }
        }
      },
      isPaused ? pauseTime : isDeleting ? deleteSpeed : typeSpeed
    );

    return () => clearTimeout(timeout);
  }, [
    currentText,
    currentWordIndex,
    isDeleting,
    isPaused,
    words,
    typeSpeed,
    deleteSpeed,
    pauseTime,
  ]);

  return currentText;
};

const Hero = () => {
  const textRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Words to cycle through in the typewriter effect
  const typewriterWords = [
    "Complete Courses",
    "Interactive Quizzes",
    "Smart Flash Cards",
    "Study Guides",
    "Learning Paths",
    "Practice Tests",
  ];

  const animatedText = useTypewriter(typewriterWords, 120, 80, 1500);

  useEffect(() => {
    // Check authentication status
    const auth = localStorage.getItem("auth");
    setIsAuthenticated(auth === "true");
  }, []);

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

    const elements = textRef.current?.querySelectorAll(".animate-on-scroll");
    elements?.forEach((el) => {
      observer.observe(el);
    });

    return () => {
      elements?.forEach((el) => {
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
            <span className="block md:mt-2 text-primary min-h-[1.2em] flex items-center justify-center">
              <span className="relative flex items-center">
                {animatedText}
                <span className="inline-block w-1 h-[1.1em] bg-primary ml-1 animate-[blink_1s_ease-in-out_infinite] align-middle"></span>
              </span>
            </span>
          </h1>

          <p className="animate-on-scroll opacity-0 text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto">
            Easily create personalized courses tailored to your needs. Interact
            with an AI teacher chat, generate courses in 23+ languages, and test
            your knowledge with AI-generated quizzes. Download courses for
            offline access and take notes as you go. Transform your learning
            experience today!
          </p>

          <div className="animate-on-scroll opacity-0 flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Button
              onClick={() =>
                navigate(isAuthenticated ? "/dashboard" : "/signup")
              }
              size="lg"
              className="w-full sm:w-auto font-medium"
            >
              {isAuthenticated ? "Go to Dashboard" : "Start Creating Now"}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            {!isAuthenticated && (
              <Button
                onClick={() => navigate("/login")}
                variant="outline"
                size="lg"
                className="w-full sm:w-auto font-medium"
              >
                Sign In
              </Button>
            )}
          </div>
        </div>

        {/* Abstract Visualization */}
        <div className="mt-16 md:mt-20 relative max-w-5xl mx-auto rounded-xl overflow-hidden shadow-xl">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-primary/5 z-0"></div>
          <div className="relative z-10 aspect-video bg-white rounded-xl overflow-hidden">
            <video
              className="w-full h-full object-cover"
              autoPlay
              muted
              loop
              playsInline
            >
              <source
                src="https://zalon-prod-image-processing-bkt.s3.ap-south-1.amazonaws.com/TEST/AI+Course.mp4"
                type="video/mp4"
              />
              Your browser does not support the video tag.
            </video>
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
