import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, BookOpen, DollarSign, UserCheck, ArrowLeft, Megaphone, Settings, Share2, Smartphone, Ticket, Wallet, Building2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalSessions: 0,
    totalRevenue: 0,
    activeMentors: 0,
    newSignups: 0,
    pendingMentors: 0,
  });
  const [loading, setLoading] = useState(true);
  const [adminNotifications, setAdminNotifications] = useState({
    pendingMentorRequests: 0,
    failedPayments: 0,
    cancelledSessions: 0,
  });
  const [pendingPayoutsCount, setPendingPayoutsCount] = useState(0);
  const [openTicketsCount, setOpenTicketsCount] = useState(0);
  const [pendingMentorPayouts, setPendingMentorPayouts] = useState(0);
  const [pendingCoachingRequests, setPendingCoachingRequests] = useState(0);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch total sessions
        const { count: sessionsCount } = await supabase
          .from('sessions')
          .select('*', { count: 'exact', head: true });

        // Fetch total revenue
        const { data: paymentsData } = await supabase
          .from('payments')
          .select('amount')
          .eq('status', 'captured');

        const totalRevenue = paymentsData?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;

        // Fetch active mentors
        const { count: activeMentorsCount } = await supabase
          .from('mentors')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'active');

        // Fetch pending mentor requests
        const { count: pendingMentorsCount } = await supabase
          .from('mentors')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'pending_request');

        // Fetch new signups (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const { count: newSignupsCount } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', thirtyDaysAgo.toISOString());

        setStats({
          totalSessions: sessionsCount || 0,
          totalRevenue: totalRevenue / 100, // Convert paise to rupees
          activeMentors: activeMentorsCount || 0,
          newSignups: newSignupsCount || 0,
          pendingMentors: pendingMentorsCount || 0,
        });

        // Fetch admin notification counts
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          const { data: notifData } = await supabase
            .from('notifications')
            .select('type')
            .eq('user_id', session.user.id)
            .eq('is_read', false)
            .in('type', ['mentor_request', 'payment_failed', 'session_cancelled']);
          
          setAdminNotifications({
            pendingMentorRequests: notifData?.filter(n => n.type === 'mentor_request').length || 0,
            failedPayments: notifData?.filter(n => n.type === 'payment_failed').length || 0,
            cancelledSessions: notifData?.filter(n => n.type === 'session_cancelled').length || 0,
          });
        }

        // Fetch pending payouts count
        const { count: pendingPayouts } = await supabase
          .from('promoter_payouts')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'pending');
        
        setPendingPayoutsCount(pendingPayouts || 0);

        // Fetch open support tickets count
        const { count: openTickets } = await supabase
          .from('support_tickets')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'open');
        
        setOpenTicketsCount(openTickets || 0);

        // Fetch pending mentor payout requests
        const { count: mentorPayouts } = await supabase
          .from('payout_requests')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'requested');
        
        setPendingMentorPayouts(mentorPayouts || 0);

        // Fetch pending coaching requests
        const { count: coachingReqs } = await supabase
          .from('coaching_requests' as any)
          .select('*', { count: 'exact', head: true })
          .eq('status', 'pending') as any;
        setPendingCoachingRequests(coachingReqs || 0);
      } catch (error) {
        console.error('Error fetching admin stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const statCards = [
    {
      title: 'Total Sessions',
      value: stats.totalSessions,
      icon: BookOpen,
      color: 'text-primary',
    },
    {
      title: 'Total Revenue',
      value: `₹${stats.totalRevenue.toFixed(2)}`,
      icon: DollarSign,
      color: 'text-accent',
    },
    {
      title: 'Active Mentors',
      value: stats.activeMentors,
      icon: UserCheck,
      color: 'text-teal-light',
    },
    {
      title: 'New Signups (30d)',
      value: stats.newSignups,
      icon: Users,
      color: 'text-navy-light',
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-teal-glow/5 to-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-teal-glow/5 to-background p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <Button
              variant="ghost"
              onClick={() => navigate('/home')}
              className="mb-4"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
            <h1 className="text-4xl font-bold text-foreground mb-2">Admin Dashboard</h1>
            <p className="text-muted-foreground">Manage your mentorship platform</p>
          </div>
        </div>

        {/* Stats Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="glass animate-pulse">
                <CardHeader className="pb-3">
                  <div className="h-4 bg-muted rounded w-24"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-8 bg-muted rounded w-16"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {statCards.map((stat, index) => (
              <Card key={index} className="glass card-hover card-press">
                <CardHeader className="flex flex-row items-center justify-between pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </CardTitle>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-foreground">{stat.value}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="glass card-hover card-press cursor-pointer" onClick={() => navigate('/admin/mentors')}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 justify-between">
                <div className="flex items-center gap-2">
                  <UserCheck className="h-5 w-5 text-primary" />
                  Mentor Management
                </div>
                {adminNotifications.pendingMentorRequests > 0 && (
                  <Badge variant="destructive" className="h-5 px-2">
                    {adminNotifications.pendingMentorRequests}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {stats.pendingMentors > 0 && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-accent/10 text-accent mb-2">
                    {stats.pendingMentors} Pending Requests
                  </span>
                )}
                <br />
                Approve, reject, or manage mentor accounts and rates.
              </p>
            </CardContent>
          </Card>

          <Card className="glass card-hover card-press cursor-pointer" onClick={() => navigate('/admin/sessions')}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 justify-between">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-primary" />
                  Session Management
                </div>
                {adminNotifications.cancelledSessions > 0 && (
                  <Badge variant="destructive" className="h-5 px-2">
                    {adminNotifications.cancelledSessions}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                View all bookings, confirm, cancel, or reschedule sessions.
              </p>
            </CardContent>
          </Card>

          <Card className="glass card-hover card-press cursor-pointer" onClick={() => navigate('/admin/payments')}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 justify-between">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-primary" />
                  Payments
                </div>
                {adminNotifications.failedPayments > 0 && (
                  <Badge variant="destructive" className="h-5 px-2">
                    {adminNotifications.failedPayments}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Manage payments, process refunds, and view transaction history.
              </p>
            </CardContent>
          </Card>

          <Card className="glass card-hover card-press cursor-pointer" onClick={() => navigate('/admin/users')}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                User Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                View user profiles, login history, and manage account status.
              </p>
            </CardContent>
          </Card>

          <Card className="glass card-hover card-press cursor-pointer" onClick={() => navigate('/admin/moderation')}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-lg">🛡️</span>
                Moderation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Review moderation logs and anti-contact detection events.
              </p>
            </CardContent>
          </Card>

          <Card className="glass card-hover card-press cursor-pointer" onClick={() => navigate('/admin/announcements')}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Megaphone className="h-5 w-5 text-primary" />
                Announcements
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Broadcast messages to all users, students, or mentors.
              </p>
            </CardContent>
          </Card>

          <Card className="glass card-hover card-press cursor-pointer" onClick={() => navigate('/admin/settings')}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-primary" />
                Platform Settings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Configure commission rates, policies, and features.
              </p>
            </CardContent>
          </Card>

          <Card className="glass card-hover card-press cursor-pointer" onClick={() => navigate('/admin/migrate-categories')}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-lg">🔄</span>
                Migrate Categories
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Convert mentor categories to new hierarchical format.
              </p>
            </CardContent>
          </Card>

          <Card className="glass card-hover card-press cursor-pointer" onClick={() => navigate('/admin/promoters')}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 justify-between">
                <div className="flex items-center gap-2">
                  <Share2 className="h-5 w-5 text-primary" />
                  Promoter Management
                </div>
                {pendingPayoutsCount > 0 && (
                  <Badge variant="destructive" className="h-5 px-2">
                    {pendingPayoutsCount}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Manage referral partners, view commissions, and process payouts.
              </p>
            </CardContent>
          </Card>

          <Card className="glass card-hover card-press cursor-pointer" onClick={() => navigate('/admin/support')}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 justify-between">
                <div className="flex items-center gap-2">
                  <Ticket className="h-5 w-5 text-primary" />
                  Support Tickets
                </div>
                {openTicketsCount > 0 && (
                  <Badge variant="destructive" className="h-5 px-2">
                    {openTicketsCount}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Manage user support requests and respond to tickets.
              </p>
            </CardContent>
          </Card>

          <Card className="glass card-hover card-press cursor-pointer" onClick={() => navigate('/admin/payout-requests')}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 justify-between">
                <div className="flex items-center gap-2">
                  <Wallet className="h-5 w-5 text-primary" />
                  Mentor Payouts
                </div>
                {pendingMentorPayouts > 0 && (
                  <Badge variant="destructive" className="h-5 px-2">
                    {pendingMentorPayouts}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Review and process mentor payout requests.
              </p>
            </CardContent>
          </Card>

          <Card className="glass card-hover card-press cursor-pointer" onClick={() => navigate('/admin/coaching')}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 justify-between">
                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary" />
                  Coaching Requests
                </div>
                {pendingCoachingRequests > 0 && (
                  <Badge variant="destructive" className="h-5 px-2">
                    {pendingCoachingRequests}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Review and manage coaching institute partnership requests.
              </p>
            </CardContent>
          </Card>

          <Card className="glass card-hover card-press cursor-pointer" onClick={() => navigate('/playstore-screenshots')}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="h-5 w-5 text-primary" />
                Play Store Screenshots
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Download professional app screenshots for Play Store listing.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
