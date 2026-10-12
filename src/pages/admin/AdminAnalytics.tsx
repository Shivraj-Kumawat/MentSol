import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, TrendingUp, Users, Calendar, DollarSign } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { 
  ChartContainer, 
  ChartTooltip, 
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent 
} from '@/components/ui/chart';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface AnalyticsData {
  revenue: { date: string; amount: number }[];
  sessions: { date: string; completed: number; cancelled: number }[];
  categories: { name: string; count: number; value: number }[];
  topMentors: { name: string; sessions: number; earnings: number; rating: number }[];
  userGrowth: { date: string; students: number; mentors: number }[];
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--chart-1))', 'hsl(var(--chart-2))'];

export default function AdminAnalytics() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AnalyticsData>({
    revenue: [],
    sessions: [],
    categories: [],
    topMentors: [],
    userGrowth: []
  });

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);

      // Revenue over last 30 days
      const { data: payments } = await supabase
        .from('payments')
        .select('created_at, amount, status')
        .eq('status', 'captured')
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at');

      // Sessions data
      const { data: sessions } = await supabase
        .from('sessions')
        .select('created_at, status, amount_paid, mentor_id')
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      // Mentor categories
      const { data: mentors } = await supabase
        .from('mentors')
        .select('mentor_types, total_sessions, total_earnings')
        .eq('status', 'approved');

      // Top mentors
      const { data: topMentorsData } = await supabase
        .from('mentors')
        .select(`
          user_id,
          total_sessions,
          total_earnings,
          rating,
          user:user_id(full_name)
        `)
        .eq('status', 'approved')
        .order('total_earnings', { ascending: false })
        .limit(5);

      // User growth
      const { data: profiles } = await supabase
        .from('profiles')
        .select('created_at, id')
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at');

      const { data: mentorUsers } = await supabase
        .from('user_roles')
        .select('created_at, user_id, role')
        .eq('role', 'mentor')
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      // Process revenue data
      const revenueMap = new Map<string, number>();
      payments?.forEach(p => {
        const date = new Date(p.created_at).toLocaleDateString();
        revenueMap.set(date, (revenueMap.get(date) || 0) + p.amount / 100);
      });
      const revenue = Array.from(revenueMap.entries())
        .map(([date, amount]) => ({ date, amount }))
        .slice(-14); // Last 14 days

      // Process sessions data
      const sessionMap = new Map<string, { completed: number; cancelled: number }>();
      sessions?.forEach(s => {
        const date = new Date(s.created_at).toLocaleDateString();
        const current = sessionMap.get(date) || { completed: 0, cancelled: 0 };
        if (s.status === 'completed') current.completed++;
        if (s.status === 'cancelled') current.cancelled++;
        sessionMap.set(date, current);
      });
      const sessionsData = Array.from(sessionMap.entries())
        .map(([date, data]) => ({ date, ...data }))
        .slice(-14);

      // Process category data
      const categoryMap = new Map<string, { count: number; value: number }>();
      mentors?.forEach(m => {
        m.mentor_types?.forEach((type: string) => {
          const current = categoryMap.get(type) || { count: 0, value: 0 };
          categoryMap.set(type, {
            count: current.count + 1,
            value: current.value + (m.total_earnings || 0)
          });
        });
      });
      const categories = Array.from(categoryMap.entries())
        .map(([name, data]) => ({ name, ...data }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5);

      // Process top mentors
      const topMentors = topMentorsData?.map(m => ({
        name: (m.user as any)?.full_name || 'Unknown',
        sessions: m.total_sessions || 0,
        earnings: m.total_earnings || 0, // DB stores in rupees
        rating: m.rating || 0
      })) || [];

      // Process user growth
      const growthMap = new Map<string, { students: number; mentors: number }>();
      profiles?.forEach(p => {
        const date = new Date(p.created_at).toLocaleDateString();
        const current = growthMap.get(date) || { students: 0, mentors: 0 };
        current.students++;
        growthMap.set(date, current);
      });
      mentorUsers?.forEach(m => {
        const date = new Date(m.created_at).toLocaleDateString();
        const current = growthMap.get(date) || { students: 0, mentors: 0 };
        current.mentors++;
        growthMap.set(date, current);
      });
      const userGrowth = Array.from(growthMap.entries())
        .map(([date, data]) => ({ date, ...data }))
        .slice(-14);

      setData({ revenue, sessions: sessionsData, categories, topMentors, userGrowth });
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast({
        title: 'Error',
        description: 'Failed to load analytics data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-teal-glow/5 to-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading analytics...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-teal-glow/5 to-background p-6">
      <div className="max-w-7xl mx-auto">
        <Button variant="ghost" onClick={() => navigate('/admin')} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>

        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Analytics Dashboard</h1>
          <p className="text-muted-foreground">Comprehensive platform insights and metrics</p>
        </div>

        <Tabs defaultValue="revenue" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="revenue">Revenue</TabsTrigger>
            <TabsTrigger value="sessions">Sessions</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="mentors">Mentors</TabsTrigger>
          </TabsList>

          <TabsContent value="revenue" className="space-y-6">
            <Card className="glass">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-primary" />
                  Revenue Trend (Last 14 Days)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    amount: {
                      label: 'Revenue (₹)',
                      color: 'hsl(var(--primary))',
                    },
                  }}
                  className="h-[300px]"
                >
                  <LineChart data={data.revenue}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line type="monotone" dataKey="amount" stroke="hsl(var(--primary))" strokeWidth={2} />
                  </LineChart>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card className="glass">
              <CardHeader>
                <CardTitle>Revenue by Category</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    value: {
                      label: 'Revenue',
                      color: 'hsl(var(--primary))',
                    },
                  }}
                  className="h-[300px]"
                >
                  <PieChart>
                    <Pie
                      data={data.categories}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label
                    >
                      {data.categories.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <ChartLegend content={<ChartLegendContent />} />
                  </PieChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sessions" className="space-y-6">
            <Card className="glass">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  Session Completion Trend
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    completed: {
                      label: 'Completed',
                      color: 'hsl(var(--primary))',
                    },
                    cancelled: {
                      label: 'Cancelled',
                      color: 'hsl(var(--destructive))',
                    },
                  }}
                  className="h-[300px]"
                >
                  <BarChart data={data.sessions}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <ChartLegend content={<ChartLegendContent />} />
                    <Bar dataKey="completed" fill="hsl(var(--primary))" />
                    <Bar dataKey="cancelled" fill="hsl(var(--destructive))" />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <Card className="glass">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  User Growth Trend
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    students: {
                      label: 'Students',
                      color: 'hsl(var(--primary))',
                    },
                    mentors: {
                      label: 'Mentors',
                      color: 'hsl(var(--secondary))',
                    },
                  }}
                  className="h-[300px]"
                >
                  <LineChart data={data.userGrowth}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <ChartLegend content={<ChartLegendContent />} />
                    <Line type="monotone" dataKey="students" stroke="hsl(var(--primary))" strokeWidth={2} />
                    <Line type="monotone" dataKey="mentors" stroke="hsl(var(--secondary))" strokeWidth={2} />
                  </LineChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="mentors" className="space-y-6">
            <Card className="glass">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Top Performing Mentors
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.topMentors.map((mentor, index) => (
                    <div key={index} className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border border-border/50">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">{mentor.name}</p>
                          <p className="text-sm text-muted-foreground">{mentor.sessions} sessions</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-foreground">₹{mentor.earnings.toFixed(2)}</p>
                        <p className="text-sm text-muted-foreground">⭐ {mentor.rating.toFixed(1)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}