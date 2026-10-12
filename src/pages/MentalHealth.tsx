import { useNavigate } from "react-router-dom";
import { ArrowLeft, Target, Brain, Heart, Sparkles } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const mentalHealthSupport = [
  {
    id: 'life-coaching',
    title: 'Life Coaching & Motivation',
    description: 'Personal development and goal achievement',
    icon: Target,
    color: 'from-green-600 to-emerald-700',
    popular: true
  },
  {
    id: 'psychiatric-counseling',
    title: 'Psychiatric Counseling',
    description: 'Professional mental health support',
    icon: Brain,
    color: 'from-teal-600 to-cyan-700',
    verified: true
  },
  {
    id: 'depression-mental-wellness',
    title: 'Depression & Mental Wellness',
    description: 'Stress, anxiety, depression support and recovery guidance',
    icon: Heart,
    color: 'from-blue-500 to-purple-600',
    popular: true
  }
];

const MentalHealth = () => {
  const navigate = useNavigate();

  const handleCardClick = (subcategoryId: string) => {
    navigate(`/category/mental-health/${subcategoryId}`);
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
              <h1 className="text-2xl font-bold">Mental Health & Motivation</h1>
              <p className="text-sm text-muted-foreground">Expert guidance for mental wellness and personal growth</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-6 space-y-8">
        {/* Mental Health Section */}
        <section>
          <div className="mb-4">
            <h2 className="text-xl font-semibold mb-2">Professional Support</h2>
            <p className="text-muted-foreground text-sm">
              Connect with experts who understand your journey
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {mentalHealthSupport.map((category) => {
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
                      {category.popular && (
                        <Badge variant="default" className="text-xs">
                          <Sparkles className="h-3 w-3 mr-1" />
                          Popular
                        </Badge>
                      )}
                      {category.verified && (
                        <Badge variant="secondary" className="text-xs">
                          Verified
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="text-lg mt-3">{category.title}</CardTitle>
                    <CardDescription>{category.description}</CardDescription>
                  </CardHeader>
                </Card>
              );
            })}
          </div>
        </section>

        {/* Info Card */}
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-primary" />
              Why Choose Our Mental Health Professionals?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2" />
              <p className="text-sm text-muted-foreground">
                <strong>Expert Guidance:</strong> Licensed therapists and certified life coaches
              </p>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2" />
              <p className="text-sm text-muted-foreground">
                <strong>Personalized Approach:</strong> Tailored strategies for your unique needs
              </p>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2" />
              <p className="text-sm text-muted-foreground">
                <strong>Safe Environment:</strong> Comfortable space to share and grow
              </p>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2" />
              <p className="text-sm text-muted-foreground">
                <strong>Proven Methods:</strong> Evidence-based techniques for lasting change
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MentalHealth;