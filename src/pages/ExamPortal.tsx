import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search, ArrowLeft, Users, Lock, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { exams, getIconComponent } from '@/data/exams';
import { supabase } from '@/integrations/supabase/client';
import { motion } from 'framer-motion';
import { Premium3DCard } from '@/components/motion/Premium3DCard';
import { premiumStagger, premiumStaggerItem, iosEasing } from '@/lib/motion';
import { useDevicePerformance } from '@/hooks/useDevicePerformance';

// Active exam IDs - only these are clickable
const ACTIVE_EXAMS = ['jee', 'neet'];

export default function ExamPortal() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [mentorCounts, setMentorCounts] = useState<Record<string, number>>({});
  const [loadingCounts, setLoadingCounts] = useState(true);
  const { prefersReducedMotion } = useDevicePerformance();

  const filteredExams = exams.filter(exam =>
    exam.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    exam.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    fetchMentorCounts();
  }, []);

  const fetchMentorCounts = async () => {
    try {
      setLoadingCounts(true);
      const counts: Record<string, number> = {};

      // Fetch counts for each exam
      for (const exam of exams) {
        const { count, error } = await supabase
          .from('mentors')
          .select('*', { count: 'exact', head: true })
          .in('status', ['approved', 'active'])
          .contains('exams', [exam.id]);

        if (!error) {
          counts[exam.id] = count || 0;
        }
      }

      setMentorCounts(counts);
    } catch (error) {
      console.error('Error fetching mentor counts:', error);
    } finally {
      setLoadingCounts(false);
    }
  };

  const isExamActive = (examId: string) => ACTIVE_EXAMS.includes(examId);

  const handleExamClick = (exam: typeof exams[0]) => {
    if (!isExamActive(exam.id)) return; // Do nothing for inactive exams
    
    // For board exams, go to board selection first
    if (exam.id === 'boards_10' || exam.id === 'boards_12') {
      navigate(`/exams/${exam.id}/board`);
    } else {
      navigate(`/exams/${exam.id}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 overflow-hidden">
      {/* Animated background elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <motion.div
          className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-primary/5 blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-secondary/5 blur-3xl"
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>

      {/* Header */}
      <motion.div 
        className="sticky top-0 z-10 backdrop-blur-xl bg-background/80 border-b border-border/50 px-4 py-3"
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: iosEasing }}
      >
        <div className="max-w-7xl mx-auto flex items-center gap-3">
          <motion.div whileTap={{ scale: 0.95 }}>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/home')}
              className="rounded-xl"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </motion.div>
          <div>
            <h1 className="text-xl font-bold">Exam Portal</h1>
            <p className="text-xs text-muted-foreground">Choose your exam category</p>
          </div>
        </div>
      </motion.div>

      <div className="max-w-7xl mx-auto p-4 pb-24 relative z-[1]">
        {/* Search Bar */}
        <motion.div 
          className="relative mb-6"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.1, ease: iosEasing }}
        >
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search exams..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-12 rounded-2xl bg-card/50 backdrop-blur border-border/50 transition-all duration-300 focus:bg-card focus:shadow-lg focus:shadow-primary/5"
          />
        </motion.div>

        {/* Exam Grid */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          variants={prefersReducedMotion ? undefined : premiumStagger}
          initial="hidden"
          animate="visible"
        >
          {filteredExams.map((exam, index) => {
            const IconComponent = getIconComponent(exam.icon);
            const isActive = isExamActive(exam.id);
            
            return (
              <motion.div
                key={exam.id}
                variants={prefersReducedMotion ? undefined : premiumStaggerItem}
                className="relative"
              >
                <Premium3DCard
                  disabled={!isActive}
                  className="h-full"
                  glowColor={isActive ? `hsl(var(--primary))` : 'transparent'}
                  onClick={() => handleExamClick(exam)}
                >
                  <Card
                    className={`glass h-full transition-all duration-300 group ${
                      isActive 
                        ? 'cursor-pointer hover:shadow-xl hover:shadow-primary/10 hover:border-primary/30' 
                        : 'cursor-not-allowed opacity-70'
                    }`}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between mb-3">
                        <motion.div 
                          className={`w-12 h-12 rounded-xl bg-gradient-to-br ${exam.color} flex items-center justify-center shadow-lg ${
                            isActive ? 'shadow-primary/20' : 'grayscale'
                          }`}
                          whileHover={isActive ? { rotate: [0, -5, 5, 0], scale: 1.05 } : undefined}
                          transition={{ duration: 0.4 }}
                        >
                          <IconComponent className="h-6 w-6 text-white" />
                        </motion.div>
                        
                        <div className="flex items-center gap-2">
                          {!loadingCounts && mentorCounts[exam.id] !== undefined && isActive && (
                            <Badge variant={mentorCounts[exam.id] > 0 ? "default" : "secondary"} className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              <span>{mentorCounts[exam.id]}</span>
                            </Badge>
                          )}
                          
                          {/* Launching Soon Badge for inactive exams */}
                          {!isActive && (
                            <motion.div
                              initial={{ scale: 0.9 }}
                              animate={{ scale: [0.9, 1, 0.9] }}
                              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                            >
                              <Badge 
                                variant="secondary" 
                                className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30 flex items-center gap-1"
                              >
                                <Sparkles className="h-3 w-3" />
                                Launching Soon
                              </Badge>
                            </motion.div>
                          )}
                        </div>
                      </div>
                      
                      <CardTitle className={`text-lg ${!isActive ? 'text-muted-foreground' : ''}`}>
                        {exam.name}
                      </CardTitle>
                      <CardDescription className="line-clamp-2">
                        {exam.description}
                      </CardDescription>
                    </CardHeader>
                    
                    <CardContent>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          {exam.mentorTypes.length} mentor types
                        </span>
                        {isActive ? (
                          <span className="text-primary font-medium group-hover:translate-x-1 transition-transform duration-300">
                            View Mentors →
                          </span>
                        ) : (
                          <span className="text-muted-foreground flex items-center gap-1">
                            <Lock className="h-3 w-3" />
                            Coming Soon
                          </span>
                        )}
                      </div>
                    </CardContent>
                    
                    {/* Inactive overlay */}
                    {!isActive && (
                      <div className="absolute inset-0 bg-background/30 backdrop-blur-[1px] rounded-[inherit] pointer-events-none" />
                    )}
                  </Card>
                </Premium3DCard>
              </motion.div>
            );
          })}
        </motion.div>

        {filteredExams.length === 0 && (
          <motion.div 
            className="text-center py-12"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <p className="text-muted-foreground">No exams found matching "{searchQuery}"</p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
