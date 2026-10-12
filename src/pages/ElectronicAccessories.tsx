import { useNavigate } from "react-router-dom";
import { ArrowLeft, Laptop, Smartphone, Headphones, Gamepad2, Home as HomeIcon, Camera, Watch, Battery, Award, Shield } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const electronicCategories = [
  {
    id: 'laptop-guide',
    title: 'Laptop Buying Guide',
    description: 'Expert advice on laptops for work, gaming & students',
    icon: Laptop,
    color: 'from-blue-600 to-cyan-700',
    popular: true
  },
  {
    id: 'mobile-guide',
    title: 'Mobile & Smartphone Guide',
    description: 'Best mobile recommendations & comparisons',
    icon: Smartphone,
    color: 'from-purple-600 to-pink-700',
    popular: true
  },
  {
    id: 'headphones-audio',
    title: 'Headphones & Audio',
    description: 'Headphones, earbuds, speakers & sound systems',
    icon: Headphones,
    color: 'from-green-600 to-teal-700',
    popular: true
  },
  {
    id: 'gaming-accessories',
    title: 'Gaming Accessories',
    description: 'Gaming keyboards, mice, controllers & setups',
    icon: Gamepad2,
    color: 'from-red-600 to-orange-700'
  },
  {
    id: 'smart-home',
    title: 'Smart Home Devices',
    description: 'Smart speakers, lights, cameras & automation',
    icon: HomeIcon,
    color: 'from-indigo-600 to-blue-700'
  },
  {
    id: 'cameras-photography',
    title: 'Cameras & Photography',
    description: 'DSLRs, mirrorless, action cams & accessories',
    icon: Camera,
    color: 'from-amber-600 to-yellow-700'
  },
  {
    id: 'wearables',
    title: 'Wearables & Fitness',
    description: 'Smartwatches, fitness bands & health trackers',
    icon: Watch,
    color: 'from-rose-600 to-pink-700'
  },
  {
    id: 'charging-power',
    title: 'Charging & Power Banks',
    description: 'Fast chargers, power banks & cables',
    icon: Battery,
    color: 'from-cyan-600 to-blue-700'
  }
];

const ElectronicAccessories = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="flex items-center gap-4 p-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/home')}
            className="shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-bold">Electronic Accessories</h1>
            <p className="text-sm text-muted-foreground">Tech experts & buying guides</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Trust Banner */}
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Shield className="h-6 w-6 text-primary mt-1 shrink-0" />
              <div>
                <h3 className="font-semibold mb-1">Expert Tech Guidance</h3>
                <p className="text-sm text-muted-foreground">
                  Get personalized recommendations from certified tech experts with hands-on experience across all major brands and categories.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Categories Grid */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Choose Your Category</h2>
          
          {electronicCategories.map((category) => {
            const Icon = category.icon;
            return (
              <Card
                key={category.id}
                className="cursor-pointer hover:shadow-lg transition-all duration-300 overflow-hidden border-2 hover:border-primary/50"
                onClick={() => navigate(`/category/electronic-accessories/${category.id}`)}
              >
                <div className={`h-2 bg-gradient-to-r ${category.color}`} />
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <div className={`p-2 rounded-lg bg-gradient-to-br ${category.color}`}>
                          <Icon className="h-5 w-5 text-white" />
                        </div>
                        <CardTitle className="text-lg">{category.title}</CardTitle>
                      </div>
                      <CardDescription className="text-sm">
                        {category.description}
                      </CardDescription>
                    </div>
                    {category.popular && (
                      <Badge variant="secondary" className="shrink-0">
                        Popular
                      </Badge>
                    )}
                  </div>
                </CardHeader>
              </Card>
            );
          })}
        </div>

        {/* Why Choose Our Experts */}
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Award className="h-5 w-5 text-primary" />
              Why Consult Our Tech Experts?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-3">
              <Shield className="h-4 w-4 text-primary mt-1 shrink-0" />
              <div>
                <p className="text-sm font-medium">Unbiased Recommendations</p>
                <p className="text-xs text-muted-foreground">
                  Get honest advice not influenced by brand partnerships
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Award className="h-4 w-4 text-primary mt-1 shrink-0" />
              <div>
                <p className="text-sm font-medium">Hands-On Experience</p>
                <p className="text-xs text-muted-foreground">
                  Experts with real-world testing across multiple brands
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Laptop className="h-4 w-4 text-primary mt-1 shrink-0" />
              <div>
                <p className="text-sm font-medium">Budget-Specific Guidance</p>
                <p className="text-xs text-muted-foreground">
                  Best recommendations tailored to your budget range
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Smartphone className="h-4 w-4 text-primary mt-1 shrink-0" />
              <div>
                <p className="text-sm font-medium">Latest Market Insights</p>
                <p className="text-xs text-muted-foreground">
                  Stay updated with current deals and new launches
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* What You'll Get */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">What You'll Get</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-primary" />
              <span className="text-muted-foreground">Detailed product comparisons & spec analysis</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-primary" />
              <span className="text-muted-foreground">Best value for money recommendations</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-primary" />
              <span className="text-muted-foreground">Where to buy & current deals/offers</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-primary" />
              <span className="text-muted-foreground">Future-proof buying advice</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-primary" />
              <span className="text-muted-foreground">After-sales support guidance</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-primary" />
              <span className="text-muted-foreground">Warranty & insurance recommendations</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ElectronicAccessories;
