import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Calendar, Clock, Loader2, AlertTriangle, Info } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Slot {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  status: string;
}

interface RescheduleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessionId: string;
  mentorId: string;
  mentorName: string;
  currentScheduledAt: string;
  onSuccess: () => void;
}

export function RescheduleDialog({
  open,
  onOpenChange,
  sessionId,
  mentorId,
  mentorName,
  currentScheduledAt,
  onSuccess,
}: RescheduleDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [rescheduling, setRescheduling] = useState(false);
  const [policy, setPolicy] = useState<any>(null);
  const [policyLoading, setPolicyLoading] = useState(true);
  const [isLastMinute, setIsLastMinute] = useState(false);
  const [estimatedFee, setEstimatedFee] = useState(0);

  useEffect(() => {
    if (open) {
      fetchPolicy();
      fetchAvailableSlots();
    }
  }, [open, mentorId, sessionId]);

  const fetchPolicy = async () => {
    setPolicyLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('manage-session-reschedule', {
        body: {
          action: 'get_policy',
          sessionId,
        },
      });

      if (error) throw error;

      setPolicy(data.policy);
      setIsLastMinute(data.isLastMinute);
      setEstimatedFee(data.estimatedFee);
    } catch (error) {
      console.error('Error fetching policy:', error);
      toast({
        title: "Warning",
        description: "Could not load reschedule policy",
        variant: "destructive",
      });
    } finally {
      setPolicyLoading(false);
    }
  };

  const fetchAvailableSlots = async () => {
    setLoading(true);
    try {
      const now = new Date();
      const fromDate = now.toISOString().split('T')[0];
      const currentTime = now.toTimeString().slice(0, 5); // HH:MM format
      
      // First get slots that are already used by active sessions
      const { data: usedSlots } = await supabase
        .from('sessions')
        .select('slot_id')
        .not('slot_id', 'is', null)
        .in('status', ['confirmed', 'pending_payment'])
        .neq('id', sessionId); // Exclude current session
      
      const usedSlotIds = usedSlots?.map(s => s.slot_id) || [];
      
      // Fetch available slots
      const { data, error } = await supabase
        .from('mentor_availability')
        .select('id, date, start_time, end_time, status')
        .eq('mentor_id', mentorId)
        .eq('status', 'available')
        .gte('date', fromDate)
        .order('date', { ascending: true })
        .order('start_time', { ascending: true })
        .limit(30);

      if (error) throw error;
      
      // Filter: exclude used slots AND filter today's past times
      const filteredSlots = (data || []).filter(slot => {
        // Exclude already used slots
        if (usedSlotIds.includes(slot.id)) return false;
        
        // For today's date, exclude past times
        if (slot.date === fromDate && slot.start_time < currentTime) {
          return false;
        }
        return true;
      });
      
      setSlots(filteredSlots);
      
      if (filteredSlots.length === 0) {
        toast({
          title: "No slots available",
          description: "This mentor has no available time slots right now. Please check back later.",
        });
      }
    } catch (error) {
      console.error('Error fetching slots:', error);
      toast({
        title: "Error",
        description: "Failed to load available slots",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReschedule = async () => {
    if (!selectedSlotId) return;

    setRescheduling(true);
    try {
      // SECURITY FIX: No longer sending userId - function extracts from JWT
      const { data, error } = await supabase.functions.invoke('manage-session-reschedule', {
        body: {
          action: 'reschedule',
          sessionId,
          newSlotId: selectedSlotId,
        },
      });

      if (error) throw error;

      const message = data.isLastMinute
        ? `Session rescheduled! Fee of ₹${(data.reschedule_fee / 100).toFixed(2)} applied.`
        : "Session rescheduled successfully!";

      toast({
        title: data.isLastMinute ? "⚠️ Session Rescheduled (Fee Applied)" : "✅ Session Rescheduled",
        description: message,
      });

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error rescheduling session:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to reschedule session",
        variant: "destructive",
      });
    } finally {
      setRescheduling(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Reschedule Session</DialogTitle>
          <DialogDescription>
            Reschedule your session with {mentorName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Policy Information */}
          {policyLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            </div>
          ) : policy && (
            <>
              {!policy.allow_reschedule ? (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Reschedule Not Allowed</AlertTitle>
                  <AlertDescription>
                    This mentor does not allow session rescheduling.
                  </AlertDescription>
                </Alert>
              ) : (
                <>
                  <Alert variant={isLastMinute ? "destructive" : "default"}>
                    {isLastMinute ? (
                      <AlertTriangle className="h-4 w-4" />
                    ) : (
                      <Info className="h-4 w-4" />
                    )}
                    <AlertTitle>
                      {isLastMinute ? "Late Reschedule Fee Applies" : "Free Reschedule"}
                    </AlertTitle>
                    <AlertDescription>
                      {isLastMinute ? (
                        <>
                          Rescheduling within {policy.free_reschedule_hours} hours incurs a{" "}
                          <strong>{policy.last_minute_fee_percentage}%</strong> fee.
                          <br />
                          <strong>Estimated fee: ₹{(estimatedFee / 100).toFixed(2)}</strong>
                        </>
                      ) : (
                        `Free rescheduling available (more than ${policy.free_reschedule_hours} hours before session)`
                      )}
                    </AlertDescription>
                  </Alert>
                </>
              )}
            </>
          )}

          {/* Current Schedule */}
          <div className="p-4 bg-muted/50 rounded-lg space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Current Schedule:</p>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                <span className="font-medium">
                  {format(new Date(currentScheduledAt), "MMM dd, yyyy")}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                <span className="font-medium">
                  {format(new Date(currentScheduledAt), "hh:mm a")}
                </span>
              </div>
            </div>
          </div>

          {/* Available Slots */}
          <div>
            <p className="text-sm font-medium mb-3">Select New Time:</p>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : slots.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No available slots found. Please try again later.
              </div>
            ) : (
              <ScrollArea className="h-[300px] pr-4">
                <div className="space-y-2">
                  {slots.map((slot) => (
                    <button
                      key={slot.id}
                      onClick={() => setSelectedSlotId(slot.id)}
                      className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                        selectedSlotId === slot.id
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50 hover:bg-muted/30"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">
                              {format(new Date(slot.date), "EEE, MMM dd")}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span>
                              {slot.start_time.slice(0, 5)} - {slot.end_time.slice(0, 5)}
                            </span>
                          </div>
                        </div>
                        {selectedSlotId === slot.id && (
                          <Badge variant="default">Selected</Badge>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={rescheduling}
          >
            Cancel
          </Button>
          <Button
            onClick={handleReschedule}
            disabled={!selectedSlotId || rescheduling || (policy && !policy.allow_reschedule)}
            variant={isLastMinute ? "destructive" : "default"}
          >
            {rescheduling && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isLastMinute 
              ? `Confirm & Pay ₹${(estimatedFee / 100).toFixed(2)}` 
              : "Confirm Reschedule"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
