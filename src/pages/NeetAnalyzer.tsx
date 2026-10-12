import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Heart, Calculator } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { neetData } from '@/data/neetData';
import { useToast } from '@/hooks/use-toast';

type Category = 'general' | 'obc' | 'ews' | 'sc' | 'st';

export default function NeetAnalyzer() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [marks, setMarks] = useState('');
  const [year, setYear] = useState('');
  const [category, setCategory] = useState<Category>('general');
  const [result, setResult] = useState<any>(null);

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

  // Get unique years
  const years = [...new Set(neetData.map(d => d.year))].sort((a, b) => b - a);

  const calculateRank = () => {
    const userMarks = parseFloat(marks);
    if (!userMarks || userMarks < 0 || userMarks > 720) {
      toast({
        title: "Invalid Marks",
        description: "Please enter marks between 0 and 720",
        variant: "destructive",
      });
      return;
    }

    if (!year) {
      toast({
        title: "Incomplete Information",
        description: "Please select year",
        variant: "destructive",
      });
      return;
    }

    const yearData = neetData.find(d => d.year === parseInt(year));

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
      marks: d[category]
    })).sort((a, b) => b.marks - a.marks);

    let rank = 0;
    for (let i = 0; i < categoryMarks.length; i++) {
      if (userMarks >= categoryMarks[i].marks) {
        rank = categoryMarks[i].rank;
        break;
      }
      if (i < categoryMarks.length - 1 && userMarks < categoryMarks[i].marks && userMarks > categoryMarks[i + 1].marks) {
        // Interpolate
        const r1 = categoryMarks[i].rank;
        const r2 = categoryMarks[i + 1].rank;
        const m1 = categoryMarks[i].marks;
        const m2 = categoryMarks[i + 1].marks;
        rank = Math.round(r1 + ((m1 - userMarks) / (m1 - m2)) * (r2 - r1));
        break;
      }
    }

    if (rank === 0 && userMarks < categoryMarks[categoryMarks.length - 1].marks) {
      rank = Math.round(categoryMarks[categoryMarks.length - 1].rank * 1.5);
    }

    setResult({
      marks: userMarks,
      rank,
      category,
      year
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
              onClick={() => navigate('/exams/neet')}
              className="rounded-xl"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-glow">
                <Heart className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold">NEET Marks Analyzer</h1>
                <p className="text-xs text-muted-foreground">Calculate Your Expected Rank</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto p-4 space-y-4">
        <Card className="glass">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Calculate Your Rank
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="neet-marks">Your Marks (Out of 720)</Label>
              <Input
                id="neet-marks"
                type="number"
                min="0"
                max="720"
                placeholder="Enter your marks"
                value={marks}
                onChange={(e) => setMarks(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Year</Label>
                <Select value={year} onValueChange={setYear}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Year" />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map(y => (
                      <SelectItem key={y} value={y.toString()}>
                        NEET {y}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Category</Label>
                <Select 
                  value={category} 
                  onValueChange={(v) => setCategory(v as Category)}
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
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600"
              onClick={calculateRank}
            >
              Calculate Rank
            </Button>
          </CardContent>
        </Card>

        {/* Result */}
        {result && (
          <Card className="glass border-2 border-primary/30 bg-gradient-to-br from-primary/10 to-accent/10">
            <CardHeader>
              <CardTitle className="text-lg">Your Result</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Your Marks</p>
                  <p className="text-2xl font-bold">{result.marks} / 720</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Estimated Rank ({categoryLabels[result.category]})</p>
                  <p className={`text-2xl font-bold bg-gradient-to-r ${categoryColors[result.category]} bg-clip-text text-transparent`}>
                    AIR {result.rank.toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">NEET {result.year}</Badge>
                <Badge variant="outline">{categoryLabels[result.category]}</Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                * This is an estimated category rank based on historical data from previous years. Actual rank may vary based on difficulty level and number of candidates.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
