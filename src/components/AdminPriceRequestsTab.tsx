import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Check, 
  X, 
  Loader2, 
  DollarSign, 
  Clock,
  Edit2
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

interface PriceRequest {
  id: string;
  mentor_id: string;
  category: string;
  current_price: number;
  requested_price: number;
  message: string | null;
  status: string;
  created_at: string;
  mentors?: {
    profiles?: {
      full_name: string | null;
      email: string | null;
    };
  };
}

export default function AdminPriceRequestsTab() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<PriceRequest[]>([]);
  const [processingId, setProcessingId] = useState<string | null>(null);
  
  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<PriceRequest | null>(null);
  const [modifiedPrice, setModifiedPrice] = useState('');
  const [adminNotes, setAdminNotes] = useState('');

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('mentor_price_requests')
        .select(`
          *,
          mentors:mentor_id (
            profiles:user_id (
              full_name,
              email
            )
          )
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (error) {
      console.error('Error loading requests:', error);
      toast({
        title: 'Error',
        description: 'Failed to load price requests',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (request: PriceRequest, priceOverride?: number) => {
    setProcessingId(request.id);
    try {
      const finalPrice = priceOverride ?? request.requested_price;
      
      // Update the request status
      const { error: requestError } = await supabase
        .from('mentor_price_requests')
        .update({
          status: 'approved',
          admin_notes: adminNotes || null,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', request.id);

      if (requestError) throw requestError;

      // Upsert the category price
      const { error: priceError } = await supabase
        .from('mentor_category_prices')
        .upsert({
          mentor_id: request.mentor_id,
          category: request.category,
          price_per_15m: finalPrice,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'mentor_id,category'
        });

      if (priceError) throw priceError;

      toast({
        title: 'Request Approved',
        description: `Price updated to ₹${finalPrice} for ${request.category}`,
      });

      setDialogOpen(false);
      setSelectedRequest(null);
      setModifiedPrice('');
      setAdminNotes('');
      loadRequests();
    } catch (error: any) {
      console.error('Error approving request:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to approve request',
        variant: 'destructive',
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (requestId: string) => {
    setProcessingId(requestId);
    try {
      const { error } = await supabase
        .from('mentor_price_requests')
        .update({
          status: 'rejected',
          admin_notes: adminNotes || 'Request rejected by admin',
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', requestId);

      if (error) throw error;

      toast({
        title: 'Request Rejected',
        description: 'The price request has been rejected',
      });

      setDialogOpen(false);
      setSelectedRequest(null);
      setAdminNotes('');
      loadRequests();
    } catch (error: any) {
      console.error('Error rejecting request:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to reject request',
        variant: 'destructive',
      });
    } finally {
      setProcessingId(null);
    }
  };

  const openModifyDialog = (request: PriceRequest) => {
    setSelectedRequest(request);
    // DB stores in RUPEES - display as-is
    setModifiedPrice(request.requested_price.toString());
    setAdminNotes('');
    setDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <DollarSign className="w-5 h-5" />
          Price Requests
          {requests.length > 0 && (
            <Badge variant="secondary">{requests.length} pending</Badge>
          )}
        </h2>
      </div>

      {requests.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No pending price requests</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {requests.map(request => (
            <Card key={request.id} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">
                        {request.mentors?.profiles?.full_name || 'Unknown Mentor'}
                      </span>
                      <Badge variant="outline">{request.category}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {request.mentors?.profiles?.email}
                    </p>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-muted-foreground">
                        ₹{request.current_price}
                      </span>
                      <span>→</span>
                      <span className="font-medium text-primary">
                        ₹{request.requested_price}
                      </span>
                      <span className="text-muted-foreground">
                        per session
                      </span>
                    </div>
                    {request.message && (
                      <p className="text-sm italic text-muted-foreground mt-2">
                        "{request.message}"
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Requested: {new Date(request.created_at).toLocaleString()}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleApprove(request)}
                      disabled={processingId === request.id}
                    >
                      {processingId === request.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <Check className="w-4 h-4 mr-1" />
                          Approve
                        </>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openModifyDialog(request)}
                      disabled={processingId === request.id}
                    >
                      <Edit2 className="w-4 h-4 mr-1" />
                      Modify
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleReject(request.id)}
                      disabled={processingId === request.id}
                    >
                      <X className="w-4 h-4 mr-1" />
                      Reject
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modify Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modify Price Request</DialogTitle>
            <DialogDescription>
              Adjust the price before approving or add notes for rejection.
            </DialogDescription>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Mentor:</span>
                  <p className="font-medium">
                    {selectedRequest.mentors?.profiles?.full_name}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Category:</span>
                  <p className="font-medium">{selectedRequest.category}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Current Price:</span>
                  <p className="font-medium">₹{selectedRequest.current_price}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Requested:</span>
                  <p className="font-medium">₹{selectedRequest.requested_price}</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Final Price (₹ per session)</Label>
                <Input
                  type="number"
                  value={modifiedPrice}
                  onChange={(e) => setModifiedPrice(e.target.value)}
                  min="0"
                />
              </div>

              <div className="space-y-2">
                <Label>Admin Notes (Optional)</Label>
                <Textarea
                  placeholder="Add notes for the mentor..."
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  rows={2}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => selectedRequest && handleReject(selectedRequest.id)}
              disabled={processingId !== null}
            >
              Reject
            </Button>
            <Button
              onClick={() => {
                if (selectedRequest && modifiedPrice) {
                  // DB stores in RUPEES - save as-is
                  handleApprove(selectedRequest, parseInt(modifiedPrice));
                }
              }}
              disabled={processingId !== null || !modifiedPrice}
            >
              Approve with ₹{modifiedPrice || '0'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}