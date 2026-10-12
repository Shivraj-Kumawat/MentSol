/**
 * MentorAvailability - Time Range based availability creation UI
 * Mentors provide time ranges (e.g. 8PM-11PM) with Google Meet links
 * System auto-generates 15-min slots for students
 */

import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { format, addDays, isBefore, startOfDay } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  Clock,
  Video,
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Check,
  Link2,
  AlertCircle,
  Sparkles,
  ExternalLink,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { MentorSetupBanner } from "@/components/MentorSetupBanner";
import { checkMentorSetup, checkMentorAvailability, MentorStatus, MentorSetupRequirements } from "@/lib/mentorUtils";

// Generate time options in 15-min increments
const TIME_OPTIONS = Array.from({ length: 96 }, (_, i) => {
  const hours = Math.floor(i / 4);
  const minutes = (i % 4) * 15;
  const timeStr = `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
  const h12 = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
  const ampm = hours < 12 ? "AM" : "PM";
  const label = `${h12}:${minutes.toString().padStart(2, "0")} ${ampm}`;
  return { value: timeStr, label };
});

interface AvailabilityRange {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  google_meet_link: string | null;
  status: string | null;
}

export default function MentorAvailability() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Form state
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [googleMeetLink, setGoogleMeetLink] = useState("");
  const [meetLinkError, setMeetLinkError] = useState("");
  
  // Data state
  const [mentorId, setMentorId] = useState<string | null>(null);
  const [mentorStatus, setMentorStatus] = useState<MentorStatus>("setup_incomplete");
  const [setupRequirements, setSetupRequirements] = useState<MentorSetupRequirements>({
    hasProfile: false,
    hasBio: false,
    hasSpecialization: false,
    hasPricing: false,
    hasAvailability: false,
    isApproved: false,
  });
  const [existingRanges, setExistingRanges] = useState<AvailabilityRange[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  
  // Date picker state
  const [weekOffset, setWeekOffset] = useState(0);

  // Validate Google Meet link format
  const validateMeetLink = (link: string): boolean => {
    if (!link) return false;
    const meetRegex = /^https:\/\/meet\.google\.com\/[a-z]{3}-[a-z]{4}-[a-z]{3}$/;
    return meetRegex.test(link);
  };

  const handleMeetLinkChange = (value: string) => {
    setGoogleMeetLink(value);
    if (value && !validateMeetLink(value)) {
      setMeetLinkError("Please enter a valid Google Meet link (e.g., https://meet.google.com/abc-defg-hij)");
    } else {
      setMeetLinkError("");
    }
  };

  // Fetch mentor data
  const fetchMentorData = useCallback(async () => {
    if (!user) return;
    
    try {
      const { data: mentor, error } = await supabase
        .from("mentors")
        .select("id, status, bio, specialization")
        .eq("user_id", user.id)
        .single();
        
      if (error) throw error;
      
      setMentorId(mentor.id);
      setMentorStatus(mentor.status as MentorStatus || "setup_incomplete");
      
      const requirements = checkMentorSetup(mentor);
      requirements.hasAvailability = await checkMentorAvailability(mentor.id);
      setSetupRequirements(requirements);
      
      // Fetch existing ranges
      const { data: ranges } = await supabase
        .from("mentor_availability")
        .select("*")
        .eq("mentor_id", mentor.id)
        .gte("date", format(new Date(), "yyyy-MM-dd"))
        .eq("status", "available")
        .order("date", { ascending: true })
        .order("start_time", { ascending: true });
        
      setExistingRanges(ranges || []);
    } catch (error) {
      console.error("Error fetching mentor data:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchMentorData();
  }, [fetchMentorData]);

  // Generate week dates
  const getWeekDates = () => {
    const today = startOfDay(new Date());
    const startDate = addDays(today, weekOffset * 7);
    return Array.from({ length: 7 }, (_, i) => addDays(startDate, i));
  };

  // Validate time range
  const isValidTimeRange = (): boolean => {
    if (!startTime || !endTime) return false;
    const [sH, sM] = startTime.split(":").map(Number);
    const [eH, eM] = endTime.split(":").map(Number);
    const startTotal = sH * 60 + sM;
    const endTotal = eH * 60 + eM;
    return endTotal > startTotal + 14; // At least 15 min range
  };

  // Create availability range
  const handleCreateRange = async () => {
    if (!mentorId || !selectedDate || !startTime || !endTime || !googleMeetLink) {
      toast.error("Please complete all fields");
      return;
    }

    if (!validateMeetLink(googleMeetLink)) {
      toast.error("Please enter a valid Google Meet link");
      return;
    }

    if (!isValidTimeRange()) {
      toast.error("End time must be at least 15 minutes after start time");
      return;
    }

    setSaving(true);
    
    try {
      const dateStr = format(selectedDate, "yyyy-MM-dd");
      
      // Calculate duration of the range
      const [sH, sM] = startTime.split(":").map(Number);
      const [eH, eM] = endTime.split(":").map(Number);
      const durationMinutes = (eH * 60 + eM) - (sH * 60 + sM);
      
      const { error } = await supabase.from("mentor_availability").insert({
        mentor_id: mentorId,
        date: dateStr,
        start_time: startTime,
        end_time: endTime,
        duration_minutes: durationMinutes,
        google_meet_link: googleMeetLink,
        status: "available",
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      });
      
      if (error) throw error;
      
      toast.success("Availability range added successfully!");
      
      // Reset form
      setShowCreateForm(false);
      setSelectedDate(null);
      setStartTime("");
      setEndTime("");
      setGoogleMeetLink("");
      
      fetchMentorData();
    } catch (error: unknown) {
      console.error("Error creating range:", error);
      toast.error(error instanceof Error ? error.message : "Failed to create availability range");
    } finally {
      setSaving(false);
    }
  };

  // Delete range
  const handleDeleteRange = async (rangeId: string) => {
    try {
      const { error } = await supabase
        .from("mentor_availability")
        .delete()
        .eq("id", rangeId);
        
      if (error) throw error;
      
      toast.success("Availability range deleted");
      fetchMentorData();
    } catch (error) {
      console.error("Error deleting range:", error);
      toast.error("Failed to delete range");
    }
  };

  const formatTimeDisplay = (time: string) => {
    const [h, m] = time.split(":").map(Number);
    const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
    const ampm = h < 12 ? "AM" : "PM";
    return `${h12}:${m.toString().padStart(2, "0")} ${ampm}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/mentor/dashboard")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </header>

      <div className="container max-w-4xl py-6 px-4 space-y-6">
        {/* Setup Banner */}
        <MentorSetupBanner
          status={mentorStatus}
          requirements={setupRequirements}
          onSetupClick={() => navigate("/mentor/profile")}
        />

        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Availability</h1>
            <p className="text-muted-foreground">
              Set your available time ranges. Students will see auto-generated slots.
            </p>
          </div>
          <Button
            onClick={() => setShowCreateForm(true)}
            className="gap-2"
            disabled={mentorStatus !== "approved"}
          >
            <Plus className="h-4 w-4" />
            Add Time Range
          </Button>
        </div>

        {/* Create Form */}
        <AnimatePresence>
          {showCreateForm && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="border-primary/20 shadow-lg overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 border-b">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-primary" />
                        Add Availability Range
                      </CardTitle>
                      <CardDescription>
                        Set a time range when you're available. Students will book 15-min slots within this range.
                      </CardDescription>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowCreateForm(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </CardHeader>
                
                <CardContent className="p-6 space-y-6">
                  {/* Date Selection */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Calendar className="h-4 w-4 text-primary" />
                      <span>Select Date</span>
                    </div>
                    
                    <div className="flex items-center justify-between mb-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setWeekOffset(Math.max(0, weekOffset - 1))}
                        disabled={weekOffset === 0}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <span className="text-sm text-muted-foreground">
                        {format(getWeekDates()[0], "MMM d")} - {format(getWeekDates()[6], "MMM d, yyyy")}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setWeekOffset(weekOffset + 1)}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-7 gap-2">
                      {getWeekDates().map((date) => {
                        const isPast = isBefore(date, startOfDay(new Date()));
                        const isSelected = selectedDate && 
                          format(date, "yyyy-MM-dd") === format(selectedDate, "yyyy-MM-dd");
                        
                        return (
                          <motion.button
                            key={date.toISOString()}
                            whileHover={{ scale: isPast ? 1 : 1.05 }}
                            whileTap={{ scale: isPast ? 1 : 0.95 }}
                            onClick={() => !isPast && setSelectedDate(date)}
                            disabled={isPast}
                            className={cn(
                              "flex flex-col items-center p-3 rounded-xl transition-all border-2",
                              isPast && "opacity-40 cursor-not-allowed",
                              isSelected
                                ? "border-primary bg-primary/10 shadow-md"
                                : "border-transparent hover:border-primary/30 hover:bg-muted"
                            )}
                          >
                            <span className="text-xs text-muted-foreground">
                              {format(date, "EEE")}
                            </span>
                            <span className={cn(
                              "text-lg font-semibold",
                              isSelected && "text-primary"
                            )}>
                              {format(date, "d")}
                            </span>
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Time Range Selection */}
                  {selectedDate && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-4"
                    >
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <Clock className="h-4 w-4 text-primary" />
                        <span>Set Time Range</span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Start Time</Label>
                          <select
                            value={startTime}
                            onChange={(e) => setStartTime(e.target.value)}
                            className="flex h-11 w-full rounded-lg border border-input bg-background px-4 py-2.5 text-base shadow-inner ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          >
                            <option value="">Select start</option>
                            {TIME_OPTIONS.map((t) => (
                              <option key={t.value} value={t.value}>{t.label}</option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-2">
                          <Label>End Time</Label>
                          <select
                            value={endTime}
                            onChange={(e) => setEndTime(e.target.value)}
                            className="flex h-11 w-full rounded-lg border border-input bg-background px-4 py-2.5 text-base shadow-inner ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          >
                            <option value="">Select end</option>
                            {TIME_OPTIONS.filter(t => {
                              if (!startTime) return true;
                              const [sH, sM] = startTime.split(":").map(Number);
                              const [tH, tM] = t.value.split(":").map(Number);
                              return (tH * 60 + tM) > (sH * 60 + sM);
                            }).map((t) => (
                              <option key={t.value} value={t.value}>{t.label}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {startTime && endTime && isValidTimeRange() && (
                        <p className="text-sm text-muted-foreground">
                          Students can book slots between {formatTimeDisplay(startTime)} and {formatTimeDisplay(endTime)}
                        </p>
                      )}
                    </motion.div>
                  )}

                  {/* Google Meet Link */}
                  {startTime && endTime && isValidTimeRange() && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-3"
                    >
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <Video className="h-4 w-4 text-primary" />
                        <span>Google Meet Link</span>
                      </div>
                      
                      <Input
                        placeholder="https://meet.google.com/abc-defg-hij"
                        value={googleMeetLink}
                        onChange={(e) => handleMeetLinkChange(e.target.value)}
                      />
                      
                      {meetLinkError && (
                        <p className="text-xs text-destructive flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {meetLinkError}
                        </p>
                      )}

                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Link2 className="h-3 w-3" />
                        <span>Create a meeting at</span>
                        <a
                          href="https://meet.google.com/new"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary underline flex items-center gap-1"
                        >
                          meet.google.com
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    </motion.div>
                  )}

                  {/* Submit Button */}
                  <div className="flex justify-end gap-3 pt-2">
                    <Button
                      variant="outline"
                      onClick={() => setShowCreateForm(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleCreateRange}
                      disabled={
                        saving ||
                        !selectedDate ||
                        !startTime ||
                        !endTime ||
                        !isValidTimeRange() ||
                        !googleMeetLink ||
                        !validateMeetLink(googleMeetLink)
                      }
                      className="gap-2"
                    >
                      {saving ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground" />
                      ) : (
                        <Check className="h-4 w-4" />
                      )}
                      Save Range
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Existing Ranges */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Your Availability Ranges</h2>
          
          {existingRanges.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center">
                <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground/40" />
                <h3 className="text-lg font-medium mb-2">No availability set</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Add time ranges when you're available for sessions
                </p>
                <Button
                  onClick={() => setShowCreateForm(true)}
                  variant="outline"
                  className="gap-2"
                  disabled={mentorStatus !== "approved"}
                >
                  <Plus className="h-4 w-4" />
                  Add Time Range
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3">
              {existingRanges.map((range) => (
                <motion.div
                  key={range.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  layout
                >
                  <Card className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="flex flex-col items-center bg-primary/10 rounded-lg px-3 py-2">
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(range.date + 'T00:00:00'), "EEE")}
                            </span>
                            <span className="text-lg font-bold text-primary">
                              {format(new Date(range.date + 'T00:00:00'), "d")}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(range.date + 'T00:00:00'), "MMM")}
                            </span>
                          </div>
                          
                          <div>
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-primary" />
                              <span className="font-semibold">
                                {formatTimeDisplay(range.start_time)} — {formatTimeDisplay(range.end_time)}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                              <Video className="h-3 w-3" />
                              <span className="truncate max-w-[200px]">
                                {range.google_meet_link || "No link"}
                              </span>
                            </div>
                            <Badge variant="secondary" className="mt-1 text-xs">
                              {range.duration_minutes} min range
                            </Badge>
                          </div>
                        </div>
                        
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => handleDeleteRange(range.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Help Text */}
        <Card className="bg-muted/30 border-dashed">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-primary mt-0.5" />
              <div className="text-sm text-muted-foreground space-y-1">
                <p className="font-medium text-foreground">How it works:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Set your available time ranges (e.g., 8:00 PM – 11:00 PM)</li>
                  <li>Students will see auto-generated 15-minute slots within your range</li>
                  <li>They choose a slot, select duration (30 min or 1 hour), and pay</li>
                  <li>You'll be notified when someone books a session</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
