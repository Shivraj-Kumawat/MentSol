import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { GraduationCap, Users, ArrowLeft, Sparkles, Building2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useDevicePerformance } from "@/hooks/useDevicePerformance";
import { motionConfig, staggerContainer, staggerItem, gentleSpring } from "@/lib/motion";
import { FloatingOrbs } from "@/components/FloatingOrbs";
import { cn } from "@/lib/utils";

const RoleSelection = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<"student" | "mentor" | null>(null);
  const { prefersReducedMotion, isMobile } = useDevicePerformance();

  const handleRoleSelect = async (role: "student" | "mentor") => {
    setSelectedRole(role);
    
    // If user is not logged in, redirect to auth with pre-selected role
    if (!user) {
      navigate(`/auth?role=${role}`);
      return;
    }
    setLoading(true);
    try {
      // Check if user already has this role
      const { data: existingRole } = await supabase
        .from('user_roles')
        .select('id')
        .eq('user_id', user.id)
        .eq('role', role)
        .maybeSingle();
      
      // Only insert if role doesn't exist
      if (!existingRole) {
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert({
            user_id: user.id,
            role
          });
        // DEFENSIVE: Graceful RLS error handling - don't crash, show toast
        if (roleError) {
          console.error('[RoleSelection] Role insert error:', roleError);
          toast({
            title: 'Error',
            description: 'Could not save your role. Please try again.',
            variant: 'destructive'
          });
          setLoading(false);
          setSelectedRole(null);
          return;
        }
      }

      // If mentor role selected, create mentor record if it doesn't exist
      if (role === 'mentor') {
        const {
          data: existingMentor
        } = await supabase.from('mentors').select('id, status').eq('user_id', user.id).maybeSingle();
        if (!existingMentor) {
          const {
            error: mentorError
          } = await supabase.from('mentors').insert({
            user_id: user.id,
            status: 'pending_request',
            bio: null,
            mentor_types: [],
            fixed_rate_per_15m: 0
          });
          if (mentorError) throw mentorError;
        }
        toast({
          title: 'Success!',
          description: existingMentor ? `Welcome back! Your mentor profile is ${existingMentor.status === 'approved' ? 'active' : 'under review'}.` : 'Your mentor application has been submitted for review.'
        });
        navigate('/mentor/dashboard');
      } else {
        toast({
          title: 'Success!',
          description: `You're now registered as a student.`
        });
        navigate('/home');
      }
    } catch (error: any) {
      console.error('Role selection error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update role',
        variant: 'destructive'
      });
      setSelectedRole(null);
    } finally {
      setLoading(false);
    }
  };

  // Motion wrapper - respects reduced motion
  const MotionWrapper = prefersReducedMotion ? 'div' : motion.div;
  const CardWrapper = prefersReducedMotion ? 'div' : motion.div;

  const roles = [
    {
      id: "student" as const,
      title: "I'm a Student",
      description: "Find verified mentors and get one-to-one guidance for your goals",
      icon: GraduationCap,
      gradient: "from-primary to-accent",
      iconBg: "bg-gradient-to-br from-primary to-accent",
    },
    {
      id: "mentor" as const,
      title: "I'm a Mentor",
      description: "Share your expertise and guide students to achieve their dreams",
      icon: Users,
      gradient: "from-secondary to-navy-light",
      iconBg: "bg-gradient-to-br from-secondary to-secondary/70",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/3 to-background flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Premium floating orbs background */}
      <FloatingOrbs variant="minimal" />
      
      {/* Subtle animated gradient noise (very low opacity) */}
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Top Corner Buttons */}
      <div className="absolute top-6 left-6 flex items-center gap-2 z-10">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => navigate("/", { replace: true })} 
          className="rounded-full hover:bg-primary/10 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
      </div>
      
      <div className="absolute top-6 right-6 z-10">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => navigate('/auth?portal=promoter')} 
          className="text-xs text-muted-foreground hover:text-foreground hover:bg-primary/10"
        >
          📈 Partner
        </Button>
      </div>

      <MotionWrapper 
        className="max-w-lg w-full space-y-8 relative z-10"
        {...(!prefersReducedMotion && {
          initial: motionConfig.fadeInUp.initial,
          animate: motionConfig.fadeInUp.animate,
          transition: motionConfig.fadeInUpTransition,
        })}
      >
        {/* Header with premium styling */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-2">
            <Sparkles className="w-4 h-4" />
            Welcome to MentSol
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground">
            Choose Your Role
          </h1>
          <p className="text-muted-foreground text-base">
            Select how you want to use the platform
          </p>
        </div>

        <MotionWrapper 
          className="space-y-4"
          {...(!prefersReducedMotion && {
            variants: staggerContainer,
            initial: "hidden",
            animate: "visible",
          })}
        >
          {roles.map((role, index) => (
            <CardWrapper
              key={role.id}
              {...(!prefersReducedMotion && {
                variants: staggerItem,
                whileHover: !isMobile ? { y: -6, scale: 1.02 } : undefined,
                whileTap: { scale: 0.98 },
                transition: gentleSpring,
              })}
            >
              <Card 
                onClick={() => !loading && handleRoleSelect(role.id)} 
                className={cn(
                  "p-6 cursor-pointer transition-all duration-200 border-2 rounded-2xl",
                  "hover:shadow-premium ripple-effect",
                  selectedRole === role.id 
                    ? "border-primary bg-primary/5 shadow-glow" 
                    : "border-border/50 hover:border-primary/50",
                  loading && selectedRole !== role.id && "opacity-50 pointer-events-none"
                )}
              >
                <div className="flex items-start gap-5">
                  {/* Premium icon container with 3D effect */}
                  <div 
                    className={cn(
                      "w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0",
                      "shadow-lg transform-gpu transition-transform duration-200",
                      role.iconBg,
                      selectedRole === role.id && "scale-110"
                    )}
                    style={{
                      boxShadow: selectedRole === role.id 
                        ? '0 8px 24px hsl(176 100% 40% / 0.3)' 
                        : '0 4px 12px hsla(0 0% 0% / 0.1)'
                    }}
                  >
                    <role.icon className="w-8 h-8 text-primary-foreground" />
                  </div>
                  
                  <div className="flex-1 pt-1">
                    <h3 className="text-xl font-semibold mb-2 text-foreground flex items-center gap-2">
                      {role.title}
                      {selectedRole === role.id && loading && (
                        <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      )}
                    </h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {role.description}
                    </p>
                  </div>
                </div>
                
                {/* Selection indicator glow */}
                {selectedRole === role.id && (
                  <div 
                    className="absolute inset-0 rounded-2xl pointer-events-none"
                    style={{
                      boxShadow: 'inset 0 0 20px hsl(176 100% 40% / 0.1)'
                    }}
                  />
                )}
              </Card>
            </CardWrapper>
          ))}
        </MotionWrapper>

        {/* Coaching Institute Card */}
        <CardWrapper
          {...(!prefersReducedMotion && {
            variants: staggerItem,
            whileHover: !isMobile ? { y: -4, scale: 1.01 } : undefined,
            whileTap: { scale: 0.98 },
            transition: gentleSpring,
          })}
        >
          <Card 
            onClick={() => navigate("/coaching")}
            className="p-5 cursor-pointer transition-all duration-200 border-2 rounded-2xl border-border/50 hover:border-primary/50 hover:shadow-premium ripple-effect"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center flex-shrink-0 shadow-lg">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-foreground">Join as a Coaching Institute</h3>
                <p className="text-muted-foreground text-xs">Partner with us to transform your coaching into a premium platform</p>
              </div>
            </div>
          </Card>
        </CardWrapper>

        {/* Footer text */}
        <p className="text-center text-xs text-muted-foreground">
          You can always switch roles later from your profile
        </p>
      </MotionWrapper>
    </div>
  );
};

export default RoleSelection;