import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, Search, CheckCircle, XCircle, Calendar, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Session {
  id: string;
  status: string;
  pre_session_brief: any;
  amount_paid: number;
  scheduled_at: string;
  created_at: string;
  payment_status_confirmed: boolean;
  student_id: string;
  student: {
    full_name: string;
    email: string;
  };
  mentor: {
    profiles: {
      full_name: string;
      email: string;
    };
  };
}

interface PartnerInfo {
  name: string;
  email: string | null;
}

export default function AdminSessions() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [partnerMap, setPartnerMap] = useState<Record<string, PartnerInfo | null>>({});
  const [togglingPayment, setTogglingPayment] = useState<Set<string>>(new Set());

  const fetchPartnerInfo = async (studentIds: string[]) => {
    if (studentIds.length === 0) return;
    try {
      // Step 1: Get referred_by_partner_id for all students
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
        // No partners, set all to null
        const map: Record<string, PartnerInfo | null> = {};
        profiles.forEach(p => { map[p.id] = null; });
        setPartnerMap(map);
        return;
      }

      // Step 2: Get promoter names and user_ids
      const { data: promoters } = await supabase
        .from('promoters')
        .select('id, name, user_id')
        .in('id', partnerIds);

      // Step 3: Get partner emails from profiles
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

      // Build promoter lookup: promoter.id -> { name, email }
      const promoterLookup: Record<string, PartnerInfo> = {};
      (promoters || []).forEach(pr => {
        promoterLookup[pr.id] = {
          name: pr.name || 'Unknown Partner',
          email: pr.user_id ? (partnerProfiles[pr.user_id] || null) : null,
        };
      });

      // Build final map: student_id -> PartnerInfo | null
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

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('sessions')
        .select(`
          *,
          student:student_id (
            full_name,
            email
          ),
          mentor:mentor_id (
            profiles:user_id (
              full_name,
              email
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      const sessionsData = (data || []) as any[];
      setSessions(sessionsData);

      // Fetch partner info for all unique student IDs
      const studentIds = [...new Set(sessionsData.map(s => s.student_id).filter(Boolean))];
      await fetchPartnerInfo(studentIds);
    } catch (error) {
      console.error('Error fetching sessions:', error);
      toast({
        title: 'Error',
        description: 'Failed to load sessions',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const updateSessionStatus = async (sessionId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('sessions')
        .update({ status })
        .eq('id', sessionId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: `Session ${status}`,
      });

      fetchSessions();
    } catch (error) {
      console.error('Error updating session:', error);
      toast({
        title: 'Error',
        description: 'Failed to update session',
        variant: 'destructive',
      });
    }
  };

  const togglePaymentStatus = async (sessionId: string, currentValue: boolean) => {
    const newValue = !currentValue;
    setTogglingPayment(prev => new Set(prev).add(sessionId));

    // Optimistic update
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
      // Rollback
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

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; label: string }> = {
      pending_payment: { variant: 'secondary', label: 'Pending Payment' },
      paid: { variant: 'default', label: 'Paid' },
      confirmed: { variant: 'default', label: 'Confirmed' },
      completed: { variant: 'outline', label: 'Completed' },
      cancelled: { variant: 'destructive', label: 'Cancelled' },
      refunded: { variant: 'destructive', label: 'Refunded' },
    };
    const config = variants[status] || variants.pending_payment;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const filteredSessions = sessions.filter((session) => {
    const matchesSearch =
      session.student?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      session.student?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      session.mentor?.profiles?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      session.mentor?.profiles?.email?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || session.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-teal-glow/5 to-background p-6">
      <div className="max-w-7xl mx-auto">
        <Button variant="ghost" onClick={() => navigate('/admin')} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>

        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Session Management</h1>
          <p className="text-muted-foreground">View and manage all mentorship sessions</p>
        </div>

        <div className="flex gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search sessions by student or mentor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending_payment">Pending Payment</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
              <SelectItem value="refunded">Refunded</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-pulse text-muted-foreground">Loading sessions...</div>
          </div>
        ) : filteredSessions.length === 0 ? (
          <Card className="glass">
            <CardContent className="py-12 text-center text-muted-foreground">
              No sessions found
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredSessions.map((session) => {
              const partner = partnerMap[session.student_id] || null;
              return (
                <Card key={session.id} className="glass card-hover">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          Session #{session.id.slice(0, 8)}
                          {getStatusBadge(session.status)}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          Created {format(new Date(session.created_at), 'MMM dd, yyyy')}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <Checkbox
                            id={`payment-${session.id}`}
                            checked={!!session.payment_status_confirmed}
                            onCheckedChange={() =>
                              togglePaymentStatus(session.id, !!session.payment_status_confirmed)
                            }
                            disabled={togglingPayment.has(session.id)}
                          />
                          <label
                            htmlFor={`payment-${session.id}`}
                            className="text-sm font-medium text-muted-foreground cursor-pointer select-none"
                          >
                            Payment Status
                          </label>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-foreground">
                            ₹{session.amount_paid || 0}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        <div>
                          <p className="text-sm font-medium text-foreground">Student</p>
                          <p className="text-sm text-muted-foreground">{session.student?.full_name || 'Unknown'}</p>
                          <p className="text-xs text-muted-foreground">{session.student?.email || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">Mentor</p>
                          <p className="text-sm text-muted-foreground">
                            {session.mentor?.profiles?.full_name || 'Unknown'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {session.mentor?.profiles?.email || 'N/A'}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground flex items-center gap-1">
                            <Users className="h-3.5 w-3.5" />
                            Partner
                          </p>
                          {partner ? (
                            <>
                              <p className="text-sm text-muted-foreground">{partner.name}</p>
                              <p className="text-xs text-muted-foreground">{partner.email || 'N/A'}</p>
                            </>
                          ) : (
                            <p className="text-sm text-muted-foreground">Not Available</p>
                          )}
                        </div>
                      </div>

                      {session.scheduled_at && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          Scheduled for {format(new Date(session.scheduled_at), 'MMM dd, yyyy HH:mm')}
                        </div>
                      )}

                      {session.pre_session_brief && (
                        <div className="border-t pt-3 mt-3">
                          <p className="text-sm font-medium text-foreground mb-1">Pre-session Brief</p>
                          <p className="text-sm text-muted-foreground">
                            {session.pre_session_brief.summary || 'No summary provided'}
                          </p>
                        </div>
                      )}

                      <div className="flex gap-2 pt-2">
                        {session.status === 'paid' && (
                          <Button
                            size="sm"
                            onClick={() => updateSessionStatus(session.id, 'confirmed')}
                          >
                            <CheckCircle className="mr-1 h-4 w-4" />
                            Confirm
                          </Button>
                        )}
                        {(session.status === 'paid' || session.status === 'confirmed') && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => updateSessionStatus(session.id, 'cancelled')}
                          >
                            <XCircle className="mr-1 h-4 w-4" />
                            Cancel
                          </Button>
                        )}
                        {session.status === 'confirmed' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateSessionStatus(session.id, 'completed')}
                          >
                            Mark Complete
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
