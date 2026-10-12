import { useState, useEffect } from 'react';
import { cn } from "@/lib/utils";
import { safeArrayAccess, safeLength } from '@/utils/safeAccess';

interface TypewriterTextProps {
  texts: string[];
  typingSpeed?: number;
  deletingSpeed?: number;
  pauseDuration?: number;
  className?: string;
  cursorClassName?: string;
}

export const TypewriterText = ({
  texts,
  typingSpeed = 80,
  deletingSpeed = 40,
  pauseDuration = 2000,
  className,
  cursorClassName,
}: TypewriterTextProps) => {
  const [displayText, setDisplayText] = useState('');
  const [textIndex, setTextIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  // DEFENSIVE: Ensure we always have valid texts array - prevents .length on undefined crash
  const safeTexts = Array.isArray(texts) && texts.length > 0 
    ? texts 
    : ['Loading...'];

  useEffect(() => {
    // DEFENSIVE: Safe array access with fallback
    const currentText = safeArrayAccess(safeTexts, textIndex, safeTexts[0] || '');
    const currentTextLength = safeLength(currentText);
    
    if (isPaused) {
      const pauseTimeout = setTimeout(() => {
        setIsPaused(false);
        setIsDeleting(true);
      }, pauseDuration);
      return () => clearTimeout(pauseTimeout);
    }

    const timeout = setTimeout(() => {
      if (!isDeleting) {
        if (displayText.length < currentTextLength) {
          setDisplayText(currentText.slice(0, displayText.length + 1));
        } else {
          setIsPaused(true);
        }
      } else {
        if (displayText.length > 0) {
          setDisplayText(displayText.slice(0, -1));
        } else {
          setIsDeleting(false);
          setTextIndex((prev) => (prev + 1) % safeTexts.length);
        }
      }
    }, isDeleting ? deletingSpeed : typingSpeed);

    return () => clearTimeout(timeout);
  }, [displayText, isDeleting, isPaused, textIndex, safeTexts, typingSpeed, deletingSpeed, pauseDuration]);

  return (
    <span className={cn("inline-flex items-center", className)}>
      <span>{displayText}</span>
      <span 
        className={cn(
          "ml-0.5 inline-block w-0.5 h-[1em] bg-primary animate-pulse",
          cursorClassName
        )} 
      />
    </span>
  );
};
