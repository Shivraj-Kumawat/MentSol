import { useState, useEffect, useCallback, memo } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, Clock, MapPin, AlertCircle, CheckCircle, XCircle, ArrowLeft, Timer, Star, Filter, MessageSquare, CalendarDays, Search, Video } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format, isPast, isFuture, isAfter, isBefore, startOfDay, endOfDay } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
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
import { ReviewDialog } from "@/components/ReviewDialog";
import { RescheduleDialog } from "@/components/RescheduleDialog";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";

interface Session {
  id: string;
  scheduled_at: string | null;
  status: string;
  amount_paid: number;
  completed_at: string | null;
  pre_session_brief: any;
  mentor_id: string;
  google_meet_link?: string | null;
  google_calendar_event_id?: string | null;
  mentor: {
    id: string;
    specialization: string | null;
    profile: {
      full_name: string | null;
      email: string | null;
      avatar_url: string | null;
    } | null;
  };
}

// Session status types for Join Video Call logic
type SessionStatusType = 
  | 'before_window'
  | 'can_join' 
  | 'session_ended' 
  | 'no_link' 
  | 'not_confirmed'
  | 'no_schedule';

interface SessionStatus {
  canJoin: boolean;
  status: SessionStatusType;
  minutesUntil?: number;
  minutesUntilWindow?: number;
}

