import { useNavigate } from "react-router-dom";
import { ArrowLeft, Pill, Wine, Cigarette, Smartphone, Shield, CheckCircle, Award, Users, TrendingUp, Lock, Heart, Clock, Target } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const certifications = [
  {
    title: "RCI Registered",
    description: "Rehabilitation Council of India",
    icon: Award,
  },
  {
    title: "NAADAC Certified",
    description: "National Addiction Counselors",
    icon: CheckCircle,
  },
  {
    title: "Licensed Therapists",
    description: "Clinical Psychology Experts",
    icon: Shield,
  },
];

const successStories = [
  {
    name: "Rahul K.",
    age: 28,
    issue: "Alcohol Addiction",
    duration: "3 months",
    story: "I've been sober for 8 months now. The counselor helped me understand my triggers and build healthier coping mechanisms. Forever grateful.",
    rating: 5,
  },
  {
    name: "Priya M.",
    age: 24,
    issue: "Digital Addiction",
    duration: "2 months",
    story: "Spent 6+ hours daily on phone. Now I've regained control of my time and focus. My productivity has increased tremendously.",
    rating: 5,
  },
  {
    name: "Anonymous",
    age: 32,
    issue: "Drug Addiction",
    duration: "6 months",
    story: "The confidential support gave me courage to seek help. 1 year clean now and rebuilding my life with my family's support.",
    rating: 5,
  },
];

const recoveryProcess = [
  {
    step: 1,
    title: "Initial Assessment",
    description: "Confidential evaluation of your situation",
    icon: CheckCircle,
  },
  {
    step: 2,
    title: "Personalized Plan",
    description: "Custom recovery strategy designed for you",
    icon: Target,
  },
  {
    step: 3,
    title: "Regular Sessions",
    description: "Weekly counseling and progress tracking",
    icon: Clock,
  },
  {
    step: 4,
    title: "Long-term Support",
    description: "Ongoing guidance and relapse prevention",
    icon: Heart,
  },
];

const addictionCounseling = [
  {
    id: 'drug-addiction',
    title: 'Drug Addiction',
    description: 'Professional help for substance abuse recovery',
    icon: Pill,
    color: 'from-red-600 to-red-800',
    confidential: true,
    certified: 'RCI Registered'
  },
  {
    id: 'alcohol-addiction',
    title: 'Alcohol Addiction',
    description: 'Quit drinking with expert support',
    icon: Wine,
    color: 'from-amber-600 to-orange-700',
    confidential: true,
    certified: 'NAADAC Certified'
  },
  {
    id: 'tobacco-addiction',
    title: 'Tobacco Addiction',
    description: 'Stop smoking & chewing tobacco',
    icon: Cigarette,
    color: 'from-gray-600 to-slate-700',
    confidential: true,
    certified: 'Licensed Therapist'
  },
  {
    id: 'digital-phone-addiction',
    title: 'Digital & Phone Addiction',
    description: 'Phone, social media, reels & screen addiction recovery',
    icon: Smartphone,
    color: 'from-blue-600 to-indigo-700',
    confidential: true,
    certified: 'Certified Coach'
  }
];

