import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Calendar, Clock, User, Star, Search, Download, Filter, DollarSign, Video, CheckCircle, XCircle, AlertCircle, Users } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

interface Session {
  id: string;
  scheduled_at: string | null;
  status: string | null;
  amount_paid: number | null;
  platform_fee: number | null;
  mentor_earning: number | null;
  google_meet_link: string | null;
  completed_at: string | null;
  payment_status_confirmed: boolean;
  student_id: string;
  student: {
    id: string;
    full_name: string | null;
    email: string | null;
  } | null;
  review: {
    rating: number;
    review_text: string | null;
    created_at: string;
  } | null;
}

interface MentorInfo {
  id: string;
  status: string | null;
  total_earnings: number | null;
  total_sessions: number | null;
  rating: number | null;
  profile: {
    full_name: string | null;
    email: string | null;
    avatar_url: string | null;
  } | null;
}

interface PartnerInfo {
  name: string;
  email: string | null;
}

export default function AdminMentorSessions() {
  const { mentorId } = useParams<{ mentorId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [mentor, setMentor] = useState<MentorInfo | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [partnerMap, setPartnerMap] = useState<Record<string, PartnerInfo | null>>({});
  const [togglingPayment, setTogglingPayment] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (mentorId) {
      loadMentorData();
    }
  }, [mentorId]);

  const fetchPartnerInfo = async (studentIds: string[]) => {
    if (studentIds.length === 0) return;
    try {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, referred_by_partner_id')
        .in('id', studentIds);

      if (!profiles) return;

      const partnerIds = [...new Set(
        profiles
          .map(p => p.referred_by_partner_id)
          .filter((id): id is string => id !== null)
      )];

      if (partnerIds.length === 0) {
        const map: Record<string, PartnerInfo | null> = {};
        profiles.forEach(p => { map[p.id] = null; });
        setPartnerMap(map);
        return;
      }

      const { data: promoters } = await supabase
        .from('promoters')
        .select('id, name, user_id')
        .in('id', partnerIds);

      const partnerUserIds = (promoters || [])
        .map(p => p.user_id)
        .filter((id): id is string => id !== null);

      let partnerProfiles: Record<string, string> = {};
      if (partnerUserIds.length > 0) {
        const { data: pProfiles } = await supabase
          .from('profiles')
          .select('id, email')
          .in('id', partnerUserIds);
        (pProfiles || []).forEach(p => {
          partnerProfiles[p.id] = p.email || '';
        });
      }

      const promoterLookup: Record<string, PartnerInfo> = {};
      (promoters || []).forEach(pr => {
        promoterLookup[pr.id] = {
          name: pr.name || 'Unknown Partner',
          email: pr.user_id ? (partnerProfiles[pr.user_id] || null) : null,
        };
      });

      const map: Record<string, PartnerInfo | null> = {};
      profiles.forEach(p => {
        if (p.referred_by_partner_id && promoterLookup[p.referred_by_partner_id]) {
          map[p.id] = promoterLookup[p.referred_by_partner_id];
        } else {
          map[p.id] = null;
        }
      });
      setPartnerMap(map);
    } catch (error) {
      console.error('Error fetching partner info:', error);
    }
  };

  const loadMentorData = async () => {
    try {
      setLoading(true);
      
      const { data: mentorData, error: mentorError } = await supabase
        .from('mentors')
        .select(`
          id,
          status,
          total_earnings,
          total_sessions,
          rating,
          user_id
        `)
        .eq('id', mentorId)
        .single();

      if (mentorError) throw mentorError;

      const { data: profileData } = await supabase
        .from('profiles')
        .select('full_name, email, avatar_url')
        .eq('id', mentorData.user_id)
        .single();

      setMentor({
        ...mentorData,
        profile: profileData
      });

      const { data: sessionsData, error: sessionsError } = await supabase
        .from('sessions')
        .select(`
          id,
          scheduled_at,
          status,
          amount_paid,
          platform_fee,
          mentor_earning,
          google_meet_link,
          completed_at,
          payment_status_confirmed,
          student_id
        `)
        .eq('mentor_id', mentorId)
        .order('scheduled_at', { ascending: false });

      if (sessionsError) throw sessionsError;

      const studentIds = [...new Set((sessionsData || []).map(s => s.student_id))];
      const { data: studentsData } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', studentIds);

      const studentMap = (studentsData || []).reduce((acc, s) => {
        acc[s.id] = s;
        return acc;
      }, {} as Record<string, any>);

      const sessionIds = (sessionsData || []).map(s => s.id);
      const { data: reviewsData } = await supabase
        .from('reviews')
        .select('session_id, rating, review_text, created_at')
        .in('session_id', sessionIds);

      const reviewMap = (reviewsData || []).reduce((acc, r) => {
        acc[r.session_id] = r;
        return acc;
      }, {} as Record<string, any>);

      const mappedSessions: Session[] = (sessionsData || []).map(s => ({
        ...s,
        payment_status_confirmed: !!(s as any).payment_status_confirmed,
        student: studentMap[s.student_id] || null,
        review: reviewMap[s.id] || null
      }));

      setSessions(mappedSessions);

      // Fetch partner info
      await fetchPartnerInfo(studentIds);
    } catch (error: any) {
      console.error('Error loading mentor data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load mentor session data',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const togglePaymentStatus = async (sessionId: string, currentValue: boolean) => {
    const newValue = !currentValue;
    setTogglingPayment(prev => new Set(prev).add(sessionId));

    setSessions(prev =>
      prev.map(s => s.id === sessionId ? { ...s, payment_status_confirmed: newValue } : s)
    );

    try {
      const { error } = await supabase
        .from('sessions')
        .update({ payment_status_confirmed: newValue } as any)
        .eq('id', sessionId);

      if (error) throw error;

      toast({
        title: 'Updated',
        description: `Payment status ${newValue ? 'confirmed' : 'unconfirmed'}`,
      });
    } catch (error) {
      console.error('Error toggling payment status:', error);
      setSessions(prev =>
        prev.map(s => s.id === sessionId ? { ...s, payment_status_confirmed: currentValue } : s)
      );
      toast({
        title: 'Error',
        description: 'Failed to update payment status',
        variant: 'destructive',
      });
    } finally {
      setTogglingPayment(prev => {
        const next = new Set(prev);
        next.delete(sessionId);
        return next;
      });
    }
  };

  const exportCSV = () => {
    const headers = ['Date', 'Student', 'Status', 'Amount Paid', 'Platform Fee', 'Mentor Earning', 'Rating', 'Review', 'Partner', 'Payment Confirmed'];
    const rows = filteredSessions.map(s => [
      s.scheduled_at ? format(new Date(s.scheduled_at), 'yyyy-MM-dd HH:mm') : 'N/A',
      s.student?.full_name || 'Unknown',
      s.status || 'unknown',
      s.amount_paid || 0,
      s.platform_fee || 0,
      s.mentor_earning || 0,
      s.review?.rating || 'No review',
      s.review?.review_text || '',
      partnerMap[s.student_id]?.name || 'Not Available',
      s.payment_status_confirmed ? 'Yes' : 'No'
    ]);

    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mentor-${mentorId}-sessions.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: 'Export Complete',
      description: 'Session data exported to CSV'
    });
  };

  const getStatusBadge = (status: string | null) => {
    const statusConfig: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: any }> = {
      completed: { variant: 'default', icon: CheckCircle },
      confirmed: { variant: 'secondary', icon: Clock },
      cancelled: { variant: 'destructive', icon: XCircle },
      pending_payment: { variant: 'outline', icon: AlertCircle }
    };
    const config = statusConfig[status || ''] || { variant: 'outline', icon: AlertCircle };
    const Icon = config.icon;
    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {status || 'Unknown'}
      </Badge>
    );
  };

  const filteredSessions = sessions.filter(s => {
    const matchesSearch = searchTerm === '' || 
      s.student?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.student?.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const stats = {
    totalSessions: sessions.length,
    completedSessions: sessions.filter(s => s.status === 'completed').length,
    totalEarnings: sessions.reduce((sum, s) => sum + (s.mentor_earning || 0), 0),
    platformRevenue: sessions.reduce((sum, s) => sum + (s.platform_fee || 0), 0),
    avgRating: sessions.filter(s => s.review?.rating).length > 0
      ? sessions.filter(s => s.review?.rating).reduce((sum, s) => sum + (s.review?.rating || 0), 0) / sessions.filter(s => s.review?.rating).length
      : 0
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading session data...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/admin/mentors')}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Mentors
              </Button>
              <div className="h-6 w-px bg-border" />
              <div>
                <h1 className="text-xl font-bold text-foreground">
                  {mentor?.profile?.full_name || 'Mentor'} - Sessions
                </h1>
                <p className="text-sm text-muted-foreground">{mentor?.profile?.email}</p>
              </div>
            </div>
            <Button onClick={exportCSV} variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <Card className="card-elevated">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Calendar className="h-4 w-4" />
                <span className="text-xs">Total Sessions</span>
              </div>
              <p className="text-2xl font-bold">{stats.totalSessions}</p>
            </CardContent>
          </Card>
          <Card className="card-elevated">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-xs">Completed</span>
              </div>
              <p className="text-2xl font-bold text-green-600">{stats.completedSessions}</p>
            </CardContent>
          </Card>
          <Card className="card-elevated">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <DollarSign className="h-4 w-4 text-purple-500" />
                <span className="text-xs">Mentor Earnings</span>
              </div>
              <p className="text-2xl font-bold text-purple-600">₹{stats.totalEarnings.toLocaleString()}</p>
            </CardContent>
          </Card>
          <Card className="card-elevated">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <DollarSign className="h-4 w-4 text-blue-500" />
                <span className="text-xs">Platform Revenue</span>
              </div>
              <p className="text-2xl font-bold text-blue-600">₹{stats.platformRevenue.toLocaleString()}</p>
            </CardContent>
          </Card>
          <Card className="card-elevated">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Star className="h-4 w-4 text-yellow-500" />
                <span className="text-xs">Avg Rating</span>
              </div>
              <p className="text-2xl font-bold text-yellow-600">{stats.avgRating.toFixed(1)} ⭐</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by student name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
              <SelectItem value="pending_payment">Pending Payment</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Sessions List */}
        <div className="space-y-4">
          {filteredSessions.length === 0 ? (
            <Card className="card-elevated">
              <CardContent className="py-12 text-center">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No sessions found</h3>
                <p className="text-sm text-muted-foreground">
                  {searchTerm || statusFilter !== 'all' 
                    ? 'Try adjusting your filters' 
                    : 'This mentor has no sessions yet'}
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredSessions.map(session => {
              const partner = partnerMap[session.student_id] || null;
              return (
                <Card key={session.id} className="card-elevated hover:shadow-lg transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                      {/* Date & Time */}
                      <div className="flex items-center gap-3 min-w-48">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <Calendar className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">
                            {session.scheduled_at 
                              ? format(new Date(session.scheduled_at), 'MMM d, yyyy')
                              : 'Not scheduled'}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {session.scheduled_at 
                              ? format(new Date(session.scheduled_at), 'h:mm a')
                              : '—'}
                          </p>
                        </div>
                      </div>

                      {/* Student */}
                      <div className="flex items-center gap-3 flex-1">
                        <div className="p-2 rounded-lg bg-blue-500/10">
                          <User className="h-5 w-5 text-blue-500" />
                        </div>
                        <div>
                          <p className="font-medium">{session.student?.full_name || 'Unknown Student'}</p>
                          <p className="text-sm text-muted-foreground">{session.student?.email}</p>
                        </div>
                      </div>

                      {/* Partner */}
                      <div className="flex items-center gap-3 min-w-36">
                        <div className="p-2 rounded-lg bg-purple-500/10">
                          <Users className="h-5 w-5 text-purple-500" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Partner</p>
                          <p className="font-medium text-sm">{partner?.name || 'Not Available'}</p>
                          {partner?.email && (
                            <p className="text-xs text-muted-foreground">{partner.email}</p>
                          )}
                        </div>
                      </div>

                      {/* Status */}
                      <div className="flex items-center gap-2">
                        {getStatusBadge(session.status)}
                      </div>

                      {/* Earnings Breakdown */}
                      <div className="flex items-center gap-4 text-sm">
                        <div className="text-center">
                          <p className="text-muted-foreground text-xs">Gross</p>
                          <p className="font-medium">₹{session.amount_paid || 0}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-muted-foreground text-xs">Platform</p>
                          <p className="font-medium text-destructive">-₹{session.platform_fee || 0}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-muted-foreground text-xs">Net</p>
                          <p className="font-bold text-green-600">₹{session.mentor_earning || 0}</p>
                        </div>
                      </div>

                      {/* Payment Status Checkbox */}
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id={`payment-ms-${session.id}`}
                          checked={!!session.payment_status_confirmed}
                          onCheckedChange={() =>
                            togglePaymentStatus(session.id, !!session.payment_status_confirmed)
                          }
                          disabled={togglingPayment.has(session.id)}
                        />
                        <label
                          htmlFor={`payment-ms-${session.id}`}
                          className="text-xs text-muted-foreground cursor-pointer select-none whitespace-nowrap"
                        >
                          Payment Status
                        </label>
                      </div>

                      {/* Review */}
                      <div className="min-w-24 text-right">
                        {session.review ? (
                          <div>
                            <div className="flex items-center justify-end gap-1">
                              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                              <span className="font-medium">{session.review.rating}</span>
                            </div>
                            {session.review.review_text && (
                              <p className="text-xs text-muted-foreground truncate max-w-32" title={session.review.review_text}>
                                "{session.review.review_text}"
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">No review</span>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
