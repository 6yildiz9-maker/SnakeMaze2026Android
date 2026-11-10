import React from 'react';
import { Home, RotateCcw, Share2 } from 'lucide-react';
import { Language, GameMode } from '../types.ts';
import { t } from '../utils/translations.ts';
import { GAME_MODES } from '../constants/gameModes.ts';
import { RankProgress } from './RankProgress.tsx';

interface GameOverScreenProps {
  lang: Language;
  score: number;
  rank: string;
  won?: boolean;
  outcome?: 'lost' | 'won' | 'time_up';
  isNewHighScore: boolean;
  mode?: GameMode;
  onTryAgain: () => void;
  onShare: () => void;
  onHome: () => void;
}

export const GameOverScreen: React.FC<GameOverScreenProps> = ({
  lang,
  score,
  rank,
  won = false,
  outcome,
  isNewHighScore,
  mode,
  onTryAgain,
  onShare,
  onHome,
}) => {
  const finalOutcome = outcome ?? (won ? 'won' : 'lost');

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-6 max-w-md mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h2
          className={`text-4xl sm:text-5xl font-black font-mono-retro tracking-widest uppercase drop-shadow-xs ${
            finalOutcome === 'won'
              ? 'text-[#2E7D32]'
              : finalOutcome === 'time_up'
              ? 'text-amber-600'
              : 'text-red-600'
          }`}
        >
          {t(
            lang,
            finalOutcome === 'won'
              ? 'victory'
              : finalOutcome === 'time_up'
              ? 'time_up_title'
              : 'game_over'
          )}
        </h2>
        {finalOutcome === 'time_up' && (
          <p className="text-sm font-mono-retro font-semibold text-[#3A3F44]/80">
            {t(lang, 'time_up_subtitle')}
          </p>
        )}
        <div className="text-2xl font-bold font-mono-retro text-[#1E2328]">
          {t(lang, 'your_score', { score })}
        </div>
        {isNewHighScore && (
          <div className="text-lg font-black font-mono-retro text-[#2E7D32]">{t(lang, 'new_high_score')}</div>
        )}
        <div className="flex items-center justify-center gap-2 text-sm font-bold font-mono-retro text-[#3A3F44]/90">
          <span>{t(lang, 'rank_label', { rank })}</span>
          {mode && (
            <>
              <span aria-hidden="true">·</span>
              <span>{t(lang, GAME_MODES[mode].nameKey)}</span>
            </>
          )}
        </div>
        <RankProgress score={score} lang={lang} />
      </div>

    <div className="w-full space-y-3 max-w-xs">
      <button
        type="button"
        onClick={onTryAgain}
        className="w-full py-3.5 px-6 rounded-xl border-3 border-[#3A3F44] bg-[#3A3F44] text-[#C7F0D8] hover:bg-black font-black font-mono-retro text-lg tracking-wider transition cursor-pointer shadow-md flex items-center justify-center gap-2"
      >
        <RotateCcw className="w-5 h-5" />
        {t(lang, 'try_again')}
      </button>
      {score > 0 && (
        <button
          type="button"
          onClick={onShare}
          className="w-full py-3.5 px-6 rounded-xl border-2 border-[#3A3F44] bg-white/40 hover:bg-white text-[#3A3F44] font-bold font-mono-retro text-base tracking-wider transition cursor-pointer shadow-xs flex items-center justify-center gap-2"
        >
          <Share2 className="w-5 h-5" />
          {t(lang, 'share_score')}
        </button>
      )}
      <button
        type="button"
        onClick={onHome}
        className="w-full py-3.5 px-6 rounded-xl border-2 border-[#3A3F44]/50 hover:bg-black/10 text-[#3A3F44] font-bold font-mono-retro text-base tracking-wider transition cursor-pointer flex items-center justify-center gap-2"
      >
        <Home className="w-5 h-5" />
        {t(lang, 'main_menu')}
      </button>
    </div>
  </div>
);
};
