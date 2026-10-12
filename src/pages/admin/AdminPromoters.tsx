import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Users, Share2, DollarSign, MousePointer, Download, Check, X, Search, Phone, Mail, BookOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface Promoter {
  id: string;
  user_id: string | null;
  name: string | null;
  code: string;
  short_ref: string;
  upi_id: string | null;
  total_clicks: number;
  total_signups: number;
  total_sessions: number;
  total_earnings: number;
  created_at: string;
}

interface AdminReferral {
  referral_id: string;
  promoter_id: string;
  promoter_name: string | null;
  promoter_code: string | null;
  referred_user_id: string;
  student_name: string | null;
  student_email: string | null;
  student_phone: string | null;
  student_category: string | null;
  sessions_count: number;
  commission_earned: number;
  booked_sessions: number;
  completed_sessions: number;
  total_session_amount: number;
  referral_date: string;
}

interface Payout {
  id: string;
  promoter_id: string | null;
  amount: number;
  status: string | null;
  created_at: string;
  paid_at: string | null;
  tx_id: string | null;
  promoter?: Promoter;
}

export default function AdminPromoters() {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Data states
  const [promoters, setPromoters] = useState<Promoter[]>([]);
  const [referrals, setReferrals] = useState<AdminReferral[]>([]);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [referralSearchQuery, setReferralSearchQuery] = useState('');
  const [payoutStatusFilter, setPayoutStatusFilter] = useState('all');
  
  // Dialog states
  const [payoutDialogOpen, setPayoutDialogOpen] = useState(false);
  const [selectedPayout, setSelectedPayout] = useState<Payout | null>(null);
  const [txId, setTxId] = useState('');
  const [processingPayout, setProcessingPayout] = useState(false);

  // Stats
  const [stats, setStats] = useState({
    totalPromoters: 0,
    totalReferrals: 0,
    totalPaidOut: 0,
    pendingPayouts: 0,
    totalCommissionEarned: 0,
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch promoters
      const { data: promotersData, error: promotersError } = await supabase
        .from('promoters')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (promotersError) throw promotersError;
      setPromoters(promotersData || []);

      // Fetch referrals with full details using RPC
      const { data: referralsData, error: referralsError } = await supabase
        .rpc('get_all_referrals_admin');
      
      if (referralsError) {
        console.error('Error fetching referrals:', referralsError);
      } else {
        setReferrals((referralsData || []) as AdminReferral[]);
      }

      // Fetch payouts with promoter info
      const { data: payoutsData, error: payoutsError } = await supabase
        .from('promoter_payouts')
        .select(`
          *,
          promoter:promoter_id (*)
        `)
        .order('created_at', { ascending: false });
      
      if (payoutsError) throw payoutsError;
      setPayouts(payoutsData || []);

      // Calculate stats
      const totalPaidOut = (payoutsData || [])
        .filter(p => p.status === 'paid')
        .reduce((sum, p) => sum + Number(p.amount), 0);
      
      const pendingPayouts = (payoutsData || [])
        .filter(p => p.status === 'pending')
        .reduce((sum, p) => sum + Number(p.amount), 0);

      const totalCommissionEarned = (referralsData || [])
        .reduce((sum: number, r: AdminReferral) => sum + Number(r.commission_earned || 0), 0);

      setStats({
        totalPromoters: promotersData?.length || 0,
        totalReferrals: referralsData?.length || 0,
        totalPaidOut,
        pendingPayouts,
        totalCommissionEarned,
      });

    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load promoter data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleApprovePayout = async () => {
    if (!selectedPayout || !txId.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a transaction ID',
        variant: 'destructive',
      });
      return;
    }

    try {
      setProcessingPayout(true);
      
      const { error } = await supabase
        .from('promoter_payouts')
        .update({
          status: 'paid',
          paid_at: new Date().toISOString(),
          tx_id: txId.trim(),
        })
        .eq('id', selectedPayout.id);

      if (error) throw error;

      toast({
        title: 'Payout Approved',
        description: `Payout of ₹${selectedPayout.amount} marked as paid`,
      });

      setPayoutDialogOpen(false);
      setSelectedPayout(null);
      setTxId('');
      fetchData();
    } catch (error) {
      console.error('Error approving payout:', error);
      toast({
        title: 'Error',
        description: 'Failed to approve payout',
        variant: 'destructive',
      });
    } finally {
      setProcessingPayout(false);
    }
  };

  const handleRejectPayout = async (payoutId: string) => {
    try {
      const { error } = await supabase
        .from('promoter_payouts')
        .update({ status: 'rejected' })
        .eq('id', payoutId);

      if (error) throw error;

      toast({
        title: 'Payout Rejected',
        description: 'Payout request has been rejected',
      });

      fetchData();
    } catch (error) {
      console.error('Error rejecting payout:', error);
      toast({
        title: 'Error',
        description: 'Failed to reject payout',
        variant: 'destructive',
      });
    }
  };

  const exportPayouts = () => {
    const csv = [
      ['ID', 'Promoter', 'UPI ID', 'Amount', 'Status', 'Requested', 'Paid At', 'TX ID'].join(','),
      ...payouts.map(p => [
        p.id,
        p.promoter?.name || 'Unknown',
        p.promoter?.upi_id || 'N/A',
        p.amount,
        p.status,
        format(new Date(p.created_at), 'yyyy-MM-dd HH:mm'),
        p.paid_at ? format(new Date(p.paid_at), 'yyyy-MM-dd HH:mm') : 'N/A',
        p.tx_id || 'N/A'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `promoter-payouts-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
  };

  const exportReferrals = () => {
    const csv = [
      ['Student Name', 'Email', 'Phone', 'Category', 'Promoter', 'Code', 'Booked', 'Completed', 'Amount', 'Commission', 'Signup Date'].join(','),
      ...referrals.map(r => [
        r.student_name || 'Unknown',
        r.student_email || 'N/A',
        r.student_phone || 'N/A',
        r.student_category || 'N/A',
        r.promoter_name || 'Unknown',
        r.promoter_code || 'N/A',
        r.booked_sessions,
        r.completed_sessions,
        r.total_session_amount,
        r.commission_earned,
        format(new Date(r.referral_date), 'yyyy-MM-dd HH:mm')
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `promoter-referrals-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
  };

  const filteredPromoters = promoters.filter(p => 
    p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.short_ref.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredReferrals = referrals.filter(r =>
    r.student_name?.toLowerCase().includes(referralSearchQuery.toLowerCase()) ||
    r.student_email?.toLowerCase().includes(referralSearchQuery.toLowerCase()) ||
    r.promoter_name?.toLowerCase().includes(referralSearchQuery.toLowerCase()) ||
    r.promoter_code?.toLowerCase().includes(referralSearchQuery.toLowerCase())
  );

  const filteredPayouts = payouts.filter(p => 
    payoutStatusFilter === 'all' || p.status === payoutStatusFilter
  );

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'paid':
        return <Badge className="bg-green-500/20 text-green-400">Paid</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-teal-glow/5 to-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading promoter data...</div>
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
          <h1 className="text-4xl font-bold text-foreground mb-2">Promoter Management</h1>
          <p className="text-muted-foreground">Manage referral partners and process payouts</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <Card className="glass">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Users className="h-4 w-4" />
                Total Promoters
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{stats.totalPromoters}</div>
            </CardContent>
          </Card>

          <Card className="glass">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Share2 className="h-4 w-4" />
                Total Referrals
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{stats.totalReferrals}</div>
            </CardContent>
          </Card>

          <Card className="glass">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <BookOpen className="h-4 w-4 text-purple-400" />
                Total Commission
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-400">₹{stats.totalCommissionEarned.toFixed(2)}</div>
            </CardContent>
          </Card>

          <Card className="glass">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <DollarSign className="h-4 w-4 text-green-400" />
                Total Paid Out
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-400">₹{stats.totalPaidOut.toFixed(2)}</div>
            </CardContent>
          </Card>

          <Card className="glass">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <DollarSign className="h-4 w-4 text-amber-400" />
                Pending Payouts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-400">₹{stats.pendingPayouts.toFixed(2)}</div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="promoters" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="promoters">Promoters ({promoters.length})</TabsTrigger>
            <TabsTrigger value="referrals">Referrals ({referrals.length})</TabsTrigger>
            <TabsTrigger value="payouts">
              Payouts
              {payouts.filter(p => p.status === 'pending').length > 0 && (
                <Badge variant="destructive" className="ml-2 h-5 px-1.5">
                  {payouts.filter(p => p.status === 'pending').length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Promoters Tab */}
          <TabsContent value="promoters" className="space-y-4">
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, code, or ref..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Card className="glass overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Promoter</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>UPI ID</TableHead>
                    <TableHead className="text-center">Clicks</TableHead>
                    <TableHead className="text-center">Signups</TableHead>
                    <TableHead className="text-center">Sessions</TableHead>
                    <TableHead className="text-right">Earnings</TableHead>
                    <TableHead>Joined</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPromoters.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                        No promoters found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredPromoters.map((promoter) => (
                      <TableRow key={promoter.id}>
                        <TableCell className="font-medium">{promoter.name || 'Unknown'}</TableCell>
                        <TableCell>
                          <code className="text-xs bg-muted px-2 py-1 rounded">{promoter.code}</code>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{promoter.upi_id || 'Not set'}</TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            <MousePointer className="h-3 w-3 text-muted-foreground" />
                            {promoter.total_clicks}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">{promoter.total_signups}</TableCell>
                        <TableCell className="text-center">{promoter.total_sessions}</TableCell>
                        <TableCell className="text-right font-semibold text-green-400">
                          ₹{Number(promoter.total_earnings).toFixed(2)}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {format(new Date(promoter.created_at), 'MMM dd, yyyy')}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          {/* Referrals Tab */}
          <TabsContent value="referrals" className="space-y-4">
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by student name, email, promoter..."
                  value={referralSearchQuery}
                  onChange={(e) => setReferralSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button onClick={exportReferrals} variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </Button>
            </div>

            <Card className="glass overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Promoter</TableHead>
                    <TableHead className="text-center">Booked</TableHead>
                    <TableHead className="text-center">Completed</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Commission</TableHead>
                    <TableHead>Signup Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReferrals.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                        No referrals yet
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredReferrals.map((referral) => (
                      <TableRow key={referral.referral_id}>
                        <TableCell className="font-medium">
                          {referral.student_name || 'Unknown User'}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1 text-xs">
                            {referral.student_email && (
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <Mail className="h-3 w-3" />
                                <span className="truncate max-w-[150px]">{referral.student_email}</span>
                              </div>
                            )}
                            {referral.student_phone && (
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <Phone className="h-3 w-3" />
                                <span>{referral.student_phone}</span>
                              </div>
                            )}
                            {!referral.student_email && !referral.student_phone && (
                              <span className="text-muted-foreground">N/A</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {referral.student_category ? (
                            <Badge variant="outline" className="text-xs">
                              {referral.student_category}
                            </Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground">N/A</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span>{referral.promoter_name || 'Unknown'}</span>
                            <code className="text-xs text-muted-foreground">
                              {referral.promoter_code}
                            </code>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="secondary">
                            {referral.booked_sessions}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant={referral.completed_sessions > 0 ? 'default' : 'secondary'}>
                            {referral.sessions_count}/5
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          ₹{Number(referral.total_session_amount).toFixed(0)}
                        </TableCell>
                        <TableCell className="text-right font-semibold text-green-400">
                          ₹{Number(referral.commission_earned).toFixed(2)}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {format(new Date(referral.referral_date), 'MMM dd, yyyy')}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          {/* Payouts Tab */}
          <TabsContent value="payouts" className="space-y-4">
            <div className="flex gap-4">
              <Select value={payoutStatusFilter} onValueChange={setPayoutStatusFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Payouts</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={exportPayouts} variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </Button>
            </div>

            <Card className="glass overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Promoter</TableHead>
                    <TableHead>UPI ID</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Requested</TableHead>
                    <TableHead>Paid At</TableHead>
                    <TableHead>TX ID</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPayouts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                        No payout requests
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredPayouts.map((payout) => (
                      <TableRow key={payout.id}>
                        <TableCell className="font-medium">
                          {payout.promoter?.name || 'Unknown'}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {payout.promoter?.upi_id || 'Not set'}
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          ₹{Number(payout.amount).toFixed(2)}
                        </TableCell>
                        <TableCell>{getStatusBadge(payout.status)}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {format(new Date(payout.created_at), 'MMM dd, yyyy')}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {payout.paid_at 
                            ? format(new Date(payout.paid_at), 'MMM dd, yyyy') 
                            : '-'}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {payout.tx_id || '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          {payout.status === 'pending' && (
                            <div className="flex justify-end gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 text-green-400 border-green-400/30 hover:bg-green-400/10"
                                onClick={() => {
                                  setSelectedPayout(payout);
                                  setPayoutDialogOpen(true);
                                }}
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 text-destructive border-destructive/30 hover:bg-destructive/10"
                                onClick={() => handleRejectPayout(payout.id)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Approve Payout Dialog */}
        <Dialog open={payoutDialogOpen} onOpenChange={setPayoutDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Approve Payout</DialogTitle>
              <DialogDescription>
                Enter the transaction ID after completing the payment to {selectedPayout?.promoter?.name}.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Amount:</span>
                <span className="font-semibold">₹{selectedPayout?.amount}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">UPI ID:</span>
                <span className="font-mono">{selectedPayout?.promoter?.upi_id || 'Not set'}</span>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Transaction ID</label>
                <Input
                  placeholder="Enter UPI/Bank transaction ID"
                  value={txId}
                  onChange={(e) => setTxId(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setPayoutDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleApprovePayout} disabled={processingPayout || !txId.trim()}>
                {processingPayout ? 'Processing...' : 'Mark as Paid'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
