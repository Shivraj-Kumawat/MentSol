import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { ChevronLeft, Star, Calendar, User, Shield, Clock, Award } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ReviewCard } from "@/components/ReviewCard";
import { VerifiedBadge } from "@/components/VerifiedBadge";

/* ===================== SAFE ARRAY HELPERS ===================== */
const safeArray = <T,>(arr?: T[]): T[] => (Array.isArray(arr) ? arr : []);
const safeLength = <T,>(arr?: T[]): number => safeArray(arr).length;
const safeMap = <T, U>(arr: T[] | undefined, cb: (v: T, i: number) => U): U[] => safeArray(arr).map(cb);
/* ============================================================= */

interface MentorData {
  id: string;
  nickname: string | null;
  bio: string | null;
  specialization: string | null;
  rating: number | null;
  total_sessions: number | null;
  fixed_rate_per_15m: number | null;
  fixed_rate_per_30m: number | null;
  fixed_rate_per_45m: number | null;
  status?: string | null;
  mentor_types?: string[] | null;
  qualifications?: string[] | null;
  exams?: string[] | null;
  piece_of_proof_url?: string | null;
  profiles: {
    avatar_url: string | null;
    full_name: string | null;
  } | null;
}

interface Review {
  id: string;
  rating: number;
  review_text: string | null;
  created_at: string;
  profiles: {
    full_name: string | null;
    avatar_url: string | null;
  } | null;
}

