-- Create announcements table
CREATE TABLE IF NOT EXISTS public.announcements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  announcement_type TEXT NOT NULL CHECK (announcement_type IN ('info', 'warning', 'promotional', 'critical')),
  target_audience TEXT NOT NULL CHECK (target_audience IN ('all', 'students', 'mentors', 'admins')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sent', 'cancelled')),
  scheduled_for TIMESTAMP WITH TIME ZONE,
  sent_at TIMESTAMP WITH TIME ZONE,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb,
  send_as_notification BOOLEAN DEFAULT true,
  send_as_email BOOLEAN DEFAULT false
);

-- Add indexes
CREATE INDEX idx_announcements_status ON announcements(status);
CREATE INDEX idx_announcements_target_audience ON announcements(target_audience);
CREATE INDEX idx_announcements_scheduled ON announcements(scheduled_for) WHERE status = 'scheduled';
CREATE INDEX idx_announcements_created_by ON announcements(created_by);

-- Create announcement_recipients table for tracking
CREATE TABLE IF NOT EXISTS public.announcement_recipients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  announcement_id UUID NOT NULL REFERENCES announcements(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  delivered_at TIMESTAMP WITH TIME ZONE,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add indexes for recipients
CREATE INDEX idx_announcement_recipients_announcement ON announcement_recipients(announcement_id);
CREATE INDEX idx_announcement_recipients_user ON announcement_recipients(user_id);
CREATE INDEX idx_announcement_recipients_delivered ON announcement_recipients(delivered_at);

-- Enable RLS
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcement_recipients ENABLE ROW LEVEL SECURITY;

-- RLS Policies for announcements
CREATE POLICY "Admins can manage all announcements"
  ON announcements FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view sent announcements targeted to them"
  ON announcements FOR SELECT
  USING (
    status = 'sent' AND (
      target_audience = 'all' OR
      (target_audience = 'students' AND EXISTS (
        SELECT 1 FROM user_roles 
        WHERE user_id = auth.uid() AND role = 'student'
      )) OR
      (target_audience = 'mentors' AND EXISTS (
        SELECT 1 FROM user_roles 
        WHERE user_id = auth.uid() AND role = 'mentor'
      )) OR
      (target_audience = 'admins' AND has_role(auth.uid(), 'admin'::app_role))
    )
  );

-- RLS Policies for recipients
CREATE POLICY "Admins can view all recipients"
  ON announcement_recipients FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view their own recipient records"
  ON announcement_recipients FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own read status"
  ON announcement_recipients FOR UPDATE
  USING (auth.uid() = user_id);

-- Comments
COMMENT ON TABLE announcements IS 'System-wide announcements and broadcasts';
COMMENT ON TABLE announcement_recipients IS 'Tracks announcement delivery and read status';
COMMENT ON COLUMN announcements.announcement_type IS 'Type of announcement: info, warning, promotional, critical';
COMMENT ON COLUMN announcements.target_audience IS 'Who should receive this: all, students, mentors, admins';
COMMENT ON COLUMN announcements.status IS 'Current status: draft, scheduled, sent, cancelled';