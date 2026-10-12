import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Calendar, Clock, MessageSquare, Shield, Sparkles, Video, Star, Timer, Tag, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useRazorpay } from '@/hooks/useRazorpay';
import { PaymentSuccessAnimation } from '@/components/PaymentSuccessAnimation';
import { format, addDays } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { iosEasing } from '@/lib/motion';
import { getStoredRef } from '@/utils/referral';

interface TimeSlot {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  status: string;
  duration_minutes?: number;
  google_meet_link?: string | null;
}

interface MentorAvailabilityRange {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  google_meet_link: string | null;
  status: string;
  duration_minutes: number;
}

interface MentorInfo {
  id: string;
  nickname: string | null;
  avatar_url: string | null;
  specialization: string | null;
  fixed_rate_per_15m: number | null;
  fixed_rate_per_30m: number | null;
  fixed_rate_per_45m: number | null;
  rating: number | null;
  total_sessions: number | null;
  reschedule_policy: {
    allow_reschedule: boolean;
    free_reschedule_hours: number;
    last_minute_fee_percentage: number;
  } | null;
}

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.3, ease: iosEasing },
  },
};

const dateButtonVariants = {
  idle: { scale: 1 },
  hover: { scale: 1.05 },
  selected: { scale: 1.02 },
  tap: { scale: 0.95 },
};

