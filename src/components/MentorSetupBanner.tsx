/**
 * MentorSetupBanner - Shows setup progress for mentors who haven't completed all requirements
 */

import { AlertCircle, CheckCircle, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useNavigate } from 'react-router-dom';
import { MentorSetupRequirements, getIncompleteSetupSteps, getMentorStatusDisplay, MentorStatus } from '@/lib/mentorUtils';

interface MentorSetupBannerProps {
  status: MentorStatus;
  requirements: MentorSetupRequirements;
  onSetupClick?: () => void;
}

export function MentorSetupBanner({ status, requirements, onSetupClick }: MentorSetupBannerProps) {
  const navigate = useNavigate();
  const statusDisplay = getMentorStatusDisplay(status);
  const incompleteSteps = getIncompleteSetupSteps(requirements);
  
  // Calculate completion percentage
  const totalSteps = 5;
  const completedSteps = [
    requirements.hasProfile,
    requirements.hasBio,
    requirements.hasSpecialization,
    requirements.hasPricing,
    requirements.hasAvailability,
  ].filter(Boolean).length;
  const progressPercent = Math.round((completedSteps / totalSteps) * 100);
  
  // Don't show banner if fully set up and approved
  if (status === 'approved' && incompleteSteps.length === 0) {
    return null;
  }
  
  // Pending approval state
  if (status === 'pending_request' || status === 'pending_approval') {
    return (
      <Card className="border-amber-500/30 bg-amber-50 dark:bg-amber-950/20 mb-6">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-amber-600" />
            <CardTitle className="text-lg text-amber-800 dark:text-amber-200">
              Application Under Review
            </CardTitle>
          </div>
          <CardDescription className="text-amber-700 dark:text-amber-300">
            {statusDisplay.description} You'll be notified once approved.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }
  
  // Rejected or suspended state
  if (status === 'rejected' || status === 'suspended') {
    return (
      <Card className="border-destructive/30 bg-destructive/5 mb-6">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <CardTitle className="text-lg text-destructive">
              {statusDisplay.label}
            </CardTitle>
          </div>
          <CardDescription>{statusDisplay.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" onClick={() => navigate('/contact-support')}>
            Contact Support
          </Button>
        </CardContent>
      </Card>
    );
  }
  
  // Setup incomplete state (approved but missing requirements)
  if (incompleteSteps.length > 0) {
    return (
      <Card className="border-primary/30 bg-primary/5 mb-6">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Complete Your Setup</CardTitle>
            </div>
            <Badge variant="secondary">{progressPercent}% Complete</Badge>
          </div>
          <Progress value={progressPercent} className="mt-2" />
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Complete these steps to start receiving bookings:
          </p>
          <ul className="space-y-2">
            {incompleteSteps.map((step, index) => (
              <li key={index} className="flex items-center gap-2 text-sm">
                <div className="h-5 w-5 rounded-full border-2 border-muted-foreground/30 flex items-center justify-center">
                  <span className="text-xs text-muted-foreground">{index + 1}</span>
                </div>
                {step}
              </li>
            ))}
          </ul>
          <div className="flex gap-2 pt-2">
            <Button onClick={onSetupClick || (() => navigate('/mentor/profile'))}>
              Continue Setup <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // All requirements met
  return (
    <Card className="border-green-500/30 bg-green-50 dark:bg-green-950/20 mb-6">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <CardTitle className="text-lg text-green-800 dark:text-green-200">
            Profile Complete
          </CardTitle>
        </div>
        <CardDescription className="text-green-700 dark:text-green-300">
          Your profile is ready! You can now receive bookings.
        </CardDescription>
      </CardHeader>
    </Card>
  );
}
