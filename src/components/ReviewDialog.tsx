import { useState } from "react";
import { Star } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { AnimatedStarRating } from "./AnimatedStarRating";
import { QuickFeedbackTags } from "./QuickFeedbackTags";
import { ThankYouAnimation } from "./ThankYouAnimation";

interface ReviewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId: string;
  mentorId: string;
  studentId: string;
  mentorName: string;
  onReviewSubmitted?: () => void;
}

export const ReviewDialog = ({
  isOpen,
  onClose,
  sessionId,
  mentorId,
  studentId,
  mentorName,
  onReviewSubmitted,
}: ReviewDialogProps) => {
  const { toast } = useToast();
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showThankYou, setShowThankYou] = useState(false);

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

    try {
      setSubmitting(true);

      const { error } = await supabase.from("reviews").insert({
        session_id: sessionId,
        student_id: studentId,
        mentor_id: mentorId,
        rating,
        review_text: reviewText || null,
      });

      if (error) throw error;

      // Show thank you animation
      setShowThankYou(true);

      // Wait for animation then close
      setTimeout(() => {
        toast({
          title: "Review Submitted! ⭐",
          description: "Thank you for your feedback",
        });

        onReviewSubmitted?.();
        onClose();
        setRating(0);
        setReviewText("");
        setSelectedTags([]);
        setShowThankYou(false);
      }, 3000);
    } catch (error: any) {
      console.error("Error submitting review:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to submit review",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <ThankYouAnimation 
        show={showThankYou}
        onComplete={() => setShowThankYou(false)}
      />
      
      <Dialog open={isOpen && !showThankYou} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-2xl">Rate Your Session</DialogTitle>
            <DialogDescription>
              How was your session with {mentorName}?
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Animated Star Rating */}
            <AnimatedStarRating
              rating={rating}
              hoveredRating={hoveredRating}
              onRatingChange={setRating}
              onHoverChange={setHoveredRating}
            />

            {/* Quick Feedback Tags */}
            {rating > 0 && (
              <div className="animate-fade-in-up">
                <QuickFeedbackTags
                  selectedTags={selectedTags}
                  onToggleTag={handleToggleTag}
                />
              </div>
            )}

            {/* Review Text */}
            {rating > 0 && (
              <div className="space-y-2 animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
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
          </div>

          <div className="flex gap-2">
            <Button 
              type="button"
              variant="outline" 
              onClick={onClose}
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
        </DialogContent>
      </Dialog>
    </>
  );
};
