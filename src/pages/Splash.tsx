import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CheckCircle2 } from "lucide-react";

const Splash = () => {
  const navigate = useNavigate();
  const { session, loading } = useAuth();
  const [currentTagline, setCurrentTagline] = useState(0);

  const taglines = [
    "Mindful Solutions for Mindful Growth",
    "Expert Guidance. Real Experience. Your Success.",
    "Transform Your Future Today",
    "Where Experience Meets Aspiration",
    "Your Success Story Starts Here",
    "Real Mentors. Real Results. Real Growth.",
    "Empowering Dreams Through Expert Guidance",
    "Connect. Learn. Achieve. Excel.",
    "From Their Journey to Your Success",
    "Building Futures, One Session at a Time",
  ];

  useEffect(() => {
    // Rotate taglines
    const interval = setInterval(() => {
      setCurrentTagline((prev) => (prev + 1) % taglines.length);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Wait for auth to load
    if (loading) return;

    const timer = setTimeout(() => {
      // If user is logged in, go to home, otherwise show portal selection
      if (session) {
        navigate("/home");
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [navigate, session, loading]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/10 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Animated Background Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-64 h-64 bg-primary/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 right-10 w-80 h-80 bg-accent/10 rounded-full blur-3xl animate-float-delayed" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-teal-glow/5 rounded-full blur-3xl animate-pulse-slow" />
      </div>

      {/* Back Button */}
      <div className="absolute top-6 left-6 z-10">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/", { replace: true })}
          className="rounded-full hover:bg-primary/10"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
      </div>

      <div className="max-w-6xl w-full animate-fade-in space-y-12 relative z-10">
        {/* Header */}
        <div className="text-center space-y-6">
          <div className="space-y-4 animate-slide-up">
            <h1 className="text-6xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent animate-gradient">
              MentSol
            </h1>
            
            <p className="text-3xl text-foreground font-bold">
              Learn from the ones who've lived it.
            </p>
            
            {/* Rotating Taglines */}
            <div className="h-8 flex items-center justify-center">
              <p className="text-lg text-muted-foreground animate-fade-in transition-opacity duration-500">
                {taglines[currentTagline]}
              </p>
            </div>

            {/* Trust Statement */}
            <div className="pt-4 max-w-xl mx-auto">
              <p className="text-sm text-muted-foreground text-center leading-relaxed">
                Every mentor is verified. Every session is meaningful. 
                We're building trust through real impact, not numbers.
              </p>
            </div>
          </div>
        </div>

        {/* Portal Selection Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Student Portal Card */}
          <div className="group animate-slide-up" style={{ animationDelay: "200ms" }}>
            <div className="relative p-8 rounded-3xl bg-gradient-to-br from-primary/10 via-accent/5 to-background border-2 border-primary/30 hover:border-primary hover:shadow-premium transition-all duration-300 card-hover backdrop-blur-sm">
              {/* Trending Badge */}
              <div className="absolute -top-3 -right-3">
                <div className="bg-gradient-to-r from-primary to-accent text-primary-foreground px-4 py-1 rounded-full text-xs font-semibold shadow-glow">
                  🔥 Trending
                </div>
              </div>

              <div className="space-y-6 relative z-10">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-glow group-hover:scale-110 transition-transform">
                  <span className="text-4xl">🎓</span>
                </div>
                
                <div className="space-y-3">
                  <h2 className="text-3xl font-bold text-foreground">Find Your Perfect Mentor</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    Connect with verified mentors who've achieved what you aspire for. Get personalized guidance for exams, career, and life goals.
                  </p>
                </div>

                <ul className="space-y-3 text-sm">
                  {[
                    "One-to-one mentorship sessions",
                    "JEE, NEET, CAT & 50+ exams",
                    "Career & college counseling",
                    "Mental health & life coaching"
                  ].map((feature, index) => (
                    <li key={index} className="flex items-center gap-3">
                      <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                      <span className="text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>

                <div className="flex gap-3 pt-4">
                  <button 
                    onClick={() => navigate('/home?mode=guest')}
                    className="flex-1 py-4 px-6 rounded-xl border-2 border-primary text-primary font-semibold hover:bg-primary/10 transition-all duration-300 hover:scale-105"
                  >
                    Explore
                  </button>
                  <button 
                    onClick={() => {
                      if (session) {
                        navigate('/home');
                      } else {
                        navigate('/auth?role=student');
                      }
                    }}
                    className="flex-1 py-4 px-6 rounded-xl bg-gradient-to-r from-primary to-accent text-primary-foreground font-semibold hover:opacity-90 transition-all duration-300 shadow-glow hover:shadow-premium hover:scale-105"
                  >
                    Sign Up
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Mentor Portal Card */}
          <div className="group animate-slide-up" style={{ animationDelay: "300ms" }}>
            <div className="relative p-8 rounded-3xl bg-gradient-to-br from-secondary/10 via-navy-light/5 to-background border-2 border-secondary/30 hover:border-secondary hover:shadow-premium transition-all duration-300 card-hover backdrop-blur-sm">
              {/* Popular Badge */}
              <div className="absolute -top-3 -right-3">
                <div className="bg-gradient-to-r from-secondary to-navy-light text-secondary-foreground px-4 py-1 rounded-full text-xs font-semibold shadow-glow">
                  ⭐ Popular
                </div>
              </div>

              <div className="space-y-6 relative z-10">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-secondary to-navy-light flex items-center justify-center shadow-glow group-hover:scale-110 transition-transform">
                  <span className="text-4xl">👨‍🏫</span>
                </div>
                
                <div className="space-y-3">
                  <h2 className="text-3xl font-bold text-foreground">Share Your Knowledge & Earn</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    Become a mentor and help students achieve their dreams. Share your experience, guide their journey, and earn while making an impact.
                  </p>
                </div>

                <ul className="space-y-3 text-sm">
                  {[
                    "Flexible scheduling & rates",
                    "Secure payment processing",
                    "Build your reputation",
                    "Make a lasting impact"
                  ].map((feature, index) => (
                    <li key={index} className="flex items-center gap-3">
                      <CheckCircle2 className="h-5 w-5 text-secondary flex-shrink-0" />
                      <span className="text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>

                <div className="flex gap-3 pt-4">
                  <button 
                    onClick={() => navigate('/mentor-info')}
                    className="flex-1 py-4 px-6 rounded-xl border-2 border-secondary text-secondary font-semibold hover:bg-secondary/10 transition-all duration-300 hover:scale-105"
                  >
                    Learn More
                  </button>
                  <button 
                    onClick={() => {
                      if (session) {
                        navigate('/mentor/dashboard');
                      } else {
                        navigate('/auth?role=mentor');
                      }
                    }}
                    className="flex-1 py-4 px-6 rounded-xl bg-gradient-to-r from-secondary to-navy-light text-secondary-foreground font-semibold hover:opacity-90 transition-all duration-300 shadow-glow hover:shadow-premium hover:scale-105"
                  >
                    Sign Up
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Splash;
