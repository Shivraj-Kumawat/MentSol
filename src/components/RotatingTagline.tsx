import { useState, useEffect } from 'react';
import { Sparkles } from 'lucide-react';
import { safeArrayAccess, safeLength } from '@/utils/safeAccess';

/**
 * RotatingTagline Component
 * 
 * DEFENSIVE CODING: This component includes safeguards against .length access on undefined
 * which was causing crashes in Safari/iOS WebView. All array accesses are now protected.
 */

const taglines = [
  "Where experience becomes your advantage",
  "Your success story starts here",
  "Expert guidance, personalized for you",
  "Learn from the best in the field",
  "Transform your future with expert mentorship",
  "Connect with real professionals",
];

export const RotatingTagline = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [displayText, setDisplayText] = useState('');
  const [isTyping, setIsTyping] = useState(true);
  const [showCursor, setShowCursor] = useState(true);

  // DEFENSIVE: Get current tagline safely with bounds checking
  const currentTagline = safeArrayAccess(taglines, currentIndex, taglines[0] || '');
  const currentTaglineLength = safeLength(currentTagline);

  // Cursor blink effect
  useEffect(() => {
    const cursorInterval = setInterval(() => {
      setShowCursor(prev => !prev);
    }, 530);
    return () => clearInterval(cursorInterval);
  }, []);

  // Typing effect with defensive checks
  useEffect(() => {
    if (isTyping) {
      if (displayText.length < currentTaglineLength) {
        const timeout = setTimeout(() => {
          setDisplayText(currentTagline.slice(0, displayText.length + 1));
        }, 50);
        return () => clearTimeout(timeout);
      } else {
        // Pause before deleting
        const pauseTimeout = setTimeout(() => {
          setIsTyping(false);
        }, 2500);
        return () => clearTimeout(pauseTimeout);
      }
    } else {
      if (displayText.length > 0) {
        const timeout = setTimeout(() => {
          setDisplayText(displayText.slice(0, -1));
        }, 30);
        return () => clearTimeout(timeout);
      } else {
        // Move to next tagline - use safeLength for array bounds
        setCurrentIndex((prev) => (prev + 1) % safeLength(taglines));
        setIsTyping(true);
      }
    }
  }, [displayText, isTyping, currentIndex, currentTagline, currentTaglineLength]);

  return (
    <div className="flex items-center justify-center gap-2 mb-3">
      <Sparkles className="h-4 w-4 text-primary animate-pulse" />
      <p className="text-sm font-medium bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent italic min-h-[1.5em] flex items-center">
        <span>"{displayText}</span>
        <span 
          className={`inline-block w-0.5 h-4 bg-primary ml-0.5 transition-opacity duration-100 ${
            showCursor ? 'opacity-100' : 'opacity-0'
          }`}
        />
        {/* DEFENSIVE: Compare lengths safely */}
        <span className={displayText.length === currentTaglineLength ? '' : 'invisible'}>"</span>
      </p>
      <Sparkles className="h-4 w-4 text-primary animate-pulse" />
    </div>
  );
};