// Helper function to get session join status with all edge cases
const getSessionStatus = (session: Session, now: Date): SessionStatus => {
  if (!session.scheduled_at) {
    return { canJoin: false, status: 'no_schedule' };
  }
  
  if (session.status !== 'confirmed') {
    return { canJoin: false, status: 'not_confirmed' };
  }
  
  const scheduledTime = new Date(session.scheduled_at);
  // Default to 30-minute sessions (legacy 15-min sessions still work)
  const sessionDurationMs = 30 * 60 * 1000;
  const sessionEndTime = new Date(scheduledTime.getTime() + sessionDurationMs);
  const windowStart = new Date(scheduledTime.getTime() - 5 * 60 * 1000); // 5 min before
  
  // Check if session has ended
  if (now > sessionEndTime) {
    return { canJoin: false, status: 'session_ended' };
  }
  
  // Check if mentor has added the link
  if (!session.google_meet_link) {
    return { canJoin: false, status: 'no_link' };
  }
  
  // Check if we're before the 5-minute window
  if (now < windowStart) {
    const minutesUntilSession = Math.ceil((scheduledTime.getTime() - now.getTime()) / 60000);
    const minutesUntilWindow = Math.ceil((windowStart.getTime() - now.getTime()) / 60000);
    return { 
      canJoin: false, 
      status: 'before_window', 
      minutesUntil: minutesUntilSession,
      minutesUntilWindow: minutesUntilWindow
    };
  }
  
  // Within the join window
  return { canJoin: true, status: 'can_join' };
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

const getStatusBadge = (status: string) => {
  const statusConfig = {
    confirmed: { label: "Confirmed", icon: CheckCircle, variant: "success" as const },
    completed: { label: "Completed", icon: CheckCircle, variant: "secondary" as const },
    cancelled: { label: "Cancelled", icon: XCircle, variant: "destructive" as const },
    pending_payment: { label: "Pending Payment", icon: AlertCircle, variant: "default" as const },
  };

  const config = statusConfig[status as keyof typeof statusConfig] || {
    label: status.replace(/_/g, ' '),
    icon: AlertCircle,
    variant: "secondary" as const,
  };

  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className="flex items-center gap-1">
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
};

// ============================================
// SessionCard - MOVED OUTSIDE to prevent remounting
// ============================================
interface SessionCardProps {
  session: Session;
  currentTime: Date;
  onOpenMeet: (meetLink: string) => void;
  onReschedule: (session: Session) => void;
  onCancel: (id: string) => void;
  onReview: (session: Session) => void;
  existingReviews: Record<string, boolean>;
}

const SessionCard = memo(({ 
  session, 
  currentTime,
  onOpenMeet,
  onReschedule,
  onCancel,
  onReview,
  existingReviews
}: SessionCardProps) => {
  const problemDescription = (session.pre_session_brief as any)?.problemDescription;
  const sessionStatus = getSessionStatus(session, currentTime);
  const hasMeetLink = !!session.google_meet_link;
  
  const mentorName = session.mentor?.profile?.full_name || 'Mentor';
  const mentorAvatar = session.mentor?.profile?.avatar_url;
  const mentorSpecialization = session.mentor?.specialization;
  
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3 flex-1">
            <Avatar className="w-12 h-12 rounded-xl">
              <AvatarImage 
                src={mentorAvatar || undefined} 
                alt={mentorName} 
                className="object-cover"
              />
              <AvatarFallback className="rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 text-lg font-bold text-primary">
                {mentorName[0] || 'M'}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-1 flex-1 min-w-0">
              <CardTitle className="text-lg truncate">
                {mentorName}
              </CardTitle>
              {mentorSpecialization && (
                <p className="text-sm text-muted-foreground truncate">{mentorSpecialization}</p>
              )}
            </div>
          </div>
          {getStatusBadge(session.status)}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2">
          {session.scheduled_at && (
            <>
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>{format(new Date(session.scheduled_at), "MMMM dd, yyyy")}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>{format(new Date(session.scheduled_at), "hh:mm a")}</span>
              </div>
              {session.status === 'confirmed' && isFuture(new Date(session.scheduled_at)) && (
                <div className="flex items-center gap-2 text-sm">
                  <Timer className="h-4 w-4 text-primary" />
                  <span className="font-semibold text-primary">
                    Starts in {getTimeUntilSession(session.scheduled_at)}
                  </span>
                </div>
              )}
            </>
          )}
          {session.amount_paid > 0 && (
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span>₹{session.amount_paid}</span>
            </div>
          )}
          {problemDescription && (
            <div className="flex items-start gap-2 text-sm mt-2 p-2 bg-muted/30 rounded-lg">
              <MessageSquare className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground font-medium mb-1">Your Question:</p>
                <p className="text-sm line-clamp-2">{problemDescription}</p>
              </div>
            </div>
          )}
        </div>

      <Separator />

      <div className="flex flex-col gap-2">
        {/* Video Call Section - State-Based UX */}
        {session.status === 'confirmed' && session.scheduled_at && (
          <>
            {/* State 1: Session Ended */}
            {sessionStatus.status === 'session_ended' && (
              <div className="w-full p-4 rounded-xl bg-muted/50 border border-border">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-muted-foreground" />
                  <p className="font-medium text-muted-foreground">
                    This session has ended.
                  </p>
                </div>
              </div>
            )}

            {/* State 2: Mentor hasn't added video link yet */}
            {sessionStatus.status === 'no_link' && (
              <div className="w-full p-4 rounded-xl bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800">
                <div className="flex items-center gap-3">
                  <AlertCircle className="h-5 w-5 text-yellow-600" />
                  <div>
                    <p className="font-medium text-yellow-900 dark:text-yellow-100">
                      Video call link pending
                    </p>
                    <p className="text-sm text-yellow-700 dark:text-yellow-300">
                      Mentor has not added the video call link yet.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* State 3: Before 5-minute window (has link but can't join yet) */}
            {sessionStatus.status === 'before_window' && hasMeetLink && (
              <div className="w-full p-4 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-3">
                  <Timer className="h-5 w-5 text-blue-600 animate-pulse" />
                  <div>
                    <p className="font-medium text-blue-900 dark:text-blue-100">
                      Session starts in {getTimeUntilSession(session.scheduled_at)}
                    </p>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      You can join the video call 5 minutes before the session starts.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* State 4: Can Join - Primary CTA Button */}
            {sessionStatus.status === 'can_join' && (
              <div className="w-full p-3 rounded-xl border-2 bg-green-50 dark:bg-green-950/30 border-green-500/50">
                <Button
                  type="button"
                  className="w-full h-12 gap-3 bg-green-600 hover:bg-green-700 text-white text-lg font-bold shadow-lg shadow-green-600/30"
                  onClick={() => {
                    console.log('[Bookings] Opening video call:', session.google_meet_link);
                    onOpenMeet(session.google_meet_link!);
                  }}
                >
                  <Video className="h-5 w-5" />
                  Join Video Call
                </Button>
              </div>
            )}
          </>
        )}
        
        {/* Action Buttons Row */}
        <div className="flex gap-2">
        {session.status === "confirmed" && session.scheduled_at && isFuture(new Date(session.scheduled_at)) && (
          <>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="flex-1"
              onClick={() => onReschedule(session)}
            >
              Reschedule
            </Button>
            <Button
              type="button"
              size="sm"
              variant="destructive"
              className="flex-1"
              onClick={() => onCancel(session.id)}
            >
              Cancel
            </Button>
          </>
        )}
        {/* Review button - show for completed sessions OR sessions that are over */}
        {(() => {
          const sessionIsOver = session.scheduled_at && 
            new Date(session.scheduled_at).getTime() + 30 * 60 * 1000 < Date.now();
          const canReview = 
            (session.status === 'completed' || 
             (session.status === 'confirmed' && sessionIsOver)) &&
            !existingReviews[session.id];
          
          return canReview ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="flex-1 gap-2"
              onClick={() => {
                console.log('[Bookings] Navigating to review page for session:', session.id);
                onReview(session);
              }}
            >
              <Star className="h-4 w-4" />
              Write Review
            </Button>
          ) : null;
        })()}
        {/* Show badge if review already submitted */}
        {existingReviews[session.id] && (
          <Badge variant="secondary" className="flex-1 justify-center gap-1">
            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
            Review Submitted
          </Badge>
        )}
        </div>
      </div>
      </CardContent>
    </Card>
  );
});

SessionCard.displayName = 'SessionCard';

// ============================================
// Main Bookings Component
// ============================================
const Bookings = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [existingReviews, setExistingReviews] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});
  const [rescheduleDialogOpen, setRescheduleDialogOpen] = useState(false);
  const [rescheduleSession, setRescheduleSession] = useState<Session | null>(null);
  
  // Time-based auto-refresh for Join Video Call button visibility
  const [currentTime, setCurrentTime] = useState(new Date());

  // Auto-refresh currentTime every 30 seconds to update button visibility without page reload
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 30000); // Update every 30 seconds
    
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (user) {
      fetchSessions();
      
      // Set up real-time subscription for student sessions
      const studentChannel = supabase
        .channel('student-sessions-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'sessions',
            filter: `student_id=eq.${user.id}`,
          },
          (payload) => {
            console.log('[Bookings] Student session change detected:', payload);
            fetchSessions();
          }
        )
        .subscribe();

      // Set up a second channel for mentor sessions (will be activated if user is a mentor)
      let mentorChannel: any = null;
      (async () => {
        const { data: mentorData } = await supabase
          .from("mentors")
          .select("id")
          .eq("user_id", user.id)
          .maybeSingle();
        if (mentorData) {
          mentorChannel = supabase
            .channel('mentor-sessions-changes-bookings')
            .on(
              'postgres_changes',
              {
                event: '*',
                schema: 'public',
                table: 'sessions',
                filter: `mentor_id=eq.${mentorData.id}`,
              },
              (payload) => {
                console.log('[Bookings] Mentor session change detected:', payload);
                fetchSessions();
              }
            )
            .subscribe();
        }
      })();

      return () => {
        supabase.removeChannel(studentChannel);
        if (mentorChannel) supabase.removeChannel(mentorChannel);
      };
    }
  }, [user]);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      // First, fetch sessions with mentor data
      // Step 1: Fetch student sessions
      const { data, error } = await supabase
        .from("sessions")
        .select(`
          id,
          scheduled_at,
          status,
          amount_paid,
          completed_at,
          pre_session_brief,
          mentor_id,
          student_id,
          google_meet_link,
          google_calendar_event_id
        `)
        .eq("student_id", user?.id)
        .order("scheduled_at", { ascending: false });

      if (error) throw error;

      let allSessionsData = data || [];

      // Step 2: Check if user is also a mentor & fetch mentor sessions
      let mentorId: string | null = null;
      const { data: mentorData } = await supabase
        .from("mentors")
        .select("id")
        .eq("user_id", user?.id)
        .maybeSingle();
      if (mentorData) mentorId = mentorData.id;

      if (mentorId) {
        const { data: mentorSessions } = await supabase
          .from("sessions")
          .select(`
            id,
            scheduled_at,
            status,
            amount_paid,
            completed_at,
            pre_session_brief,
            mentor_id,
            student_id,
            google_meet_link,
            google_calendar_event_id
          `)
          .eq("mentor_id", mentorId)
          .order("scheduled_at", { ascending: false });

        if (mentorSessions) {
          const existingIds = new Set(allSessionsData.map(s => s.id));
          const newSessions = mentorSessions.filter(s => !existingIds.has(s.id));
          allSessionsData = [...allSessionsData, ...newSessions];
        }
      }
      
      // Step 3: Get unique mentor IDs AND student IDs for profile lookups
      const mentorIds = [...new Set(allSessionsData.map(s => s.mentor_id).filter(Boolean))];
      const studentIds = [...new Set(allSessionsData.map(s => (s as any).student_id).filter(Boolean))];
      
      // Fetch mentors with profiles separately for reliability
      let mentorMap: Record<string, any> = {};
      if (mentorIds.length > 0) {
        const { data: mentorsData } = await supabase
          .from("mentors")
          .select(`id, specialization, user_id`)
          .in("id", mentorIds);
          
        if (mentorsData && mentorsData.length > 0) {
          const userIds = mentorsData.map(m => m.user_id).filter(Boolean);
          // Also include student IDs in profile fetch
          const allProfileIds = [...new Set([...userIds, ...studentIds])];
          const { data: profilesData } = await supabase
            .from("profiles")
            .select("id, full_name, email, avatar_url")
            .in("id", allProfileIds);
            
          const profileMap = (profilesData || []).reduce((acc, p) => {
            acc[p.id] = p;
            return acc;
          }, {} as Record<string, any>);
          
          mentorsData.forEach(m => {
            const profile = profileMap[m.user_id];
            mentorMap[m.id] = {
              id: m.id,
              specialization: m.specialization || 'General Mentor',
              profile: profile ? {
                full_name: profile.full_name || 'Your Mentor',
                email: profile.email || '',
                avatar_url: profile.avatar_url || null
              } : {
                full_name: 'Your Mentor',
                email: '',
                avatar_url: null
              }
            };
          });

          // For sessions where user is the mentor, show the student's profile instead
          if (mentorId) {
            allSessionsData.forEach((s: any) => {
              if (s.mentor_id === mentorId && s.student_id !== user?.id) {
                const studentProfile = profileMap[s.student_id];
                // Override the mentor display to show student info for mentor-side sessions
                mentorMap[`student_${s.id}`] = {
                  id: s.mentor_id,
                  specialization: 'Student Session',
                  profile: studentProfile ? {
                    full_name: studentProfile.full_name || 'Student',
                    email: studentProfile.email || '',
                    avatar_url: studentProfile.avatar_url || null
                  } : {
                    full_name: 'Student',
                    email: '',
                    avatar_url: null
                  }
                };
              }
            });
          }
        }
      } else if (studentIds.length > 0 && mentorId) {
        // Edge case: no mentor IDs but we have student sessions as mentor
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("id, full_name, email, avatar_url")
          .in("id", studentIds);
        const profileMap = (profilesData || []).reduce((acc, p) => {
          acc[p.id] = p;
          return acc;
        }, {} as Record<string, any>);
        
        allSessionsData.forEach((s: any) => {
          if (s.mentor_id === mentorId) {
            const studentProfile = profileMap[s.student_id];
            mentorMap[`student_${s.id}`] = {
              id: s.mentor_id,
              specialization: 'Student Session',
              profile: studentProfile ? {
                full_name: studentProfile.full_name || 'Student',
                email: studentProfile.email || '',
                avatar_url: studentProfile.avatar_url || null
              } : {
                full_name: 'Student',
                email: '',
                avatar_url: null
              }
            };
          }
        });
      }
      
      // Map sessions with appropriate display data
      const safeSessions: Session[] = allSessionsData.map((session: any) => {
        // For mentor-side sessions, use student profile display
        const isMentorSession = mentorId && session.mentor_id === mentorId && session.student_id !== user?.id;
        const displayKey = isMentorSession ? `student_${session.id}` : null;
        
        return {
          ...session,
          mentor: (displayKey && mentorMap[displayKey]) || mentorMap[session.mentor_id] || {
            id: session.mentor_id || '',
            specialization: 'General Mentor',
            profile: {
              full_name: 'Your Mentor',
              email: '',
              avatar_url: null
            }
          }
        };
      });
      
      setSessions(safeSessions);

      // Fetch existing reviews
      if (safeSessions.length > 0) {
        const { data: reviewsData } = await supabase
          .from("reviews")
          .select("session_id")
          .eq("student_id", user?.id);

        if (reviewsData) {
          const reviewsMap = reviewsData.reduce((acc, review) => {
            acc[review.session_id] = true;
            return acc;
          }, {} as Record<string, boolean>);
          setExistingReviews(reviewsMap);
        }
      }
    } catch (error: any) {
      console.error("Error fetching sessions:", error);
      toast({
        title: "Error",
        description: "Failed to load your bookings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSession = async () => {
    if (!selectedSessionId) return;

    try {
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
          console.log('✅ Calendar event deleted');
        } catch (calendarError) {
          console.error('Failed to delete calendar event:', calendarError);
          // Continue with cancellation anyway
        }
      }

      // 3. Update session status
      const { error } = await supabase
        .from("sessions")
        .update({ status: "cancelled" })
        .eq("id", selectedSessionId)
        .eq("student_id", user?.id);

      if (error) throw error;

      toast({
        title: "Session Cancelled",
        description: "Your booking has been cancelled. The mentor will be notified.",
      });

      fetchSessions();
    } catch (error: any) {
      console.error("Error cancelling session:", error);
      toast({
        title: "Error",
        description: "Failed to cancel session",
        variant: "destructive",
      });
    } finally {
      setCancelDialogOpen(false);
      setSelectedSessionId(null);
    }
  };

  const toggleStatus = (status: string) => {
    setSelectedStatuses(prev =>
      prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]
    );
  };

  const filteredSessions = sessions.filter(session => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const mentorName = session.mentor?.profile?.full_name?.toLowerCase() || '';
      const specialization = session.mentor?.specialization?.toLowerCase() || '';
      const problemDesc = (session.pre_session_brief as any)?.problemDescription?.toLowerCase() || '';
      
      if (!mentorName.includes(query) && !specialization.includes(query) && !problemDesc.includes(query)) {
        return false;
      }
    }

    // Status filter
    if (selectedStatuses.length > 0 && !selectedStatuses.includes(session.status)) {
      return false;
    }

    // Date range filter
    if (session.scheduled_at) {
      const sessionDate = new Date(session.scheduled_at);
      if (dateRange.from && isBefore(sessionDate, startOfDay(dateRange.from))) {
        return false;
      }
      if (dateRange.to && isAfter(sessionDate, endOfDay(dateRange.to))) {
        return false;
      }
    }

    return true;
  });

  const upcomingSessions = filteredSessions.filter(
    (s) => s.scheduled_at && isFuture(new Date(s.scheduled_at)) && s.status !== "cancelled" && s.status !== "completed"
  );

  const pastSessions = filteredSessions.filter(
    (s) => s.completed_at || (s.scheduled_at && isPast(new Date(s.scheduled_at))) || s.status === "cancelled"
  );

  const stats = {
    total: sessions.length,
    upcoming: sessions.filter(s => s.scheduled_at && isFuture(new Date(s.scheduled_at)) && s.status !== "cancelled" && s.status !== "completed").length,
    completed: sessions.filter(s => s.status === 'completed').length,
    cancelled: sessions.filter(s => s.status === 'cancelled').length,
  };

  // Handle opening Google Meet link - MOBILE SAFE
  const handleOpenMeet = useCallback((meetLink: string) => {
    // CRITICAL: window.open MUST be called synchronously within user gesture
    // iOS Safari blocks popup if not in direct response to tap
    if (!meetLink) {
      console.error('[Bookings] No meet link provided');
      return;
    }
    
    try {
      console.log('[Bookings] handleOpenMeet called with:', meetLink);
      // Try window.open first
      const newWindow = window.open(meetLink, '_blank', 'noopener,noreferrer');
      
      // Fallback: If popup blocked, use location.href
      if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
        console.log('[Bookings] Popup blocked, using location fallback');
        window.location.href = meetLink;
      }
    } catch (error) {
      console.error('[Bookings] Error opening meet link:', error);
      // Ultimate fallback
      window.location.href = meetLink;
    }
  }, []);

  // Memoized callbacks for SessionCard to prevent unnecessary re-renders
  const handleRescheduleClick = useCallback((s: Session) => {
    setRescheduleSession(s);
    setRescheduleDialogOpen(true);
  }, []);

  const handleCancelClick = useCallback((id: string) => {
    setSelectedSessionId(id);
    setCancelDialogOpen(true);
  }, []);

  const handleReviewClick = useCallback((s: Session) => {
    // Navigate to the dedicated review page instead of opening a dialog
    navigate(`/review/${s.id}`);
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center">
        <div className="text-center space-y-2">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          <p className="text-muted-foreground">Loading your bookings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/home", { replace: true })}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">My Bookings</h1>
              <p className="text-sm text-muted-foreground">Manage your mentor sessions</p>
            </div>
          </div>
          <Breadcrumbs className="mt-3" />
        </div>
      </div>

      {/* Stats */}
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-xs text-muted-foreground">Total Sessions</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-2xl font-bold text-primary">{stats.upcoming}</p>
                  <p className="text-xs text-muted-foreground">Upcoming</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-success" />
                <div>
                  <p className="text-2xl font-bold text-success">{stats.completed}</p>
                  <p className="text-xs text-muted-foreground">Completed</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-destructive" />
                <div>
                  <p className="text-2xl font-bold text-destructive">{stats.cancelled}</p>
                  <p className="text-xs text-muted-foreground">Cancelled</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by mentor name, specialization, or problem..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Filter className="h-4 w-4" />
                Status
                {selectedStatuses.length > 0 && (
                  <Badge variant="secondary" className="ml-1 rounded-full px-1.5">
                    {selectedStatuses.length}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem
                checked={selectedStatuses.includes('pending_payment')}
                onCheckedChange={() => toggleStatus('pending_payment')}
              >
                Pending Payment
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={selectedStatuses.includes('confirmed')}
                onCheckedChange={() => toggleStatus('confirmed')}
              >
                Confirmed
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={selectedStatuses.includes('completed')}
                onCheckedChange={() => toggleStatus('completed')}
              >
                Completed
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={selectedStatuses.includes('cancelled')}
                onCheckedChange={() => toggleStatus('cancelled')}
              >
                Cancelled
              </DropdownMenuCheckboxItem>
              {selectedStatuses.length > 0 && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setSelectedStatuses([])}>
                    Clear Filters
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="gap-2">
                <CalendarDays className="h-4 w-4" />
                Date Range
                {(dateRange.from || dateRange.to) && (
                  <Badge variant="secondary" className="ml-1 rounded-full px-1.5">
                    ✓
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <CalendarComponent
                mode="range"
                selected={{ from: dateRange.from, to: dateRange.to }}
                onSelect={(range) => setDateRange({ from: range?.from, to: range?.to })}
                numberOfMonths={2}
              />
              <div className="p-3 border-t">
                <Button
                  size="sm"
                  variant="ghost"
                  className="w-full"
                  onClick={() => setDateRange({})}
                  disabled={!dateRange.from && !dateRange.to}
                >
                  Clear Date Range
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="upcoming" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upcoming">
              Upcoming ({upcomingSessions.length})
            </TabsTrigger>
            <TabsTrigger value="past">
              Past ({pastSessions.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming" className="space-y-4">
            {upcomingSessions.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No upcoming sessions</h3>
                  <p className="text-sm text-muted-foreground text-center mb-4">
                    Book a session with a mentor to get started
                  </p>
                  <Button onClick={() => navigate("/home")}>Browse Mentors</Button>
                </CardContent>
              </Card>
            ) : (
              upcomingSessions.map((session) => (
                <SessionCard 
                  key={session.id} 
                  session={session}
                  currentTime={currentTime}
                  onOpenMeet={handleOpenMeet}
                  onReschedule={handleRescheduleClick}
                  onCancel={handleCancelClick}
                  onReview={handleReviewClick}
                  existingReviews={existingReviews}
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="past" className="space-y-4">
            {pastSessions.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Clock className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No past sessions</h3>
                  <p className="text-sm text-muted-foreground text-center">
                    Your completed sessions will appear here
                  </p>
                </CardContent>
              </Card>
            ) : (
              pastSessions.map((session) => (
                <SessionCard 
                  key={session.id} 
                  session={session}
                  currentTime={currentTime}
                  onOpenMeet={handleOpenMeet}
                  onReschedule={handleRescheduleClick}
                  onCancel={handleCancelClick}
                  onReview={handleReviewClick}
                  existingReviews={existingReviews}
                />
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Cancel Confirmation Dialog */}
      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Session</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel this session? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Session</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancelSession} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Yes, Cancel Session
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Review Dialog */}
      {selectedSession && (
        <ReviewDialog
          isOpen={reviewDialogOpen}
          onClose={() => {
            setReviewDialogOpen(false);
            setSelectedSession(null);
          }}
          sessionId={selectedSession.id}
          mentorId={selectedSession.mentor.id}
          studentId={user?.id || ""}
          mentorName={selectedSession.mentor.profile?.full_name || "Mentor"}
          onReviewSubmitted={fetchSessions}
        />
      )}

      {/* Reschedule Dialog */}
      {rescheduleSession && (
        <RescheduleDialog
          open={rescheduleDialogOpen}
          onOpenChange={setRescheduleDialogOpen}
          sessionId={rescheduleSession.id}
          mentorId={rescheduleSession.mentor.id}
          mentorName={rescheduleSession.mentor.profile?.full_name || "Mentor"}
          currentScheduledAt={rescheduleSession.scheduled_at || ""}
          onSuccess={fetchSessions}
        />
      )}
    </div>
  );
};

export default Bookings;
