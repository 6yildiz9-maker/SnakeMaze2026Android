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
  won: boolean;
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
  won,
  isNewHighScore,
  mode,
  onTryAgain,
  onShare,
  onHome,
}) => (
  <div className="w-full h-full flex flex-col items-center justify-center p-6 max-w-md mx-auto space-y-6">
    <div className="text-center space-y-2">
      <h2 className={`text-4xl sm:text-5xl font-black font-mono-retro tracking-widest uppercase drop-shadow-xs ${won ? 'text-[#2E7D32]' : 'text-red-600'}`}>
        {t(lang, won ? 'victory' : 'game_over')}
      </h2>
      <div className="text-2xl font-bold font-mono-retro text-[#1E2328]">
        {t(lang, 'your_score', { score })}
      </div>
      {isNewHighScore && (
        <div className="text-lg font-black font-mono-retro text-[#2E7D32]">{t(lang, 'new_high_score')}</div>
      )}
      <div className="flex items-center justify-center gap-2 flex-wrap">
        <div className="text-sm font-bold font-mono-retro text-[#2E7D32] bg-[#2E7D32]/10 py-1 px-3 rounded-full border border-[#2E7D32]/30">
          {t(lang, 'rank_label', { rank })}
        </div>
        {mode && (
          <div className="text-sm font-bold font-mono-retro text-[#3A3F44] bg-black/10 py-1 px-3 rounded-full border border-[#3A3F44]/20">
            {t(lang, GAME_MODES[mode].nameKey)}
          </div>
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
