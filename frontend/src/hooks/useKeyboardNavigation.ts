/**
 * useKeyboardNavigation Hook
 * Provides keyboard navigation support for accessibility
 * Requirements: Task 21 - Add keyboard navigation support
 */

import { useEffect, useCallback, RefObject } from 'react';

interface KeyboardNavigationOptions {
  onEscape?: () => void;
  onEnter?: () => void;
  onArrowUp?: () => void;
  onArrowDown?: () => void;
  onArrowLeft?: () => void;
  onArrowRight?: () => void;
  onTab?: (shift: boolean) => void;
  enabled?: boolean;
}

/**
 * Hook for handling keyboard navigation
 */
export function useKeyboardNavigation(options: KeyboardNavigationOptions) {
  const {
    onEscape,
    onEnter,
    onArrowUp,
    onArrowDown,
    onArrowLeft,
    onArrowRight,
    onTab,
    enabled = true,
  } = options;

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      switch (event.key) {
        case 'Escape':
          if (onEscape) {
            event.preventDefault();
            onEscape();
          }
          break;
        case 'Enter':
          if (onEnter) {
            event.preventDefault();
            onEnter();
          }
          break;
        case 'ArrowUp':
          if (onArrowUp) {
            event.preventDefault();
            onArrowUp();
          }
          break;
        case 'ArrowDown':
          if (onArrowDown) {
            event.preventDefault();
            onArrowDown();
          }
          break;
        case 'ArrowLeft':
          if (onArrowLeft) {
            event.preventDefault();
            onArrowLeft();
          }
          break;
        case 'ArrowRight':
          if (onArrowRight) {
            event.preventDefault();
            onArrowRight();
          }
          break;
        case 'Tab':
          if (onTab) {
            event.preventDefault();
            onTab(event.shiftKey);
          }
          break;
      }
    },
    [enabled, onEscape, onEnter, onArrowUp, onArrowDown, onArrowLeft, onArrowRight, onTab]
  );

  useEffect(() => {
    if (enabled) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [enabled, handleKeyDown]);
}

/**
 * Hook for managing focus trap (useful for modals/dialogs)
 */
export function useFocusTrap(containerRef: RefObject<HTMLElement>, isActive: boolean = true) {
  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    const container = containerRef.current;
    const focusableElements = container.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    // Focus first element when trap activates
    firstElement?.focus();

    container.addEventListener('keydown', handleTabKey);
    return () => container.removeEventListener('keydown', handleTabKey);
  }, [containerRef, isActive]);
}

/**
 * Hook for handling list navigation with arrow keys
 */
export function useListNavigation<T>(
  items: T[],
  onSelect: (item: T, index: number) => void,
  options: {
    initialIndex?: number;
    loop?: boolean;
    enabled?: boolean;
  } = {}
) {
  const { initialIndex = 0, loop = true, enabled = true } = options;
  const [selectedIndex, setSelectedIndex] = React.useState(initialIndex);

  const handleArrowUp = useCallback(() => {
    setSelectedIndex((prev) => {
      const newIndex = prev - 1;
      if (newIndex < 0) {
        return loop ? items.length - 1 : 0;
      }
      return newIndex;
    });
  }, [items.length, loop]);

  const handleArrowDown = useCallback(() => {
    setSelectedIndex((prev) => {
      const newIndex = prev + 1;
      if (newIndex >= items.length) {
        return loop ? 0 : items.length - 1;
      }
      return newIndex;
    });
  }, [items.length, loop]);

  const handleEnter = useCallback(() => {
    if (items[selectedIndex]) {
      onSelect(items[selectedIndex], selectedIndex);
    }
  }, [items, selectedIndex, onSelect]);

  useKeyboardNavigation({
    onArrowUp: handleArrowUp,
    onArrowDown: handleArrowDown,
    onEnter: handleEnter,
    enabled,
  });

  return {
    selectedIndex,
    setSelectedIndex,
    selectedItem: items[selectedIndex],
  };
}

// Need to import React for useState
import React from 'react';

