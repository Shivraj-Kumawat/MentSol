import { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, ExternalLink, Timer, FileText, Calendar, XCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { isFuture, format } from 'date-fns';
import { logger } from '@/utils/logger';
import { EntranceAnimation } from '@/components/motion/EntranceAnimation';
import { motion } from 'framer-motion';
import { listStagger, listItem } from '@/lib/motion';
import { useDevicePerformance } from '@/hooks/useDevicePerformance';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// Helper functions outside component for stability
const canOpenMeetLink = (session: any) => {
  if (session.status !== 'confirmed' || !session.scheduled_at) {
    return false;
  }
  
  const now = new Date();
  const scheduledTime = new Date(session.scheduled_at);
  
  // Allow opening from 5 minutes before session until 30 minutes after scheduled time
  const windowStart = new Date(scheduledTime.getTime() - 5 * 60 * 1000); // 5 min before
  const windowEnd = new Date(scheduledTime.getTime() + 30 * 60 * 1000); // 30 min after
  
  return now >= windowStart && now <= windowEnd;
};

const getTimeUntilSession = (scheduledAt: string) => {
  const now = new Date();
  const sessionTime = new Date(scheduledAt);
  const diff = sessionTime.getTime() - now.getTime();

  if (diff < 0) return 'Session started';

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
};

// Memoized SessionCard component to prevent unnecessary re-renders
const SessionCard = memo(({ 
  session, 
  onOpenMeet,
  onOpenCalendar,
  onCancel
}: { 
  session: any; 
  onOpenMeet: (meetLink: string) => void;
  onOpenCalendar: (eventId: string) => void;
  onCancel: (sessionId: string) => void;
}) => {
  const canOpen = canOpenMeetLink(session);
  const hasMeetLink = !!session.google_meet_link;
  const hasCalendarEvent = !!session.google_calendar_event_id;
  const isUpcoming = session.status === 'confirmed' && session.scheduled_at && isFuture(new Date(session.scheduled_at));
  
  return (
    <Card className="mb-4">
      <CardContent className="pt-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="font-semibold text-lg">
              {session.student?.full_name || 'Student'}
            </h3>
            <p className="text-sm text-muted-foreground">
              {session.student?.phone || session.student?.email}
            </p>
            <p className="text-sm mt-2">
              {session.scheduled_at
                ? format(new Date(session.scheduled_at), 'MMM dd, yyyy • hh:mm a')
                : 'Time not set'}
            </p>
            {session.status === 'confirmed' && session.scheduled_at && isFuture(new Date(session.scheduled_at)) && (
              <p className="text-sm text-primary font-semibold flex items-center gap-1 mt-1">
                <Timer className="h-3 w-3" />
                Starts in {getTimeUntilSession(session.scheduled_at)}
              </p>
            )}
            <p className="text-sm text-muted-foreground capitalize mt-1">
              Status: {session.status}
            </p>
            <p className="text-sm font-medium mt-1">
              Amount: ₹{session.amount_paid || 0}
            </p>
          </div>
          <div className="text-right">
            <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium
              ${session.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : ''}
              ${session.status === 'cancelled' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' : ''}
              ${session.status === 'pending_payment' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' : ''}
              ${session.status === 'confirmed' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' : ''}
            `}>
              {session.status}
            </span>
          </div>
        </div>

        {/* Student's Problem Description */}
        {session.pre_session_brief?.problem_description && (
          <div className="mb-4 p-3 rounded-lg bg-muted/30 border border-border/50">
            <div className="flex items-start gap-2">
              <FileText className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground mb-1">
                  Student's Problem/Query:
                </p>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {session.pre_session_brief.problem_description}
                </p>
                {session.pre_session_brief.submitted_at && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Submitted: {new Date(session.pre_session_brief.submitted_at).toLocaleString()}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Action buttons for confirmed sessions */}
        {session.status === 'confirmed' && (
          <div className="flex gap-2 flex-wrap">
            {/* Google Meet button - only shown during session window */}
            {canOpen && hasMeetLink && (
              <Button
                type="button"
                size="sm"
                className="gap-2 bg-green-600 hover:bg-green-700"
                onClick={() => onOpenMeet(session.google_meet_link)}
                aria-label="Join Google Meet"
              >
                <ExternalLink className="h-4 w-4" />
                Join Google Meet
              </Button>
            )}
            
            {/* Calendar event button - always shown for confirmed sessions with calendar event */}
            {hasCalendarEvent && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="gap-2"
                onClick={() => onOpenCalendar(session.google_calendar_event_id)}
                aria-label="Open calendar event"
              >
                <Calendar className="h-4 w-4" />
                Open Calendar Event
              </Button>
            )}

            {/* Cancel button for upcoming sessions */}
            {isUpcoming && (
              <Button
                type="button"
                size="sm"
                variant="destructive"
                className="gap-2"
                onClick={() => onCancel(session.id)}
                aria-label="Cancel session"
              >
                <XCircle className="h-4 w-4" />
                Cancel Session
              </Button>
            )}

            {/* Session window indicator when not yet open */}
            {!canOpen && hasMeetLink && (
              <div className="flex-1 p-3 bg-muted/30 rounded-lg text-center">
                <p className="text-sm text-muted-foreground">
                  Meet link will be available 5 minutes before session
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
});

SessionCard.displayName = 'SessionCard';

export default function MentorSessions() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  const loadSessions = useCallback(async () => {
    if (!user) return;

    try {
      logger.debug('[MentorSessions] Loading sessions');
      
      const { data: mentor } = await supabase
        .from('mentors')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!mentor) {
        logger.warn('[MentorSessions] No mentor record found');
        return;
      }

      const { data, error } = await supabase
        .from('sessions')
        .select(`
          *,
          student:profiles!sessions_student_id_fkey(full_name, phone, email),
          pre_session_brief
        `)
        .eq('mentor_id', mentor.id)
        .order('scheduled_at', { ascending: false });

      if (error) throw error;

      logger.debug('[MentorSessions] Loaded sessions:', data?.length || 0);
      setSessions(data || []);
    } catch (error) {
      logger.error('[MentorSessions] Error loading sessions:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadSessions();
    
    const setupRealtimeSubscription = async () => {
      if (!user) return;

      const { data: mentor } = await supabase
        .from('mentors')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!mentor) return;

      const channel = supabase
        .channel('mentor-sessions-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'sessions',
            filter: `mentor_id=eq.${mentor.id}`,
          },
          (payload) => {
            logger.debug('[MentorSessions] Session change detected');
            // Update specific session instead of reloading all
            setSessions(prev => {
              if (payload.eventType === 'DELETE') {
                return prev.filter(s => s.id !== payload.old.id);
              }
              if (payload.eventType === 'INSERT') {
                return [payload.new as any, ...prev];
              }
              // UPDATE
              return prev.map(s => s.id === payload.new.id ? payload.new as any : s);
            });
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    };

    const cleanup = setupRealtimeSubscription();
    
    return () => {
      cleanup.then(fn => fn?.());
    };
  }, [user, loadSessions]);

  const upcomingSessions = useMemo(() => 
    sessions.filter(s => s.status !== 'completed' && s.status !== 'cancelled'),
    [sessions]
  );

  const completedSessions = useMemo(() => 
    sessions.filter(s => s.status === 'completed'),
    [sessions]
  );

  const cancelledSessions = useMemo(() => 
    sessions.filter(s => s.status === 'cancelled'),
    [sessions]
  );

  const filterSessions = useCallback((status: string) => {
    if (status === 'upcoming') return upcomingSessions;
    if (status === 'completed') return completedSessions;
    return cancelledSessions;
  }, [upcomingSessions, completedSessions, cancelledSessions]);

  const handleOpenMeet = useCallback((meetLink: string) => {
    window.open(meetLink, '_blank', 'noopener,noreferrer');
  }, []);

  const handleOpenCalendar = useCallback((eventId: string) => {
    // Open Google Calendar event
    const calendarUrl = `https://calendar.google.com/calendar/event?eid=${eventId}`;
    window.open(calendarUrl, '_blank', 'noopener,noreferrer');
  }, []);

  const handleCancelClick = useCallback((sessionId: string) => {
    setSelectedSessionId(sessionId);
    setCancelDialogOpen(true);
  }, []);

  const handleCancelSession = async () => {
    if (!selectedSessionId) return;

    try {
      setIsCancelling(true);
      
      // 1. Get session with calendar event ID
      const { data: session } = await supabase
        .from("sessions")
        .select("google_calendar_event_id")
        .eq("id", selectedSessionId)
        .single();

      // 2. Delete Google Calendar event if exists
      if (session?.google_calendar_event_id) {
        try {
          await supabase.functions.invoke('delete-calendar-event', {
            body: { eventId: session.google_calendar_event_id }
          });
          logger.debug('[MentorSessions] Calendar event deleted');
        } catch (calendarError) {
          logger.error('[MentorSessions] Failed to delete calendar event:', calendarError);
          // Continue with cancellation anyway
        }
      }

      // 3. Update session status
      const { error } = await supabase
        .from("sessions")
        .update({ status: "cancelled" })
        .eq("id", selectedSessionId);

      if (error) throw error;

      toast({
        title: "Session Cancelled",
        description: "The session has been cancelled. The student will be notified.",
      });

      loadSessions();
    } catch (error: any) {
      logger.error('[MentorSessions] Error cancelling session:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to cancel session. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCancelling(false);
      setCancelDialogOpen(false);
      setSelectedSessionId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/mentor/dashboard')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle>My Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="upcoming" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
                <TabsTrigger value="completed">Completed</TabsTrigger>
                <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
              </TabsList>

              <TabsContent value="upcoming" className="mt-6">
                {filterSessions('upcoming').length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No upcoming sessions
                  </p>
                ) : (
                  filterSessions('upcoming').map((session) => (
                    <SessionCard 
                      key={`upcoming-${session.id}`} 
                      session={session}
                      onOpenMeet={handleOpenMeet}
                      onOpenCalendar={handleOpenCalendar}
                      onCancel={handleCancelClick}
                    />
                  ))
                )}
              </TabsContent>

              <TabsContent value="completed" className="mt-6">
                {filterSessions('completed').length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No completed sessions
                  </p>
                ) : (
                  filterSessions('completed').map((session) => (
                    <SessionCard 
                      key={`completed-${session.id}`} 
                      session={session}
                      onOpenMeet={handleOpenMeet}
                      onOpenCalendar={handleOpenCalendar}
                      onCancel={handleCancelClick}
                    />
                  ))
                )}
              </TabsContent>

              <TabsContent value="cancelled" className="mt-6">
                {filterSessions('cancelled').length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No cancelled sessions
                  </p>
                ) : (
                  filterSessions('cancelled').map((session) => (
                    <SessionCard 
                      key={`cancelled-${session.id}`} 
                      session={session}
                      onOpenMeet={handleOpenMeet}
                      onOpenCalendar={handleOpenCalendar}
                      onCancel={handleCancelClick}
                    />
                  ))
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Cancel Confirmation Dialog */}
      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Session?</AlertDialogTitle>
            <AlertDialogDescription>
              This will cancel the session and notify the student. The Google Calendar event will also be removed. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isCancelling}>Keep Session</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelSession}
              disabled={isCancelling}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isCancelling ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Cancelling...
                </>
              ) : (
                'Cancel Session'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
