-- Create reviews table
CREATE TABLE public.reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  student_id UUID NOT NULL,
  mentor_id UUID NOT NULL REFERENCES public.mentors(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(session_id)
);

-- Enable RLS
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Students can create reviews for their completed sessions
CREATE POLICY "Students can create reviews for own sessions"
ON public.reviews
FOR INSERT
WITH CHECK (
  auth.uid() = student_id AND
  EXISTS (
    SELECT 1 FROM sessions 
    WHERE sessions.id = session_id 
    AND sessions.student_id = auth.uid()
    AND sessions.status = 'completed'
  )
);

-- Students can update their own reviews
CREATE POLICY "Students can update own reviews"
ON public.reviews
FOR UPDATE
USING (auth.uid() = student_id);

-- Everyone can view reviews
CREATE POLICY "Anyone can view reviews"
ON public.reviews
FOR SELECT
USING (true);

-- Admins can manage all reviews
CREATE POLICY "Admins can manage all reviews"
ON public.reviews
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Function to update mentor rating when a review is added/updated
CREATE OR REPLACE FUNCTION update_mentor_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE mentors
  SET rating = (
    SELECT COALESCE(AVG(rating), 0)
    FROM reviews
    WHERE mentor_id = COALESCE(NEW.mentor_id, OLD.mentor_id)
  )
  WHERE id = COALESCE(NEW.mentor_id, OLD.mentor_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to update mentor rating
CREATE TRIGGER trigger_update_mentor_rating
AFTER INSERT OR UPDATE OR DELETE ON public.reviews
FOR EACH ROW
EXECUTE FUNCTION update_mentor_rating();

-- Add updated_at trigger
CREATE TRIGGER update_reviews_updated_at
BEFORE UPDATE ON public.reviews
FOR EACH ROW
EXECUTE FUNCTION handle_updated_at();