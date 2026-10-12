import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, DollarSign, Users, Clock, Settings, CheckCircle, XCircle, Star, TrendingUp, AlertCircle, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { AnimatedNumber } from '@/components/AnimatedNumber';
import { EntranceAnimation } from '@/components/motion/EntranceAnimation';
// Mentor presence removed - using Google Meet flow

export default function MentorDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [mentorData, setMentorData] = useState<any>(null);
  const [stats, setStats] = useState({
    totalSessions: 0,
    upcomingSessions: 0,
    pendingRequests: 0,
    totalEarnings: 0,
    rating: 0,
    totalReviews: 0,
  });
  const [upcomingSessions, setUpcomingSessions] = useState<any[]>([]);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [recentFeedback, setRecentFeedback] = useState<any[]>([]);
  const [earningsData, setEarningsData] = useState<any[]>([]);
  const [categoryBreakdown, setCategoryBreakdown] = useState<any[]>([]);

  // Presence tracking removed - sessions use Google Meet

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  const loadDashboardData = async () => {
    if (!user) return;

    try {
      // Get mentor profile
      const { data: mentor, error: mentorError } = await supabase
        .from('mentors')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (mentorError) {
        console.error('Error fetching mentor:', mentorError);
        toast({
          title: 'Error',
          description: 'Failed to load mentor profile. Please try again.',
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }

      if (!mentor) {
        // No mentor profile exists - this is handled by MentorRoute but add fallback
        toast({
          title: 'Profile Not Found',
          description: 'No mentor profile found for your account.',
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }

      setMentorData(mentor);

      // Get sessions
      const { data: sessions, error: sessionsError } = await supabase
        .from('sessions')
        .select(`
          *,
          profiles:student_id(full_name, phone, avatar_url)
        `)
        .eq('mentor_id', mentor.id)
        .order('scheduled_at', { ascending: true });

      if (sessionsError) throw sessionsError;

      const upcoming = sessions?.filter(s => 
        s.status === 'confirmed' && s.scheduled_at && new Date(s.scheduled_at) > new Date()
      ) || [];

      const pending = sessions?.filter(s => 
        s.status === 'pending_payment' || s.status === 'paid'
      ) || [];

      setUpcomingSessions(upcoming.slice(0, 5));
      setPendingRequests(pending);

      // Calculate earnings by month (last 6 months)
      const monthlyEarnings = calculateMonthlyEarnings(sessions || []);
      setEarningsData(monthlyEarnings);

      // Calculate category-wise sessions
      const categoryData = calculateCategoryBreakdown(mentor.mentor_types || []);
      setCategoryBreakdown(categoryData);

      // Fetch real reviews from database
      const { data: reviews, error: reviewsError } = await supabase
        .from('reviews')
        .select('id, rating, review_text, created_at, student_id')
        .eq('mentor_id', mentor.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (reviewsError) {
        console.error('Error fetching reviews:', reviewsError);
      }

      // Get student names for reviews
      const reviewStudentIds = [...new Set((reviews || []).map(r => r.student_id))];
      let reviewProfiles: Record<string, string> = {};
      if (reviewStudentIds.length > 0) {
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', reviewStudentIds);
        
        (profilesData || []).forEach(p => {
          reviewProfiles[p.id] = p.full_name || 'Anonymous';
        });
      }

      const mappedFeedback = (reviews || []).map(r => ({
        id: r.id,
        student: reviewProfiles[r.student_id] || 'Anonymous',
        rating: r.rating,
        comment: r.review_text || 'No comment provided',
        date: r.created_at,
      }));
      setRecentFeedback(mappedFeedback);

      setStats({
        totalSessions: mentor.total_sessions || 0,
        upcomingSessions: upcoming.length,
        pendingRequests: pending.length,
        totalEarnings: mentor.total_earnings || 0,
        rating: mentor.rating || 0,
        totalReviews: mappedFeedback.length,
      });
    } catch (error: any) {
      console.error('Error loading dashboard:', error);
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateMonthlyEarnings = (sessions: any[]) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    const currentMonth = new Date().getMonth();
    
    return months.map((month, index) => {
      const monthSessions = sessions.filter(s => {
        if (!s.completed_at) return false;
        const sessionMonth = new Date(s.completed_at).getMonth();
        return sessionMonth === (currentMonth - 5 + index + 12) % 12;
      });
      
      const earnings = monthSessions.reduce((sum, s) => sum + (s.mentor_earning || 0), 0);
      const sessionsCount = monthSessions.length;
      
      return { month, earnings, sessions: sessionsCount };
    });
  };

  const calculateCategoryBreakdown = (mentorTypes: string[]) => {
    const colors = ['#8b5cf6', '#06b6d4', '#f59e0b', '#ef4444', '#10b981'];
    return mentorTypes.slice(0, 5).map((type, index) => ({
      name: type.length > 20 ? type.substring(0, 20) + '...' : type,
      value: Math.floor(Math.random() * 30) + 10, // Mock data
      color: colors[index],
    }));
  };

  const handleAcceptRequest = async (sessionId: string) => {
    try {
      const { error } = await supabase
        .from('sessions')
        .update({ status: 'confirmed' })
        .eq('id', sessionId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Session request accepted',
      });
      
      loadDashboardData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleRejectRequest = async (sessionId: string) => {
    try {
      const { error } = await supabase
        .from('sessions')
        .update({ status: 'cancelled' })
        .eq('id', sessionId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Session request rejected',
      });
      
      loadDashboardData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  // Helper to get status badge
  const getStatusBadge = () => {
    if (!mentorData?.status) return null;
    const statusConfig: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
      approved: { variant: 'default', label: 'Active' },
      pending_request: { variant: 'secondary', label: 'Under Review' },
      suspended: { variant: 'destructive', label: 'Suspended' },
      rejected: { variant: 'outline', label: 'Rejected' },
    };
    const config = statusConfig[mentorData.status] || statusConfig.pending_request;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <div className="min-h-screen bg-background">
      <EntranceAnimation direction="down" distance={8}>
      {/* Header with Back Navigation */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Back to Home button - fixes navigation flow */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/home')}
                className="gap-2 text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4" />
                Home
              </Button>
              <div className="h-6 w-px bg-border" />
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold text-foreground">Mentor Dashboard</h1>
                  {getStatusBadge()}
                </div>
                <p className="text-sm text-muted-foreground">Welcome back, {mentorData?.bio || 'Mentor'}</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate('/mentor/profile')}
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border-blue-500/20 kpi-card-gradient hover-elevation">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
              <Users className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                <AnimatedNumber value={stats.totalSessions} />
              </div>
              <p className="text-xs text-muted-foreground mt-1">Lifetime</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-500/10 to-orange-600/10 border-orange-500/20 kpi-card-gradient hover-elevation">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
              <AlertCircle className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                <AnimatedNumber value={stats.pendingRequests} />
              </div>
              <p className="text-xs text-muted-foreground mt-1">Need action</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500/10 to-green-600/10 border-green-500/20 kpi-card-gradient hover-elevation">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Upcoming</CardTitle>
              <Clock className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                <AnimatedNumber value={stats.upcomingSessions} />
              </div>
              <p className="text-xs text-muted-foreground mt-1">Confirmed</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 border-purple-500/20 kpi-card-gradient hover-elevation">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
              <DollarSign className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ₹<AnimatedNumber value={stats.totalEarnings} />
              </div>
              <p className="text-xs text-muted-foreground mt-1">All time</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/10 border-yellow-500/20 kpi-card-gradient hover-elevation">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Rating</CardTitle>
              <Star className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                <AnimatedNumber value={stats.rating} decimals={1} /> ⭐
              </div>
              <p className="text-xs text-muted-foreground mt-1">{stats.totalReviews} reviews</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Button
            onClick={() => navigate('/mentor/availability')}
            className="h-20"
            variant="outline"
          >
            <Calendar className="mr-2 h-5 w-5" />
            Manage Availability
          </Button>
          <Button
            onClick={() => navigate('/mentor/sessions')}
            className="h-20"
            variant="outline"
          >
            <Users className="mr-2 h-5 w-5" />
            View Sessions
          </Button>
          <Button
            onClick={() => navigate('/mentor/earnings')}
            className="h-20"
            variant="outline"
          >
            <DollarSign className="mr-2 h-5 w-5" />
            Earnings
          </Button>
          <Button
            onClick={() => navigate('/mentor/profile')}
            className="h-20"
            variant="outline"
          >
            <Settings className="mr-2 h-5 w-5" />
            Manage Categories
          </Button>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="pending" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 h-auto gap-1 p-1">
            <TabsTrigger value="pending" className="relative text-xs sm:text-sm py-2.5">
              Pending Requests
              {stats.pendingRequests > 0 && (
                <Badge variant="destructive" className="ml-1 h-5 w-5 rounded-full p-0 text-xs">
                  {stats.pendingRequests}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="upcoming" className="text-xs sm:text-sm py-2.5">Upcoming Sessions</TabsTrigger>
            <TabsTrigger value="analytics" className="text-xs sm:text-sm py-2.5">Analytics</TabsTrigger>
            <TabsTrigger value="feedback" className="text-xs sm:text-sm py-2.5">Student Feedback</TabsTrigger>
          </TabsList>

          {/* Pending Requests Tab */}
          <TabsContent value="pending" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Session Requests Awaiting Your Response</CardTitle>
                <CardDescription>
                  Accept or reject student booking requests
                </CardDescription>
              </CardHeader>
              <CardContent>
                {pendingRequests.length === 0 ? (
                  <div className="text-center py-12">
                    <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      No pending requests. Great job staying on top of things!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pendingRequests.map((session) => (
                      <div
                        key={session.id}
                        className="flex items-start gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Users className="h-6 w-6 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <h4 className="font-semibold">{session.profiles?.full_name || 'Student'}</h4>
                              <p className="text-sm text-muted-foreground">
                                {session.profiles?.phone || 'No phone'}
                              </p>
                              <div className="flex items-center gap-2 mt-2">
                                <Badge variant={session.status === 'paid' ? 'default' : 'secondary'}>
                                  {session.status === 'paid' ? 'Paid' : 'Pending Payment'}
                                </Badge>
                                <span className="text-sm text-muted-foreground">
                                  ₹{session.amount_paid || 0}
                                </span>
                              </div>
                              {session.pre_session_brief && (
                                <p className="text-sm mt-2 text-muted-foreground">
                                  Brief: {JSON.stringify(session.pre_session_brief)}
                                </p>
                              )}
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="default"
                                onClick={() => handleAcceptRequest(session.id)}
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Accept
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleRejectRequest(session.id)}
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                Reject
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Upcoming Sessions Tab */}
          <TabsContent value="upcoming">
            <Card>
              <CardHeader>
                <CardTitle>Confirmed Upcoming Sessions</CardTitle>
                <CardDescription>
                  Sessions scheduled with students
                </CardDescription>
              </CardHeader>
              <CardContent>
                {upcomingSessions.length === 0 ? (
                  <div className="text-center py-12">
                    <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      No upcoming sessions scheduled
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {upcomingSessions.map((session) => (
                      <div
                        key={session.id}
                        className="flex items-start gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0">
                          <Calendar className="h-6 w-6 text-green-500" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-semibold">{session.profiles?.full_name || 'Student'}</h4>
                              <p className="text-sm text-muted-foreground">
                                {session.scheduled_at
                                  ? new Date(session.scheduled_at).toLocaleString('en-IN', {
                                      dateStyle: 'medium',
                                      timeStyle: 'short'
                                    })
                                  : 'Time not set'}
                              </p>
                              <Badge variant="outline" className="mt-2">
                                ₹{session.amount_paid || 0}
                              </Badge>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => navigate('/mentor/sessions')}
                            >
                              View Details
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Monthly Earnings Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-purple-500" />
                    Monthly Earnings Trend
                  </CardTitle>
                  <CardDescription>
                    Last 6 months earnings overview
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={earningsData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="earnings" 
                        stroke="#8b5cf6" 
                        strokeWidth={2}
                        name="Earnings (₹)"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Sessions per Month */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-blue-500" />
                    Sessions Per Month
                  </CardTitle>
                  <CardDescription>
                    Number of sessions conducted
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={earningsData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar 
                        dataKey="sessions" 
                        fill="#06b6d4" 
                        name="Sessions"
                        radius={[8, 8, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Category Breakdown */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Category-wise Session Distribution</CardTitle>
                  <CardDescription>
                    Your expertise areas breakdown
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col md:flex-row items-center gap-8">
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={categoryBreakdown}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {categoryBreakdown.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="flex-1 space-y-2">
                      {categoryBreakdown.map((cat, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <div 
                            className="w-4 h-4 rounded-full" 
                            style={{ backgroundColor: cat.color }}
                          />
                          <span className="text-sm">{cat.name}</span>
                          <span className="text-sm text-muted-foreground ml-auto">
                            {cat.value} sessions
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Feedback Tab */}
          <TabsContent value="feedback">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-yellow-500" />
                  Recent Student Feedback
                </CardTitle>
                <CardDescription>
                  Reviews and ratings from your students
                </CardDescription>
              </CardHeader>
              <CardContent>
                {recentFeedback.length === 0 ? (
                  <div className="text-center py-12">
                    <Star className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      No feedback yet. Complete sessions to receive reviews!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recentFeedback.map((feedback) => (
                      <div
                        key={feedback.id}
                        className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="font-semibold">{feedback.student}</h4>
                            <div className="flex items-center gap-1 mt-1">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star
                                  key={i}
                                  className={`h-4 w-4 ${
                                    i < feedback.rating
                                      ? 'text-yellow-500 fill-yellow-500'
                                      : 'text-gray-300'
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {new Date(feedback.date).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {feedback.comment}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      </EntranceAnimation>
    </div>
  );
}
