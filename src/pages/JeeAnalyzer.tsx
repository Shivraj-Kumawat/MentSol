import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, TrendingUp, Calculator } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { jeeMainsData } from '@/data/jeeMainsData';
import { jeeAdvancedData } from '@/data/jeeAdvancedData';
import { useToast } from '@/hooks/use-toast';

type Category = 'general' | 'obc' | 'ews' | 'sc' | 'st';

export default function JeeAnalyzer() {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Mains State
  const [mainsMarks, setMainsMarks] = useState('');
  const [mainsYear, setMainsYear] = useState('');
  const [mainsSession, setMainsSession] = useState('');
  const [mainsShift, setMainsShift] = useState('');
  const [mainsCategory, setMainsCategory] = useState<Category>('general');
  const [mainsResult, setMainsResult] = useState<{
    marks: number;
    percentile: string;
    categoryRank: number;
    air: number;
    category: Category;
    year: string;
    session: string;
    shift: string;
  } | null>(null);

  // Advanced State
  const [advancedMarks, setAdvancedMarks] = useState('');
  const [advancedYear, setAdvancedYear] = useState('');
  const [advancedCategory, setAdvancedCategory] = useState<Category>('general');
  const [advancedResult, setAdvancedResult] = useState<{
    marks: number;
    rank: number;
    air: number;
    category: Category;
    year: string;
  } | null>(null);

  const categoryLabels: Record<Category, string> = {
    general: 'General',
    obc: 'OBC-NCL',
    ews: 'EWS',
    sc: 'SC',
    st: 'ST'
  };

  const categoryColors: Record<Category, string> = {
    general: 'from-blue-500 to-indigo-600',
    obc: 'from-green-500 to-emerald-600',
    ews: 'from-purple-500 to-pink-600',
    sc: 'from-orange-500 to-red-600',
    st: 'from-teal-500 to-cyan-600'
  };

  // Get unique years and sessions
  const mainsYears = [...new Set(jeeMainsData.map(d => d.year))].sort((a, b) => b - a);
  const mainsSessions = mainsYear 
    ? [...new Set(jeeMainsData.filter(d => d.year === parseInt(mainsYear)).map(d => d.session))]
    : [];
  const mainsShifts = mainsYear && mainsSession
    ? jeeMainsData.filter(d => d.year === parseInt(mainsYear) && d.session === mainsSession).map(d => d.shift)
    : [];

  const advancedYears = [...new Set(jeeAdvancedData.map(d => d.year))].sort((a, b) => b - a);

  // Get category-specific candidate numbers for JEE Mains
  const getCategoryCandidates = (category: Category): number => {
    const totalCandidates = 1200000; // JEE Mains 2024 approximate total
    const categoryDistribution: Record<Category, number> = {
      general: 0.44,  // 44% - ~528,000
      obc: 0.27,      // 27% - ~324,000
      ews: 0.10,      // 10% - ~120,000
      sc: 0.15,       // 15% - ~180,000
      st: 0.04        // 4% - ~48,000
    };
    return Math.round(totalCandidates * categoryDistribution[category]);
  };

  const calculateMainsPercentile = () => {
    const marks = parseFloat(mainsMarks);
    if (!marks || marks < 0 || marks > 300) {
      toast({
        title: "Invalid Marks",
        description: "Please enter marks between 0 and 300",
        variant: "destructive",
      });
      return;
    }

    if (!mainsYear || !mainsSession || !mainsShift) {
      toast({
        title: "Incomplete Information",
        description: "Please select year, session, and shift",
        variant: "destructive",
      });
      return;
    }

    const shiftData = jeeMainsData.find(
      d => d.year === parseInt(mainsYear) && 
           d.session === mainsSession && 
           d.shift === mainsShift
    );

    if (!shiftData) {
      toast({
        title: "Data Not Found",
        description: "No data available for selected combination",
        variant: "destructive",
      });
      return;
    }

    // Find percentile by comparing marks with category-specific data
    const categoryMarks = shiftData.percentileData.map(d => ({
      percentile: d.percentile,
      marks: d[mainsCategory]
    })).sort((a, b) => b.marks - a.marks);

    let percentile = 0;
    for (let i = 0; i < categoryMarks.length; i++) {
      if (marks >= categoryMarks[i].marks) {
        percentile = categoryMarks[i].percentile;
        break;
      }
      if (i < categoryMarks.length - 1 && marks < categoryMarks[i].marks && marks > categoryMarks[i + 1].marks) {
        // Interpolate
        const p1 = categoryMarks[i].percentile;
        const p2 = categoryMarks[i + 1].percentile;
        const m1 = categoryMarks[i].marks;
        const m2 = categoryMarks[i + 1].marks;
        percentile = p1 - ((marks - m1) / (m2 - m1)) * (p1 - p2);
        break;
      }
    }

    if (percentile === 0 && marks < categoryMarks[categoryMarks.length - 1].marks) {
      percentile = Math.max(0, categoryMarks[categoryMarks.length - 1].percentile - 5);
    }

    // Calculate Category Rank using category-specific candidate numbers
    const categoryCandidates = getCategoryCandidates(mainsCategory);
    const categoryRank = Math.round(categoryCandidates * (100 - percentile) / 100);
    
    // Calculate AIR using total candidates
    const totalCandidates = 1200000;

    // Calculate AIR using General category percentile for same marks
    const generalMarks = shiftData.percentileData.map(d => ({
      percentile: d.percentile,
      marks: d.general
    })).sort((a, b) => b.marks - a.marks);

    let airPercentile = 0;
    for (let i = 0; i < generalMarks.length; i++) {
      if (marks >= generalMarks[i].marks) {
        airPercentile = generalMarks[i].percentile;
        break;
      }
      if (i < generalMarks.length - 1 && marks < generalMarks[i].marks && marks > generalMarks[i + 1].marks) {
        // Interpolate
        const p1 = generalMarks[i].percentile;
        const p2 = generalMarks[i + 1].percentile;
        const m1 = generalMarks[i].marks;
        const m2 = generalMarks[i + 1].marks;
        airPercentile = p1 - ((marks - m1) / (m2 - m1)) * (p1 - p2);
        break;
      }
    }
    
    if (airPercentile === 0 && marks < generalMarks[generalMarks.length - 1].marks) {
      airPercentile = Math.max(0, generalMarks[generalMarks.length - 1].percentile - 5);
    }

    const air = Math.round(totalCandidates * (100 - airPercentile) / 100);

    setMainsResult({
      marks,
      percentile: percentile.toFixed(4),
      categoryRank,
      air,
      category: mainsCategory,
      year: mainsYear,
      session: mainsSession,
      shift: mainsShift
    });
  };

  const calculateAdvancedRank = () => {
    const marks = parseFloat(advancedMarks);
    if (!marks || marks < 0 || marks > 360) {
      toast({
        title: "Invalid Marks",
        description: "Please enter marks between 0 and 360",
        variant: "destructive",
      });
      return;
    }

    if (!advancedYear) {
      toast({
        title: "Incomplete Information",
        description: "Please select year",
        variant: "destructive",
      });
      return;
    }

    const yearData = jeeAdvancedData.find(d => d.year === parseInt(advancedYear));

    if (!yearData) {
      toast({
        title: "Data Not Found",
        description: "No data available for selected year",
        variant: "destructive",
      });
      return;
    }

    // Find rank by comparing marks with category-specific data
    const categoryMarks = yearData.rankData.map(d => ({
      rank: d.rank,
      marks: d[advancedCategory]
    })).sort((a, b) => b.marks - a.marks);

    let rank = 0;
    for (let i = 0; i < categoryMarks.length; i++) {
      if (marks >= categoryMarks[i].marks) {
        rank = categoryMarks[i].rank;
        break;
      }
      if (i < categoryMarks.length - 1 && marks < categoryMarks[i].marks && marks > categoryMarks[i + 1].marks) {
        // Interpolate
        const r1 = categoryMarks[i].rank;
        const r2 = categoryMarks[i + 1].rank;
        const m1 = categoryMarks[i].marks;
        const m2 = categoryMarks[i + 1].marks;
        rank = Math.round(r1 + ((m1 - marks) / (m1 - m2)) * (r2 - r1));
        break;
      }
    }

    if (rank === 0 && marks < categoryMarks[categoryMarks.length - 1].marks) {
      rank = Math.round(categoryMarks[categoryMarks.length - 1].rank * 1.5);
    }

    // Calculate AIR using General category for same marks
    const generalMarks = yearData.rankData.map(d => ({
      rank: d.rank,
      marks: d.general
    })).sort((a, b) => b.marks - a.marks);

    let air = 0;
    for (let i = 0; i < generalMarks.length; i++) {
      if (marks >= generalMarks[i].marks) {
        air = generalMarks[i].rank;
        break;
      }
      if (i < generalMarks.length - 1 && marks < generalMarks[i].marks && marks > generalMarks[i + 1].marks) {
        // Interpolate
        const r1 = generalMarks[i].rank;
        const r2 = generalMarks[i + 1].rank;
        const m1 = generalMarks[i].marks;
        const m2 = generalMarks[i + 1].marks;
        air = Math.round(r1 + ((m1 - marks) / (m1 - m2)) * (r2 - r1));
        break;
      }
    }

    if (air === 0 && marks < generalMarks[generalMarks.length - 1].marks) {
      air = Math.round(generalMarks[generalMarks.length - 1].rank * 1.5);
    }

    setAdvancedResult({
      marks,
      rank,
      air,
      category: advancedCategory,
      year: advancedYear
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 backdrop-blur-xl bg-background/80 border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/exams/jee')}
              className="rounded-xl"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-glow">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold">JEE Marks Analyzer</h1>
                <p className="text-xs text-muted-foreground">Calculate Your Percentile/Rank</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto p-4">
        <Tabs defaultValue="mains" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="mains">JEE Mains</TabsTrigger>
            <TabsTrigger value="advanced">JEE Advanced</TabsTrigger>
          </TabsList>

          {/* JEE Mains */}
          <TabsContent value="mains" className="space-y-4">
            <Card className="glass">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  Calculate Your Percentile
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    <strong>Important:</strong> Select Year, Session, and Shift for accurate percentile calculation. Percentile varies by 3-4% across different shifts.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="mains-marks">Your Marks (Out of 300)</Label>
                  <Input
                    id="mains-marks"
                    type="number"
                    min="0"
                    max="300"
                    placeholder="Enter your marks"
                    value={mainsMarks}
                    onChange={(e) => setMainsMarks(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Year</Label>
                    <Select value={mainsYear} onValueChange={setMainsYear}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Year" />
                      </SelectTrigger>
                      <SelectContent>
                        {mainsYears.map(year => (
                          <SelectItem key={year} value={year.toString()}>
                            {year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Session</Label>
                    <Select 
                      value={mainsSession} 
                      onValueChange={setMainsSession}
                      disabled={!mainsYear}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Session" />
                      </SelectTrigger>
                      <SelectContent>
                        {mainsSessions.map(session => (
                          <SelectItem key={session} value={session}>
                            {session}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Shift</Label>
                    <Select 
                      value={mainsShift} 
                      onValueChange={setMainsShift}
                      disabled={!mainsSession}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Shift" />
                      </SelectTrigger>
                      <SelectContent>
                        {mainsShifts.map((shift, idx) => (
                          <SelectItem key={idx} value={shift}>
                            {shift}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select 
                      value={mainsCategory} 
                      onValueChange={(v) => setMainsCategory(v as Category)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(Object.keys(categoryLabels) as Category[]).map(cat => (
                          <SelectItem key={cat} value={cat}>
                            {categoryLabels[cat]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button 
                  className="w-full bg-gradient-to-r from-blue-500 to-indigo-600"
                  onClick={calculateMainsPercentile}
                >
                  Calculate Percentile
                </Button>
              </CardContent>
            </Card>

            {/* Mains Result */}
            {mainsResult && (
              <Card className="glass border-2 border-primary/30 bg-gradient-to-br from-primary/10 to-accent/10">
                <CardHeader>
                  <CardTitle className="text-lg">Your Result</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg bg-gradient-to-br from-blue-500/10 to-purple-500/10">
                      <p className="text-sm text-muted-foreground mb-1">Your Marks</p>
                      <p className="text-2xl font-bold">{mainsResult.marks} / 300</p>
                    </div>
                    <div className="p-4 rounded-lg bg-gradient-to-br from-primary/10 to-primary/20">
                      <p className="text-sm text-muted-foreground mb-1">Percentile</p>
                      <p className={`text-2xl font-bold bg-gradient-to-r ${categoryColors[mainsResult.category]} bg-clip-text text-transparent`}>
                        {mainsResult.percentile}%
                      </p>
                    </div>
                    <div className="p-4 rounded-lg bg-gradient-to-br from-accent/10 to-accent/20">
                      <p className="text-sm text-muted-foreground mb-1">Estimated {categoryLabels[mainsResult.category]} Rank</p>
                      <p className="text-2xl font-bold">~{mainsResult.categoryRank.toLocaleString()}</p>
                    </div>
                    <div className="p-4 rounded-lg bg-gradient-to-br from-green-500/10 to-emerald-500/10">
                      <p className="text-sm text-muted-foreground mb-1">Estimated AIR (General)</p>
                      <p className="text-2xl font-bold">~{mainsResult.air.toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">{mainsResult.year}</Badge>
                    <Badge variant="secondary">{mainsResult.session}</Badge>
                    <Badge variant="secondary">{mainsResult.shift}</Badge>
                    <Badge variant="outline">{categoryLabels[mainsResult.category]}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    * Estimated percentile and ranks based on historical data. Actual results may vary.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* JEE Advanced */}
          <TabsContent value="advanced" className="space-y-4">
            <Card className="glass">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  Calculate Your Rank
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="advanced-marks">Your Marks (Out of 360)</Label>
                  <Input
                    id="advanced-marks"
                    type="number"
                    min="0"
                    max="360"
                    placeholder="Enter your marks"
                    value={advancedMarks}
                    onChange={(e) => setAdvancedMarks(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Year</Label>
                    <Select value={advancedYear} onValueChange={setAdvancedYear}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Year" />
                      </SelectTrigger>
                      <SelectContent>
                        {advancedYears.map(year => (
                          <SelectItem key={year} value={year.toString()}>
                            {year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select 
                      value={advancedCategory} 
                      onValueChange={(v) => setAdvancedCategory(v as Category)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(Object.keys(categoryLabels) as Category[]).map(cat => (
                          <SelectItem key={cat} value={cat}>
                            {categoryLabels[cat]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button 
                  className="w-full bg-gradient-to-r from-blue-500 to-indigo-600"
                  onClick={calculateAdvancedRank}
                >
                  Calculate Rank
                </Button>
              </CardContent>
            </Card>

            {/* Advanced Result */}
            {advancedResult && (
              <Card className="glass border-2 border-primary/30 bg-gradient-to-br from-primary/10 to-accent/10">
                <CardHeader>
                  <CardTitle className="text-lg">Your Result</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg bg-gradient-to-br from-blue-500/10 to-purple-500/10">
                      <p className="text-sm text-muted-foreground mb-1">Your Marks</p>
                      <p className="text-2xl font-bold">{advancedResult.marks} / 360</p>
                    </div>
                    <div className="p-4 rounded-lg bg-gradient-to-br from-accent/10 to-accent/20">
                      <p className="text-sm text-muted-foreground mb-1">{categoryLabels[advancedResult.category]} Rank</p>
                      <p className={`text-2xl font-bold bg-gradient-to-r ${categoryColors[advancedResult.category]} bg-clip-text text-transparent`}>
                        ~{advancedResult.rank.toLocaleString()}
                      </p>
                    </div>
                    <div className="p-4 rounded-lg bg-gradient-to-br from-green-500/10 to-emerald-500/10 col-span-2">
                      <p className="text-sm text-muted-foreground mb-1">AIR (General)</p>
                      <p className="text-2xl font-bold">~{advancedResult.air.toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">{advancedResult.year}</Badge>
                    <Badge variant="outline">{categoryLabels[advancedResult.category]}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    * Estimated category rank and AIR based on historical data. Actual results may vary.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
