/**
 * Button - Accessible button component with loading states
 * Requirements: 6.1, 6.3 - Professional UI with loading states and accessibility
 */
import { ButtonHTMLAttributes, forwardRef } from 'react';
import { clsx } from 'clsx';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  loadingText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    className, 
    variant = 'primary', 
    size = 'md', 
    isLoading, 
    loadingText,
    leftIcon,
    rightIcon,
    fullWidth = false,
    children, 
    disabled, 
    'aria-label': ariaLabel,
    ...props 
  }, ref) => {
    const isDisabled = disabled || isLoading;
    
    return (
      <button
        ref={ref}
        disabled={isDisabled}
        aria-disabled={isDisabled}
        aria-busy={isLoading}
        aria-label={isLoading && loadingText ? loadingText : ariaLabel}
        className={clsx(
          // Base styles
          'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          'active:scale-[0.98]',
          
          // Full width
          fullWidth && 'w-full',
          
          // Variants - Updated for dark theme
          {
            // Primary - Cyan accent
            'bg-cyan-500 text-white hover:bg-cyan-600 focus-visible:ring-cyan-500 shadow-[0_0_15px_rgba(0,212,255,0.3)] hover:shadow-[0_0_20px_rgba(0,212,255,0.4)]': variant === 'primary',
            // Secondary - Blue
            'bg-blue-600 text-white hover:bg-blue-700 focus-visible:ring-blue-500': variant === 'secondary',
            // Outline
            'border-2 border-slate-600 text-slate-300 hover:bg-slate-800 hover:border-slate-500 focus-visible:ring-slate-500': variant === 'outline',
            // Ghost
            'text-slate-300 hover:bg-slate-800 hover:text-white focus-visible:ring-slate-500': variant === 'ghost',
            // Danger
            'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500': variant === 'danger',
            // Success - Green accent
            'bg-green-500 text-white hover:bg-green-600 focus-visible:ring-green-500 shadow-[0_0_15px_rgba(34,197,94,0.3)] hover:shadow-[0_0_20px_rgba(34,197,94,0.4)]': variant === 'success',
          },
          
          // Sizes
          {
            'px-3 py-1.5 text-sm gap-1.5': size === 'sm',
            'px-4 py-2 text-base gap-2': size === 'md',
            'px-6 py-3 text-lg gap-2.5': size === 'lg',
          },
          
          className
        )}
        {...props}
      >
        {/* Loading spinner */}
        {isLoading && (
          <svg 
            className="animate-spin h-4 w-4" 
            fill="none" 
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle 
              className="opacity-25" 
              cx="12" 
              cy="12" 
              r="10" 
              stroke="currentColor" 
              strokeWidth="4" 
            />
            <path 
              className="opacity-75" 
              fill="currentColor" 
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" 
            />
          </svg>
        )}
        
        {/* Left icon */}
        {!isLoading && leftIcon && (
          <span className="flex-shrink-0" aria-hidden="true">
            {leftIcon}
          </span>
        )}
        
        {/* Button text */}
        <span className={isLoading ? 'opacity-70' : ''}>
          {isLoading && loadingText ? loadingText : children}
        </span>
        
        {/* Right icon */}
        {!isLoading && rightIcon && (
          <span className="flex-shrink-0" aria-hidden="true">
            {rightIcon}
          </span>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';
