import { Transition, Variants } from 'framer-motion';

// iOS-inspired easing curve (ease-out-quart)
export const iosEasing = [0.25, 0.46, 0.45, 0.94] as const;

// Gentle spring for tap feedback
export const gentleSpring: Transition = {
  type: "spring",
  stiffness: 400,
  damping: 30,
};

// Shared motion configuration
export const motionConfig = {
  // Page transitions - slide from TOP for professional feel
  page: {
    initial: { opacity: 0, y: -20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 10 },
  },
  pageTransition: {
    duration: 0.3,
    ease: iosEasing,
  },

  // Card/container fade-in
  fadeInUp: {
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
  },
  fadeInUpTransition: {
    duration: 0.35,
    ease: iosEasing,
  },

  // Modal/dialog animations
  modal: {
    initial: { opacity: 0, scale: 0.96 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.98 },
  },
  modalTransition: {
    duration: 0.25,
    ease: iosEasing,
  },
  modalExitTransition: {
    duration: 0.15,
    ease: iosEasing,
  },

  // Overlay fade
  overlay: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },
  overlayTransition: {
    duration: 0.2,
    ease: iosEasing,
  },

  // Button tap
  tap: { scale: 0.97 },

  // Subtle hover lift
  hoverLift: { y: -2 },
  
  // Card hover with glow
  cardHover: { 
    y: -4, 
    scale: 1.02,
    transition: { duration: 0.2, ease: iosEasing }
  },
};

// Stagger container variants
export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.1,
    },
  },
};

// Stagger item variants
export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: iosEasing,
    },
  },
};

// Error shake animation
export const shakeVariants: Variants = {
  shake: {
    x: [0, -4, 4, -4, 4, 0],
    transition: { duration: 0.4 },
  },
};

// 3D Card hover effect - professional, not playful
export const card3D: Variants = {
  rest: { 
    rotateX: 0, 
    rotateY: 0, 
    scale: 1,
    z: 0,
  },
  hover: { 
    rotateX: -2, 
    rotateY: 3, 
    scale: 1.02,
    z: 20,
    transition: { duration: 0.3, ease: iosEasing },
  },
  tap: { 
    scale: 0.98, 
    rotateX: 0, 
    rotateY: 0,
    transition: { duration: 0.1 },
  },
};

// Slide from top entrance
export const slideFromTop: Variants = {
  hidden: { opacity: 0, y: -30, scale: 0.98 },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: { duration: 0.4, ease: iosEasing },
  },
};

// Premium stagger for cards
export const premiumStagger: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.15,
    },
  },
};

// Premium stagger item
export const premiumStaggerItem: Variants = {
  hidden: { opacity: 0, y: -20, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.4,
      ease: iosEasing,
    },
  },
};

// List stagger for session cards, etc.
export const listStagger: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
};

export const listItem: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.25,
      ease: iosEasing,
    },
  },
};

// Toast slide animation
export const toastSlide: Variants = {
  initial: { opacity: 0, y: 50, scale: 0.95 },
  animate: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: { duration: 0.3, ease: iosEasing }
  },
  exit: { 
    opacity: 0, 
    y: 20, 
    scale: 0.95,
    transition: { duration: 0.2, ease: iosEasing }
  },
};

// Badge pulse (single, not infinite)
export const badgePulse: Variants = {
  initial: { scale: 1 },
  pulse: {
    scale: [1, 1.1, 1],
    transition: { duration: 0.4, ease: iosEasing },
  },
};

// Chart line draw
export const chartLineAnimation = {
  initial: { pathLength: 0, opacity: 0 },
  animate: { 
    pathLength: 1, 
    opacity: 1,
    transition: { duration: 1.5, ease: iosEasing }
  },
};

// Success checkmark
export const successCheck: Variants = {
  hidden: { scale: 0, rotate: -45 },
  visible: {
    scale: 1,
    rotate: 0,
    transition: {
      type: "spring",
      stiffness: 260,
      damping: 20,
    },
  },
};
