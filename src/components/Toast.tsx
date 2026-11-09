import React, { useEffect } from 'react';
import { Award, Heart, CheckCircle2 } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'achievement' | 'support' | 'info';
  title?: string;
  message: string;
}

interface ToastProps {
  toast: ToastMessage | null;
  onDismiss: () => void;
}

export const Toast: React.FC<ToastProps> = ({ toast, onDismiss }) => {
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      onDismiss();
    }, 3800);
    return () => clearTimeout(timer);
  }, [toast, onDismiss]);

  if (!toast) return null;

  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-sm px-4 pointer-events-none animate-bounce-short">
      <div className="bg-[#1E2328] text-[#C7F0D8] border-2 border-[#C7F0D8] rounded-xl shadow-2xl p-3.5 flex items-center gap-3 backdrop-blur-md">
        <div className="p-2 bg-[#C7F0D8]/10 rounded-lg shrink-0">
          {toast.type === 'achievement' && <Award className="w-6 h-6 text-[#FFD700]" />}
          {toast.type === 'support' && <Heart className="w-6 h-6 text-[#FF4D4D] fill-[#FF4D4D]" />}
          {toast.type === 'info' && <CheckCircle2 className="w-6 h-6 text-[#C7F0D8]" />}
        </div>
        <div className="flex-1 min-w-0">
          {toast.title && (
            <div className="text-xs font-black uppercase tracking-wider text-[#FFD700] font-mono-retro">
              {toast.title}
            </div>
          )}
          <div className="text-sm font-bold font-mono-retro leading-tight truncate">
            {toast.message}
          </div>
        </div>
      </div>
    </div>
  );
};
