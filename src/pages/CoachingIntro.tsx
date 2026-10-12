import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  ArrowLeft, Users, TrendingUp, ShieldCheck, Monitor, 
  BarChart3, CalendarCheck, BookOpen, RefreshCw, Sparkles, ArrowRight 
} from "lucide-react";
import { motion } from "framer-motion";

const features = [
  {
    icon: Users,
    title: "Personalized Mentorship",
    description: "Students get one-to-one mentorship from IIT & AIIMS students. They relate better — like an elder brother or sister guiding them through their journey.",
  },
  {
    icon: TrendingUp,
    title: "Strong Marketing Advantage",
    description: "More trust from parents means more admissions. IIT/AIIMS mentor-backed coaching creates a powerful brand advantage and higher revenue.",
  },
  {
    icon: ShieldCheck,
    title: "Parent Trust System",
    description: "Parents can directly interact with IIT/AIIMS mentors, building confidence in your coaching institute and increasing retention.",
  },
  {
    icon: Monitor,
    title: "Complete Digital Platform",
    description: "Student records, test tracking, doubt solving, and study materials — all in one place. Fully digital operations for your coaching.",
  },
  {
    icon: BarChart3,
    title: "Advanced Test Series",
    description: "All India ranking system with detailed analytics. Track student performance at a national level with comprehensive test infrastructure.",
  },
  {
    icon: CalendarCheck,
    title: "Monthly PTM",
    description: "Mentor-led Parent-Teacher Meetings that showcase student progress, build trust, and keep parents engaged with their child's preparation.",
  },
  {
    icon: BookOpen,
    title: "Topper Notes & Strategies",
    description: "Access insights and strategies from AIR rankers. Share proven study methods and topper notes with your students.",
  },
  {
    icon: RefreshCw,
    title: "One-Shot Revision & Backlog Support",
    description: "Structured revision cycles and backlog clearing support to ensure no student falls behind in their preparation.",
  },
];

const CoachingIntro = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-lg border-b border-border/50 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/", { replace: true })} className="rounded-full">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <span className="font-semibold text-foreground">MentSol for Coaching</span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-12">
        {/* Hero */}
        <motion.div 
          className="text-center space-y-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
            <Sparkles className="w-4 h-4" />
            For Coaching Institutes
          </div>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground leading-tight">
            Transform Your Coaching into a{" "}
            <span className="text-primary">Premium Learning Platform</span>{" "}
            with MentSol 🚀
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Built by IIT Bombay students to help coaching institutes grow, scale, and deliver world-class mentorship.
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid gap-5 md:grid-cols-2">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.06, duration: 0.4 }}
            >
              <Card className="p-5 h-full border-border/50 hover:border-primary/30 transition-colors">
                <div className="flex gap-4">
                  <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <f.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">{f.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{f.description}</p>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <motion.div 
          className="text-center space-y-4 pb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
        >
          <Button 
            size="lg" 
            variant="premium"
            className="text-base px-8 py-6 gap-2"
            onClick={() => navigate("/coaching/register")}
          >
            Register Your Coaching <ArrowRight className="w-5 h-5" />
          </Button>
          <p className="text-xs text-muted-foreground">
            No commitment required. Our team will reach out after review.
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default CoachingIntro;
