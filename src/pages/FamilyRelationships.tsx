import { useNavigate } from "react-router-dom";
import { ArrowLeft, Heart, Users, Baby, Shield, CheckCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const relationshipCategories = [
  {
    id: 'love-romantic',
    title: 'Love & Romantic Relationships',
    description: 'Dating, compatibility & relationship guidance',
    icon: Heart,
    color: 'from-rose-600 to-pink-700',
    certified: 'RCI Registered',
    popular: true
  },
  {
    id: 'family-relationships',
    title: 'Family Relationships',
    description: 'Parent-child, sibling & family dynamics',
    icon: Users,
    color: 'from-blue-600 to-indigo-700',
    certified: 'LMFT Licensed',
    popular: false
  },
  {
    id: 'marital-issues',
    title: 'Marital Issues',
    description: 'Marriage counseling & conflict resolution',
    icon: Heart,
    color: 'from-purple-600 to-violet-700',
    certified: 'LMFT Certified',
    popular: true
  },
  {
    id: 'parenting-child',
    title: 'Parenting & Child',
    description: 'Child psychology & positive parenting',
    icon: Baby,
    color: 'from-teal-600 to-cyan-700',
    certified: 'RCI Registered',
    popular: false
  },
  {
    id: 'elder-care',
    title: 'Elder Care & Relationships',
    description: 'Senior care & caregiver support',
    icon: Users,
    color: 'from-amber-600 to-orange-700',
    certified: 'Certified Professional',
    popular: false
  }
];

const FamilyRelationships = () => {
  const navigate = useNavigate();

  const handleCardClick = (subcategoryId: string) => {
    navigate(`/category/family-relationships/${subcategoryId}`);
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
              <h1 className="text-2xl font-bold">Family & Relationships</h1>
              <p className="text-sm text-muted-foreground">Professional counseling from government registered experts</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-6 space-y-8">
        {/* Categories Section */}
        <section>
          <div className="mb-4">
            <h2 className="text-xl font-semibold mb-2">Choose Your Area</h2>
            <p className="text-muted-foreground text-sm">
              Connect with certified relationship and family counselors
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {relationshipCategories.map((category) => {
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
                        {category.popular && (
                          <Badge variant="default" className="text-xs">
                            Popular
                          </Badge>
                        )}
                        <Badge variant="secondary" className="text-xs bg-success/10 text-success border-success/20">
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

        {/* Info Card */}
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Why Choose Our Relationship Experts?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2" />
              <p className="text-sm text-muted-foreground">
                <strong>Government Registered:</strong> All counselors are RCI registered or LMFT certified professionals
              </p>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2" />
              <p className="text-sm text-muted-foreground">
                <strong>100% Confidential:</strong> Your privacy is our highest priority
              </p>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2" />
              <p className="text-sm text-muted-foreground">
                <strong>Evidence-Based Approach:</strong> Proven techniques for lasting relationship improvement
              </p>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2" />
              <p className="text-sm text-muted-foreground">
                <strong>Safe Space:</strong> Non-judgmental environment for open communication
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FamilyRelationships;
