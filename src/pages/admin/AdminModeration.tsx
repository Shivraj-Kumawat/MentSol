import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Shield, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface ModerationLog {
  id: string;
  session_id: string;
  detected_type: string;
  detected_content: string;
  context: string;
  action_taken: string;
  reviewed_by_admin: boolean;
  created_at: string;
}

export default function AdminModeration() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [logs, setLogs] = useState<ModerationLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('moderation_logs')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLogs(data || []);
    } catch (error) {
      console.error('Error fetching moderation logs:', error);
      toast({
        title: 'Error',
        description: 'Failed to load moderation logs',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const markAsReviewed = async (logId: string) => {
    try {
      const { error } = await supabase
        .from('moderation_logs')
        .update({ reviewed_by_admin: true })
        .eq('id', logId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Log marked as reviewed',
      });

      fetchLogs();
    } catch (error) {
      console.error('Error marking log as reviewed:', error);
      toast({
        title: 'Error',
        description: 'Failed to update log',
        variant: 'destructive',
      });
    }
  };

  const getTypeBadge = (type: string) => {
    const variants: Record<string, { variant: any; label: string }> = {
      phone_number: { variant: 'destructive', label: 'Phone' },
      email: { variant: 'destructive', label: 'Email' },
      social_handle: { variant: 'default', label: 'Social' },
      other: { variant: 'secondary', label: 'Other' },
    };
    const config = variants[type] || variants.other;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const unreviewedCount = logs.filter((log) => !log.reviewed_by_admin).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-teal-glow/5 to-background p-6">
      <div className="max-w-7xl mx-auto">
        <Button variant="ghost" onClick={() => navigate('/admin')} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>

        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Moderation Logs</h1>
          <p className="text-muted-foreground">
            Review anti-contact detection events
            {unreviewedCount > 0 && (
              <Badge variant="destructive" className="ml-3">
                {unreviewedCount} Unreviewed
              </Badge>
            )}
          </p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-pulse text-muted-foreground">Loading logs...</div>
          </div>
        ) : logs.length === 0 ? (
          <Card className="glass">
            <CardContent className="py-12 text-center">
              <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No moderation events detected</p>
              <p className="text-sm text-muted-foreground mt-2">
                This is a good sign! Your platform is clean.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {logs.map((log) => (
              <Card
                key={log.id}
                className={`glass card-hover ${
                  !log.reviewed_by_admin ? 'border-destructive/50' : ''
                }`}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        Detection Event
                        {getTypeBadge(log.detected_type)}
                        {!log.reviewed_by_admin && (
                          <Badge variant="outline">Needs Review</Badge>
                        )}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        {format(new Date(log.created_at), 'MMM dd, yyyy HH:mm')}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-medium text-foreground">Detected Content</p>
                      <p className="text-sm text-muted-foreground font-mono bg-muted/50 p-2 rounded">
                        {log.detected_content}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">Context</p>
                      <p className="text-sm text-muted-foreground">{log.context}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">Action Taken</p>
                      <p className="text-sm text-muted-foreground">{log.action_taken}</p>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Session ID: {log.session_id}
                    </div>
                    {!log.reviewed_by_admin && (
                      <div className="pt-2">
                        <Button size="sm" onClick={() => markAsReviewed(log.id)}>
                          <CheckCircle className="mr-1 h-4 w-4" />
                          Mark as Reviewed
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
