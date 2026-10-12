
UPDATE plans SET 
  name = 'JEE 60 Days Ultimate Strategy',
  description = 'Complete 60-day intensive JEE preparation with personalized mentorship',
  features = '["Weekly 1-on-1 live sessions with dedicated mentor", "Unlimited chat access with your mentor", "Complete mock test & marks analysis", "Personalized study roadmap & daily schedule", "Previous year paper strategy & shortcuts", "Weak topic identification & targeted practice"]'::jsonb,
  duration_minutes = 60,
  updated_at = now()
WHERE plan_key = 'jee_advanced_2026';

UPDATE plans SET 
  name = 'NEET 60 Days Ultimate Strategy',
  description = 'Complete 60-day intensive NEET preparation with personalized mentorship',
  features = '["Weekly 1-on-1 live sessions with dedicated mentor", "Unlimited chat access with your mentor", "Complete mock test & marks analysis", "Personalized study roadmap & daily schedule", "Subject-wise weightage strategy & NCERT mastery plan", "Weak topic identification & targeted practice"]'::jsonb,
  duration_minutes = 60,
  updated_at = now()
WHERE plan_key = 'neet_2026';
