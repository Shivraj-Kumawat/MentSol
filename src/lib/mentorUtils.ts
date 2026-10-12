/**
 * Mentor Utilities - Single Source of Truth for Mentor State & Pricing
 * 
 * CRITICAL: All pricing is stored in PAISE (integer). Convert to rupees ONLY for display.
 * Mentor status lifecycle: setup_incomplete → pending_approval → approved | rejected | suspended
 */

import { supabase } from '@/integrations/supabase/client';

// Valid mentor statuses
export type MentorStatus = 'setup_incomplete' | 'pending_request' | 'pending_approval' | 'approved' | 'rejected' | 'suspended';

// Mentor setup requirements
export interface MentorSetupRequirements {
  hasProfile: boolean;
  hasBio: boolean;
  hasSpecialization: boolean;
  hasPricing: boolean;
  hasAvailability: boolean;
  isApproved: boolean;
}

// Canonical mentor data
export interface CanonicalMentorData {
  id: string;
  user_id: string;
  status: MentorStatus;
  nickname: string | null;
  bio: string | null;
  specialization: string | null;
  fixed_rate_per_15m: number; // Always in PAISE
  rating: number;
  total_sessions: number;
  mentor_types: string[];
  exams: string[];
  isBookable: boolean;
  setupRequirements: MentorSetupRequirements;
}

/**
 * Check if mentor has completed all setup requirements
 */
export function checkMentorSetup(mentor: any): MentorSetupRequirements {
  const hasProfile = !!mentor;
  const hasBio = !!mentor?.bio && mentor.bio.trim().length > 0;
  const hasSpecialization = !!mentor?.specialization && mentor.specialization.trim().length > 0;
  const hasPricing = typeof mentor?.fixed_rate_per_15m === 'number' && mentor.fixed_rate_per_15m > 0;
  const isApproved = mentor?.status === 'approved';
  
  return {
    hasProfile,
    hasBio,
    hasSpecialization,
    hasPricing,
    hasAvailability: false, // Will be checked separately
    isApproved,
  };
}

/**
 * Check if mentor has any availability slots
 */
export async function checkMentorAvailability(mentorId: string): Promise<boolean> {
  const { count, error } = await supabase
    .from('mentor_availability')
    .select('id', { count: 'exact', head: true })
    .eq('mentor_id', mentorId)
    .eq('status', 'available')
    .gte('date', new Date().toISOString().split('T')[0]);
  
  if (error) {
    console.error('Error checking mentor availability:', error);
    return false;
  }
  
  return (count ?? 0) > 0;
}

/**
 * Determine if a mentor is bookable (all requirements met)
 */
export function isMentorBookable(mentor: any, hasAvailability: boolean): boolean {
  if (!mentor) return false;
  
  const requirements = checkMentorSetup(mentor);
  requirements.hasAvailability = hasAvailability;
  
  return (
    requirements.isApproved &&
    requirements.hasPricing &&
    requirements.hasAvailability
  );
}

/**
 * PRICING MODEL CLARIFICATION:
 * - Database stores prices in INTEGER RUPEES (not paise)
 * - Example: ₹5 is stored as 5 in the DB
 * - No conversion needed for display
 * - Razorpay requires paise, so multiply by 100 only when calling Razorpay API
 */

/**
 * Format price for display (DB stores in rupees)
 */
export function formatPrice(amountInRupees: number, options?: { showSymbol?: boolean }): string {
  if (typeof amountInRupees !== 'number' || isNaN(amountInRupees)) {
    amountInRupees = 0;
  }
  const formatted = amountInRupees.toLocaleString('en-IN');
  return options?.showSymbol !== false ? `₹${formatted}` : formatted;
}

/**
 * @deprecated - DB stores in RUPEES, not paise. Use formatPrice() directly.
 */
export function paiseToRupees(paise: number): number {
  console.warn('paiseToRupees is deprecated - DB stores in RUPEES, not paise');
  return paise; // No conversion - DB is in rupees
}

