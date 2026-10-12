import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { 
  ArrowLeft, TrendingUp, Calendar, Clock, Users, IndianRupee, Download,
  Wallet, CheckCircle2, CircleDot, Send,
} from 'lucide-react';
import { format, startOfWeek, startOfMonth, subDays, subMonths, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { AnimatedNumber } from '@/components/AnimatedNumber';
import { EntranceAnimation } from '@/components/motion/EntranceAnimation';
import { toast } from '@/hooks/use-toast';

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

interface Earning {
  id: string;
  session_id: string;
  amount: number;
  status: string;
  created_at: string;
  paid_at: string | null;
}

interface EarningsStats {
  total: number;
  thisMonth: number;
  thisWeek: number;
  today: number;
  pending: number;
  completedSessions: number;
  platformFees: number;
  walletBalance: number;
  paidBalance: number;
}

export default function MentorEarnings() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [pendingSessions, setPendingSessions] = useState<Session[]>([]);
  const [earnings, setEarnings] = useState<Earning[]>([]);
  const [mentorId, setMentorId] = useState<string | null>(null);
  const [upiId, setUpiId] = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const [savingPayment, setSavingPayment] = useState(false);
  const [payoutDialogOpen, setPayoutDialogOpen] = useState(false);
  const [requestingPayout, setRequestingPayout] = useState(false);
  const [stats, setStats] = useState<EarningsStats>({
    total: 0, thisMonth: 0, thisWeek: 0, today: 0, pending: 0,
    completedSessions: 0, platformFees: 0, walletBalance: 0, paidBalance: 0,
  });

  useEffect(() => { loadEarnings(); }, [user]);

  const loadEarnings = async () => {
    if (!user) return;
    try {
      const { data: mentor, error: mentorError } = await supabase
        .from('mentors')
        .select('id, total_earnings, total_sessions, wallet_balance, paid_balance, upi_id, bank_account')
        .eq('user_id', user.id)
        .single();

      if (mentorError || !mentor) { setLoading(false); return; }

      setMentorId(mentor.id);
      setUpiId((mentor as any).upi_id || '');
      setBankAccount((mentor as any).bank_account || '');

      // Fetch earnings records
      const { data: earningsData } = await supabase
        .from('earnings')
        .select('*')
        .eq('mentor_id', mentor.id)
        .order('created_at', { ascending: false });

      setEarnings((earningsData as Earning[]) || []);

      // Get completed sessions with student profiles
      const { data: completedSessions, error: sessionsError } = await supabase
        .from('sessions')
        .select('id, status, amount_paid, mentor_earning, platform_fee, scheduled_at, completed_at, student_id, slot_id')
        .eq('mentor_id', mentor.id)
        .eq('status', 'completed')
        .order('completed_at', { ascending: false });

      if (sessionsError) throw sessionsError;

      const studentIds = [...new Set(completedSessions?.map(s => s.student_id) || [])];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', studentIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p.full_name]) || []);

      const slotIds = [...new Set(completedSessions?.filter(s => s.slot_id).map(s => s.slot_id) || [])];
      const { data: slots } = await supabase
        .from('mentor_availability')
        .select('id, duration_minutes')
        .in('id', slotIds);

      const slotMap = new Map(slots?.map(s => [s.id, s.duration_minutes]) || []);

      const enrichedSessions: Session[] = (completedSessions || []).map(s => ({
        ...s,
        student_name: profileMap.get(s.student_id) || `Student #${s.student_id.slice(0, 6)}`,
        duration_minutes: s.slot_id ? slotMap.get(s.slot_id) || 15 : 15,
      }));

      setSessions(enrichedSessions);

      const { data: pending } = await supabase
        .from('sessions')
        .select('id, status, amount_paid, mentor_earning, platform_fee, scheduled_at, completed_at, student_id')
        .eq('mentor_id', mentor.id)
        .eq('status', 'confirmed');

      setPendingSessions((pending || []) as Session[]);

      // Calculate stats
      const now = new Date();
      const weekStart = startOfWeek(now, { weekStartsOn: 1 });
      const monthStart = startOfMonth(now);
      const todayStart = startOfDay(now);
      const todayEnd = endOfDay(now);

      const totalEarnings = enrichedSessions.reduce((sum, s) => sum + (s.mentor_earning || 0), 0);
      const thisMonthEarnings = enrichedSessions
        .filter(s => s.completed_at && new Date(s.completed_at) >= monthStart)
        .reduce((sum, s) => sum + (s.mentor_earning || 0), 0);
      const thisWeekEarnings = enrichedSessions
        .filter(s => s.completed_at && new Date(s.completed_at) >= weekStart)
        .reduce((sum, s) => sum + (s.mentor_earning || 0), 0);
      const todayEarnings = enrichedSessions
        .filter(s => s.completed_at && isWithinInterval(new Date(s.completed_at), { start: todayStart, end: todayEnd }))
        .reduce((sum, s) => sum + (s.mentor_earning || 0), 0);
      const pendingEarnings = (pending || []).reduce((sum, s) => sum + (s.mentor_earning || 0), 0);
      const totalPlatformFees = enrichedSessions.reduce((sum, s) => sum + (s.platform_fee || 0), 0);

      setStats({
        total: totalEarnings,
        thisMonth: thisMonthEarnings,
        thisWeek: thisWeekEarnings,
        today: todayEarnings,
        pending: pendingEarnings,
        completedSessions: enrichedSessions.length,
        platformFees: totalPlatformFees,
        walletBalance: (mentor as any).wallet_balance || 0,
        paidBalance: (mentor as any).paid_balance || 0,
      });
    } catch (error) {
      console.error('Error loading earnings:', error);
    } finally {
      setLoading(false);
    }
  };

  const savePaymentDetails = async () => {
    if (!mentorId) return;
    setSavingPayment(true);
    try {
      const { error } = await supabase
        .from('mentors')
        .update({ upi_id: upiId || null, bank_account: bankAccount || null } as any)
        .eq('id', mentorId);
      if (error) throw error;
      toast({ title: 'Payment details saved!' });
    } catch (err) {
      toast({ title: 'Failed to save', description: String(err), variant: 'destructive' });
    } finally {
      setSavingPayment(false);
    }
  };

  const requestPayout = async () => {
    if (!mentorId || stats.walletBalance <= 0) return;
    setRequestingPayout(true);
    try {
      // Insert payout request
      const { error: insertErr } = await supabase
        .from('payout_requests')
        .insert({ mentor_id: mentorId, amount: stats.walletBalance } as any);
      if (insertErr) throw insertErr;

      // Update earnings status from pending to payout_requested
      const { error: updateErr } = await supabase
        .from('earnings')
        .update({ status: 'payout_requested' } as any)
        .eq('mentor_id', mentorId)
        .eq('status', 'pending');
      if (updateErr) throw updateErr;

      toast({ title: 'Payout requested!', description: `₹${stats.walletBalance} payout has been submitted for review.` });
      setPayoutDialogOpen(false);
      loadEarnings();
    } catch (err) {
      toast({ title: 'Failed to request payout', description: String(err), variant: 'destructive' });
    } finally {
      setRequestingPayout(false);
    }
  };

  // Helper to get earning status for a session
  const getEarningStatus = (sessionId: string): string | null => {
    const earning = earnings.find(e => e.session_id === sessionId);
    return earning?.status || null;
  };

  const renderEarningBadge = (sessionId: string) => {
    const status = getEarningStatus(sessionId);
    if (!status) return null;
    switch (status) {
      case 'pending':
        return <Badge variant="warning" className="text-xs gap-1"><CircleDot className="h-3 w-3" />Pending</Badge>;
      case 'payout_requested':
        return <Badge variant="info" className="text-xs gap-1"><Send className="h-3 w-3" />Payout Requested</Badge>;
      case 'paid':
        return <Badge variant="success" className="text-xs gap-1"><CheckCircle2 className="h-3 w-3" />Credited</Badge>;
      default:
        return null;
    }
  };

  // Calculate chart data
  const dailyChartData = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = subDays(new Date(), 6 - i);
      return { date: format(date, 'EEE'), fullDate: format(date, 'yyyy-MM-dd'), earnings: 0, sessions: 0 };
    });
    sessions.forEach(session => {
      if (session.completed_at) {
        const sessionDate = format(new Date(session.completed_at), 'yyyy-MM-dd');
        const dayData = last7Days.find(d => d.fullDate === sessionDate);
        if (dayData) { dayData.earnings += session.mentor_earning || 0; dayData.sessions += 1; }
      }
    });
    return last7Days;
  }, [sessions]);

  const weeklyChartData = useMemo(() => {
    const last4Weeks = Array.from({ length: 4 }, (_, i) => {
      const ws = startOfWeek(subDays(new Date(), (3 - i) * 7), { weekStartsOn: 1 });
      return { week: `Week ${4 - i}`, startDate: ws, earnings: 0, sessions: 0 };
    });
    sessions.forEach(session => {
      if (session.completed_at) {
        const sd = new Date(session.completed_at);
        const wd = last4Weeks.find((w, idx) => {
          const next = idx < 3 ? last4Weeks[idx + 1]?.startDate : new Date();
          return sd >= w.startDate && (idx === 3 || sd < next);
        });
        if (wd) { wd.earnings += session.mentor_earning || 0; wd.sessions += 1; }
      }
    });
    return last4Weeks;
  }, [sessions]);

  const monthlyChartData = useMemo(() => {
    const last6Months = Array.from({ length: 6 }, (_, i) => {
      const date = subMonths(new Date(), 5 - i);
      return { month: format(date, 'MMM'), monthStart: startOfMonth(date), earnings: 0, sessions: 0 };
    });
    sessions.forEach(session => {
      if (session.completed_at) {
        const sd = new Date(session.completed_at);
        const md = last6Months.find(m => {
          const me = new Date(m.monthStart); me.setMonth(me.getMonth() + 1);
          return sd >= m.monthStart && sd < me;
        });
        if (md) { md.earnings += session.mentor_earning || 0; md.sessions += 1; }
      }
    });
    return last6Months;
  }, [sessions]);

  const exportCSV = () => {
    const headers = ['Date', 'Student', 'Duration (min)', 'Gross Amount (₹)', 'Platform Fee (₹)', 'Net Earning (₹)', 'Payout Status'];
    const rows = sessions.map(s => [
      s.completed_at ? format(new Date(s.completed_at), 'yyyy-MM-dd HH:mm') : 'N/A',
      s.student_name || 'Unknown',
      s.duration_minutes || 15,
      s.amount_paid || 0,
      s.platform_fee || 0,
      s.mentor_earning || 0,
      getEarningStatus(s.id) || 'N/A',
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `earnings_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading earnings...</div>
      </div>
    );
  }

  return (
    <EntranceAnimation direction="up" distance={8}>
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => navigate('/mentor/dashboard')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Dashboard
          </Button>
          <Button variant="outline" size="sm" onClick={exportCSV}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 max-w-6xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Your Earnings</h1>
          <p className="text-muted-foreground">Track your session earnings and payouts</p>
        </div>

        {/* Payment Details */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Payment Details</CardTitle>
            <CardDescription>Add your UPI or bank account for payouts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 items-end">
              <div className="flex-1 space-y-1.5">
                <Label htmlFor="upi">UPI ID</Label>
                <Input id="upi" placeholder="name@upi" value={upiId} onChange={e => setUpiId(e.target.value)} />
              </div>
              <div className="flex-1 space-y-1.5">
                <Label htmlFor="bank">Bank Account</Label>
                <Input id="bank" placeholder="Account number" value={bankAccount} onChange={e => setBankAccount(e.target.value)} />
              </div>
              <Button onClick={savePaymentDetails} disabled={savingPayment} size="sm">
                {savingPayment ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Wallet Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                <IndianRupee className="h-3 w-3" /> Total Earnings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">₹<AnimatedNumber value={stats.total} /></div>
              <p className="text-xs text-muted-foreground">{stats.completedSessions} sessions</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                <Wallet className="h-3 w-3" /> Wallet Balance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">₹<AnimatedNumber value={stats.walletBalance} /></div>
              <p className="text-xs text-muted-foreground">available for payout</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border-emerald-500/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" /> Paid Balance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600">₹<AnimatedNumber value={stats.paidBalance} /></div>
              <p className="text-xs text-muted-foreground">already credited</p>
            </CardContent>
          </Card>

          <Card className="flex flex-col items-center justify-center p-4">
            <Button
              onClick={() => setPayoutDialogOpen(true)}
              disabled={stats.walletBalance <= 0}
              className="w-full"
            >
              <Send className="h-4 w-4 mr-2" />
              Request Payout
            </Button>
            {stats.walletBalance <= 0 && (
              <p className="text-xs text-muted-foreground mt-2 text-center">No balance to withdraw</p>
            )}
          </Card>
        </div>

        {/* Time-based Stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3 w-3" /> This Month
              </CardTitle>
            </CardHeader>
            <CardContent><div className="text-2xl font-bold">₹{stats.thisMonth}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                <TrendingUp className="h-3 w-3" /> This Week
              </CardTitle>
            </CardHeader>
            <CardContent><div className="text-2xl font-bold">₹{stats.thisWeek}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" /> Today
              </CardTitle>
            </CardHeader>
            <CardContent><div className="text-2xl font-bold">₹{stats.today}</div></CardContent>
          </Card>
        </div>

        {/* Charts */}
        <Tabs defaultValue="daily" className="w-full">
          <TabsList>
            <TabsTrigger value="daily">Daily (7 Days)</TabsTrigger>
            <TabsTrigger value="weekly">Weekly (4 Weeks)</TabsTrigger>
            <TabsTrigger value="monthly">Monthly (6 Months)</TabsTrigger>
          </TabsList>

          <TabsContent value="daily">
            <Card>
              <CardHeader><CardTitle>Daily Earnings</CardTitle><CardDescription>Last 7 days</CardDescription></CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dailyChartData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="date" className="text-xs" />
                      <YAxis className="text-xs" />
                      <Tooltip formatter={(value: number) => [`₹${value}`, 'Earnings']} />
                      <Bar dataKey="earnings" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="weekly">
            <Card>
              <CardHeader><CardTitle>Weekly Earnings</CardTitle><CardDescription>Last 4 weeks</CardDescription></CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={weeklyChartData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="week" className="text-xs" />
                      <YAxis className="text-xs" />
                      <Tooltip formatter={(value: number) => [`₹${value}`, 'Earnings']} />
                      <Line type="monotone" dataKey="earnings" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ fill: 'hsl(var(--primary))' }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="monthly">
            <Card>
              <CardHeader><CardTitle>Monthly Earnings</CardTitle><CardDescription>Last 6 months</CardDescription></CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyChartData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="month" className="text-xs" />
                      <YAxis className="text-xs" />
                      <Tooltip formatter={(value: number) => [`₹${value}`, 'Earnings']} />
                      <Bar dataKey="earnings" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Transaction History */}
        <Card>
          <CardHeader>
            <CardTitle>Transaction History</CardTitle>
            <CardDescription>Detailed breakdown of all your completed sessions</CardDescription>
          </CardHeader>
          <CardContent>
            {sessions.length === 0 ? (
              <div className="text-center py-12">
                <IndianRupee className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No completed sessions yet</p>
                <p className="text-sm text-muted-foreground mt-1">Your earnings will appear here after sessions are completed</p>
              </div>
            ) : (
              <div className="space-y-3">
                {sessions.slice(0, 20).map((session) => (
                  <div key={session.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium">{session.student_name}</p>
                        <Badge variant="outline" className="text-xs">{session.duration_minutes || 15} min</Badge>
                        {renderEarningBadge(session.id)}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {session.completed_at ? format(new Date(session.completed_at), 'PPp') : 'Date not available'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-600">+₹{session.mentor_earning || 0}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>Gross: ₹{session.amount_paid || 0}</span>
                        <span>•</span>
                        <span>Fee: ₹{session.platform_fee || 0}</span>
                      </div>
                    </div>
                  </div>
                ))}
                {sessions.length > 20 && (
                  <p className="text-center text-sm text-muted-foreground py-2">
                    Showing 20 of {sessions.length} transactions. Export CSV for full history.
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Payout Request Dialog */}
      <Dialog open={payoutDialogOpen} onOpenChange={setPayoutDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Payout</DialogTitle>
            <DialogDescription>
              Your full wallet balance of ₹{stats.walletBalance} will be requested for payout.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Payout Amount</span>
              <span className="font-bold text-lg">₹{stats.walletBalance}</span>
            </div>
            {upiId && <div className="flex justify-between text-sm"><span className="text-muted-foreground">UPI ID</span><span>{upiId}</span></div>}
            {bankAccount && <div className="flex justify-between text-sm"><span className="text-muted-foreground">Bank Account</span><span>{bankAccount}</span></div>}
            {!upiId && !bankAccount && (
              <p className="text-sm text-destructive">⚠️ Please add your UPI ID or bank account above before requesting.</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPayoutDialogOpen(false)}>Cancel</Button>
            <Button onClick={requestPayout} disabled={requestingPayout || (!upiId && !bankAccount)}>
              {requestingPayout ? 'Submitting...' : 'Confirm Payout Request'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    </EntranceAnimation>
  );
}
