import React, { useState, useEffect } from 'react';
import { Language } from '../types.ts';
import { t } from '../utils/translations.ts';
import { soundManager } from '../utils/soundManager.ts';
import { Play, Check, X, Sparkles } from 'lucide-react';

interface AdModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReward: () => void;
  lang: Language;
}

export const AdModal: React.FC<AdModalProps> = ({
  isOpen,
  onClose,
  onReward,
  lang,
}) => {
  const [countdown, setCountdown] = useState<number>(3);
  const [canClaim, setCanClaim] = useState<boolean>(false);

  useEffect(() => {
    if (!isOpen) {
      setCountdown(3);
      setCanClaim(false);
      return;
    }

    setCountdown(3);
    setCanClaim(false);

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setCanClaim(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-sm bg-[#1A1D20] text-white border-2 border-[#3A3F44] rounded-2xl shadow-2xl p-6 text-center space-y-4">
        {/* Close button if ready */}
        <button
          type="button"
          onClick={() => {
            soundManager.playButtonClick();
            onClose();
          }}
          className="absolute top-3 right-3 text-gray-400 hover:text-white cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-16 h-16 mx-auto rounded-full bg-[#C7F0D8]/10 border border-[#C7F0D8]/30 flex items-center justify-center text-[#C7F0D8]">
          <Play className="w-8 h-8 fill-current ml-1" />
        </div>

        <div>
          <h3 className="text-lg font-bold font-mono-retro text-[#C7F0D8]">
            {t(lang, 'watch_ads')}
          </h3>
          <p className="text-xs text-gray-400 font-mono-retro mt-1">
            {t(lang, 'support_developer')}
          </p>
        </div>

        {/* Sponsor Banner Box */}
        <div className="p-4 rounded-xl bg-black/40 border border-[#3A3F44] flex flex-col items-center justify-center min-h-[100px]">
          <Sparkles className="w-7 h-7 text-[#FFD700] mb-2 animate-bounce" />
          <div className="text-sm font-bold font-mono-retro text-amber-200">
            SNAKE MAZE 2026 SUPPORTER
          </div>
          <div className="text-[11px] text-gray-400 font-mono-retro mt-1">
            Thank you for keeping indie retro gaming alive!
          </div>
        </div>

        {/* Action Button */}
        <div>
          {canClaim ? (
            <button
              type="button"
              onClick={() => {
                soundManager.playBonusEat();
                onReward();
                onClose();
              }}
              className="w-full py-3 bg-[#C7F0D8] text-[#1E2328] font-black rounded-xl font-mono-retro text-sm flex items-center justify-center gap-2 hover:bg-white transition cursor-pointer shadow-lg"
            >
              <Check className="w-5 h-5" />
              {lang === 'tr' ? 'Ödülü Al' : 'Claim Reward'}
            </button>
          ) : (
            <div className="py-3 bg-gray-800 text-gray-300 font-bold rounded-xl font-mono-retro text-sm">
              {lang === 'tr'
                ? `Kapatılabilir: ${countdown}s`
                : `Reward in: ${countdown}s`}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
