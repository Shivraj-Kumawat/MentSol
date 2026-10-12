import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, Share2, GraduationCap, MapPin, TrendingUp, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { collegesCutoffData } from '@/data/collegesCutoff';
import { predictColleges, groupCollegesByProbability, getExamName, getCategoryName, PredictedCollege } from '@/utils/collegePrediction';
import { useEffect, useState } from 'react';

const CollegeResults = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const formData = location.state as { exam: string; rank: string; category: string } | null;

  const [filteredColleges, setFilteredColleges] = useState<PredictedCollege[]>([]);

  useEffect(() => {
    if (!formData) {
      navigate('/college-predictor');
      return;
    }

    const predictions = predictColleges(
      formData.exam,
      parseInt(formData.rank),
      formData.category,
      collegesCutoffData
    );
    setFilteredColleges(predictions);
  }, [formData, navigate]);

  if (!formData) {
    return null;
  }

  const groupedColleges = groupCollegesByProbability(filteredColleges);

  const getProbabilityBadgeVariant = (probability: string) => {
    switch (probability) {
      case 'high':
        return 'default';
      case 'medium':
        return 'secondary';
      case 'low':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const CollegeCard = ({ college }: { college: PredictedCollege }) => {
    const categoryKey = formData.category.toLowerCase() as keyof typeof college.cutoffs;
    const cutoff = college.cutoffs[categoryKey];

    return (
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <CardTitle className="text-lg mb-1">{college.name}</CardTitle>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>{college.location}</span>
              </div>
            </div>
            <Badge variant={getProbabilityBadgeVariant(college.probability)} className="shrink-0">
              {college.probabilityText}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{college.branch}</span>
          </div>
          
          <div className="grid grid-cols-2 gap-4 p-3 bg-muted/50 rounded-lg">
            <div>
              <p className="text-xs text-muted-foreground">Cutoff Rank ({getCategoryName(formData.category)})</p>
              <p className="font-semibold">{cutoff.closing.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Your Rank</p>
              <p className="font-semibold">{parseInt(formData.rank).toLocaleString()}</p>
            </div>
          </div>

          {college.safetyMargin !== undefined && (
            <div className="flex items-center gap-2 text-sm">
              <TrendingUp className="h-4 w-4" />
              <span>
                {college.safetyMargin > 0 
                  ? `${college.safetyMargin}% safety margin` 
                  : `${Math.abs(college.safetyMargin)}% above cutoff`}
              </span>
            </div>
          )}

          {college.fees && (
            <div className="text-sm text-muted-foreground">
              Annual Fees: <span className="font-medium text-foreground">{college.fees}</span>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b sticky top-0 bg-background/95 backdrop-blur z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate("/college-predictor", { replace: true })}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold">College Predictions</h1>
                <p className="text-sm text-muted-foreground">Based on your rank and preferences</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 max-w-6xl">
        {/* Summary Card */}
        <Card className="mb-6 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Exam</p>
                <p className="font-semibold text-lg">{getExamName(formData.exam)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Your Rank</p>
                <p className="font-semibold text-lg">{parseInt(formData.rank).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Category</p>
                <p className="font-semibold text-lg">{getCategoryName(formData.category)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-muted-foreground">
            Found <span className="font-semibold text-foreground">{filteredColleges.length}</span> college options for you
          </p>
        </div>

        {/* Results by Probability */}
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="all">
              All ({filteredColleges.length})
            </TabsTrigger>
            <TabsTrigger value="high">
              High Chance ({groupedColleges.high.length})
            </TabsTrigger>
            <TabsTrigger value="medium">
              Moderate ({groupedColleges.medium.length})
            </TabsTrigger>
            <TabsTrigger value="low">
              Dream ({groupedColleges.low.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            {filteredColleges.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <GraduationCap className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-xl font-semibold mb-2">No colleges found</h3>
                  <p className="text-muted-foreground mb-4">
                    We couldn't find any colleges matching your criteria.
                  </p>
                  <Button onClick={() => navigate('/college-predictor')}>
                    Try Different Criteria
                  </Button>
                </CardContent>
              </Card>
            ) : (
              filteredColleges.map(college => (
                <CollegeCard key={college.id} college={college} />
              ))
            )}
          </TabsContent>

          <TabsContent value="high" className="space-y-4">
            {groupedColleges.high.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">No high chance colleges found</p>
                </CardContent>
              </Card>
            ) : (
              groupedColleges.high.map(college => (
                <CollegeCard key={college.id} college={college} />
              ))
            )}
          </TabsContent>

          <TabsContent value="medium" className="space-y-4">
            {groupedColleges.medium.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">No moderate chance colleges found</p>
                </CardContent>
              </Card>
            ) : (
              groupedColleges.medium.map(college => (
                <CollegeCard key={college.id} college={college} />
              ))
            )}
          </TabsContent>

          <TabsContent value="low" className="space-y-4">
            {groupedColleges.low.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">No dream colleges found</p>
                </CardContent>
              </Card>
            ) : (
              groupedColleges.low.map(college => (
                <CollegeCard key={college.id} college={college} />
              ))
            )}
          </TabsContent>
        </Tabs>

        {/* CTA Card */}
        <Card className="mt-8 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="py-8 text-center">
            <GraduationCap className="h-12 w-12 mx-auto mb-4 text-primary" />
            <h3 className="text-xl font-semibold mb-2">Need Expert Guidance?</h3>
            <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
              Connect with our experienced counselors to get personalized college recommendations 
              and application strategies tailored to your profile.
            </p>
            <Button size="lg" onClick={() => navigate('/home')}>
              Talk to Counselor
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CollegeResults;