const AddictionCounselling = () => {
  const navigate = useNavigate();

  const handleCardClick = (subcategoryId: string) => {
    navigate(`/category/addiction-counselling/${subcategoryId}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/home", { replace: true })}
              className="rounded-full"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Addiction Counselling</h1>
              <p className="text-sm text-muted-foreground">Confidential support for overcoming addictions</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-6 space-y-8">
        {/* Trust Section */}
        <section>
          <Card className="bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
            <CardContent className="pt-6 text-center">
              <h2 className="text-xl font-bold text-foreground mb-2">
                Confidential. Professional. Caring.
              </h2>
              <p className="text-sm text-muted-foreground max-w-xl mx-auto">
                We connect you with certified counselors who specialize in addiction recovery. 
                Your privacy is protected, and every conversation is judgment-free.
              </p>
              <div className="flex flex-wrap justify-center gap-3 mt-4">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-background border border-border/50">
                  <Lock className="h-4 w-4 text-primary" />
                  <span className="text-xs font-medium">100% Confidential</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-background border border-border/50">
                  <Shield className="h-4 w-4 text-emerald-500" />
                  <span className="text-xs font-medium">Licensed Professionals</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-background border border-border/50">
                  <Heart className="h-4 w-4 text-rose-500" />
                  <span className="text-xs font-medium">Judgment-Free</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Certified Counselors Badge Section */}
        <section>
          <h2 className="text-xl font-semibold mb-4">Our Certified Counselors</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {certifications.map((cert, index) => {
              const Icon = cert.icon;
              return (
                <Card key={index} className="border-primary/20">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{cert.title}</p>
                        <p className="text-xs text-muted-foreground">{cert.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        {/* Addiction Counseling Section */}
        <section>
          <div className="mb-4">
            <h2 className="text-xl font-semibold mb-2">Choose Your Area of Support</h2>
            <p className="text-muted-foreground text-sm">
              Connect with certified counselors specialized in addiction recovery
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {addictionCounseling.map((category) => {
              const Icon = category.icon;
              return (
                <Card
                  key={category.id}
                  className="cursor-pointer hover:shadow-lg transition-all duration-300 hover:-translate-y-1 overflow-hidden group"
                  onClick={() => handleCardClick(category.id)}
                >
                  <div className={`h-2 bg-gradient-to-r ${category.color}`} />
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className={`p-3 rounded-lg bg-gradient-to-br ${category.color} text-white`}>
                        <Icon className="h-6 w-6" />
                      </div>
                      <div className="flex flex-col gap-1">
                        {category.confidential && (
                          <Badge variant="secondary" className="text-xs">
                            <Shield className="h-3 w-3 mr-1" />
                            Confidential
                          </Badge>
                        )}
                        <Badge variant="outline" className="text-xs bg-success/10 text-success border-success/20">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          {category.certified}
                        </Badge>
                      </div>
                    </div>
                    <CardTitle className="text-lg mt-3">{category.title}</CardTitle>
                    <CardDescription>{category.description}</CardDescription>
                  </CardHeader>
                </Card>
              );
            })}
          </div>
        </section>

        {/* Recovery Process Timeline */}
        <section>
          <h2 className="text-xl font-semibold mb-4">Your Recovery Journey</h2>
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {recoveryProcess.map((step) => {
                  const Icon = step.icon;
                  return (
                    <div key={step.step} className="text-center">
                      <div className="mb-3 flex items-center justify-center">
                        <div className="relative">
                          <div className="p-3 rounded-full bg-primary/10">
                            <Icon className="h-6 w-6 text-primary" />
                          </div>
                          <div className="absolute -top-1 -right-1 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">
                            {step.step}
                          </div>
                        </div>
                      </div>
                      <h3 className="font-semibold mb-1">{step.title}</h3>
                      <p className="text-xs text-muted-foreground">{step.description}</p>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Success Stories */}
        <section>
          <h2 className="text-xl font-semibold mb-4">Success Stories</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {successStories.map((story, index) => (
              <Card key={index} className="bg-gradient-to-br from-success/5 to-success/10 border-success/20">
                <CardHeader>
                  <div className="flex items-start gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {story.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold">{story.name}</p>
                          <p className="text-xs text-muted-foreground">{story.age} years • {story.issue}</p>
                        </div>
                      </div>
                      <div className="flex gap-1 mt-1">
                        {Array.from({ length: story.rating }).map((_, i) => (
                          <CheckCircle key={i} className="h-3 w-3 fill-success text-success" />
                        ))}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground italic">"{story.story}"</p>
                  <div className="mt-3 flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      <Clock className="h-3 w-3 mr-1" />
                      {story.duration} program
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Info Card */}
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Why Choose Our Counselors?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2" />
              <p className="text-sm text-muted-foreground">
                <strong>100% Confidential:</strong> Your privacy is our top priority
              </p>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2" />
              <p className="text-sm text-muted-foreground">
                <strong>Licensed Professionals:</strong> Certified addiction counselors with proven track records
              </p>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2" />
              <p className="text-sm text-muted-foreground">
                <strong>Flexible Sessions:</strong> Book counseling at your convenience
              </p>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2" />
              <p className="text-sm text-muted-foreground">
                <strong>Judgment-Free Support:</strong> Safe space for recovery and healing
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AddictionCounselling;