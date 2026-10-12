import { ArrowLeft, Trophy, Shield, Eye, CheckCircle2, Lock, Heart, Users, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import shivrajPhoto from "@/assets/shivraj.jpeg";
import laukikPhoto from "@/assets/laukik.jpeg";

const trustPrinciples = [
  { icon: Shield, title: "Verified mentors with real credentials", color: "text-primary" },
  { icon: Eye, title: "No fake reviews or inflated metrics", color: "text-emerald-500" },
  { icon: CheckCircle2, title: "Clear pricing with no hidden charges", color: "text-blue-500" },
  { icon: Lock, title: "Secure payments and data protection", color: "text-amber-500" },
  { icon: Heart, title: "Ethical growth — users come before numbers", color: "text-rose-500" },
];

const visionGoals = [
  "Become the most trusted mentorship platform for students",
  "Ensure every mentor is verified, accountable, and transparent",
  "Protect students' data, privacy, and payments with strict safeguards",
  "Build long-term relationships, not short-term engagement",
];

const AboutUs = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl mx-auto p-6">
        <Button
          variant="ghost"
          onClick={() => navigate("/home", { replace: true })}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        <h1 className="text-3xl font-bold text-foreground mb-2">About MentSol</h1>
        <p className="text-muted-foreground mb-2">
          Connecting students with expert mentors for personalized guidance
        </p>
        <p className="text-sm font-medium text-primary italic mb-8">
          "Empowering dreams through authentic mentorship"
        </p>

        <div className="space-y-8">
          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-6">Our Founders</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center text-center space-y-4">
                    <Avatar className="w-32 h-32">
                      <AvatarImage src={shivrajPhoto} alt="Shivraj Kumawat" />
                      <AvatarFallback>SK</AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="text-xl font-bold text-foreground">Shivraj Kumawat</h3>
                      <p className="text-primary font-medium">Co-Founder</p>
                      <p className="text-sm text-muted-foreground mt-1">IIIT Pune - CSE</p>
                    </div>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      A passionate Computer Science student from IIIT Pune, Shivraj brings technical expertise and a deep understanding of student challenges. With a vision to bridge the gap between students and quality mentorship, he combines his technical skills with a genuine desire to help others succeed in their academic and career journeys.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center text-center space-y-4">
                    <Avatar className="w-32 h-32">
                      <AvatarImage src={laukikPhoto} alt="Laukik Thakare" />
                      <AvatarFallback>LT</AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="text-xl font-bold text-foreground">Laukik Thakare</h3>
                      <p className="text-primary font-medium">Co-Founder</p>
                      <p className="text-sm text-muted-foreground mt-1">IIT Bombay</p>
                    </div>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      An accomplished student from IIT Bombay, Laukik brings invaluable insights from one of India's premier institutions. His firsthand experience with competitive exams and academic excellence drives MentSol's mission to provide authentic, personalized mentorship that truly makes a difference in students' lives.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>

          <section>
            <div className="flex items-center gap-2 mb-4">
              <Trophy className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-semibold text-foreground">Achievements</h2>
            </div>
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground py-8">
                  Our journey has just begun. Watch this space for exciting milestones!
                </p>
              </CardContent>
            </Card>
          </section>

          {/* 2026 Vision Section */}
          <section className="py-4">
            <div className="text-center mb-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-primary">Our 2026 Vision</span>
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
                Trust Before Scale
              </h2>
              <p className="text-muted-foreground">
                At MentSol, growth is not our first goal — <span className="text-foreground font-medium">trust is</span>.
              </p>
            </div>

            <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-background to-accent/5 mb-6">
              <CardContent className="pt-6 space-y-4">
                <p className="text-muted-foreground leading-relaxed">
                  We believe that a mentorship platform should be built on honesty, safety, and real human impact — not exaggerated numbers.
                </p>
                
                <h3 className="text-lg font-semibold text-foreground">
                  By 2026, our vision is to:
                </h3>
                
                <ul className="space-y-3">
                  {visionGoals.map((goal, index) => (
                    <li key={index} className="flex items-start gap-3 text-sm text-muted-foreground">
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                      </div>
                      <span>{goal}</span>
                    </li>
                  ))}
                </ul>
                
                <div className="pt-4 border-t border-border/50">
                  <p className="text-muted-foreground leading-relaxed">
                    <span className="text-foreground font-medium">Scale will follow trust</span> — not the other way around. Our long-term targets include reaching millions of learners and enabling millions of sessions, but only after trust is earned at every step.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Trust Principles */}
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-foreground text-center mb-4">
                How We Build Trust
              </h3>
              <div className="grid gap-3 md:grid-cols-2">
                {trustPrinciples.map((principle, index) => (
                  <div
                    key={index}
                    className={cn(
                      "flex items-center gap-3 p-4 rounded-xl",
                      "bg-background border border-border/50",
                      "transition-all duration-200 hover:border-primary/30"
                    )}
                  >
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 bg-gradient-to-br from-primary/10 to-primary/5">
                      <principle.icon className={cn("h-5 w-5", principle.color)} />
                    </div>
                    <span className="text-sm font-medium text-foreground">
                      {principle.title}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Transparency Disclaimer */}
            <div className="text-center">
              <div className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-muted/50 border border-border/30">
                <Users className="h-4 w-4 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">
                  All numbers and milestones mentioned above represent long-term goals and vision, not current platform statistics.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4 flex items-center gap-2">
              <span>💡</span> Our Promise
            </h2>
            <Card className="border-primary/30 bg-gradient-to-br from-primary/5 via-accent/5 to-background">
              <CardContent className="pt-6 space-y-4">
                <h3 className="text-xl font-bold text-center text-foreground">
                  Built for Students. Powered by Mentors. Driven by Trust.
                </h3>
                <p className="text-muted-foreground leading-relaxed text-center">
                  MentSol is an early-stage mentorship platform focused on meaningful, 1-to-1 guidance for students. 
                  We believe trust is built through real impact — not fake numbers. 
                  Every mentor is verified, every session is intentional, and every feature is designed to genuinely help learners grow.
                </p>
                <div className="pt-4 border-t border-primary/20">
                  <p className="text-center text-sm text-muted-foreground italic">
                    As a growing platform, our journey has just begun — and you're invited to be part of it.
                  </p>
                </div>
              </CardContent>
            </Card>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">Our Mission</h2>
            <Card>
              <CardContent className="pt-6 space-y-4">
                <p className="text-muted-foreground leading-relaxed">
                  MentSol is committed to democratizing access to quality mentorship. We believe every student deserves personalized guidance from experienced mentors who understand their unique challenges. Our platform connects students with verified experts across various domains, ensuring secure, one-on-one mentorship sessions that drive real results.
                </p>
                <div className="pt-4 border-t border-border">
                  <p className="text-center text-sm font-medium text-primary italic">
                    "Learn from those who've walked the path you're about to take"
                  </p>
                </div>
              </CardContent>
            </Card>
          </section>
        </div>
      </div>
    </div>
  );
};

export default AboutUs;