// Progress step indicator component
const ProgressIndicator = ({ currentStep }: { currentStep: number }) => {
  const steps = [
    { num: 1, label: 'Duration' },
    { num: 2, label: 'Date' },
    { num: 3, label: 'Time' },
    { num: 4, label: 'Details' },
  ];

  return (
    <div className="flex items-center justify-center gap-2 py-3">
      {steps.map((step, index) => (
        <div key={step.num} className="flex items-center gap-1.5">
          <div className="flex flex-col items-center gap-1">
            <motion.div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors duration-300 ${
                step.num <= currentStep 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-muted text-muted-foreground'
              }`}
              initial={{ scale: 0.8 }}
              animate={{ scale: step.num === currentStep ? 1.1 : 1 }}
              transition={{ duration: 0.2 }}
            >
              {step.num}
            </motion.div>
            <span className={`text-[9px] font-medium ${step.num <= currentStep ? 'text-primary' : 'text-muted-foreground'}`}>
              {step.label}
            </span>
          </div>
          {index < steps.length - 1 && (
            <div className={`w-6 h-0.5 rounded-full mt-[-12px] ${step.num < currentStep ? 'bg-primary' : 'bg-muted'}`} />
          )}
        </div>
      ))}
    </div>
  );
};

const REFERRAL_DISCOUNT = 50;

const BookSession = () => {
  const { mentorId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { createOrderAndPay, isLoading: paymentLoading } = useRazorpay();

  const [loading, setLoading] = useState(true);
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [mentorInfo, setMentorInfo] = useState<MentorInfo | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [problemDescription, setProblemDescription] = useState("");
  const [showPaymentSuccess, setShowPaymentSuccess] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState<{ amount?: number; mentorName?: string }>({});
  const [selectedDuration, setSelectedDuration] = useState<number | null>(null);
  const [sessionPrices, setSessionPrices] = useState<{ price30m: number; price60m: number }>({ price30m: 149, price60m: 249 });

  // Referral code state
  const [referralCode, setReferralCode] = useState('');
  const [referralApplied, setReferralApplied] = useState(false);
  const [referralError, setReferralError] = useState('');
  const [validatingReferral, setValidatingReferral] = useState(false);

  // Auto-load referral code from localStorage on mount
  useEffect(() => {
    const storedRef = getStoredRef();
    if (storedRef) {
      setReferralCode(storedRef);
      // Auto-validate
      validateReferralCode(storedRef);
    }
  }, []);

  const validateReferralCode = async (code: string) => {
    if (!code.trim()) {
      setReferralError('');
      setReferralApplied(false);
      return;
    }
    
    setValidatingReferral(true);
    setReferralError('');
    
    try {
      const { data } = await supabase
        .rpc('lookup_promoter_by_ref', { ref_code: code.trim() });
      
      if (data && data.length > 0) {
        setReferralApplied(true);
        setReferralError('');
      } else {
        setReferralApplied(false);
        setReferralError('Invalid referral code');
      }
    } catch {
      setReferralApplied(false);
      setReferralError('Failed to validate code');
    } finally {
      setValidatingReferral(false);
    }
  };

  const handleApplyReferral = () => {
    validateReferralCode(referralCode);
  };

  const handleRemoveReferral = () => {
    setReferralCode('');
    setReferralApplied(false);
    setReferralError('');
  };

  // Calculate current step for progress indicator
  const currentStep = useMemo(() => {
    if (!selectedDuration) return 1;
    if (selectedSlot && problemDescription.trim()) return 4;
    if (selectedSlot) return 3;
    return 2;
  }, [selectedDuration, selectedSlot, problemDescription]);

  // Get student's local timezone
  const studentTimezone = useMemo(() => {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  }, []);

  // Generate next 7 days
  const dates = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => addDays(new Date(), i));
  }, []);

  useEffect(() => {
    if (mentorId) {
      loadMentorInfo();
      loadSessionPrices();
    }
  }, [mentorId]);

  useEffect(() => {
    if (mentorId && selectedDuration) {
      loadAvailableSlots();
    }
  }, [mentorId, selectedDate, selectedDuration]);

  const loadSessionPrices = async () => {
    try {
      const { data } = await supabase
        .from('platform_settings')
        .select('setting_key, setting_value')
        .in('setting_key', ['session_price_30m', 'session_price_60m']);
      
      if (data) {
        const prices = { price30m: 149, price60m: 249 };
        data.forEach((s: any) => {
          const val = s.setting_value?.value;
          if (s.setting_key === 'session_price_30m' && val) prices.price30m = val;
          if (s.setting_key === 'session_price_60m' && val) prices.price60m = val;
        });
        setSessionPrices(prices);
      }
    } catch (error) {
      console.error('Error loading session prices:', error);
    }
  };

  const loadMentorInfo = async () => {
    try {
      const { data: mentorData, error: mentorError } = await supabase
        .rpc('get_public_mentor_by_id', { mentor_uuid: mentorId });

      if (mentorError) throw mentorError;

      if (!mentorData || mentorData.length === 0) {
        toast({
          title: "Mentor Not Found",
          description: "This mentor doesn't exist or is no longer available.",
          variant: "destructive",
        });
        navigate("/home", { replace: true });
        return;
      }

      const m = mentorData[0];
      
      const { data: policyData } = await supabase
        .from('mentors')
        .select('reschedule_policy')
        .eq('id', m.mentor_id)
        .maybeSingle();

      const policy = policyData?.reschedule_policy as any;

      setMentorInfo({
        id: m.mentor_id,
        nickname: m.nickname,
        avatar_url: m.avatar_url,
        specialization: m.specialization,
        fixed_rate_per_15m: m.fixed_rate_per_15m,
        fixed_rate_per_30m: m.fixed_rate_per_30m ?? 0,
        fixed_rate_per_45m: m.fixed_rate_per_45m ?? 0,
        rating: m.rating,
        total_sessions: m.total_sessions,
        reschedule_policy: policy ? {
          allow_reschedule: policy.allow_reschedule ?? true,
          free_reschedule_hours: policy.free_reschedule_hours ?? 24,
          last_minute_fee_percentage: policy.last_minute_fee_percentage ?? 20,
        } : {
          allow_reschedule: true,
          free_reschedule_hours: 24,
          last_minute_fee_percentage: 20,
        },
      });
    } catch (error) {
      console.error('Error loading mentor info:', error);
      toast({
        title: "Error",
        description: "Failed to load mentor information.",
        variant: "destructive",
      });
    }
  };

  const loadAvailableSlots = async () => {
    if (!selectedDuration) return;
    try {
      setLoading(true);
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      
      const { data, error } = await supabase
        .from('mentor_availability')
        .select('*')
        .eq('mentor_id', mentorId)
        .eq('date', dateStr)
        .eq('status', 'available')
        .order('start_time');

      if (error) throw error;
      
      const { data: bookedSessions } = await supabase
        .from('sessions')
        .select('scheduled_at, slot_id')
        .eq('mentor_id', mentorId)
        .in('status', ['confirmed', 'pending_payment'])
        .gte('scheduled_at', `${dateStr}T00:00:00`)
        .lte('scheduled_at', `${dateStr}T23:59:59`);

      const bookedTimes = new Set(
        (bookedSessions || []).map(s => {
          if (s.scheduled_at) {
            const d = new Date(s.scheduled_at);
            return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
          }
          return '';
        }).filter(Boolean)
      );

      const generatedSlots: TimeSlot[] = [];
      (data || []).forEach((range: MentorAvailabilityRange) => {
        const [startH, startM] = range.start_time.split(':').map(Number);
        const [endH, endM] = range.end_time.split(':').map(Number);
        const startTotal = startH * 60 + startM;
        const endTotal = endH * 60 + endM;
        
        for (let t = startTotal; t + selectedDuration <= endTotal; t += 15) {
          const slotStartH = Math.floor(t / 60);
          const slotStartM = t % 60;
          const slotEndT = t + selectedDuration;
          const slotEndH = Math.floor(slotEndT / 60);
          const slotEndM = slotEndT % 60;
          
          const startTimeStr = `${slotStartH.toString().padStart(2, '0')}:${slotStartM.toString().padStart(2, '0')}`;
          const endTimeStr = `${slotEndH.toString().padStart(2, '0')}:${slotEndM.toString().padStart(2, '0')}`;
          
          if (bookedTimes.has(startTimeStr)) continue;
          
          const now = new Date();
          const slotDateTime = new Date(`${dateStr}T${startTimeStr}:00`);
          if (slotDateTime <= now) continue;
          
          generatedSlots.push({
            id: `${range.id}_${startTimeStr}`,
            date: dateStr,
            start_time: startTimeStr,
            end_time: endTimeStr,
            status: 'available',
            duration_minutes: selectedDuration,
            google_meet_link: range.google_meet_link,
          });
        }
      });
      
      setSlots(generatedSlots);
    } catch (error: any) {
      console.error('Error loading slots:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to load available slots.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatSlotTime = (slot: TimeSlot) => {
    const startDateTime = new Date(`${slot.date}T${slot.start_time}`);
    const endDateTime = new Date(`${slot.date}T${slot.end_time}`);
    
    const startTime = startDateTime.toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: studentTimezone,
    });
    
    const endTime = endDateTime.toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: studentTimezone,
    });
    
    return { startTime, endTime };
  };

  const handleSlotClick = (slotId: string) => {
    setSelectedSlot(slotId === selectedSlot ? null : slotId);
  };

  const handleDurationSelect = (duration: number) => {
    if (duration === selectedDuration) return;
    setSelectedDuration(duration);
    setSelectedSlot(null);
    setProblemDescription("");
  };

  const handleBookSlot = async () => {
    if (!selectedSlot) return;
    
    if (!problemDescription.trim()) {
      toast({
        title: "Description Required",
        description: "Please describe your problem or questions before booking",
        variant: "destructive",
      });
      return;
    }

    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to book a session",
        variant: "destructive",
      });
      navigate('/auth', { state: { from: `/mentor/${mentorId}/book` } });
      return;
    }

    if (!mentorId) return;

    try {
      const [rangeId, startTime] = selectedSlot.split('_');
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      
      const result = await createOrderAndPay({
        mentor_id: mentorId,
        slot_id: rangeId,
        problem_description: problemDescription,
        selected_duration: selectedDuration,
        selected_start_time: startTime,
        selected_date: dateStr,
        referral_code: referralApplied ? referralCode.trim() : undefined,
      });

      if (result.success) {
        setPaymentDetails({
          amount: result.amount,
          mentorName: result.mentorName || mentorInfo?.nickname || 'Mentor',
        });
        setShowPaymentSuccess(true);
      }
    } catch (error: any) {
      console.error('Error booking slot:', error);
      toast({
        title: "Booking Failed",
        description: error.message || "Failed to book the session. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handlePaymentAnimationComplete = () => {
    setShowPaymentSuccess(false);
    navigate('/bookings');
  };

  const effectiveSessionPrices = useMemo(() => {
    const mentor30m = Number(mentorInfo?.fixed_rate_per_30m || 0);
    const mentor60m = Number(mentorInfo?.fixed_rate_per_45m || 0);

    return {
      price30m: mentor30m > 0 ? mentor30m : sessionPrices.price30m,
      price60m: mentor60m > 0 ? mentor60m : sessionPrices.price60m,
    };
  }, [mentorInfo, sessionPrices]);

  const sessionPrice = useMemo(() => {
    if (!selectedDuration) return 0;
    if (selectedDuration === 60) return effectiveSessionPrices.price60m;
    if (selectedDuration === 30) return effectiveSessionPrices.price30m;
    return 0;
  }, [selectedDuration, effectiveSessionPrices]);

  const finalPrice = useMemo(() => {
    if (!sessionPrice) return 0;
    return referralApplied ? Math.max(sessionPrice - REFERRAL_DISCOUNT, 1) : sessionPrice;
  }, [sessionPrice, referralApplied]);

  const canProceed = selectedSlot && problemDescription.trim() && selectedDuration;

  // Loading state
  if (!mentorInfo) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-background">
        <div className="text-center space-y-2">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto" />
          <p className="text-muted-foreground text-sm">Loading booking...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <PaymentSuccessAnimation
        show={showPaymentSuccess}
        onComplete={handlePaymentAnimationComplete}
        amount={paymentDetails.amount}
        mentorName={paymentDetails.mentorName}
      />

      <div className="min-h-[100dvh] flex flex-col bg-background">
        {/* Sticky Header */}
        <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-lg border-b border-border shrink-0">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/home", { replace: true })}
                className="rounded-full h-9 w-9"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-base font-semibold text-foreground">Book Session</h1>
                <p className="text-xs text-muted-foreground">with {mentorInfo.nickname}</p>
              </div>
            </div>
            {selectedDuration ? (
              <Badge className="text-sm font-bold px-3 py-1.5 bg-primary/10 text-primary border-primary/20">
                {selectedDuration} min — ₹{finalPrice}
              </Badge>
            ) : (
              <Badge className="text-sm font-bold px-3 py-1.5 bg-muted text-muted-foreground">
                Select duration
              </Badge>
            )}
          </div>
        </header>

        {/* Mentor Card (Compact) */}
        <div className="shrink-0 px-4 py-3 border-b border-border/50 bg-gradient-to-b from-primary/5 to-transparent">
          <div className="flex items-center gap-3">
            <Avatar className="w-12 h-12 ring-2 ring-primary/20 ring-offset-2 ring-offset-background">
              <AvatarImage 
                src={mentorInfo.avatar_url || undefined} 
                alt={mentorInfo.nickname || 'Mentor'} 
              />
              <AvatarFallback className="bg-primary text-primary-foreground text-lg font-semibold">
                {(mentorInfo.nickname || 'M')[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-foreground truncate">
                {mentorInfo.nickname || 'Mentor'}
              </div>
              {mentorInfo.specialization && (
                <div className="text-xs text-muted-foreground truncate">
                  {mentorInfo.specialization}
                </div>
              )}
              <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                <div className="flex items-center gap-0.5">
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  <span>{mentorInfo.rating || 'New'}</span>
                </div>
                <span>•</span>
                <span>{mentorInfo.total_sessions || 0} sessions</span>
              </div>
            </div>
          </div>
        </div>

        {/* Progress Indicator */}
        <div className="shrink-0 border-b border-border/30 bg-muted/20">
          <ProgressIndicator currentStep={currentStep} />
        </div>

        {/* Scrollable Content Area */}
        <main className="flex-1 overflow-y-auto pb-36">
          <div className="p-4 space-y-6">
            {/* Step 1: Duration Selection */}
            <motion.section
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1, ease: iosEasing }}
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                  1
                </div>
                <Label className="text-sm font-semibold text-foreground">Select Duration</Label>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleDurationSelect(30)}
                  className={`cursor-pointer rounded-xl border-2 p-5 text-center transition-all duration-200 ${
                    selectedDuration === 30
                      ? 'border-primary bg-primary/5 ring-2 ring-primary/20 shadow-lg shadow-primary/10'
                      : 'border-border bg-card hover:border-primary/40'
                  }`}
                >
                  <Timer className={`h-6 w-6 mx-auto mb-2 ${selectedDuration === 30 ? 'text-primary' : 'text-muted-foreground'}`} />
                  <Badge variant="secondary" className="mb-2">30 Minutes</Badge>
                  <p className={`text-2xl font-bold mb-1 ${selectedDuration === 30 ? 'text-primary' : 'text-foreground'}`}>
                    ₹{effectiveSessionPrices.price30m}
                  </p>
                  <p className="text-xs text-muted-foreground">Standard session</p>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleDurationSelect(60)}
                  className={`cursor-pointer rounded-xl border-2 p-5 text-center transition-all duration-200 ${
                    selectedDuration === 60
                      ? 'border-primary bg-primary/5 ring-2 ring-primary/20 shadow-lg shadow-primary/10'
                      : 'border-border bg-card hover:border-primary/40'
                  }`}
                >
                  <Timer className={`h-6 w-6 mx-auto mb-2 ${selectedDuration === 60 ? 'text-primary' : 'text-muted-foreground'}`} />
                  <Badge className="mb-2 bg-primary/10 text-primary border-primary/20">1 Hour</Badge>
                  <p className={`text-2xl font-bold mb-1 ${selectedDuration === 60 ? 'text-primary' : 'text-foreground'}`}>
                    ₹{effectiveSessionPrices.price60m}
                  </p>
                  <p className="text-xs text-muted-foreground">Strategy session</p>
                </motion.div>
              </div>
            </motion.section>

            {/* Step 2: Date Selection (only after duration selected) */}
            <AnimatePresence>
              {selectedDuration && (
                <motion.section
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3, ease: iosEasing }}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <div className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold transition-colors ${
                      currentStep >= 2 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                    }`}>
                      2
                    </div>
                    <Label className="text-sm font-semibold text-foreground">Select Date</Label>
                  </div>
                  
                  <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
                    {dates.map((date) => {
                      const isSelected = format(date, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');
                      const isToday = format(date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
                      
                      return (
                        <motion.button
                          key={date.toISOString()}
                          variants={dateButtonVariants}
                          initial="idle"
                          whileHover="hover"
                          whileTap="tap"
                          animate={isSelected ? "selected" : "idle"}
                          onClick={() => {
                            setSelectedDate(date);
                            setSelectedSlot(null);
                          }}
                          className={`relative flex-shrink-0 flex flex-col items-center justify-center w-16 h-20 rounded-xl border-2 transition-colors ${
                            isSelected
                              ? 'border-primary bg-primary/10 text-primary'
                              : 'border-border bg-card hover:border-primary/50 hover:bg-primary/5'
                          }`}
                        >
                          <span className={`text-xs font-medium ${isSelected ? 'text-primary' : 'text-muted-foreground'}`}>
                            {format(date, 'EEE')}
                          </span>
                          <span className={`text-xl font-bold ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                            {format(date, 'd')}
                          </span>
                          <span className={`text-xs ${isSelected ? 'text-primary' : 'text-muted-foreground'}`}>
                            {format(date, 'MMM')}
                          </span>
                          {isToday && (
                            <span className="absolute -top-1.5 left-1/2 -translate-x-1/2 text-[9px] font-bold text-primary bg-primary/10 px-1.5 rounded">
                              Today
                            </span>
                          )}
                        </motion.button>
                      );
                    })}
                  </div>
                  
                  <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" />
                    <span>Your timezone: {studentTimezone}</span>
                  </div>
                </motion.section>
              )}
            </AnimatePresence>

            {/* Step 3: Time Slot Selection */}
            <AnimatePresence>
              {selectedDuration && (
                <motion.section
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3, delay: 0.1, ease: iosEasing }}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <div className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold transition-colors ${
                      currentStep >= 3 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                    }`}>
                      3
                    </div>
                    <Label className="text-sm font-semibold text-foreground">Select Time Slot</Label>
                    <span className="text-xs text-muted-foreground ml-auto">
                      {format(selectedDate, 'MMM d, yyyy')}
                    </span>
                  </div>

                  {loading ? (
                    <div className="grid grid-cols-2 gap-3">
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="h-20 rounded-xl bg-muted/50 animate-pulse" />
                      ))}
                    </div>
                  ) : slots.length === 0 ? (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="text-center py-10 rounded-xl border-2 border-dashed border-border bg-muted/20"
                    >
                      <Calendar className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
                      <p className="text-muted-foreground font-medium">No {selectedDuration}-min slots available</p>
                      <p className="text-xs text-muted-foreground/70 mt-1">
                        Try selecting a different date
                      </p>
                    </motion.div>
                  ) : (
                    <motion.div 
                      className="grid grid-cols-2 gap-3"
                      variants={containerVariants}
                      initial="hidden"
                      animate="visible"
                    >
                      <AnimatePresence mode="popLayout">
                        {slots.map((slot) => {
                          const { startTime, endTime } = formatSlotTime(slot);
                          const isSelected = selectedSlot === slot.id;
                          
                          return (
                            <motion.div
                              key={slot.id}
                              variants={itemVariants}
                              layout
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => handleSlotClick(slot.id)}
                              className={`relative cursor-pointer rounded-xl border-2 p-4 transition-all duration-200 ${
                                isSelected
                                  ? 'border-primary bg-primary/5 ring-2 ring-primary/20 shadow-lg shadow-primary/10'
                                  : 'border-border bg-card hover:border-primary/40 hover:bg-primary/5'
                              }`}
                            >
                              {isSelected && (
                                <motion.div
                                  layoutId="slot-selected-indicator"
                                  className="absolute top-2 right-2"
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                >
                                  <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                                    <Sparkles className="h-3 w-3 text-primary-foreground" />
                                  </div>
                                </motion.div>
                              )}
                              
                              <div className="flex items-center gap-2 mb-1.5">
                                <Clock className={`h-4 w-4 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                                <span className={`text-base font-semibold ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                                  {startTime}
                                </span>
                              </div>
                              
                              <div className="text-xs text-muted-foreground mb-2">
                                to {endTime}
                              </div>
                              
                              <div className="flex items-center justify-between">
                                <Badge variant="secondary" className="text-xs font-medium px-2 py-0.5">
                                  {slot.duration_minutes || 15} min
                                </Badge>
                                <span className={`text-sm font-bold ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                                  ₹{finalPrice}
                                </span>
                              </div>
                            </motion.div>
                          );
                        })}
                      </AnimatePresence>
                    </motion.div>
                  )}
                </motion.section>
              )}
            </AnimatePresence>

            {/* Step 4: Problem Description (shows when slot selected) */}
            <AnimatePresence>
              {selectedSlot && (
                <motion.section
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.25, ease: iosEasing }}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <div className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold transition-colors ${
                      currentStep >= 4 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                    }`}>
                      4
                    </div>
                    <Label className="text-sm font-semibold text-foreground">Describe Your Question</Label>
                  </div>
                  
                  <Textarea
                    placeholder="Example: I need help understanding organic chemistry reactions for NEET preparation..."
                    value={problemDescription}
                    onChange={(e) => setProblemDescription(e.target.value)}
                    className="min-h-[100px] resize-none border-border/50 focus:border-primary/50 bg-card"
                  />
                  <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1.5">
                    <MessageSquare className="h-3.5 w-3.5" />
                    Help your mentor prepare for the session
                  </p>
                </motion.section>
              )}
            </AnimatePresence>

            {/* Referral Code Section */}
            <AnimatePresence>
              {selectedDuration && (
                <motion.section
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.25, ease: iosEasing }}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <Tag className="h-4 w-4 text-primary" />
                    <Label className="text-sm font-semibold text-foreground">Referral Code</Label>
                    <span className="text-xs text-muted-foreground">(Optional)</span>
                  </div>

                  {referralApplied ? (
                    <div className="flex items-center justify-between rounded-xl border-2 border-primary/30 bg-primary/5 p-3">
                      <div className="flex items-center gap-2">
                        <Tag className="h-4 w-4 text-primary" />
                        <span className="text-sm font-semibold text-primary">
                          {referralCode} — ₹{REFERRAL_DISCOUNT} off applied!
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 rounded-full"
                        onClick={handleRemoveReferral}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <Input
                        placeholder="Enter referral code"
                        value={referralCode}
                        onChange={(e) => {
                          setReferralCode(e.target.value.toUpperCase());
                          setReferralError('');
                        }}
                        className="flex-1 bg-card"
                      />
                      <Button
                        variant="outline"
                        onClick={handleApplyReferral}
                        disabled={!referralCode.trim() || validatingReferral}
                        className="shrink-0"
                      >
                        {validatingReferral ? 'Checking...' : 'Apply'}
                      </Button>
                    </div>
                  )}

                  {referralError && (
                    <p className="text-xs text-destructive mt-1.5">{referralError}</p>
                  )}
                </motion.section>
              )}
            </AnimatePresence>

            {/* Reschedule Policy */}
            {mentorInfo?.reschedule_policy?.allow_reschedule && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.3 }}
                className="text-xs text-muted-foreground bg-muted/30 rounded-lg p-3"
              >
                <div className="flex items-start gap-2">
                  <span className="text-primary shrink-0">ℹ️</span>
                  <span>
                    Free rescheduling up to {mentorInfo.reschedule_policy.free_reschedule_hours}h before session.
                    {mentorInfo.reschedule_policy.last_minute_fee_percentage > 0 && (
                      <span className="text-muted-foreground/70">
                        {' '}Last-minute: {mentorInfo.reschedule_policy.last_minute_fee_percentage}% fee.
                      </span>
                    )}
                  </span>
                </div>
              </motion.div>
            )}
          </div>
        </main>

        {/* Fixed Footer - ALWAYS visible */}
        <motion.footer 
          className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-xl border-t border-border p-4 pb-safe"
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 300, damping: 30 }}
        >
          <div className="max-w-lg mx-auto space-y-3">
            {/* Price Summary (when slot selected) */}
            {selectedSlot && (
              <motion.div 
                className="space-y-1"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Session Price ({selectedDuration} min)</span>
                  <span className={`font-semibold ${referralApplied ? 'line-through text-muted-foreground' : 'text-lg font-bold text-foreground'}`}>
                    ₹{sessionPrice}
                  </span>
                </div>
                {referralApplied && (
                  <>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-primary flex items-center gap-1">
                        <Tag className="h-3 w-3" />
                        Referral Discount
                      </span>
                      <span className="text-primary font-semibold">-₹{REFERRAL_DISCOUNT}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm pt-1 border-t border-border/50">
                      <span className="text-foreground font-semibold">Final Price</span>
                      <span className="text-lg font-bold text-foreground">₹{finalPrice}</span>
                    </div>
                  </>
                )}
              </motion.div>
            )}

            <motion.div
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button 
                onClick={handleBookSlot}
                disabled={!canProceed || paymentLoading}
                className="w-full h-14 text-base font-semibold bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg shadow-primary/25 disabled:opacity-50 disabled:shadow-none transition-all"
                size="lg"
              >
                {paymentLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                    Processing...
                  </>
                ) : !selectedDuration ? (
                  'Select a duration to continue'
                ) : !selectedSlot ? (
                  'Select a time slot'
                ) : (
                  <>
                    <span className="mr-2">💳</span>
                    Pay ₹{finalPrice} & Confirm
                  </>
                )}
              </Button>
            </motion.div>
            
            <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Shield className="h-3.5 w-3.5" />
                <span>Secure payment</span>
              </div>
              <div className="h-3 w-px bg-border" />
              <div className="flex items-center gap-1.5">
                <Video className="h-3.5 w-3.5" />
                <span>Meet link after payment</span>
              </div>
            </div>
          </div>
        </motion.footer>
      </div>
    </>
  );
};

export default BookSession;
