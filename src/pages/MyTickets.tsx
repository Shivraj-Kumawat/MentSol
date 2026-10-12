import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Ticket, Clock, CheckCircle, AlertCircle, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface SupportTicket {
  id: string;
  subject: string;
  message: string;
  category: string;
  status: string;
  priority: string;
  admin_response: string | null;
  responded_at: string | null;
  created_at: string;
  updated_at: string;
}

const MyTickets = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);

  useEffect(() => {
    if (user) {
      fetchTickets();
    }
  }, [user]);

  const fetchTickets = async () => {
    try {
      const { data, error } = await supabase
        .from('support_tickets')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTickets(data || []);
    } catch (error) {
      console.error('Error fetching tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ReactNode; label: string }> = {
      open: { variant: 'destructive', icon: <AlertCircle className="h-3 w-3" />, label: 'Open' },
      in_progress: { variant: 'default', icon: <Clock className="h-3 w-3" />, label: 'In Progress' },
      resolved: { variant: 'secondary', icon: <CheckCircle className="h-3 w-3" />, label: 'Resolved' },
      closed: { variant: 'outline', icon: <CheckCircle className="h-3 w-3" />, label: 'Closed' },
    };

    const config = statusConfig[status] || statusConfig.open;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        {config.icon}
        {config.label}
      </Badge>
    );
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      general: 'General',
      payment: 'Payment Issue',
      session: 'Session Problem',
      mentor: 'Mentor Query',
      technical: 'Technical Issue',
      other: 'Other',
    };
    return labels[category] || category;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading tickets...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-2xl mx-auto p-6">
        <Button
          variant="ghost"
          onClick={() => navigate("/home", { replace: true })}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">My Tickets</h1>
            <p className="text-muted-foreground">Track your support requests</p>
          </div>
          <Button onClick={() => navigate('/help')}>
            <Ticket className="mr-2 h-4 w-4" />
            New Ticket
          </Button>
        </div>

        {tickets.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Ticket className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No tickets yet</h3>
              <p className="text-muted-foreground mb-4">
                You haven't submitted any support tickets
              </p>
              <Button onClick={() => navigate('/help')}>
                Submit a Ticket
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {tickets.map((ticket) => (
              <Card 
                key={ticket.id} 
                className="cursor-pointer hover:bg-accent/5 transition-colors"
                onClick={() => setSelectedTicket(ticket)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg truncate">{ticket.subject}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        {getCategoryLabel(ticket.category)} • {format(new Date(ticket.created_at), 'MMM d, yyyy')}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {getStatusBadge(ticket.status)}
                      {ticket.admin_response && (
                        <Badge variant="outline" className="flex items-center gap-1">
                          <MessageSquare className="h-3 w-3" />
                          Response
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {ticket.message}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Ticket Detail Dialog */}
        <Dialog open={!!selectedTicket} onOpenChange={() => setSelectedTicket(null)}>
          <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedTicket?.subject}</DialogTitle>
            </DialogHeader>
            {selectedTicket && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 flex-wrap">
                  {getStatusBadge(selectedTicket.status)}
                  <Badge variant="outline">{getCategoryLabel(selectedTicket.category)}</Badge>
                  <Badge variant="outline" className="capitalize">{selectedTicket.priority} Priority</Badge>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Your Message</h4>
                  <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                    {selectedTicket.message}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Submitted on {format(new Date(selectedTicket.created_at), 'MMM d, yyyy h:mm a')}
                  </p>
                </div>

                {selectedTicket.admin_response && (
                  <div>
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-primary" />
                      Admin Response
                    </h4>
                    <p className="text-sm bg-primary/5 border border-primary/20 p-3 rounded-lg">
                      {selectedTicket.admin_response}
                    </p>
                    {selectedTicket.responded_at && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Responded on {format(new Date(selectedTicket.responded_at), 'MMM d, yyyy h:mm a')}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default MyTickets;
