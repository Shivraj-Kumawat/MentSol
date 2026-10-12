import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Star } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { AnimatedStarRating } from "@/components/AnimatedStarRating";
import { QuickFeedbackTags } from "@/components/QuickFeedbackTags";
import { ThankYouAnimation } from "@/components/ThankYouAnimation";
import { format } from "date-fns";

interface SessionData {
  id: string;
  mentor_id: string;
  scheduled_at: string | null;
  mentorName: string;
  mentorAvatar: string | null;
  mentorSpecialization: string | null;
}

export default function ReviewSession() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [showThankYou, setShowThankYou] = useState(false);
  const [alreadyReviewed, setAlreadyReviewed] = useState(false);

  useEffect(() => {
    if (sessionId && user) {
      fetchSessionData();
    }
  }, [sessionId, user]);

  const fetchSessionData = async () => {
    try {
      setLoading(true);
      
      // Check if already reviewed
      const { data: existingReview } = await supabase
        .from("reviews")
        .select("id")
        .eq("session_id", sessionId)
        .maybeSingle();

      if (existingReview) {
        setAlreadyReviewed(true);
        setLoading(false);
        return;
      }

      // Fetch session data
      const { data: session, error: sessionError } = await supabase
        .from("sessions")
        .select("id, mentor_id, scheduled_at")
        .eq("id", sessionId)
        .eq("student_id", user?.id)
        .single();

      if (sessionError || !session) {
        toast({
          title: "Session not found",
          description: "Unable to load session details",
          variant: "destructive",
        });
        navigate("/bookings");
        return;
      }

      // Fetch mentor data
      const { data: mentor } = await supabase
        .from("mentors")
        .select("user_id, specialization")
        .eq("id", session.mentor_id)
        .single();

      let mentorName = "Your Mentor";
      let mentorAvatar = null;
      let mentorSpecialization = null;

      if (mentor) {
        mentorSpecialization = mentor.specialization;
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name, avatar_url")
          .eq("id", mentor.user_id)
          .single();

        if (profile) {
          mentorName = profile.full_name || "Your Mentor";
          mentorAvatar = profile.avatar_url;
        }
      }

      setSessionData({
        id: session.id,
        mentor_id: session.mentor_id,
        scheduled_at: session.scheduled_at,
        mentorName,
        mentorAvatar,
        mentorSpecialization,
      });
    } catch (error) {
      console.error("Error fetching session:", error);
      toast({
        title: "Error",
        description: "Failed to load session details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleTag = (tagId: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagId)
        ? prev.filter((id) => id !== tagId)
        : [...prev, tagId]
    );
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      toast({
        title: "Rating Required",
        description: "Please select a rating before submitting",
        variant: "destructive",
      });
      return;
    }

    if (!sessionData || !user) return;

    try {
      setSubmitting(true);

      const { error } = await supabase.from("reviews").insert({
        session_id: sessionData.id,
        student_id: user.id,
        mentor_id: sessionData.mentor_id,
        rating,
        review_text: reviewText || null,
      });

      if (error) throw error;

      setShowThankYou(true);

      setTimeout(() => {
        toast({
          title: "Review Submitted! ⭐",
          description: "Thank you for your feedback",
        });
        navigate("/bookings");
      }, 3000);
    } catch (error: any) {
      console.error("Error submitting review:", error);
      
      // Detect RLS policy error and show helpful message
      const isRlsError = error.message?.includes("row-level security") || 
                         error.code === "42501";
      
      toast({
        title: isRlsError ? "Cannot Submit Review Yet" : "Error",
        description: isRlsError 
          ? "You can submit a review only after the session time has passed (30 minutes after start)."
          : (error.message || "Failed to submit review"),
        variant: "destructive",
      });
      setSubmitting(false);
    }
  };

  if (showThankYou) {
    return <ThankYouAnimation show={true} onComplete={() => navigate("/bookings")} />;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (alreadyReviewed) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-background p-4">
        <div className="max-w-lg mx-auto pt-8">
          <Button
            variant="ghost"
            onClick={() => navigate("/bookings")}
            className="mb-6"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Bookings
          </Button>
          
          <Card className="text-center">
            <CardContent className="py-12">
              <Star className="h-16 w-16 mx-auto mb-4 fill-yellow-400 text-yellow-400" />
              <h2 className="text-2xl font-bold mb-2">Already Reviewed</h2>
              <p className="text-muted-foreground">
                You have already submitted a review for this session.
              </p>
              <Button
                className="mt-6"
                onClick={() => navigate("/bookings")}
              >
                Back to Bookings
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!sessionData) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-background p-4">
      <div className="max-w-lg mx-auto pt-4 pb-8">
        <Button
          variant="ghost"
          onClick={() => navigate("/bookings")}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Bookings
        </Button>

        <Card>
          <CardHeader className="text-center pb-2">
            <div className="flex justify-center mb-4">
              <Avatar className="w-20 h-20">
                <AvatarImage src={sessionData.mentorAvatar || undefined} />
                <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                  {sessionData.mentorName[0]}
                </AvatarFallback>
              </Avatar>
            </div>
            <CardTitle className="text-2xl">Rate Your Session</CardTitle>
            <CardDescription>
              How was your session with {sessionData.mentorName}?
            </CardDescription>
            {sessionData.scheduled_at && (
              <p className="text-sm text-muted-foreground mt-2">
                {format(new Date(sessionData.scheduled_at), "MMMM dd, yyyy 'at' hh:mm a")}
              </p>
            )}
          </CardHeader>

          <CardContent className="space-y-6 pt-4">
            {/* Star Rating */}
            <AnimatedStarRating
              rating={rating}
              hoveredRating={hoveredRating}
              onRatingChange={setRating}
              onHoverChange={setHoveredRating}
            />

            {/* Quick Feedback Tags */}
            {rating > 0 && (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                <QuickFeedbackTags
                  selectedTags={selectedTags}
                  onToggleTag={handleToggleTag}
                />
              </div>
            )}

            {/* Review Text */}
            {rating > 0 && (
              <div className="space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <label className="text-sm font-medium">
                  Your Review (Optional)
                </label>
                <Textarea
                  placeholder="Share your experience with this mentor..."
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  rows={4}
                  maxLength={500}
                  className="resize-none"
                />
                <p className="text-xs text-muted-foreground text-right">
                  {reviewText.length}/500
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/bookings")}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={submitting || rating === 0}
                className="flex-1"
              >
                {submitting ? "Submitting..." : "Submit Review"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
