/**
 * Card - Accessible card components with variants
 * Requirements: 6.1 - Professional UI components
 */
import { HTMLAttributes, forwardRef } from 'react';
import { clsx } from 'clsx';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'bordered' | 'elevated' | 'interactive';
  as?: 'div' | 'article' | 'section';
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', as: Component = 'div', children, ...props }, ref) => {
    return (
      <Component
        ref={ref}
        className={clsx(
          'rounded-xl transition-all duration-200',
          {
            // Default - Subtle glow
            'bg-slate-800 border border-slate-700': variant === 'default',
            // Bordered - Prominent border
            'bg-slate-800 border-2 border-cyan-500/50 shadow-[0_0_20px_rgba(0,212,255,0.2)]': variant === 'bordered',
            // Elevated - Strong shadow
            'bg-slate-800 border border-slate-700 shadow-lg shadow-black/20': variant === 'elevated',
            // Interactive - Hover effects
            'bg-slate-800 border border-slate-700 hover:border-cyan-500/50 hover:shadow-[0_0_15px_rgba(0,212,255,0.15)] cursor-pointer': variant === 'interactive',
          },
          className
        )}
        {...props}
      >
        {children}
      </Component>
    );
  }
);

Card.displayName = 'Card';

interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  action?: React.ReactNode;
}

export const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, children, action, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={clsx(
          'px-6 py-4 border-b border-slate-700 flex items-center justify-between',
          className
        )}
        {...props}
      >
        <div className="flex-1">{children}</div>
        {action && <div className="ml-4">{action}</div>}
      </div>
    );
  }
);

CardHeader.displayName = 'CardHeader';

interface CardTitleProps extends HTMLAttributes<HTMLHeadingElement> {
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
}

export const CardTitle = forwardRef<HTMLHeadingElement, CardTitleProps>(
  ({ className, as: Component = 'h3', children, ...props }, ref) => {
    return (
      <Component
        ref={ref}
        className={clsx('text-lg font-semibold text-white', className)}
        {...props}
      >
        {children}
      </Component>
    );
  }
);

CardTitle.displayName = 'CardTitle';

export const CardDescription = forwardRef<HTMLParagraphElement, HTMLAttributes<HTMLParagraphElement>>(
  ({ className, children, ...props }, ref) => {
    return (
      <p
        ref={ref}
        className={clsx('text-sm text-slate-400 mt-1', className)}
        {...props}
      >
        {children}
      </p>
    );
  }
);

CardDescription.displayName = 'CardDescription';

export const CardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={clsx('px-6 py-4', className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

CardContent.displayName = 'CardContent';

export const CardFooter = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={clsx(
          'px-6 py-4 border-t border-slate-700 flex items-center justify-end gap-3',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

CardFooter.displayName = 'CardFooter';

