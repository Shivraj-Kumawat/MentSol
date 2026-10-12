import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  ArrowLeft, 
  Download,
  IndianRupee,
  TrendingUp,
  Users,
  Star,
} from 'lucide-react';
import { format, subDays, subMonths, startOfMonth, startOfWeek, startOfDay } from 'date-fns';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface Session {
  id: string;
  status: string;
  amount_paid: number;
  mentor_earning: number;
  platform_fee: number;
  scheduled_at: string;
  completed_at: string | null;
  student_id: string;
  student_name?: string;
  duration_minutes?: number;
}

interface MentorInfo {
  id: string;
  nickname: string | null;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
  rating: number;
  total_sessions: number;
  total_earnings: number;
  status: string;
}

export default function AdminMentorEarnings() {
  const { mentorId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [mentor, setMentor] = useState<MentorInfo | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [dateFilter, setDateFilter] = useState<string>('all');

  useEffect(() => {
    if (mentorId) {
      loadMentorData();
    }
  }, [mentorId]);

  const loadMentorData = async () => {
    try {
      // Get mentor info
      const { data: mentorData, error: mentorError } = await supabase
        .from('mentors')
        .select('id, nickname, rating, total_sessions, total_earnings, status, user_id')
        .eq('id', mentorId)
        .single();

      if (mentorError || !mentorData) {
        console.error('Error fetching mentor:', mentorError);
        navigate('/admin/mentors');
        return;
      }

      // Get profile info
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, email, avatar_url')
        .eq('id', mentorData.user_id)
        .single();

      setMentor({
        ...mentorData,
        full_name: profile?.full_name || null,
        email: profile?.email || null,
        avatar_url: profile?.avatar_url || null,
      });

      // Get all completed sessions
      const { data: completedSessions, error: sessionsError } = await supabase
        .from('sessions')
        .select('id, status, amount_paid, mentor_earning, platform_fee, scheduled_at, completed_at, student_id, slot_id')
        .eq('mentor_id', mentorId)
        .eq('status', 'completed')
        .order('completed_at', { ascending: false });

      if (sessionsError) throw sessionsError;

      // Get student names
      const studentIds = [...new Set(completedSessions?.map(s => s.student_id) || [])];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', studentIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p.full_name]) || []);

      // Get slot durations
      const slotIds = [...new Set(completedSessions?.filter(s => s.slot_id).map(s => s.slot_id) || [])];
      const { data: slots } = await supabase
        .from('mentor_availability')
        .select('id, duration_minutes')
        .in('id', slotIds);

      const slotMap = new Map(slots?.map(s => [s.id, s.duration_minutes]) || []);

      // Enrich sessions
      const enrichedSessions: Session[] = (completedSessions || []).map(s => ({
        ...s,
        student_name: profileMap.get(s.student_id) || `Student #${s.student_id.slice(0, 6)}`,
        duration_minutes: s.slot_id ? slotMap.get(s.slot_id) || 15 : 15,
      }));

      setSessions(enrichedSessions);
    } catch (error) {
      console.error('Error loading mentor data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter sessions by date
  const filteredSessions = useMemo(() => {
    if (dateFilter === 'all') return sessions;

    const now = new Date();
    let startDate: Date;

    switch (dateFilter) {
      case 'today':
        startDate = startOfDay(now);
        break;
      case 'week':
        startDate = startOfWeek(now, { weekStartsOn: 1 });
        break;
      case 'month':
        startDate = startOfMonth(now);
        break;
      case '3months':
        startDate = subMonths(now, 3);
        break;
      default:
        return sessions;
    }

    return sessions.filter(s => 
      s.completed_at && new Date(s.completed_at) >= startDate
    );
  }, [sessions, dateFilter]);

  // Calculate stats from filtered sessions
  const stats = useMemo(() => {
    const totalEarnings = filteredSessions.reduce((sum, s) => sum + (s.mentor_earning || 0), 0);
    const platformRevenue = filteredSessions.reduce((sum, s) => sum + (s.platform_fee || 0), 0);
    const grossRevenue = filteredSessions.reduce((sum, s) => sum + (s.amount_paid || 0), 0);

    return {
      totalEarnings,
      platformRevenue,
      grossRevenue,
      sessionCount: filteredSessions.length,
    };
  }, [filteredSessions]);

  // Chart data
  const dailyChartData = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = subDays(new Date(), 6 - i);
      return {
        date: format(date, 'EEE'),
        fullDate: format(date, 'yyyy-MM-dd'),
        earnings: 0,
        platformFee: 0,
      };
    });

    sessions.forEach(session => {
      if (session.completed_at) {
        const sessionDate = format(new Date(session.completed_at), 'yyyy-MM-dd');
        const dayData = last7Days.find(d => d.fullDate === sessionDate);
        if (dayData) {
          dayData.earnings += session.mentor_earning || 0;
          dayData.platformFee += session.platform_fee || 0;
        }
      }
    });

    return last7Days;
  }, [sessions]);

  const exportCSV = () => {
    const headers = ['Date', 'Student', 'Duration (min)', 'Gross Amount (₹)', 'Platform Fee (₹)', 'Mentor Earning (₹)'];
    const rows = filteredSessions.map(s => [
      s.completed_at ? format(new Date(s.completed_at), 'yyyy-MM-dd HH:mm') : 'N/A',
      s.student_name || 'Unknown',
      s.duration_minutes || 15,
      s.amount_paid || 0,
      s.platform_fee || 0,
      s.mentor_earning || 0,
    ]);

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mentor_earnings_${mentor?.nickname || mentorId}_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!mentor) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Mentor not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => navigate('/admin/mentors')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Mentors
          </Button>
          <Button variant="outline" size="sm" onClick={exportCSV}>
            <Download className="h-4 w-4 mr-2" />
            Export for Payout
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 max-w-6xl space-y-6">
        {/* Mentor Header */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={mentor.avatar_url || undefined} />
                <AvatarFallback>{(mentor.full_name || mentor.nickname || 'M')[0]}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold">{mentor.full_name || mentor.nickname || 'Unknown Mentor'}</h1>
                  <Badge variant={mentor.status === 'approved' ? 'default' : 'secondary'}>
                    {mentor.status}
                  </Badge>
                </div>
                <p className="text-muted-foreground">{mentor.email}</p>
                <div className="flex items-center gap-4 mt-2">
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm">{mentor.rating?.toFixed(1) || '0.0'}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {mentor.total_sessions} total sessions
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Filters */}
        <div className="flex items-center gap-4">
          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by date" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="3months">Last 3 Months</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                <IndianRupee className="h-3 w-3" /> Mentor Earnings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">₹{stats.totalEarnings}</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                <TrendingUp className="h-3 w-3" /> Platform Revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">₹{stats.platformRevenue}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                <IndianRupee className="h-3 w-3" /> Gross Revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{stats.grossRevenue}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                <Users className="h-3 w-3" /> Sessions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.sessionCount}</div>
            </CardContent>
          </Card>
        </div>

        {/* Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Daily Earnings (Last 7 Days)</CardTitle>
            <CardDescription>Mentor earnings vs platform revenue</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyChartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip />
                  <Bar dataKey="earnings" name="Mentor Earnings" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="platformFee" name="Platform Fee" fill="hsl(var(--muted-foreground))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Transaction History */}
        <Card>
          <CardHeader>
            <CardTitle>Session History</CardTitle>
            <CardDescription>All completed sessions for payout processing</CardDescription>
          </CardHeader>
          <CardContent>
            {filteredSessions.length === 0 ? (
              <div className="text-center py-12">
                <IndianRupee className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No sessions found for this period</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredSessions.map((session) => (
                  <div
                    key={session.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{session.student_name}</p>
                        <Badge variant="outline" className="text-xs">
                          {session.duration_minutes || 15} min
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {session.completed_at
                          ? format(new Date(session.completed_at), 'PPp')
                          : 'N/A'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-600">₹{session.mentor_earning || 0}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>Gross: ₹{session.amount_paid || 0}</span>
                        <span>•</span>
                        <span>Fee: ₹{session.platform_fee || 0}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
