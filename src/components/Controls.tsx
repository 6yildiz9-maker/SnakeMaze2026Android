import React, { useEffect } from 'react';
import { ControlMode, Direction, Language, ButtonSize, HandOrientation } from '../types.ts';
import { soundManager } from '../utils/soundManager.ts';
import { vibrate } from '../utils/haptics.ts';
import { t } from '../utils/translations.ts';
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, CornerDownLeft, CornerUpRight } from 'lucide-react';

interface ControlsProps {
  mode: ControlMode;
  buttonSize?: ButtonSize;
  handOrientation?: HandOrientation;
  currentDirection: Direction;
  onTurnUp: () => void;
  onTurnDown: () => void;
  onTurnLeft: () => void;
  onTurnRight: () => void;
  onZigZagLeft: () => void;
  onZigZagRight: () => void;
  lang: Language;
}

export const Controls: React.FC<ControlsProps> = ({
  mode,
  buttonSize = 'medium',
  handOrientation = 'right',
  onTurnUp,
  onTurnDown,
  onTurnLeft,
  onTurnRight,
  onZigZagLeft,
  onZigZagRight,
  lang,
}) => {
  const handleAction = (fn: () => void) => {
    soundManager.playButtonClick();
    vibrate(40);
    fn();
  };

  // Keyboard controls listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA'
      ) {
        return;
      }

      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          e.preventDefault();
          handleAction(onTurnUp);
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          e.preventDefault();
          handleAction(onTurnDown);
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          e.preventDefault();
          if (mode === 'classic' && (e.key === 'a' || e.key === 'A')) {
            handleAction(onZigZagLeft);
          } else {
            handleAction(onTurnLeft);
          }
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          e.preventDefault();
          if (mode === 'classic' && (e.key === 'd' || e.key === 'D')) {
            handleAction(onZigZagRight);
          } else {
            handleAction(onTurnRight);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mode, onTurnUp, onTurnDown, onTurnLeft, onTurnRight, onZigZagLeft, onZigZagRight]);

  // Size styling classes
  const classicSizeClass =
    buttonSize === 'small'
      ? 'w-24 h-24 sm:w-28 sm:h-28'
      : buttonSize === 'large'
      ? 'w-32 h-32 sm:w-36 sm:h-36'
      : 'w-28 h-28 sm:w-32 sm:h-32';

  const dpadSizeClass =
    buttonSize === 'small'
      ? 'w-13 h-13'
      : buttonSize === 'large'
      ? 'w-18 h-18'
      : 'w-16 h-16';

  const dpadContainerClass =
    buttonSize === 'small'
      ? 'w-40 h-40'
      : buttonSize === 'large'
      ? 'w-52 h-52'
      : 'w-48 h-48';

  return (
    <div className="w-full flex justify-center items-center py-2 select-none">
      {mode === 'classic' && (
        <div
          className={`flex justify-between items-center w-full max-w-sm px-6 gap-6 ${
            handOrientation === 'left' ? 'flex-row-reverse' : 'flex-row'
          }`}
        >
          {/* Left ZigZag button */}
          <button
            type="button"
            onClick={() => handleAction(onZigZagLeft)}
            aria-label={t(lang, 'turn_left')}
            className={`relative ${classicSizeClass} rounded-full bg-black/80 active:bg-black text-white flex flex-col items-center justify-center shadow-lg border-4 border-black/40 hover:scale-105 active:scale-95 transition-all cursor-pointer after:absolute after:-inset-3 after:content-['']`}
          >
            <CornerDownLeft className="w-10 h-10 sm:w-12 sm:h-12 text-white" strokeWidth={3} />
            <span className="text-[10px] sm:text-[11px] font-bold tracking-wider mt-1 font-mono-retro">
              {lang === 'tr' ? 'SOL / AŞAĞI' : 'LEFT / DOWN'}
            </span>
          </button>

          {/* Right ZigZag button */}
          <button
            type="button"
            onClick={() => handleAction(onZigZagRight)}
            aria-label={t(lang, 'turn_right')}
            className={`relative ${classicSizeClass} rounded-full bg-black/80 active:bg-black text-white flex flex-col items-center justify-center shadow-lg border-4 border-black/40 hover:scale-105 active:scale-95 transition-all cursor-pointer after:absolute after:-inset-3 after:content-['']`}
          >
            <CornerUpRight className="w-10 h-10 sm:w-12 sm:h-12 text-white" strokeWidth={3} />
            <span className="text-[10px] sm:text-[11px] font-bold tracking-wider mt-1 font-mono-retro">
              {lang === 'tr' ? 'SAĞ / YUKARI' : 'RIGHT / UP'}
            </span>
          </button>
        </div>
      )}

      {mode === 'alternative' && (
        <div className={`relative ${dpadContainerClass} flex items-center justify-center`}>
          {/* UP */}
          <button
            type="button"
            onClick={() => handleAction(onTurnUp)}
            aria-label={t(lang, 'turn_up')}
            className={`absolute top-0 ${dpadSizeClass} rounded-full bg-black/80 active:bg-black text-white flex items-center justify-center shadow-md border-2 border-black/30 hover:scale-105 active:scale-95 transition cursor-pointer after:absolute after:-inset-2 after:content-['']`}
          >
            <ArrowUp className="w-7 h-7 sm:w-8 sm:h-8" strokeWidth={3} />
          </button>

          {/* DOWN */}
          <button
            type="button"
            onClick={() => handleAction(onTurnDown)}
            aria-label={t(lang, 'turn_down')}
            className={`absolute bottom-0 ${dpadSizeClass} rounded-full bg-black/80 active:bg-black text-white flex items-center justify-center shadow-md border-2 border-black/30 hover:scale-105 active:scale-95 transition cursor-pointer after:absolute after:-inset-2 after:content-['']`}
          >
            <ArrowDown className="w-7 h-7 sm:w-8 sm:h-8" strokeWidth={3} />
          </button>

          {/* LEFT */}
          <button
            type="button"
            onClick={() => handleAction(onTurnLeft)}
            aria-label={t(lang, 'turn_left')}
            className={`absolute left-0 ${dpadSizeClass} rounded-full bg-black/80 active:bg-black text-white flex items-center justify-center shadow-md border-2 border-black/30 hover:scale-105 active:scale-95 transition cursor-pointer after:absolute after:-inset-2 after:content-['']`}
          >
            <ArrowLeft className="w-7 h-7 sm:w-8 sm:h-8" strokeWidth={3} />
          </button>

          {/* RIGHT */}
          <button
            type="button"
            onClick={() => handleAction(onTurnRight)}
            aria-label={t(lang, 'turn_right')}
            className={`absolute right-0 ${dpadSizeClass} rounded-full bg-black/80 active:bg-black text-white flex items-center justify-center shadow-md border-2 border-black/30 hover:scale-105 active:scale-95 transition cursor-pointer after:absolute after:-inset-2 after:content-['']`}
          >
            <ArrowRight className="w-7 h-7 sm:w-8 sm:h-8" strokeWidth={3} />
          </button>
        </div>
      )}

      {mode === 'swipe' && (
        <div
          aria-hidden="true"
          className="w-full max-w-sm h-36 border-2 border-dashed border-[#3A3F44]/40 rounded-xl bg-black/5 flex flex-col items-center justify-center p-4 text-center transition-colors"
        >
          <div className="grid grid-cols-3 gap-1 mb-2 opacity-60">
            <div />
            <ArrowUp className="w-6 h-6 mx-auto text-[#3A3F44]" />
            <div />
            <ArrowLeft className="w-6 h-6 mx-auto text-[#3A3F44]" />
            <span className="text-[11px] font-bold text-[#3A3F44] tracking-widest font-mono-retro">
              SWIPE
            </span>
            <ArrowRight className="w-6 h-6 mx-auto text-[#3A3F44]" />
            <div />
            <ArrowDown className="w-6 h-6 mx-auto text-[#3A3F44]" />
            <div />
          </div>
          <span className="text-xs text-[#3A3F44]/80 font-mono-retro">
            {t(lang, 'swipe_instructions')}
          </span>
        </div>
      )}
    </div>
  );
};
