import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { ArrowLeft, Star, Verified, Clock, TrendingUp, Calendar, User } from 'lucide-react';
import { getExamById, getIconComponent } from '@/data/exams';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format, addDays } from 'date-fns';

interface Mentor {
  id: string;
  user_id: string;
  bio: string;
  specialization: string;
  qualifications: string[];
  rating: number;
  fixed_rate_per_15m: number;
  status: string;
  mentor_types: string[] | null;
  exams: string[] | null;
  profiles: {
    full_name: string;
    email: string;
    avatar_url: string | null;
  } | null;
}

export default function ExamDetail() {
  const { examId, boardId } = useParams<{ examId: string; boardId?: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedMentorType, setSelectedMentorType] = useState<string | null>(null);
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [loading, setLoading] = useState(true);
  const [availableSlots, setAvailableSlots] = useState<Record<string, number>>({});
  const [showAvailableOnly, setShowAvailableOnly] = useState(false);

  const exam = examId ? getExamById(examId) : undefined;

  useEffect(() => {
    if (!exam) return;
    fetchMentors();
  }, [exam, selectedMentorType]);

  const fetchAvailability = async (mentorIds: string[]) => {
    if (mentorIds.length === 0) {
      setAvailableSlots({});
      return;
    }
    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      const tomorrow = format(addDays(new Date(), 1), 'yyyy-MM-dd');

      const { data, error } = await supabase
        .from('mentor_availability')
        .select('mentor_id')
        .eq('status', 'available')
        .gte('date', today)
        .lte('date', tomorrow)
        .in('mentor_id', mentorIds);

      if (error) throw error;

      const slotMap: Record<string, number> = {};
      (data || []).forEach((row) => {
        slotMap[row.mentor_id] = (slotMap[row.mentor_id] || 0) + 1;
      });
      setAvailableSlots(slotMap);
    } catch (error: any) {
      console.error('Error fetching availability:', error.message);
      setAvailableSlots({});
    }
  };

  const fetchMentors = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase.rpc('get_all_public_mentor_profiles');

      if (error) throw error;

      let filtered = (data || []).filter((mentor: any) => 
        mentor.exams?.includes(examId)
      );

      if (selectedMentorType) {
        filtered = filtered.filter((mentor: any) => 
          mentor.mentor_types?.includes(selectedMentorType)
        );
      }

      const mappedMentors = filtered.map((m: any) => ({
        id: m.mentor_id,
        user_id: m.id,
        bio: m.bio,
        specialization: m.specialization,
        qualifications: m.qualifications,
        rating: m.rating,
        fixed_rate_per_15m: m.fixed_rate_per_15m,
        status: m.mentor_status,
        mentor_types: m.mentor_types,
        exams: m.exams,
        profiles: {
          full_name: m.full_name,
          email: '',
          avatar_url: m.avatar_url,
        }
      }));

      setMentors(mappedMentors);
      
      // Fetch availability for all mentor IDs
      const mentorIds = mappedMentors.map((m: Mentor) => m.id);
      await fetchAvailability(mentorIds);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Apply availability filter and sort
  const displayMentors = (() => {
    let result = [...mentors];
    if (showAvailableOnly) {
      result = result.filter((m) => (availableSlots[m.id] || 0) > 0);
    }
    // Sort: mentors with available slots first
    result.sort((a, b) => (availableSlots[b.id] || 0) - (availableSlots[a.id] || 0));
    return result;
  })();

  if (!exam) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Exam not found</h2>
          <Button onClick={() => navigate('/exams')}>Back to Exams</Button>
        </div>
      </div>
    );
  }

  const IconComponent = getIconComponent(exam.icon);
  const availableCount = Object.keys(availableSlots).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <div className="sticky top-0 z-10 backdrop-blur-xl bg-background/80 border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center gap-3 mb-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                if (boardId && (examId === 'boards_10' || examId === 'boards_12')) {
                  navigate(`/exams/${examId}/board`);
                } else {
                  navigate('/exams');
                }
              }}
              className="rounded-xl"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${exam.color} flex items-center justify-center shadow-glow`}>
                <IconComponent className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold">
                  {exam.name} — One-to-One Mentors
                  {boardId && ` (${boardId.toUpperCase()})`}
                </h1>
                <p className="text-xs text-muted-foreground">{exam.description}</p>
              </div>
            </div>
          </div>

          {/* Marks Analyzer Button (for JEE & NEET) */}
          {(examId === 'jee' || examId === 'neet') && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(examId === 'jee' ? '/jee-analyzer' : '/neet-analyzer')}
              className="mb-3 w-full sm:w-auto bg-gradient-to-r from-primary/10 to-accent/10 border-primary/30 hover:border-primary/50"
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              View Marks vs {examId === 'jee' ? 'Percentile/Rank' : 'Rank'} Analysis
            </Button>
          )}

          {/* Mentor Type Chips + Available Today Filter */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <Button
              variant={selectedMentorType === null && !showAvailableOnly ? 'default' : 'outline'}
              size="sm"
              onClick={() => { setSelectedMentorType(null); setShowAvailableOnly(false); }}
              className="rounded-2xl shrink-0"
            >
              All Mentors
            </Button>
            <Button
              variant={showAvailableOnly ? 'default' : 'outline'}
              size="sm"
              onClick={() => setShowAvailableOnly(!showAvailableOnly)}
              className={`rounded-2xl shrink-0 ${showAvailableOnly ? 'bg-emerald-600 hover:bg-emerald-700 border-emerald-600' : 'border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-700 dark:text-emerald-400 dark:hover:bg-emerald-950'}`}
            >
              <Calendar className="h-4 w-4 mr-1" />
              Available Now {availableCount > 0 && `(${availableCount})`}
            </Button>
            {exam.mentorTypes.map((type) => (
              <Button
                key={type.id}
                variant={selectedMentorType === type.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => { setSelectedMentorType(type.id); setShowAvailableOnly(false); }}
                className="rounded-2xl shrink-0"
              >
                {type.label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Mentor List */}
      <div className="max-w-7xl mx-auto p-4 pb-24">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="glass animate-pulse">
                <CardHeader>
                  <div className="flex items-start gap-3">
                    <div className="w-16 h-16 rounded-2xl bg-muted" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-muted rounded w-3/4" />
                      <div className="h-3 bg-muted rounded w-1/2" />
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        ) : displayMentors.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">
              {showAvailableOnly
                ? 'No mentors with available slots right now. Check back later!'
                : 'No mentors found for this category yet.'}
            </p>
            <Button onClick={() => { setSelectedMentorType(null); setShowAvailableOnly(false); }}>
              View All Mentors
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayMentors.map((mentor) => {
              const slotCount = availableSlots[mentor.id] || 0;
              return (
                <Card
                  key={mentor.id}
                  className="glass cursor-pointer transition-all hover:shadow-lg hover:-translate-y-1 active:scale-95 relative"
                  onClick={() => navigate(`/mentor/${mentor.id}`)}
                >
                  {/* Available slots badge */}
                  {slotCount > 0 && (
                    <div className="absolute top-3 right-3 z-[1]">
                      <Badge variant="success" className="text-xs font-medium">
                        <Calendar className="h-3 w-3 mr-1" />
                        {slotCount} slot{slotCount > 1 ? 's' : ''} available
                      </Badge>
                    </div>
                  )}

                  <CardHeader className="pb-3">
                    <div className="flex items-start gap-3 mb-3">
                      <Avatar className="w-16 h-16 rounded-2xl">
                        <AvatarImage 
                          src={mentor.profiles?.avatar_url || undefined} 
                          alt={mentor.profiles?.full_name || 'Mentor'} 
                          className="object-cover"
                        />
                        <AvatarFallback className="rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 text-2xl font-bold text-primary">
                          {mentor.profiles?.full_name?.[0] || 'M'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1 mb-1">
                          <CardTitle className="text-base truncate">
                            {mentor.profiles?.full_name || 'Mentor'}
                          </CardTitle>
                          <Verified className="h-4 w-4 text-primary shrink-0" />
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {mentor.specialization || 'Expert Mentor'}
                        </p>
                        <div className="flex items-center gap-1 mt-1">
                          <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                          <span className="text-xs font-medium">
                            {mentor.rating?.toFixed(1) || '5.0'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {mentor.mentor_types && mentor.mentor_types.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {[...new Set(mentor.mentor_types)].slice(0, 2).map((type, index) => (
                          <Badge key={`${type}-${index}`} variant="secondary" className="text-xs">
                            {type}
                          </Badge>
                        ))}
                      </div>
                    )}

                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                      {mentor.bio || 'Experienced mentor ready to guide you'}
                    </p>

                  </CardHeader>

                  <CardContent className="pt-0">
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 rounded-xl"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/mentor/${mentor.id}`);
                        }}
                      >
                        <User className="h-4 w-4 mr-1" />
                        View Profile
                      </Button>
                      <Button
                        size="sm"
                        className="flex-1 rounded-xl"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/mentor/${mentor.id}/book`);
                        }}
                      >
                        Book Now
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
