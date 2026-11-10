import React from 'react';
import { ArrowLeft, Zap, Sparkles } from 'lucide-react';
import { ControlMode, Direction, Language, Point, ThemeColors, ButtonSize, HandOrientation } from '../types.ts';
import { GameLogic } from '../constants/gameConstants.ts';
import { SnakeCanvas } from './SnakeCanvas.tsx';
import { Controls } from './Controls.tsx';
import { t } from '../utils/translations.ts';

interface GameScreenProps {
  lang: Language;
  controlMode: ControlMode;
  buttonSize: ButtonSize;
  handOrientation: HandOrientation;
  snake: Point[];
  obstacles: Point[];
  food: Point;
  bonusFood: Point | null;
  bonusRemainingMs?: number;
  direction: Direction;
  colors: ThemeColors;
  score: number;
  level: number;
  countdown: number | null;
  gameSpeed: number;
  lcdEffectsEnabled: boolean;
  smoothMotionEnabled: boolean;
  rankDecorationsEnabled: boolean;
  rankDecoration: string;
  onBack: () => void;
  onTurnUp: () => void;
  onTurnDown: () => void;
  onTurnLeft: () => void;
  onTurnRight: () => void;
  onZigZagLeft: () => void;
  onZigZagRight: () => void;
  onSwipeStart: (event: React.TouchEvent<HTMLDivElement>) => void;
  onSwipeMove: (event: React.TouchEvent<HTMLDivElement>) => void;
  onSwipeEnd: (event: React.TouchEvent<HTMLDivElement>) => void;
}

export const GameScreen: React.FC<GameScreenProps> = ({
  lang,
  controlMode,
  buttonSize,
  handOrientation,
  snake,
  obstacles,
  food,
  bonusFood,
  bonusRemainingMs = 0,
  direction,
  colors,
  score,
  level,
  countdown,
  gameSpeed,
  lcdEffectsEnabled,
  smoothMotionEnabled,
  rankDecorationsEnabled,
  rankDecoration,
  onBack,
  onTurnUp,
  onTurnDown,
  onTurnLeft,
  onTurnRight,
  onZigZagLeft,
  onZigZagRight,
  onSwipeStart,
  onSwipeMove,
  onSwipeEnd,
}) => {
  const bonusPercent = Math.max(
    0,
    Math.min(100, Math.round((bonusRemainingMs / GameLogic.BONUS_FOOD_DISPLAY_TIMEOUT_MS) * 100))
  );

  return (
    <div
      className="w-full h-full flex flex-col items-center justify-between p-2 sm:p-4 max-w-md mx-auto console-case"
      style={{ touchAction: controlMode === 'swipe' ? 'none' : 'auto' }}
      onTouchStart={controlMode === 'swipe' ? onSwipeStart : undefined}
      onTouchMove={controlMode === 'swipe' ? onSwipeMove : undefined}
      onTouchEnd={controlMode === 'swipe' ? onSwipeEnd : undefined}
    >
      {/* Top Bar */}
      <div className="w-full flex items-center justify-between px-2 pt-1 pb-1">
        <button
          type="button"
          onClick={onBack}
          aria-label={t(lang, 'back')}
          className="p-2 rounded-xl bg-[#3A3F44]/10 hover:bg-[#3A3F44]/20 text-[#3A3F44] transition cursor-pointer"
        >
          <ArrowLeft className="w-6 h-6 stroke-[3]" />
        </button>

        {/* Center: Score & Level */}
        <div className="flex flex-col items-center">
          <div className="text-2xl sm:text-3xl font-black font-mono-retro tracking-wider text-[#1E2328] leading-none">
            {t(lang, 'score', { score })}
          </div>
          <div className="text-[11px] font-bold font-mono-retro text-[#3A3F44]/80 tracking-wide mt-0.5">
            {t(lang, 'level_label', { level })}
          </div>
        </div>

        {/* Right: Speed indicator */}
        <div
          className="flex items-center gap-1 text-xs sm:text-sm font-bold font-mono-retro bg-white/40 px-2 py-1 rounded-md border border-[#3A3F44]/20"
          aria-label={t(lang, 'speed_label', { speed: (GameLogic.INITIAL_SPEED / gameSpeed).toFixed(1) })}
        >
          <Zap className="w-4 h-4 text-amber-600" aria-hidden="true" />
          <span>x{(GameLogic.INITIAL_SPEED / gameSpeed).toFixed(1)}</span>
        </div>
      </div>

      {/* Playfield Canvas */}
      <div className={`relative w-full flex flex-col items-center justify-center p-1 my-auto ${lcdEffectsEnabled ? 'lcd-screen' : ''}`}>
        <SnakeCanvas
          snake={snake}
          obstacles={obstacles}
          food={food}
          bonusFood={bonusFood}
          bonusRemainingMs={bonusRemainingMs}
          direction={direction}
          colors={colors}
          smoothMotion={smoothMotionEnabled}
          gameSpeed={gameSpeed}
          rankDecorationsEnabled={rankDecorationsEnabled}
          rankDecoration={rankDecoration}
        />

        {/* FR-04-R: Bonus Countdown Bar directly under playfield */}
        {bonusFood && bonusRemainingMs > 0 && (
          <div className="w-full max-w-[440px] mt-1.5 px-1 flex items-center gap-1.5 animate-fadeIn">
            <Sparkles className="w-3.5 h-3.5 text-[#FFD700] animate-pulse" />
            <div className="flex-1 h-2 bg-black/20 rounded-full overflow-hidden border border-[#3A3F44]/30">
              <div
                className={`h-full transition-all duration-100 ${
                  bonusRemainingMs <= 1500 ? 'bg-red-500 animate-pulse' : 'bg-[#FFD700]'
                }`}
                style={{ width: `${bonusPercent}%` }}
              />
            </div>
            <span className="text-[10px] font-bold font-mono-retro text-[#3A3F44] min-w-[28px] text-right">
              {(bonusRemainingMs / 1000).toFixed(1)}s
            </span>
          </div>
        )}

        {/* Countdown overlay */}
        {countdown !== null && countdown > 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-2xs rounded-lg">
            <span className="text-7xl sm:text-8xl font-black text-white font-mono-retro drop-shadow-lg animate-countdown">
              {countdown}
            </span>
          </div>
        )}
      </div>

      {/* Controls Area */}
      <div className="w-full pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        <Controls
          mode={controlMode}
          buttonSize={buttonSize}
          handOrientation={handOrientation}
          currentDirection={direction}
          onTurnUp={onTurnUp}
          onTurnDown={onTurnDown}
          onTurnLeft={onTurnLeft}
          onTurnRight={onTurnRight}
          onZigZagLeft={onZigZagLeft}
          onZigZagRight={onZigZagRight}
          lang={lang}
        />
      </div>
    </div>
  );
};
