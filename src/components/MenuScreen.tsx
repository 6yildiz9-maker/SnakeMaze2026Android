import React from 'react';
import { Globe, Play, Sliders, Trophy, Grid } from 'lucide-react';
import { GameMode, Language } from '../types.ts';
import { t } from '../utils/translations.ts';
import { soundManager } from '../utils/soundManager.ts';
import { ModeSelect } from './ModeSelect.tsx';
import { isCapacitor } from '../utils/platform.ts';
import { adService } from '../utils/ads.ts';

interface MenuScreenProps {
  lang: Language;
  highScore: number;
  hasSavedGame: boolean;
  selectedMode: GameMode;
  onSelectMode: (mode: GameMode) => void;
  selectedCustomMazeId?: string;
  onSelectCustomMaze?: (mazeId: string) => void;
  onToggleLang: () => void;
  onNewGame: () => void;
  onResume: () => void;
  onCareer: () => void;
  onSettings: () => void;
  onMazeEditor: () => void;
  onSupportRewarded?: () => void;
  onAdNotReady?: () => void;
}

export const MenuScreen: React.FC<MenuScreenProps> = ({
  lang,
  highScore,
  hasSavedGame,
  selectedMode,
  onSelectMode,
  selectedCustomMazeId,
  onSelectCustomMaze,
  onToggleLang,
  onNewGame,
  onResume,
  onCareer,
  onSettings,
  onMazeEditor,
  onSupportRewarded,
  onAdNotReady,
}) => {
  const isNative = isCapacitor();

  const handleWatchAdClick = async () => {
    soundManager.playButtonClick();
    await adService.showRewarded(
      () => {
        onSupportRewarded?.();
      },
      () => {
        onAdNotReady?.();
      }
    );
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-between p-3 sm:p-6 max-w-md mx-auto overflow-y-auto">
      <div className="w-full flex justify-end">
        <button
          type="button"
          onClick={onToggleLang}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#3A3F44] text-[#C7F0D8] rounded-lg font-bold font-mono-retro text-sm hover:bg-black transition cursor-pointer shadow-md"
        >
          <Globe className="w-4 h-4" />
          <span>{lang.toUpperCase()}</span>
        </button>
      </div>

      <div className="text-center my-auto py-2">
        <h1 className="text-3xl sm:text-5xl font-black tracking-widest text-[#3A3F44] font-mono-retro uppercase drop-shadow-xs">
          {t(lang, 'title_name')}
        </h1>
        <div className="mt-2 text-base sm:text-xl font-bold font-mono-retro tracking-wider text-[#1E2328]">
          {t(lang, 'high_score', { score: highScore })}
        </div>
      </div>

      {/* Mode Selector with Custom Maze support */}
      <ModeSelect
        selectedMode={selectedMode}
        onSelectMode={onSelectMode}
        selectedCustomMazeId={selectedCustomMazeId}
        onSelectCustomMaze={onSelectCustomMaze}
        lang={lang}
      />

      <div className="w-full space-y-2.5 max-w-xs mb-3">
        <button type="button" onClick={onNewGame} className="menu-button">
          {t(lang, 'new_game')}
        </button>
        {hasSavedGame && (
          <button type="button" onClick={onResume} className="menu-button flex items-center justify-center gap-2">
            <Play className="w-5 h-5 fill-current" />
            {t(lang, 'resume_game')}
          </button>
        )}
        <button type="button" onClick={onCareer} className="menu-button flex items-center justify-center gap-2">
          <Trophy className="w-5 h-5" />
          {t(lang, 'career')}
        </button>
        <button type="button" onClick={onMazeEditor} className="menu-button flex items-center justify-center gap-2">
          <Grid className="w-5 h-5" />
          {t(lang, 'maze_editor')}
        </button>
        <button type="button" onClick={onSettings} className="menu-button flex items-center justify-center gap-2">
          <Sliders className="w-5 h-5" />
          {t(lang, 'settings')}
        </button>
      </div>

      <div className="w-full max-w-xs text-center pt-1 pb-1">
        {isNative ? (
          <>
            <span id="support-description" className="text-[11px] text-[#3A3F44]/70 font-mono-retro block mb-1">
              {t(lang, 'ad_support_desc')}
            </span>
            <button
              type="button"
              onClick={handleWatchAdClick}
              aria-label={t(lang, 'watch_rewarded_ad')}
              aria-describedby="support-description"
              className="w-full py-2 px-4 rounded-lg border-2 border-[#3A3F44]/60 bg-black/5 hover:bg-[#3A3F44] text-[#3A3F44] hover:text-[#C7F0D8] font-bold font-mono-retro text-xs sm:text-sm tracking-wider transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <Trophy className="w-4 h-4 text-amber-600" />
              {t(lang, 'watch_rewarded_ad')}
            </button>
          </>
        ) : (
          <>
            <span id="support-description" className="text-[11px] text-[#3A3F44]/70 font-mono-retro block mb-1">
              {t(lang, 'support_developer')}
            </span>
            <a
              href="https://github.com/6yildiz9-maker/SnakeMaze2026Android"
              target="_blank"
              rel="noreferrer"
              onClick={() => soundManager.playButtonClick()}
              aria-label={t(lang, 'support_developer')}
              aria-describedby="support-description"
              className="w-full py-2 px-4 rounded-lg border-2 border-[#3A3F44]/60 bg-black/5 hover:bg-[#3A3F44] text-[#3A3F44] hover:text-[#C7F0D8] font-bold font-mono-retro text-xs sm:text-sm tracking-wider transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <Trophy className="w-4 h-4" />
              {t(lang, 'support_star')}
            </a>
          </>
        )}
      </div>
    </div>
  );
};
