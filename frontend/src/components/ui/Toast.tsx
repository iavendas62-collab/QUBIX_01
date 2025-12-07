/**
 * Toast - Centralized toast notification service
 * Requirements: 6.3 - Implement toast notifications for all actions
 */
import toast, { Toaster as HotToaster, ToastOptions } from 'react-hot-toast';
import { CheckCircle, XCircle, AlertTriangle, Info, Loader2 } from 'lucide-react';

// Custom toast styles
const baseStyle: React.CSSProperties = {
  background: '#1E293B',
  color: '#F8FAFC',
  border: '1px solid #334155',
  borderRadius: '12px',
  padding: '12px 16px',
  fontSize: '14px',
  maxWidth: '400px',
  boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
};

const defaultOptions: ToastOptions = {
  duration: 4000,
  position: 'top-right',
  style: baseStyle,
};

// Toast notification functions
export const notify = {
  /**
   * Success notification
   */
  success: (message: string, options?: ToastOptions) => {
    return toast.success(message, {
      ...defaultOptions,
      ...options,
      icon: <CheckCircle className="w-5 h-5 text-green-400" />,
      style: {
        ...baseStyle,
        borderColor: 'rgba(34, 197, 94, 0.3)',
      },
      ariaProps: {
        role: 'status',
        'aria-live': 'polite',
      },
    });
  },

  /**
   * Error notification
   */
  error: (message: string, options?: ToastOptions) => {
    return toast.error(message, {
      ...defaultOptions,
      duration: 5000, // Errors stay longer
      ...options,
      icon: <XCircle className="w-5 h-5 text-red-400" />,
      style: {
        ...baseStyle,
        borderColor: 'rgba(239, 68, 68, 0.3)',
      },
      ariaProps: {
        role: 'alert',
        'aria-live': 'assertive',
      },
    });
  },

  /**
   * Warning notification
   */
  warning: (message: string, options?: ToastOptions) => {
    return toast(message, {
      ...defaultOptions,
      ...options,
      icon: <AlertTriangle className="w-5 h-5 text-yellow-400" />,
      style: {
        ...baseStyle,
        borderColor: 'rgba(245, 158, 11, 0.3)',
      },
      ariaProps: {
        role: 'alert',
        'aria-live': 'polite',
      },
    });
  },

  /**
   * Info notification
   */
  info: (message: string, options?: ToastOptions) => {
    return toast(message, {
      ...defaultOptions,
      ...options,
      icon: <Info className="w-5 h-5 text-blue-400" />,
      style: {
        ...baseStyle,
        borderColor: 'rgba(59, 130, 246, 0.3)',
      },
      ariaProps: {
        role: 'status',
        'aria-live': 'polite',
      },
    });
  },

  /**
   * Loading notification (returns toast ID for dismissal)
   */
  loading: (message: string, options?: ToastOptions) => {
    return toast.loading(message, {
      ...defaultOptions,
      duration: Infinity, // Loading toasts don't auto-dismiss
      ...options,
      icon: <Loader2 className="w-5 h-5 text-cyan-400 animate-spin" />,
      style: {
        ...baseStyle,
        borderColor: 'rgba(0, 212, 255, 0.3)',
      },
    });
  },

  /**
   * Promise-based notification
   */
  promise: <T,>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((err: Error) => string);
    },
    options?: ToastOptions
  ) => {
    return toast.promise(
      promise,
      {
        loading: messages.loading,
        success: messages.success,
        error: messages.error,
      },
      {
        ...defaultOptions,
        ...options,
        style: baseStyle,
      }
    );
  },

  /**
   * Dismiss a specific toast or all toasts
   */
  dismiss: (toastId?: string) => {
    if (toastId) {
      toast.dismiss(toastId);
    } else {
      toast.dismiss();
    }
  },

  /**
   * Custom toast with JSX content
   */
  custom: (content: React.ReactNode, options?: ToastOptions) => {
    return toast.custom(
      (t) => (
        <div
          className={`${
            t.visible ? 'animate-enter' : 'animate-leave'
          } max-w-md w-full bg-slate-800 border border-slate-700 shadow-lg rounded-xl pointer-events-auto`}
        >
          {content}
        </div>
      ),
      {
        ...defaultOptions,
        ...options,
      }
    );
  },
};

/**
 * Toaster component - Place this at the root of your app
 */
export function Toaster() {
  return (
    <HotToaster
      position="top-right"
      gutter={12}
      containerStyle={{
        top: 80, // Below header
      }}
      toastOptions={{
        ...defaultOptions,
        className: 'toast-notification',
      }}
    />
  );
}

export default notify;

