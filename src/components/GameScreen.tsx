import React from 'react';
import { ArrowLeft, Zap, Sparkles } from 'lucide-react';
import { ControlMode, Direction, Language, Point, ThemeColors, ButtonSize, HandOrientation, GameMode, FoodType } from '../types.ts';
import { GameLogic } from '../constants/gameConstants.ts';
import { SnakeCanvas } from './SnakeCanvas.tsx';
import { Controls } from './Controls.tsx';
import { t } from '../utils/translations.ts';
import { Clock } from 'lucide-react';

interface GameScreenProps {
  lang: Language;
  mode?: GameMode;
  controlMode: ControlMode;
  buttonSize: ButtonSize;
  handOrientation: HandOrientation;
  snake: Point[];
  obstacles: Point[];
  food: Point;
  bonusFood: Point | null;
  bonusRemainingMs?: number;
  timeRemainingMs?: number;
  foodType?: FoodType;
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
  mode,
  controlMode,
  buttonSize,
  handOrientation,
  snake,
  obstacles,
  food,
  bonusFood,
  bonusRemainingMs = 0,
  timeRemainingMs,
  foodType = 'regular',
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

        {/* Center: Score & Level & Optional Time Remaining */}
        <div className="flex flex-col items-center">
          <div className="text-2xl sm:text-3xl font-black font-mono-retro tracking-wider text-[#1E2328] leading-none">
            {t(lang, 'score', { score })}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[11px] font-bold font-mono-retro text-[#3A3F44]/80 tracking-wide">
              {t(lang, 'level_label', { level })}
            </span>
            {timeRemainingMs !== undefined && (
              <span
                className={`text-[11px] font-black font-mono-retro px-1.5 py-0.2 rounded border flex items-center gap-0.5 ${
                  timeRemainingMs <= 10000
                    ? 'bg-red-500/20 text-red-700 border-red-500/40 animate-pulse'
                    : 'bg-black/10 text-[#1E2328] border-black/20'
                }`}
              >
                <Clock className="w-3 h-3" />
                {Math.ceil(timeRemainingMs / 1000)}s
              </span>
            )}
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
          foodType={foodType}
          direction={direction}
          colors={colors}
          smoothMotion={smoothMotionEnabled}
          gameSpeed={gameSpeed}
          rankDecorationsEnabled={rankDecorationsEnabled}
          rankDecoration={rankDecoration}
        />

        {/* Fixed-height slot (h-9) directly under playfield for Bonus Countdown or Time Attack Timer */}
        <div className="w-full max-w-[440px] h-9 my-1 px-1 flex items-center justify-center">
          {bonusFood && bonusRemainingMs > 0 ? (
            <div className="w-full h-full flex items-center gap-1.5 px-2 bg-black/5 rounded-lg border border-[#3A3F44]/20">
              <Sparkles className="w-4 h-4 text-[#FFD700] animate-pulse shrink-0" />
              <div className="flex-1 h-2.5 bg-black/20 rounded-sm overflow-hidden border border-[#3A3F44]/30">
                <div
                  className={`h-full transition-all duration-100 ${
                    bonusRemainingMs <= 1500 ? 'bg-red-500 animate-pulse' : 'bg-[#FFD700]'
                  }`}
                  style={{ width: `${bonusPercent}%` }}
                />
              </div>
              <span className="text-xs font-bold font-mono-retro text-[#3A3F44] min-w-[32px] text-right tabular-nums">
                {(bonusRemainingMs / 1000).toFixed(1)}s
              </span>
            </div>
          ) : mode === 'time_attack' || timeRemainingMs !== undefined ? (
            <div
              className={`w-full h-full flex items-center justify-between px-3 rounded-lg border font-mono-retro font-bold text-sm transition-colors ${
                (timeRemainingMs ?? 0) <= 10000
                  ? 'bg-red-500/20 text-red-700 border-red-500/50 animate-pulse'
                  : 'bg-black/10 text-[#1E2328] border-[#3A3F44]/20'
              }`}
            >
              <div className="flex items-center gap-2">
                <Clock
                  className={`w-4 h-4 shrink-0 ${
                    (timeRemainingMs ?? 0) <= 10000 ? 'text-red-600' : 'text-[#3A3F44]'
                  }`}
                />
                <span className="tracking-wider uppercase text-xs">
                  {t(lang, 'mode_time_attack')}
                </span>
              </div>
              <div className="text-lg font-black tracking-widest tabular-nums">
                {((timeRemainingMs ?? 0) / 1000).toFixed(1)}s
              </div>
            </div>
          ) : (
            <div className="w-full h-full invisible" aria-hidden="true" />
          )}
        </div>

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
