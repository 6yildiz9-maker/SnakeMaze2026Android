import React from 'react';
import { ArrowLeft, Zap } from 'lucide-react';
import { ControlMode, Direction, Language, Point, ThemeColors } from '../types.ts';
import { GameLogic } from '../constants/gameConstants.ts';
import { SnakeCanvas } from './SnakeCanvas.tsx';
import { Controls } from './Controls.tsx';
import { t } from '../utils/translations.ts';

interface GameScreenProps {
  lang: Language;
  controlMode: ControlMode;
  snake: Point[];
  obstacles: Point[];
  food: Point;
  bonusFood: Point | null;
  direction: Direction;
  colors: ThemeColors;
  score: number;
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
  snake,
  obstacles,
  food,
  bonusFood,
  direction,
  colors,
  score,
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
}) => (
  <div
    className="w-full h-full flex flex-col items-center justify-between p-2 sm:p-4 max-w-md mx-auto console-case"
    style={{ touchAction: controlMode === 'swipe' ? 'none' : 'auto' }}
    onTouchStart={controlMode === 'swipe' ? onSwipeStart : undefined}
    onTouchMove={controlMode === 'swipe' ? onSwipeMove : undefined}
    onTouchEnd={controlMode === 'swipe' ? onSwipeEnd : undefined}
  >
    <div className="w-full flex items-center justify-between px-2 pt-1 pb-1">
      <button
        type="button"
        onClick={onBack}
        aria-label={t(lang, 'back')}
        className="p-2 rounded-xl bg-[#3A3F44]/10 hover:bg-[#3A3F44]/20 text-[#3A3F44] transition cursor-pointer"
      >
        <ArrowLeft className="w-6 h-6 stroke-[3]" />
      </button>
      <div className="text-2xl sm:text-3xl font-black font-mono-retro tracking-wider text-[#1E2328]">
        {t(lang, 'score', { score })}
      </div>
      <div
        className="flex items-center gap-1 text-xs sm:text-sm font-bold font-mono-retro"
        aria-label={t(lang, 'speed_label', { speed: (GameLogic.INITIAL_SPEED / gameSpeed).toFixed(1) })}
      >
        <Zap className="w-4 h-4" aria-hidden="true" />
        <span className="hidden sm:inline">
          x{(GameLogic.INITIAL_SPEED / gameSpeed).toFixed(1)}
        </span>
      </div>
    </div>

    <div className={`relative w-full flex items-center justify-center p-1 my-auto ${lcdEffectsEnabled ? 'lcd-screen' : ''}`}>
      <SnakeCanvas
        snake={snake}
        obstacles={obstacles}
        food={food}
        bonusFood={bonusFood}
        direction={direction}
        colors={colors}
        smoothMotion={smoothMotionEnabled}
        gameSpeed={gameSpeed}
        rankDecorationsEnabled={rankDecorationsEnabled}
        rankDecoration={rankDecoration}
      />
      {countdown !== null && countdown > 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-2xs rounded-lg">
          <span className="text-7xl sm:text-8xl font-black text-white font-mono-retro drop-shadow-lg animate-countdown">
            {countdown}
          </span>
        </div>
      )}
    </div>

    <div className="w-full pb-[max(0.5rem,env(safe-area-inset-bottom))]">
      <Controls
        mode={controlMode}
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