/**
 * @deprecated - DB stores in RUPEES, not paise. Save the value directly.
 */
export function rupeesToPaise(rupees: number): number {
  console.warn('rupeesToPaise is deprecated - DB stores in RUPEES, not paise');
  return rupees; // No conversion - DB is in rupees
}

/**
 * Validate booking eligibility
 */
export interface BookingValidation {
  canBook: boolean;
  error?: string;
  errorCode?: 'MENTOR_NOT_APPROVED' | 'PRICING_NOT_SET' | 'SLOT_NOT_AVAILABLE' | 'INVALID_AMOUNT';
}

export function validateBookingEligibility(
  mentor: any,
  slot: any,
  amount: number
): BookingValidation {
  // Check mentor is approved
  if (!mentor || mentor.status !== 'approved') {
    return {
      canBook: false,
      error: 'This mentor is not available for booking at this time.',
      errorCode: 'MENTOR_NOT_APPROVED',
    };
  }
  
  // Check pricing is set
  if (!mentor.fixed_rate_per_15m || mentor.fixed_rate_per_15m <= 0) {
    return {
      canBook: false,
      error: 'Pricing has not been set for this mentor. Please contact support.',
      errorCode: 'PRICING_NOT_SET',
    };
  }
  
  // Check slot is available
  if (!slot || slot.status !== 'available') {
    return {
      canBook: false,
      error: 'This time slot is no longer available. Please select another slot.',
      errorCode: 'SLOT_NOT_AVAILABLE',
    };
  }
  
  // Check amount is valid
  if (!amount || amount <= 0) {
    return {
      canBook: false,
      error: 'Invalid session amount. Please try again.',
      errorCode: 'INVALID_AMOUNT',
    };
  }
  
  return { canBook: true };
}

/**
 * Calculate session amount
 */
export function calculateSessionAmount(ratePerBlock: number, durationMinutes: number, blockSize: number = 15): number {
  if (!ratePerBlock || ratePerBlock <= 0) return 0;
  if (!durationMinutes || durationMinutes <= 0) return 0;
  
  const blocks = Math.ceil(durationMinutes / blockSize);
  return ratePerBlock * blocks;
}

/**
 * Get mentor status display info
 */
export function getMentorStatusDisplay(status: MentorStatus): {
  label: string;
  variant: 'default' | 'secondary' | 'destructive' | 'outline';
  description: string;
} {
  switch (status) {
    case 'approved':
      return {
        label: 'Active',
        variant: 'default',
        description: 'Your profile is live and you can receive bookings.',
      };
    case 'pending_request':
    case 'pending_approval':
      return {
        label: 'Under Review',
        variant: 'secondary',
        description: 'Your application is being reviewed by our team.',
      };
    case 'setup_incomplete':
      return {
        label: 'Setup Required',
        variant: 'outline',
        description: 'Complete your profile setup to submit for review.',
      };
    case 'rejected':
      return {
        label: 'Not Approved',
        variant: 'destructive',
        description: 'Your application was not approved. Contact support for details.',
      };
    case 'suspended':
      return {
        label: 'Suspended',
        variant: 'destructive',
        description: 'Your account has been suspended. Contact support.',
      };
    default:
      return {
        label: 'Unknown',
        variant: 'outline',
        description: 'Contact support for assistance.',
      };
  }
}

/**
 * Get incomplete setup steps
 */
export function getIncompleteSetupSteps(requirements: MentorSetupRequirements): string[] {
  const steps: string[] = [];
  
  if (!requirements.hasBio) steps.push('Add a bio');
  if (!requirements.hasSpecialization) steps.push('Set your specialization');
  if (!requirements.hasPricing) steps.push('Pricing needs to be set by admin');
  if (!requirements.hasAvailability) steps.push('Add availability slots');
  
  return steps;
}
