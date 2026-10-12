import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, DollarSign, Filter, Download } from 'lucide-react';
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface Payment {
  id: string;
  razorpay_order_id: string;
  razorpay_payment_id: string;
  amount: number;
  currency: string;
  status: string;
  created_at: string;
  session: {
    id: string;
    student: {
      full_name: string;
      email: string;
    };
  };
}

export default function AdminPayments() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [refundDialogOpen, setRefundDialogOpen] = useState(false);
  const [paymentToRefund, setPaymentToRefund] = useState<string | null>(null);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('payments')
        .select(`
          *,
          session:session_id (
            id,
            student:student_id (
              full_name,
              email
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setPayments(data || []);
    } catch (error) {
      console.error('Error fetching payments:', error);
      toast({
        title: 'Error',
        description: 'Failed to load payments',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [statusFilter]);

  const processRefund = async () => {
    if (!paymentToRefund) return;

    try {
      // TODO: Call Razorpay API for actual refund
      // For now, just update status to refunded
      const { error } = await supabase
        .from('payments')
        .update({ status: 'refunded' })
        .eq('id', paymentToRefund);

      if (error) throw error;

      toast({
        title: 'Refund Processed',
        description: 'Payment has been marked as refunded',
      });

      setRefundDialogOpen(false);
      setPaymentToRefund(null);
      fetchPayments();
    } catch (error) {
      console.error('Error processing refund:', error);
      toast({
        title: 'Error',
        description: 'Failed to process refund',
        variant: 'destructive',
      });
    }
  };

  const exportPayments = () => {
    const csv = [
      ['ID', 'Date', 'Customer', 'Amount', 'Status'].join(','),
      ...payments.map(p => [
        p.id,
        format(new Date(p.created_at), 'yyyy-MM-dd HH:mm'),
        p.session?.student?.full_name,
        (p.amount / 100).toFixed(2),
        p.status
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payments-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; label: string }> = {
      created: { variant: 'secondary', label: 'Created' },
      captured: { variant: 'default', label: 'Captured' },
      failed: { variant: 'destructive', label: 'Failed' },
      refunded: { variant: 'outline', label: 'Refunded' },
    };
    const config = variants[status] || variants.created;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const totalRevenue = payments
    .filter((p) => p.status === 'captured')
    .reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-teal-glow/5 to-background p-6">
      <div className="max-w-7xl mx-auto">
        <Button variant="ghost" onClick={() => navigate('/admin')} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>

        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Payment Management</h1>
          <p className="text-muted-foreground">View and manage all transactions</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-primary" />
                Total Revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">
                ₹{(totalRevenue / 100).toFixed(2)}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                From {payments.filter((p) => p.status === 'captured').length} successful transactions
              </p>
            </CardContent>
          </Card>

          <Card className="glass">
            <CardHeader>
              <CardTitle>Filter & Export</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Payments</SelectItem>
                  <SelectItem value="captured">Captured</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="refunded">Refunded</SelectItem>
                  <SelectItem value="created">Created</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={exportPayments} variant="outline" className="w-full">
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </Button>
            </CardContent>
          </Card>

          <Card className="glass">
            <CardContent className="pt-6">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Successful</span>
                  <span className="font-semibold text-foreground">
                    {payments.filter(p => p.status === 'captured').length}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Failed</span>
                  <span className="font-semibold text-destructive">
                    {payments.filter(p => p.status === 'failed').length}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Refunded</span>
                  <span className="font-semibold text-foreground">
                    {payments.filter(p => p.status === 'refunded').length}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-pulse text-muted-foreground">Loading payments...</div>
          </div>
        ) : payments.length === 0 ? (
          <Card className="glass">
            <CardContent className="py-12 text-center text-muted-foreground">
              No payments found
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {payments.map((payment) => (
              <Card key={payment.id} className="glass card-hover">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        Payment #{payment.id.slice(0, 8)}
                        {getStatusBadge(payment.status)}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        {format(new Date(payment.created_at), 'MMM dd, yyyy HH:mm')}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold text-foreground">
                        {payment.currency} {(payment.amount / 100).toFixed(2)}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div>
                      <p className="text-sm font-medium text-foreground">Customer</p>
                      <p className="text-sm text-muted-foreground">
                        {payment.session?.student?.full_name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {payment.session?.student?.email}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
                      <div>
                        <span className="font-medium">Order ID:</span>{' '}
                        {payment.razorpay_order_id || 'N/A'}
                      </div>
                      <div>
                        <span className="font-medium">Payment ID:</span>{' '}
                        {payment.razorpay_payment_id || 'N/A'}
                      </div>
                    </div>
                    {payment.status === 'captured' && (
                      <div className="pt-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setPaymentToRefund(payment.id);
                            setRefundDialogOpen(true);
                          }}
                        >
                          Issue Refund
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Refund Confirmation Dialog */}
        <AlertDialog open={refundDialogOpen} onOpenChange={setRefundDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Process Refund</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to refund this payment? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={processRefund}>
                Process Refund
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
