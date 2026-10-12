import { useState, useEffect } from 'react';
import { Bell, Gift, Calendar, Info, Settings, UserCheck, AlertCircle, XCircle, CalendarCheck, Pin, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';

type Notification = {
  id: string;
  type: 'offer' | 'session_reminder' | 'system' | 'mentor_request' | 'payment_failed' | 'session_cancelled' | 'session_booked';
  title: string;
  message: string;
  metadata: any;
  is_read: boolean;
  is_pinned?: boolean;
  created_at: string;
};

export const NotificationBell = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchNotifications();
    
    // Get current user ID
    const setupRealtimeSubscription = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Set up real-time subscription for new notifications
      const channel = supabase
        .channel('notifications-changes')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${session.user.id}`
          },
          (payload) => {
            const newNotification = payload.new as Notification;
            setNotifications(prev => [newNotification, ...prev]);
            setUnreadCount(prev => prev + 1);
            
            // Show toast notification
            const icon = getNotificationIcon(newNotification.type);
            toast({
              title: newNotification.title,
              description: newNotification.message,
              duration: 5000,
              action: newNotification.metadata?.action_url ? (
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => navigate(newNotification.metadata.action_url)}
                >
                  View
                </Button>
              ) : undefined,
            });
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${session.user.id}`
          },
          (payload) => {
            const updatedNotification = payload.new as Notification;
            setNotifications(prev =>
              prev.map(n => n.id === updatedNotification.id ? updatedNotification : n)
            );
            
            // Update unread count
            if (updatedNotification.is_read) {
              setUnreadCount(prev => Math.max(0, prev - 1));
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    };

    setupRealtimeSubscription();
  }, [toast, navigate]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      setNotifications((data || []) as Notification[]);
      setUnreadCount(data?.filter(n => !n.is_read).length || 0);
    } catch (error: any) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error: any) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', session.user.id)
        .eq('is_read', false);

      if (error) throw error;

      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
      toast({
        title: "All notifications marked as read",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'offer':
        return <Gift className="h-5 w-5 text-primary" />;
      case 'session_reminder':
        return <Calendar className="h-5 w-5 text-accent" />;
      case 'session_booked':
        return <CalendarCheck className="h-5 w-5 text-green-500" />;
      case 'mentor_request':
        return <UserCheck className="h-5 w-5 text-blue-500" />;
      case 'payment_failed':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'session_cancelled':
        return <XCircle className="h-5 w-5 text-orange-500" />;
      default:
        return <Info className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'offer':
        return 'from-primary/10 to-primary/5 border-primary/20';
      case 'session_reminder':
        return 'from-accent/10 to-accent/5 border-accent/20';
      case 'session_booked':
        return 'from-green-500/10 to-green-500/5 border-green-500/20';
      case 'mentor_request':
        return 'from-blue-500/10 to-blue-500/5 border-blue-500/20';
      case 'payment_failed':
        return 'from-red-500/10 to-red-500/5 border-red-500/20';
      case 'session_cancelled':
        return 'from-orange-500/10 to-orange-500/5 border-orange-500/20';
      default:
        return 'from-muted/10 to-muted/5 border-muted/20';
    }
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader className="space-y-4">
          <div className="flex items-center justify-between">
            <SheetTitle>Notifications</SheetTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/notification-settings')}
                className="h-8 w-8"
              >
                <Settings className="h-4 w-4" />
              </Button>
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={markAllAsRead}
                  className="text-xs"
                >
                  Mark all read
                </Button>
              )}
            </div>
          </div>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-8rem)] mt-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <Bell className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="font-semibold text-lg mb-2">No Notifications</h3>
              <p className="text-sm text-muted-foreground">
                You're all caught up! Check back later for updates.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Pinned Notifications */}
              {notifications.filter(n => n.is_pinned && !n.is_read).map((notification) => (
                <div
                  key={notification.id}
                  className="relative p-5 rounded-xl border-2 cursor-pointer transition-all hover:shadow-lg bg-gradient-to-br from-primary/15 via-accent/10 to-primary/5 border-primary/30 animate-pulse-subtle"
                  onClick={() => {
                    if (notification.metadata?.action_url) {
                      navigate(notification.metadata.action_url);
                    }
                  }}
                >
                  <div className="absolute top-3 right-3">
                    <Pin className="h-4 w-4 text-primary" />
                  </div>
                  <Badge className="mb-3 bg-primary/20 text-primary border-primary/30">
                    📌 Pinned
                  </Badge>
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-base mb-1">{notification.title}</h4>
                      <p className="text-sm text-foreground/80 mb-3">
                        {notification.message}
                      </p>
                      <Button 
                        size="sm" 
                        className="w-full gap-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(notification.metadata?.action_url || '/bookings');
                        }}
                      >
                        View Session
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                      <p className="text-xs text-muted-foreground mt-2">
                        {formatDistanceToNow(new Date(notification.created_at), {
                          addSuffix: true,
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}

              {/* Regular Notifications */}
              {notifications.filter(n => !n.is_pinned || n.is_read).map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => {
                    !notification.is_read && markAsRead(notification.id);
                    if (notification.metadata?.action_url) {
                      navigate(notification.metadata.action_url);
                    }
                  }}
                  className={`p-4 rounded-xl border cursor-pointer transition-all hover:shadow-md bg-gradient-to-br ${getNotificationColor(notification.type)} ${
                    !notification.is_read ? 'ring-2 ring-primary/20' : ''
                  }`}
                >
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h4 className="font-semibold text-sm">{notification.title}</h4>
                        {!notification.is_read && (
                          <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1"></div>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {notification.message}
                      </p>
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(notification.created_at), {
                            addSuffix: true,
                          })}
                        </p>
                        {notification.type === 'offer' && notification.metadata?.offer_code && (
                          <Badge variant="secondary" className="text-xs">
                            Code: {notification.metadata.offer_code}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};

export default NotificationBell;
