import { CheckCircle2, AlertCircle, X } from 'lucide-react';
import { useEffect, useState } from 'react';

type StatusToastProps = {
  message: string;
  variant?: 'success' | 'error';
  onClose?: () => void;
  duration?: number;
};

export function StatusToast({ message, variant = 'success', onClose, duration = 3000 }: StatusToastProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (duration > 0) {
      // Start progress animation slightly after mount to ensure transition works
      const progressTimer = setTimeout(() => {
        setProgress(0);
      }, 50);

      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(() => onClose?.(), 300); // Wait for exit animation
      }, duration);

      return () => {
        clearTimeout(timer);
        clearTimeout(progressTimer);
      };
    }
  }, [duration, onClose]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => onClose?.(), 300);
  };

  const baseStyles = "fixed top-6 right-6 z-50 flex flex-col rounded-xl shadow-xl backdrop-blur-md border border-white/10 transition-all duration-300 overflow-hidden";
  const variants = {
    success: "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-emerald-500/20",
    error: "bg-gradient-to-r from-red-500 to-pink-600 text-white shadow-red-500/20"
  };

  const Icon = variant === 'success' ? CheckCircle2 : AlertCircle;

  return (
    <div
      className={`${baseStyles} ${variants[variant]} ${isVisible
          ? "animate-in slide-in-from-top-2 fade-in duration-300 translate-y-0 opacity-100"
          : "translate-y-[-1rem] opacity-0 pointer-events-none"
        }`}
      role="alert"
    >
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="p-1 bg-white/20 rounded-full">
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1 text-sm font-semibold tracking-wide pr-2">
          {message}
        </div>
        {onClose && (
          <button
            onClick={handleClose}
            className="p-1 hover:bg-white/20 rounded-lg transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Progress Bar */}
      {duration > 0 && (
        <div className="h-1 w-full bg-black/10">
          <div
            className="h-full bg-white/40"
            style={{
              width: `${progress}%`,
              transition: `width ${duration}ms linear`
            }}
          />
        </div>
      )}
    </div>
  );
}

export default StatusToast;
