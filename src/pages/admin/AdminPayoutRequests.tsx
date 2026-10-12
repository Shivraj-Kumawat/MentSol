import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, CheckCircle2, XCircle, Clock, IndianRupee } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from '@/hooks/use-toast';

interface PayoutRequest {
  id: string;
  mentor_id: string;
  amount: number;
  status: string;
  requested_at: string;
  processed_at: string | null;
  admin_notes: string | null;
  mentor_name?: string;
  avatar_url?: string;
  upi_id?: string;
  bank_account?: string;
}

export default function AdminPayoutRequests() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [requests, setRequests] = useState<PayoutRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<PayoutRequest | null>(null);
  const [rejectNotes, setRejectNotes] = useState('');

  useEffect(() => { loadRequests(); }, []);

  const loadRequests = async () => {
    try {
      const { data: payoutData, error } = await supabase
        .from('payout_requests')
        .select('*')
        .order('requested_at', { ascending: false });

      if (error) throw error;

      // Fetch mentor details
      const mentorIds = [...new Set((payoutData || []).map((p: any) => p.mentor_id))];
      const { data: mentors } = await supabase
        .from('mentors')
        .select('id, user_id, upi_id, bank_account')
        .in('id', mentorIds);

      const userIds = mentors?.map(m => m.user_id) || [];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .in('id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
      const mentorMap = new Map(mentors?.map(m => [m.id, { ...m, ...(profileMap.get(m.user_id) || {}) }]) || []);

      const enriched: PayoutRequest[] = (payoutData || []).map((p: any) => {
        const mentor = mentorMap.get(p.mentor_id);
        return {
          ...p,
          mentor_name: (mentor as any)?.full_name || 'Unknown',
          avatar_url: (mentor as any)?.avatar_url || null,
          upi_id: (mentor as any)?.upi_id || null,
          bank_account: (mentor as any)?.bank_account || null,
        };
      });

      setRequests(enriched);
    } catch (err) {
      console.error('Error loading payout requests:', err);
    } finally {
      setLoading(false);
    }
  };

  const markAsPaid = async (req: PayoutRequest) => {
    if (!user) return;
    setProcessing(req.id);
    try {
      // Update payout request
      const { error: prErr } = await supabase
        .from('payout_requests')
        .update({ status: 'paid', processed_at: new Date().toISOString(), processed_by: user.id } as any)
        .eq('id', req.id);
      if (prErr) throw prErr;

      // Update earnings for this mentor from payout_requested to paid
      const { error: eErr } = await supabase
        .from('earnings')
        .update({ status: 'paid', paid_at: new Date().toISOString() } as any)
        .eq('mentor_id', req.mentor_id)
        .eq('status', 'payout_requested');
      if (eErr) throw eErr;

      // Update mentor balances
      const { data: mentor } = await supabase
        .from('mentors')
        .select('wallet_balance, paid_balance')
        .eq('id', req.mentor_id)
        .single();

      if (mentor) {
        const { error: mErr } = await supabase
          .from('mentors')
          .update({
            wallet_balance: Math.max(0, ((mentor as any).wallet_balance || 0) - req.amount),
            paid_balance: ((mentor as any).paid_balance || 0) + req.amount,
          } as any)
          .eq('id', req.mentor_id);
        if (mErr) throw mErr;
      }

      toast({ title: 'Payout marked as paid!', description: `₹${req.amount} credited to ${req.mentor_name}` });
      loadRequests();
    } catch (err) {
      toast({ title: 'Error', description: String(err), variant: 'destructive' });
    } finally {
      setProcessing(null);
    }
  };

  const rejectRequest = async () => {
    if (!selectedRequest || !user) return;
    setProcessing(selectedRequest.id);
    try {
      // Update payout request to rejected
      const { error: prErr } = await supabase
        .from('payout_requests')
        .update({ status: 'rejected', processed_at: new Date().toISOString(), processed_by: user.id, admin_notes: rejectNotes || null } as any)
        .eq('id', selectedRequest.id);
      if (prErr) throw prErr;

      // Revert earnings back to pending
      const { error: eErr } = await supabase
        .from('earnings')
        .update({ status: 'pending' } as any)
        .eq('mentor_id', selectedRequest.mentor_id)
        .eq('status', 'payout_requested');
      if (eErr) throw eErr;

      toast({ title: 'Payout rejected', description: `Request from ${selectedRequest.mentor_name} has been rejected.` });
      setRejectDialogOpen(false);
      setSelectedRequest(null);
      setRejectNotes('');
      loadRequests();
    } catch (err) {
      toast({ title: 'Error', description: String(err), variant: 'destructive' });
    } finally {
      setProcessing(null);
    }
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case 'requested': return <Badge variant="warning"><Clock className="h-3 w-3 mr-1" />Requested</Badge>;
      case 'paid': return <Badge variant="success"><CheckCircle2 className="h-3 w-3 mr-1" />Paid</Badge>;
      case 'rejected': return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading payout requests...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/admin')}>
            <ArrowLeft className="h-4 w-4 mr-2" />Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Mentor Payout Requests</h1>
            <p className="text-muted-foreground">Review and process mentor withdrawal requests</p>
          </div>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-sm text-muted-foreground">Pending</p>
              <p className="text-3xl font-bold text-yellow-600">{requests.filter(r => r.status === 'requested').length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-sm text-muted-foreground">Total Paid</p>
              <p className="text-3xl font-bold text-green-600">
                ₹{requests.filter(r => r.status === 'paid').reduce((s, r) => s + r.amount, 0)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-sm text-muted-foreground">Pending Amount</p>
              <p className="text-3xl font-bold text-blue-600">
                ₹{requests.filter(r => r.status === 'requested').reduce((s, r) => s + r.amount, 0)}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Requests List */}
        <Card>
          <CardHeader>
            <CardTitle>All Requests</CardTitle>
          </CardHeader>
          <CardContent>
            {requests.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <IndianRupee className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No payout requests yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {requests.map(req => (
                  <div key={req.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold">{req.mentor_name}</p>
                        {statusBadge(req.status)}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Requested: {format(new Date(req.requested_at), 'PPp')}
                      </p>
                      <div className="flex gap-4 text-xs text-muted-foreground">
                        {req.upi_id && <span>UPI: {req.upi_id}</span>}
                        {req.bank_account && <span>Bank: {req.bank_account}</span>}
                      </div>
                      {req.admin_notes && <p className="text-xs text-muted-foreground italic">Note: {req.admin_notes}</p>}
                    </div>
                    <div className="text-right flex flex-col items-end gap-2">
                      <p className="text-xl font-bold">₹{req.amount}</p>
                      {req.status === 'requested' && (
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => markAsPaid(req)} disabled={processing === req.id}>
                            <CheckCircle2 className="h-3 w-3 mr-1" />{processing === req.id ? '...' : 'Mark Paid'}
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => { setSelectedRequest(req); setRejectDialogOpen(true); }}>
                            <XCircle className="h-3 w-3 mr-1" />Reject
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Payout</DialogTitle>
            <DialogDescription>
              Reject ₹{selectedRequest?.amount} payout for {selectedRequest?.mentor_name}? Earnings will revert to pending.
            </DialogDescription>
          </DialogHeader>
          <Textarea placeholder="Reason for rejection (optional)" value={rejectNotes} onChange={e => setRejectNotes(e.target.value)} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={rejectRequest} disabled={processing === selectedRequest?.id}>
              {processing === selectedRequest?.id ? 'Rejecting...' : 'Reject Request'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
