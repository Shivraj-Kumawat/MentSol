import { Sparkles, ChevronRight, Bot, MessageCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useDevicePerformance } from '@/hooks/useDevicePerformance';
import { motionConfig, iosEasing } from '@/lib/motion';

interface AIMentorCardProps {
  onOpenChat: () => void;
}

const suggestedQuestions = [
  "Which stream should I choose after 10th?",
  "How do I prepare for JEE in 6 months?",
  "Help me choose between IIT and BITS",
  "I'm feeling stressed about exams",
];

export const AIMentorCard = ({ onOpenChat }: AIMentorCardProps) => {
  const { prefersReducedMotion, isMobile } = useDevicePerformance();

  const cardVariants = prefersReducedMotion
    ? {}
    : {
        initial: { opacity: 0, y: 12 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.4, ease: iosEasing },
      };

  return (
    <motion.div {...cardVariants}>
      <Card 
        className="relative overflow-hidden border-0 bg-gradient-to-br from-primary/10 via-accent/5 to-purple-500/10 p-4 cursor-pointer group"
        onClick={onOpenChat}
        style={{
          WebkitTapHighlightColor: 'transparent',
        }}
      >
        {/* Subtle animated gradient background */}
        {!prefersReducedMotion && (
          <div className="absolute inset-0 opacity-30 bg-gradient-to-r from-primary/20 via-transparent to-accent/20 animate-gradient" />
        )}
        
        <div className="relative z-10">
          {/* Header */}
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary to-accent shadow-glow">
              <Bot className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-foreground">AI Mentor Assistant</h3>
                <Sparkles className="h-4 w-4 text-primary animate-twinkle" />
              </div>
              <p className="text-xs text-muted-foreground">Get instant guidance 24/7</p>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
          </div>

          {/* Sample Questions */}
          <div className="flex flex-wrap gap-2">
            {suggestedQuestions.slice(0, isMobile ? 2 : 3).map((question, index) => (
              <span
                key={index}
                className="px-2.5 py-1 text-xs rounded-full bg-background/60 text-muted-foreground border border-border/50 truncate max-w-[140px]"
              >
                {question}
              </span>
            ))}
          </div>

          {/* CTA */}
          <Button
            variant="ghost"
            size="sm"
            className="mt-3 w-full justify-center gap-2 text-primary hover:bg-primary/10"
            onClick={(e) => {
              e.stopPropagation();
              onOpenChat();
            }}
          >
            <MessageCircle className="h-4 w-4" />
            Start Conversation
          </Button>
        </div>
      </Card>
    </motion.div>
  );
};
