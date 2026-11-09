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
  useEffect(() => {
    if (!activeToast) return;
    const timer = setTimeout(() => {
      onDismiss();
    }, 2800);
    return () => clearTimeout(timer);
  }, [activeToast, onDismiss]);

  if (!activeToast) return null;

  return (
    <div role="status" aria-live="polite" className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-sm px-4 pointer-events-none animate-bounce-short">
      <div className="bg-[#1E2328] text-[#C7F0D8] border-2 border-[#C7F0D8] rounded-xl shadow-2xl p-3.5 flex items-center gap-3 backdrop-blur-md">
        <div className="p-2 bg-[#C7F0D8]/10 rounded-lg shrink-0">
          {activeToast.type === 'achievement' && <Award className="w-6 h-6 text-[#FFD700]" />}
          {activeToast.type === 'support' && <Heart className="w-6 h-6 text-[#FF4D4D] fill-[#FF4D4D]" />}
          {activeToast.type === 'info' && <CheckCircle2 className="w-6 h-6 text-[#C7F0D8]" />}
        </div>
        <div className="flex-1 min-w-0">
          {activeToast.title && (
            <div className="text-xs font-black uppercase tracking-wider text-[#FFD700] font-mono-retro">
              {activeToast.title}
            </div>
          )}
          <div className="text-sm font-bold font-mono-retro leading-tight truncate">
            {activeToast.message}
          </div>
        </div>
      </div>
    </div>
  );
};
