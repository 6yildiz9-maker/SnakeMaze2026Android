import React from 'react';
import { GameMode, Language } from '../types.ts';
import { GAME_MODES } from '../constants/gameModes.ts';
import { t } from '../utils/translations.ts';
import { soundManager } from '../utils/soundManager.ts';
import { mazeEditorService } from '../utils/mazeEditor.ts';
import { Grid, Compass, Clock, Flame, MapPin } from 'lucide-react';

interface ModeSelectProps {
  selectedMode: GameMode;
  onSelectMode: (mode: GameMode) => void;
  selectedCustomMazeId?: string;
  onSelectCustomMaze?: (mazeId: string) => void;
  lang: Language;
}

export const ModeSelect: React.FC<ModeSelectProps> = ({
  selectedMode,
  onSelectMode,
  selectedCustomMazeId = '',
  onSelectCustomMaze,
  lang,
}) => {
  const modes: GameMode[] = ['maze', 'classic', 'time_attack', 'survival'];
  const customMazes = mazeEditorService.getCustomMazes();

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

      {/* Custom Maze Selection (FR-13-R) when Maze mode is active */}
      {selectedMode === 'maze' && customMazes.length > 0 && onSelectCustomMaze && (
        <div className="pt-1 animate-fadeIn">
          <div className="flex items-center gap-1 text-[10px] font-bold font-mono-retro text-[#3A3F44]/80 px-1 mb-0.5">
            <MapPin className="w-3 h-3 text-[#3A3F44]" />
            <span>{lang === 'tr' ? 'HARİTA SEÇİMİ:' : 'MAP SELECTION:'}</span>
          </div>
          <select
            value={selectedCustomMazeId}
            onChange={(e) => {
              soundManager.playButtonClick();
              onSelectCustomMaze(e.target.value);
            }}
            aria-label={lang === 'tr' ? 'Harita Seçimi' : 'Map Selection'}
            className="w-full p-1.5 text-xs font-mono-retro font-bold bg-white/70 border-2 border-[#3A3F44]/30 rounded-lg text-[#3A3F44] focus:outline-none focus:border-[#3A3F44] cursor-pointer"
          >
            <option value="">
              {lang === 'tr' ? 'Varsayılan (Dinamik Labirent)' : 'Default (Dynamic Maze)'}
            </option>
            {customMazes.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} ({m.obstacles.length} {lang === 'tr' ? 'engel' : 'blocks'})
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
};