const MentorProfile = () => {
  /* ===================== ALL HOOKS AT TOP LEVEL ===================== */
  const { mentorId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isMountedRef = useRef(true);

  const [mentor, setMentor] = useState<MentorData | null>(null);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [proofLightboxOpen, setProofLightboxOpen] = useState(false);
  /* ================================================================ */

  /* ===================== MOUNT / UNMOUNT SAFETY ===================== */
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);
  /* ================================================================ */

  useEffect(() => {
    if (mentorId) {
      fetchMentorData();
      fetchReviews();
    }
  }, [mentorId]);

  // Handle hash-based booking redirect
  useEffect(() => {
    const hash = window.location.hash;
    if (hash === "#slots" || hash === "#book") {
      window.history.replaceState(null, "", window.location.pathname);
      navigate(`/mentor/${mentorId}/book`);
    }
  }, [mentorId, navigate]);

  const fetchMentorData = async () => {
    if (!isMountedRef.current) return;

    try {
      setLoading(true);

      const { data, error } = await supabase.rpc("get_public_mentor_by_id", { mentor_uuid: mentorId });

      if (!isMountedRef.current) return;

      if (error || !data || safeLength(data) === 0) {
        setMentor(null);
        return;
      }

      const m = data[0];

      setMentor({
        id: m.mentor_id,
        nickname: m.nickname,
        bio: m.bio,
        specialization: m.specialization,
        rating: m.rating,
        total_sessions: m.total_sessions,
        fixed_rate_per_15m: m.fixed_rate_per_15m,
        fixed_rate_per_30m: m.fixed_rate_per_30m ?? 0,
        fixed_rate_per_45m: m.fixed_rate_per_45m ?? 0,
        status: m.mentor_status,
        mentor_types: m.mentor_types,
        qualifications: m.qualifications,
        exams: m.exams,
        piece_of_proof_url: m.piece_of_proof_url ?? null,
        profiles: { 
          avatar_url: m.avatar_url,
          full_name: m.full_name || m.nickname || 'Mentor'
        },
      });
    } catch {
      if (isMountedRef.current) {
        toast({
          title: "Error",
          description: "Failed to load mentor profile",
          variant: "destructive",
        });
      }
    } finally {
      if (isMountedRef.current) setLoading(false);
    }
  };

  const fetchReviews = async () => {
    if (!isMountedRef.current) return;

    try {
      const { data } = await supabase
        .from("reviews")
        .select("id, rating, review_text, created_at, student_id")
        .eq("mentor_id", mentorId)
        .order("created_at", { ascending: false });

      if (!isMountedRef.current) return;

      if (!data) {
        setReviews([]);
        return;
      }

      const studentIds = [...new Set(safeMap(data, (r) => r.student_id))];
      
      if (studentIds.length === 0) {
        setReviews(safeMap(data, (r) => ({ ...r, profiles: null })));
        return;
      }

      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url")
        .in("id", studentIds);

      if (!isMountedRef.current) return;

      const profileMap = new Map(safeMap(profiles, (p) => [p.id, p]));

      const enriched = safeMap(data, (r) => ({
        ...r,
        profiles: profileMap.get(r.student_id) ?? null,
      }));

      setReviews(enriched);
    } catch {
      if (isMountedRef.current) setReviews([]);
    }
  };

  const handleBookSession = () => {
    navigate(`/mentor/${mentorId}/book`);
  };

  const handleBack = () => {
    navigate("/home", { replace: true });
  };

  /* ===================== RENDER HELPERS ===================== */
  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(<Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />);
      } else if (i === fullStars && hasHalfStar) {
        stars.push(<Star key={i} className="h-4 w-4 fill-yellow-400/50 text-yellow-400" />);
      } else {
        stars.push(<Star key={i} className="h-4 w-4 text-muted-foreground/30" />);
      }
    }
    return stars;
  };

  /* ===================== LOADING STATE ===================== */
  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="sticky top-0 bg-background/95 backdrop-blur-sm z-10 border-b">
          <div className="flex items-center gap-3 p-4">
            <Skeleton className="h-10 w-10 rounded-full" />
            <Skeleton className="h-6 w-32" />
          </div>
        </div>
        <div className="p-4 space-y-4">
          <div className="flex items-center gap-4">
            <Skeleton className="h-20 w-20 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  /* ===================== NOT FOUND STATE ===================== */
  if (!mentor) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
        <User className="h-16 w-16 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">Mentor Not Found</h2>
        <p className="text-muted-foreground text-center mb-6">
          This mentor profile doesn't exist or has been removed.
        </p>
        <Button onClick={handleBack}>Go Back Home</Button>
      </div>
    );
  }

  /* ===================== MAIN RENDER ===================== */
  const displayName = mentor.profiles?.full_name || mentor.nickname || "Mentor";
  const avatarUrl = mentor.profiles?.avatar_url;
  const rating = mentor.rating ?? 0;
  const totalSessions = mentor.total_sessions ?? 0;
  const price30m = mentor.fixed_rate_per_30m ?? 0;
  const price45m = mentor.fixed_rate_per_45m ?? 0;
  const isApproved = mentor.status === "approved";

  return (
    <div className="min-h-screen bg-background pb-28">
      {/* STICKY HEADER */}
      <div className="sticky top-0 bg-background/95 backdrop-blur-sm z-10 border-b">
        <div className="flex items-center gap-3 p-4">
          <Button variant="ghost" size="icon" onClick={handleBack}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold">Mentor Profile</h1>
        </div>
      </div>

      {/* HERO SECTION */}
      <div className="p-4">
        <Card className="p-6">
          <div className="flex items-start gap-4">
            <Avatar className="h-20 w-20 border-2 border-primary/20">
              <AvatarImage src={avatarUrl || undefined} alt={displayName} />
              <AvatarFallback className="text-xl font-semibold bg-primary/10 text-primary">
                {displayName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-bold truncate">{displayName}</h2>
                {isApproved && <VerifiedBadge />}
              </div>
              
              {mentor.specialization && (
                <p className="text-muted-foreground mt-1">{mentor.specialization}</p>
              )}
              
              {/* Rating Row */}
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <div className="flex items-center gap-1">
                  {renderStars(rating)}
                  <span className="text-sm font-medium ml-1">{rating.toFixed(1)}</span>
                </div>
                <span className="text-muted-foreground">•</span>
                <span className="text-sm text-muted-foreground">{totalSessions} sessions</span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* STATS GRID */}
      <div className="px-4 mb-4">
        <div className="grid grid-cols-2 gap-3">
          <Card className="p-4 text-center">
            <Calendar className="h-5 w-5 mx-auto text-primary mb-1" />
            <p className="text-2xl font-bold">{totalSessions}</p>
            <p className="text-xs text-muted-foreground">Sessions</p>
          </Card>
          <Card className="p-4 text-center">
            <Star className="h-5 w-5 mx-auto text-yellow-500 mb-1" />
            <p className="text-2xl font-bold">{rating.toFixed(1)}</p>
            <p className="text-xs text-muted-foreground">Rating</p>
          </Card>
        </div>
      </div>

      {/* SESSION PRICING */}
      <div className="px-4 mb-4">
        <h3 className="font-semibold mb-3 flex items-center gap-2 px-1">
          <Clock className="h-4 w-4" />
          Session Pricing
        </h3>
        {price30m === 0 && price45m === 0 ? (
          <Card className="p-4 text-center">
            <p className="text-muted-foreground">Pricing not set yet</p>
          </Card>
        ) : (
          <div className={`grid ${price30m > 0 && price45m > 0 ? 'grid-cols-2' : 'grid-cols-1'} gap-3`}>
            {price30m > 0 && (
              <Card className="p-5 text-center border-2 border-border hover:border-primary/40 transition-colors">
                <Badge variant="secondary" className="mb-3">30 Minutes</Badge>
                <p className="text-3xl font-bold text-primary mb-1">₹{price30m}</p>
                <p className="text-xs text-muted-foreground">Standard session</p>
              </Card>
            )}
            {price45m > 0 && (
              <Card className="p-5 text-center border-2 border-primary/30 bg-primary/5 hover:border-primary/50 transition-colors">
                <Badge className="mb-3 bg-primary/10 text-primary border-primary/20">45 Minutes</Badge>
                <p className="text-3xl font-bold text-primary mb-1">₹{price45m}</p>
                <p className="text-xs text-muted-foreground">Extended session</p>
              </Card>
            )}
          </div>
        )}
      </div>

      {/* BIO SECTION */}
      <div className="px-4 mb-4">
        <Card className="p-4">
          <h3 className="font-semibold mb-2 flex items-center gap-2">
            <User className="h-4 w-4" />
            About
          </h3>
          <p className="text-muted-foreground leading-relaxed">
            {mentor.bio || "This mentor hasn't added a bio yet."}
          </p>
        </Card>
      </div>

      {/* SPECIALIZATIONS / MENTOR TYPES */}
      {safeLength(mentor.mentor_types) > 0 && (
        <div className="px-4 mb-4">
          <Card className="p-4">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Award className="h-4 w-4" />
              Expertise
            </h3>
            <div className="flex flex-wrap gap-2">
              {[...new Set(safeArray(mentor.mentor_types))].map((type, index) => (
                <Badge key={`type-${index}`} variant="secondary">
                  {type}
                </Badge>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* QUALIFICATIONS */}
      {safeLength(mentor.qualifications) > 0 && (
        <div className="px-4 mb-4">
          <Card className="p-4">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Qualifications
            </h3>
            <div className="flex flex-wrap gap-2">
              {[...new Set(safeArray(mentor.qualifications))].map((qual, index) => (
                <Badge key={`qual-${index}`} variant="outline">
                  {qual}
                </Badge>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* VERIFIED PROOF SECTION */}
      {mentor.piece_of_proof_url && (
        <div className="px-4 mb-4">
          <Card className="p-4">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Shield className="h-4 w-4 text-green-600" />
              Verified Proof
            </h3>
            <div
              className="border rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => setProofLightboxOpen(true)}
            >
              <img
                src={mentor.piece_of_proof_url}
                alt="Verification proof"
                className="w-full max-h-48 object-contain bg-muted"
              />
            </div>
            <p className="text-xs text-muted-foreground mt-2">Tap to view full size</p>
          </Card>

          <Dialog open={proofLightboxOpen} onOpenChange={setProofLightboxOpen}>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>Verified Proof</DialogTitle>
              </DialogHeader>
              <div className="flex justify-center">
                <img
                  src={mentor.piece_of_proof_url}
                  alt="Verification proof full size"
                  className="max-w-full max-h-[70vh] object-contain rounded-lg"
                />
              </div>
            </DialogContent>
          </Dialog>
        </div>
      )}

      {/* REVIEWS SECTION */}
      <div className="px-4 mb-4">
        <Card className="p-4">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Star className="h-4 w-4" />
            Reviews ({safeLength(reviews)})
          </h3>
          
          {safeLength(reviews) === 0 ? (
            <p className="text-muted-foreground text-center py-4">No reviews yet.</p>
          ) : (
            <div className="space-y-3">
              {safeMap(reviews, (review, index) => (
                <ReviewCard
                  key={review.id || `review-${index}`}
                  studentName={review.profiles?.full_name ?? "Anonymous"}
                  studentAvatar={review.profiles?.avatar_url ?? null}
                  rating={review.rating ?? 0}
                  reviewText={review.review_text ?? null}
                  createdAt={review.created_at ?? ""}
                  verified
                  tags={[]}
                />
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* FIXED BOTTOM BOOKING BUTTON */}
      <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t p-4 z-20">
        <Button 
          onClick={handleBookSession} 
          className="w-full h-14 text-lg font-semibold"
          size="lg"
          disabled={!isApproved}
        >
          <Calendar className="h-5 w-5 mr-2" />
          {isApproved ? (
            <>Book Session with {displayName.split(' ')[0]}</>
          ) : (
            <>Mentor Not Available</>
          )}
        </Button>
        {isApproved && (
          <p className="text-center text-sm text-muted-foreground mt-2">
            {totalSessions} completed sessions
          </p>
        )}
      </div>
    </div>
  );
};

export default MentorProfile;
