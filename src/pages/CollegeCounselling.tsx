import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, GraduationCap, Stethoscope, Building2, Globe, Hospital, Target, MapPin, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const CollegeCounselling = () => {
  const navigate = useNavigate();
  const [selectedState, setSelectedState] = useState<string>('');

  const engineeringStages = [
    {
      id: 'iit-nit-iiit',
      title: 'IIT, NIT & IIIT Counselling',
      description: 'Expert guidance for top government engineering colleges',
      icon: GraduationCap,
      color: 'from-blue-500 to-cyan-500',
      popular: true
    },
    {
      id: 'other-engineering',
      title: 'Other Engineering Colleges',
      description: 'State universities, deemed universities & private colleges',
      icon: Building2,
      color: 'from-primary to-accent'
    }
  ];

  const medicalStages = [
    {
      id: 'aiims-top-gmc',
      title: 'AIIMS & Top GMC',
      description: 'Premium government medical colleges counselling',
      icon: Hospital,
      color: 'from-red-500 to-pink-500',
      popular: true
    },
    {
      id: 'private-state-medical',
      title: 'Private & State Medical Colleges',
      description: 'State government & private MBBS colleges counselling',
      icon: Building2,
      color: 'from-orange-500 to-amber-500'
    },
    {
      id: 'foreign-mbbs',
      title: 'Foreign MBBS',
      description: 'International medical education guidance',
      icon: Globe,
      color: 'from-green-500 to-emerald-500'
    }
  ];

  const indianStates = [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
    'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
    'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
    'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
    'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
    'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Delhi', 'Jammu & Kashmir'
  ];

  const StageCard = ({ stage, department }: { stage: typeof engineeringStages[0], department: 'engineering' | 'medical' }) => {
    const Icon = stage.icon;
    
    return (
      <Card
        onClick={() => navigate(`/category/counselling/${department}/${stage.id}`)}
        className="cursor-pointer hover:shadow-lg transition-all"
      >
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${stage.color} flex items-center justify-center shrink-0`}>
              <Icon className="w-7 h-7 text-white" />
            </div>
            {stage.popular && (
              <Badge className="bg-primary text-primary-foreground">Popular</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <h3 className="font-semibold text-lg mb-2">{stage.title}</h3>
          <p className="text-sm text-muted-foreground">{stage.description}</p>
        </CardContent>
      </Card>
    );
  };

  const handleStateCETClick = () => {
    if (selectedState) {
      navigate(`/category/counselling/cet/${selectedState.toLowerCase().replace(/\s+/g, '-')}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/home", { replace: true })}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">College Counselling</h1>
              <p className="text-sm text-muted-foreground">Expert guidance for your college journey</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 max-w-4xl space-y-8">
        {/* College Predictor Button */}
        <Button
          onClick={() => navigate('/college-predictor')}
          className="w-full h-auto py-4 rounded-2xl shadow-lg flex items-center justify-center gap-3 bg-gradient-to-r from-primary to-accent hover:shadow-xl transition-all"
        >
          <Target className="w-6 h-6" />
          <div className="text-left">
            <div className="text-lg font-semibold">College Predictor</div>
            <div className="text-sm opacity-90">Predict your college based on your rank</div>
          </div>
        </Button>

        {/* State CET Counselling */}
        <Card className="border-purple-500/30 bg-gradient-to-br from-purple-500/10 to-violet-500/5">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-violet-500 flex items-center justify-center">
                <MapPin className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-lg">State CET Counselling</CardTitle>
                <p className="text-sm text-muted-foreground">Select your state for CET guidance</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Select value={selectedState} onValueChange={setSelectedState}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select your state" />
              </SelectTrigger>
              <SelectContent>
                {indianStates.map((state) => (
                  <SelectItem key={state} value={state}>
                    {state}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button 
              onClick={handleStateCETClick} 
              disabled={!selectedState}
              className="w-full"
            >
              <span>Find CET Mentors</span>
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </CardContent>
        </Card>

        {/* Engineering Section */}
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Engineering Counselling</h2>
              <p className="text-sm text-muted-foreground">For JEE Main & JEE Advanced aspirants</p>
            </div>
          </div>
          
          <div className="grid gap-4">
            {engineeringStages.map(stage => (
              <StageCard key={stage.id} stage={stage} department="engineering" />
            ))}
          </div>
        </div>

        {/* Medical Section */}
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-pink-500 flex items-center justify-center">
              <Stethoscope className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Medical Counselling</h2>
              <p className="text-sm text-muted-foreground">For NEET aspirants</p>
            </div>
          </div>
          
          <div className="grid gap-4">
            {medicalStages.map(stage => (
              <StageCard key={stage.id} stage={stage} department="medical" />
            ))}
          </div>
        </div>

        {/* Info Card */}
        <Card className="bg-gradient-to-br from-primary/10 to-accent/10 border-primary/20">
          <CardContent className="py-6">
            <h3 className="font-semibold mb-2">Why College Counselling?</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">✓</span>
                <span>Expert guidance on college selection based on your rank</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">✓</span>
                <span>Branch selection strategies for better career prospects</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">✓</span>
                <span>Counselling round strategies and choice filling tips</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">✓</span>
                <span>Document preparation and admission process help</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CollegeCounselling;