import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { DollarSign, Clock, Check, X, Loader2, Send } from 'lucide-react';

interface PriceRequest {
  id: string;
  category: string;
  current_price: number;
  requested_price: number;
  message: string | null;
  status: string;
  admin_notes: string | null;
  created_at: string;
}

interface MentorPriceRequestSectionProps {
  mentorId: string;
  mentorCategories: string[];
}

export default function MentorPriceRequestSection({ mentorId, mentorCategories }: MentorPriceRequestSectionProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [requests, setRequests] = useState<PriceRequest[]>([]);
  const [categoryPrices, setCategoryPrices] = useState<Record<string, number>>({});
  
  // Form state
  const [selectedCategory, setSelectedCategory] = useState('');
  const [requestedPrice, setRequestedPrice] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadData();
  }, [mentorId]);

  const loadData = async () => {
    try {
      // Load existing price requests
      const { data: requestsData, error: requestsError } = await supabase
        .from('mentor_price_requests')
        .select('*')
        .eq('mentor_id', mentorId)
        .order('created_at', { ascending: false });

      if (requestsError) throw requestsError;
      setRequests(requestsData || []);

      // Load current category prices
      const { data: pricesData, error: pricesError } = await supabase
        .from('mentor_category_prices')
        .select('category, price_per_15m')
        .eq('mentor_id', mentorId);

      if (pricesError) throw pricesError;
      
      const priceMap: Record<string, number> = {};
      pricesData?.forEach(p => {
        priceMap[p.category] = p.price_per_15m;
      });
      setCategoryPrices(priceMap);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitRequest = async () => {
    if (!selectedCategory || !requestedPrice) {
      toast({
        title: 'Missing Information',
        description: 'Please select a category and enter requested price',
        variant: 'destructive',
      });
      return;
    }

    // DB stores in RUPEES - save as-is
    const priceValue = parseInt(requestedPrice);
    if (isNaN(priceValue) || priceValue <= 0) {
      toast({
        title: 'Invalid Price',
        description: 'Please enter a valid price',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);
    try {
      const currentPrice = categoryPrices[selectedCategory] || 0;
      
      const { error } = await supabase
        .from('mentor_price_requests')
        .insert({
          mentor_id: mentorId,
          category: selectedCategory,
          current_price: currentPrice,
          requested_price: priceValue,
          message: message.trim() || null,
          status: 'pending',
        });

      if (error) throw error;

      toast({
        title: 'Request Submitted',
        description: 'Your price change request has been submitted for admin review',
      });

      // Reset form
      setSelectedCategory('');
      setRequestedPrice('');
      setMessage('');
      
      // Reload data
      loadData();
    } catch (error: any) {
      console.error('Error submitting request:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to submit request',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'approved':
        return <Badge className="bg-green-500"><Check className="w-3 h-3 mr-1" />Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><X className="w-3 h-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Submit New Request */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-primary" />
            Request Price Update
          </CardTitle>
          <CardDescription>
            Submit a request to update your pricing. Admin will review and approve.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {mentorCategories.map(cat => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                      {categoryPrices[cat] > 0 && ` (Current: ₹${categoryPrices[cat]})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Requested Price (₹ per 15 min)</Label>
              <Input
                type="number"
                placeholder="e.g., 100"
                value={requestedPrice}
                onChange={(e) => setRequestedPrice(e.target.value)}
                min="0"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Message (Optional)</Label>
            <Textarea
              placeholder="Explain why you're requesting this price change..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={2}
            />
          </div>

          <Button onClick={handleSubmitRequest} disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Submit Request
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Request History */}
      <Card>
        <CardHeader>
          <CardTitle>Request History</CardTitle>
        </CardHeader>
        <CardContent>
          {requests.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">
              No price requests yet
            </p>
          ) : (
            <div className="space-y-4">
              {requests.map(request => (
                <div
                  key={request.id}
                  className="p-4 border rounded-lg space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{request.category}</span>
                    {getStatusBadge(request.status)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <span>₹{request.current_price}</span>
                    <span className="mx-2">→</span>
                    <span className="font-medium text-foreground">
                      ₹{request.requested_price}
                    </span>
                  </div>
                  {request.message && (
                    <p className="text-sm text-muted-foreground">
                      "{request.message}"
                    </p>
                  )}
                  {request.admin_notes && (
                    <p className="text-sm text-primary">
                      Admin: {request.admin_notes}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {new Date(request.created_at).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}