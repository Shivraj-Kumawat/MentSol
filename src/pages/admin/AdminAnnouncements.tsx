import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Send, Plus, Calendar, Users, TrendingUp } from 'lucide-react';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
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
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

interface Announcement {
  id: string;
  title: string;
  message: string;
  announcement_type: string;
  target_audience: string;
  status: string;
  scheduled_for: string | null;
  sent_at: string | null;
  created_at: string;
  send_as_notification: boolean;
}

interface AnnouncementStats {
  total: number;
  sent: number;
  scheduled: number;
  draft: number;
}

export default function AdminAnnouncements() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<AnnouncementStats>({ total: 0, sent: 0, scheduled: 0, draft: 0 });
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [announcementToSend, setAnnouncementToSend] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    announcement_type: 'info',
    target_audience: 'all',
    send_as_notification: true,
    send_as_email: false,
  });

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setAnnouncements(data || []);

      // Calculate stats
      const total = data?.length || 0;
      const sent = data?.filter(a => a.status === 'sent').length || 0;
      const scheduled = data?.filter(a => a.status === 'scheduled').length || 0;
      const draft = data?.filter(a => a.status === 'draft').length || 0;

      setStats({ total, sent, scheduled, draft });
    } catch (error) {
      console.error('Error fetching announcements:', error);
      toast({
        title: 'Error',
        description: 'Failed to load announcements',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const createAnnouncement = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase.from('announcements').insert({
        ...formData,
        created_by: user.id,
        status: 'draft',
      });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Announcement created successfully',
      });

      setCreateDialogOpen(false);
      setFormData({
        title: '',
        message: '',
        announcement_type: 'info',
        target_audience: 'all',
        send_as_notification: true,
        send_as_email: false,
      });
      fetchAnnouncements();
    } catch (error) {
      console.error('Error creating announcement:', error);
      toast({
        title: 'Error',
        description: 'Failed to create announcement',
        variant: 'destructive',
      });
    }
  };

  const sendAnnouncement = async () => {
    if (!announcementToSend) return;

    try {
      setSending(true);

      // Call edge function to broadcast
      const { data, error } = await supabase.functions.invoke('broadcast-announcement', {
        body: { announcementId: announcementToSend },
      });

      if (error) throw error;

      toast({
        title: 'Success',
        description: data.message || 'Announcement sent successfully',
      });

      setSendDialogOpen(false);
      setAnnouncementToSend(null);
      fetchAnnouncements();
    } catch (error) {
      console.error('Error sending announcement:', error);
      toast({
        title: 'Error',
        description: 'Failed to send announcement',
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  };

  const getTypeBadge = (type: string) => {
    const variants: Record<string, { variant: any; label: string }> = {
      info: { variant: 'default', label: 'Info' },
      warning: { variant: 'secondary', label: 'Warning' },
      promotional: { variant: 'outline', label: 'Promotional' },
      critical: { variant: 'destructive', label: 'Critical' },
    };
    const config = variants[type] || variants.info;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; label: string }> = {
      draft: { variant: 'secondary', label: 'Draft' },
      scheduled: { variant: 'outline', label: 'Scheduled' },
      sent: { variant: 'default', label: 'Sent' },
      cancelled: { variant: 'destructive', label: 'Cancelled' },
    };
    const config = variants[status] || variants.draft;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-teal-glow/5 to-background p-6">
      <div className="max-w-7xl mx-auto">
        <Button variant="ghost" onClick={() => navigate('/admin')} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>

        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">Announcements</h1>
            <p className="text-muted-foreground">Broadcast messages to users</p>
          </div>
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button size="lg">
                <Plus className="mr-2 h-4 w-4" />
                New Announcement
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Announcement</DialogTitle>
                <DialogDescription>
                  Broadcast a message to specific user groups
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label>Title</Label>
                  <Input
                    placeholder="Announcement title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Message</Label>
                  <Textarea
                    placeholder="Your announcement message..."
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    rows={4}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Type</Label>
                    <Select
                      value={formData.announcement_type}
                      onValueChange={(value) => setFormData({ ...formData, announcement_type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="info">Info</SelectItem>
                        <SelectItem value="warning">Warning</SelectItem>
                        <SelectItem value="promotional">Promotional</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Target Audience</Label>
                    <Select
                      value={formData.target_audience}
                      onValueChange={(value) => setFormData({ ...formData, target_audience: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Users</SelectItem>
                        <SelectItem value="students">Students Only</SelectItem>
                        <SelectItem value="mentors">Mentors Only</SelectItem>
                        <SelectItem value="admins">Admins Only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="notification">Send as Notification</Label>
                  <Switch
                    id="notification"
                    checked={formData.send_as_notification}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, send_as_notification: checked })
                    }
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={createAnnouncement} disabled={!formData.title || !formData.message}>
                  Create Draft
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="glass">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-foreground">{stats.total}</p>
                <p className="text-sm text-muted-foreground mt-1">Total Announcements</p>
              </div>
            </CardContent>
          </Card>
          <Card className="glass">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-primary">{stats.sent}</p>
                <p className="text-sm text-muted-foreground mt-1">Sent</p>
              </div>
            </CardContent>
          </Card>
          <Card className="glass">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-secondary">{stats.scheduled}</p>
                <p className="text-sm text-muted-foreground mt-1">Scheduled</p>
              </div>
            </CardContent>
          </Card>
          <Card className="glass">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-muted-foreground">{stats.draft}</p>
                <p className="text-sm text-muted-foreground mt-1">Drafts</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Announcements List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-pulse text-muted-foreground">Loading announcements...</div>
          </div>
        ) : announcements.length === 0 ? (
          <Card className="glass">
            <CardContent className="py-12 text-center text-muted-foreground">
              No announcements yet. Create your first one!
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {announcements.map((announcement) => (
              <Card key={announcement.id} className="glass card-hover">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {getTypeBadge(announcement.announcement_type)}
                        {getStatusBadge(announcement.status)}
                        <Badge variant="outline">
                          <Users className="h-3 w-3 mr-1" />
                          {announcement.target_audience}
                        </Badge>
                      </div>
                      <CardTitle className="text-lg">{announcement.title}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        Created {format(new Date(announcement.created_at), 'MMM dd, yyyy HH:mm')}
                      </p>
                      {announcement.sent_at && (
                        <p className="text-sm text-muted-foreground">
                          Sent {format(new Date(announcement.sent_at), 'MMM dd, yyyy HH:mm')}
                        </p>
                      )}
                    </div>
                    {announcement.status === 'draft' && (
                      <Button
                        size="sm"
                        onClick={() => {
                          setAnnouncementToSend(announcement.id);
                          setSendDialogOpen(true);
                        }}
                      >
                        <Send className="mr-2 h-4 w-4" />
                        Send Now
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-foreground whitespace-pre-wrap">
                    {announcement.message}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Send Confirmation Dialog */}
        <AlertDialog open={sendDialogOpen} onOpenChange={setSendDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Send Announcement</AlertDialogTitle>
              <AlertDialogDescription>
                This will immediately send the announcement to all targeted users. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={sending}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={sendAnnouncement} disabled={sending}>
                {sending ? 'Sending...' : 'Send Now'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}