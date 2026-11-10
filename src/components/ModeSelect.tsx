import React from 'react';
import { GameMode, Language } from '../types.ts';
import { GAME_MODES } from '../constants/gameModes.ts';
import { t } from '../utils/translations.ts';
import { soundManager } from '../utils/soundManager.ts';
import { Grid, Compass, Clock, Flame } from 'lucide-react';

interface ModeSelectProps {
  selectedMode: GameMode;
  onSelectMode: (mode: GameMode) => void;
  lang: Language;
}

export const ModeSelect: React.FC<ModeSelectProps> = ({
  selectedMode,
  onSelectMode,
  lang,
}) => {
  const modes: GameMode[] = ['maze', 'classic', 'time_attack', 'survival'];

  const getIcon = (mode: GameMode) => {
    switch (mode) {
      case 'maze':
        return <Grid className="w-4 h-4" />;
      case 'classic':
        return <Compass className="w-4 h-4" />;
      case 'time_attack':
        return <Clock className="w-4 h-4" />;
      case 'survival':
        return <Flame className="w-4 h-4" />;
    }
  };

  return (
    <div className="w-full max-w-xs space-y-1 mb-3">
      <div className="text-[11px] font-bold font-mono-retro tracking-wider text-[#3A3F44]/80 text-center uppercase">
        {lang === 'tr' ? 'OYUN MODU' : 'GAME MODE'}
      </div>
      <div className="grid grid-cols-2 gap-1.5">
        {modes.map((mode) => {
          const cfg = GAME_MODES[mode];
          const isSelected = selectedMode === mode;
          return (
            <button
              key={mode}
              type="button"
              onClick={() => {
                soundManager.playButtonClick();
                onSelectMode(mode);
              }}
              className={`p-2 rounded-lg border-2 text-xs font-bold font-mono-retro flex items-center justify-center gap-1.5 transition cursor-pointer shadow-2xs ${
                isSelected
                  ? 'bg-[#3A3F44] text-[#C7F0D8] border-[#3A3F44]'
                  : 'bg-white/40 text-[#3A3F44] border-[#3A3F44]/30 hover:bg-white/70'
              }`}
            >
              {getIcon(mode)}
              <span>{t(lang, cfg.nameKey)}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
