import React, { useEffect } from 'react';
import { Award, Heart, CheckCircle2 } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'achievement' | 'support' | 'info';
  title?: string;
  message: string;
}

interface ToastProps {
  toast: ToastMessage[];
  onDismiss: () => void;
}

export const Toast: React.FC<ToastProps> = ({ toast, onDismiss }) => {
  const activeToast = toast[0] ?? null;
  const activeToastId = activeToast?.id;
  useEffect(() => {
    if (!activeToastId) return;
    const timer = setTimeout(() => {
      onDismiss();
    }, 5000);
    return () => clearTimeout(timer);
  }, [activeToastId, onDismiss]);

  if (!activeToast) return null;

  return (
    <div role="status" aria-live="polite" className="fixed top-[calc(env(safe-area-inset-top)+6.5rem)] left-1/2 -translate-x-1/2 z-50 w-full max-w-xs px-3 pointer-events-none">
      <div className="bg-[#1E2328]/95 text-[#C7F0D8] border border-[#C7F0D8]/80 rounded-md shadow-lg px-2.5 py-1.5 flex items-center gap-2 backdrop-blur-md">
        <div className="shrink-0">
          {activeToast.type === 'achievement' && <Award className="w-4 h-4 text-[#FFD700]" />}
          {activeToast.type === 'support' && <Heart className="w-4 h-4 text-[#FF4D4D] fill-[#FF4D4D]" />}
          {activeToast.type === 'info' && <CheckCircle2 className="w-4 h-4 text-[#C7F0D8]" />}
        </div>
        <div className="flex-1 min-w-0">
          {activeToast.title && (
            <div className="text-[9px] font-black uppercase tracking-wider text-[#FFD700] font-mono-retro leading-none mb-0.5">
              {activeToast.title}
            </div>
          )}
          <div className="text-[11px] font-bold font-mono-retro leading-tight truncate">
            {activeToast.message}
          </div>
        </div>
      </div>
    </div>
  );
};
