import React from 'react';
import { Home, Play } from 'lucide-react';
import { Language } from '../types.ts';
import { t } from '../utils/translations.ts';

interface PauseScreenProps {
  lang: Language;
  score: number;
  onResume: () => void;
  onHome: () => void;
}

export const PauseScreen: React.FC<PauseScreenProps> = ({ lang, score, onResume, onHome }) => (
  <div className="w-full h-full flex flex-col items-center justify-center p-6 max-w-md mx-auto space-y-6">
    <div className="text-center">
      <h2 className="text-3xl sm:text-4xl font-black font-mono-retro tracking-widest text-[#3A3F44] uppercase">
        {t(lang, 'game_paused_title')}
      </h2>
      <div className="text-xl font-bold font-mono-retro mt-2">{t(lang, 'score', { score })}</div>
    </div>
    <div className="w-full space-y-3 max-w-xs">
      <button
        type="button"
        onClick={onResume}
        className="w-full py-4 px-6 rounded-xl border-3 border-[#3A3F44] bg-[#3A3F44] text-[#C7F0D8] hover:bg-black font-black font-mono-retro text-lg tracking-wider transition cursor-pointer shadow-md flex items-center justify-center gap-2"
      >
        <Play className="w-5 h-5 fill-current" />
        {t(lang, 'resume_game')}
      </button>
      <button
        type="button"
        onClick={onHome}
        className="w-full py-4 px-6 rounded-xl border-3 border-[#3A3F44] bg-transparent text-[#3A3F44] hover:bg-[#3A3F44] hover:text-white font-black font-mono-retro text-lg tracking-wider transition cursor-pointer shadow-sm flex items-center justify-center gap-2"
      >
        <Home className="w-5 h-5" />
        {t(lang, 'main_menu')}
      </button>
    </div>
  </div>
);
