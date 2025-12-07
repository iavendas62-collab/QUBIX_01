/**
 * Animation Utilities using Framer Motion
 * Centralized animation configurations for consistent UX
 * Requirements: 6.1, 6.3, 6.4
 */

import { Variants, Transition } from 'framer-motion';

// ========================================
// Transition Presets
// ========================================

export const transitions = {
  fast: { duration: 0.15, ease: 'easeOut' } as Transition,
  normal: { duration: 0.2, ease: 'easeOut' } as Transition,
  slow: { duration: 0.3, ease: 'easeOut' } as Transition,
  spring: { type: 'spring', stiffness: 300, damping: 30 } as Transition,
  bounce: { type: 'spring', stiffness: 400, damping: 20 } as Transition,
};

// ========================================
// Fade Animations
// ========================================

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: transitions.normal
  },
  exit: { 
    opacity: 0,
    transition: transitions.fast
  }
};

export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: transitions.normal
  },
  exit: { 
    opacity: 0, 
    y: -20,
    transition: transitions.fast
  }
};

export const fadeInDown: Variants = {
  hidden: { opacity: 0, y: -20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: transitions.normal
  },
  exit: { 
    opacity: 0, 
    y: 20,
    transition: transitions.fast
  }
};

// ========================================
// Scale Animations
// ========================================

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: transitions.spring
  },
  exit: { 
    opacity: 0, 
    scale: 0.9,
    transition: transitions.fast
  }
};

export const scaleInBounce: Variants = {
  hidden: { opacity: 0, scale: 0 },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: transitions.bounce
  },
  exit: { 
    opacity: 0, 
    scale: 0,
    transition: transitions.fast
  }
};

// ========================================
// Slide Animations
// ========================================

export const slideInLeft: Variants = {
  hidden: { opacity: 0, x: -50 },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: transitions.normal
  },
  exit: { 
    opacity: 0, 
    x: -50,
    transition: transitions.fast
  }
};

export const slideInRight: Variants = {
  hidden: { opacity: 0, x: 50 },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: transitions.normal
  },
  exit: { 
    opacity: 0, 
    x: 50,
    transition: transitions.fast
  }
};

// ========================================
// Wizard Step Transitions
// ========================================

export const wizardStepVariants: Variants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
    transition: transitions.normal,
  },
  exit: (direction: number) => ({
    x: direction < 0 ? 300 : -300,
    opacity: 0,
    transition: transitions.fast,
  }),
};

// ========================================
// Card Hover Animations
// ========================================

export const cardHover: Variants = {
  rest: { 
    scale: 1,
    y: 0,
    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
  },
  hover: { 
    scale: 1.02,
    y: -4,
    boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.2), 0 0 20px rgba(0, 212, 255, 0.15)',
    transition: transitions.fast,
  },
  tap: { 
    scale: 0.98,
    transition: transitions.fast,
  }
};

export const gpuCardHover: Variants = {
  rest: { 
    scale: 1,
    y: 0,
    borderColor: 'rgba(51, 65, 85, 1)',
  },
  hover: { 
    scale: 1.01,
    y: -2,
    borderColor: 'rgba(0, 212, 255, 0.5)',
    transition: transitions.fast,
  },
  tap: { 
    scale: 0.99,
    transition: transitions.fast,
  }
};

// ========================================
// Button Animations
// ========================================

export const buttonTap: Variants = {
  tap: { 
    scale: 0.95,
    transition: transitions.fast,
  }
};

// ========================================
// List Animations (Stagger Children)
// ========================================

export const listContainer: Variants = {
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
  hidden: { opacity: 0, y: 10 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: transitions.fast,
  },
};

// ========================================
// Progress Animations
// ========================================

export const progressBar: Variants = {
  initial: { scaleX: 0, originX: 0 },
  animate: (progress: number) => ({
    scaleX: progress / 100,
    transition: { duration: 0.5, ease: 'easeOut' },
  }),
};

// ========================================
// Modal/Dialog Animations
// ========================================

export const modalBackdrop: Variants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: transitions.fast,
  },
  exit: { 
    opacity: 0,
    transition: transitions.fast,
  }
};

export const modalContent: Variants = {
  hidden: { 
    opacity: 0, 
    scale: 0.95,
    y: 20,
  },
  visible: { 
    opacity: 1, 
    scale: 1,
    y: 0,
    transition: transitions.spring,
  },
  exit: { 
    opacity: 0, 
    scale: 0.95,
    y: 20,
    transition: transitions.fast,
  }
};

// ========================================
// Success/Error Animations
// ========================================

export const successPulse: Variants = {
  initial: { scale: 1 },
  animate: {
    scale: [1, 1.1, 1],
    transition: {
      duration: 0.6,
      ease: 'easeInOut',
    },
  },
};

export const errorShake: Variants = {
  initial: { x: 0 },
  animate: {
    x: [-10, 10, -10, 10, 0],
    transition: {
      duration: 0.4,
      ease: 'easeInOut',
    },
  },
};

// ========================================
// Loading Animations
// ========================================

export const spinnerRotate: Variants = {
  animate: {
    rotate: 360,
    transition: {
      duration: 1,
      repeat: Infinity,
      ease: 'linear',
    },
  },
};

export const pulseScale: Variants = {
  animate: {
    scale: [1, 1.05, 1],
    opacity: [1, 0.8, 1],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

// ========================================
// Utility Functions
// ========================================

/**
 * Get animation variants based on direction
 */
export function getSlideVariants(direction: 'left' | 'right' | 'up' | 'down'): Variants {
  switch (direction) {
    case 'left':
      return slideInLeft;
    case 'right':
      return slideInRight;
    case 'up':
      return fadeInUp;
    case 'down':
      return fadeInDown;
    default:
      return fadeIn;
  }
}

/**
 * Respect user's motion preferences
 */
export function shouldReduceMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Get transition with reduced motion support
 */
export function getTransition(transition: Transition): Transition {
  if (shouldReduceMotion()) {
    return { duration: 0.01 };
  }
  return transition;
}
