-- Add INSERT policy for mentors table to allow users to create their own mentor profiles
CREATE POLICY "Users can insert own mentor profile" 
ON public.mentors 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Add unique constraint to prevent duplicate mentor profiles per user
ALTER TABLE public.mentors 
ADD CONSTRAINT unique_user_mentor UNIQUE (user_id);