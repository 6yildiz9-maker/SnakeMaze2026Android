import React from 'react';
import { ButtonSize, ControlMode, DifficultyProfile, HandOrientation, Language, ThemeColors } from '../types.ts';
import { SnakeCanvas } from './SnakeCanvas.tsx';
import { soundManager } from '../utils/soundManager.ts';
import { t } from '../utils/translations.ts';
import { useDialogAccessibility } from '../hooks/useDialogAccessibility.ts';
import { STORAGE_KEYS, storage } from '../utils/storage.ts';
import { PRESET_THEMES } from '../constants/gameConstants.ts';
import { Volume2, VolumeX, Shuffle, X, Palette, Sliders, Smartphone, Gauge, Move } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  soundEnabled: boolean;
  onToggleSound: (enabled: boolean) => void;
  vibrationEnabled: boolean;
  onToggleVibration: (enabled: boolean) => void;
  difficultyProfile: DifficultyProfile;
  onSelectDifficultyProfile: (profile: DifficultyProfile) => void;
  buttonSize: ButtonSize;
  onSelectButtonSize: (size: ButtonSize) => void;
  handOrientation: HandOrientation;
  onSelectHandOrientation: (orientation: HandOrientation) => void;
  controlMode: ControlMode;
  onSelectControlMode: (mode: ControlMode) => void;
  colors: ThemeColors;
  onUpdateColors: (colors: ThemeColors) => void;
  lcdEffectsEnabled: boolean;
  onToggleLcdEffects: (enabled: boolean) => void;
  smoothMotionEnabled: boolean;
  onToggleSmoothMotion: (enabled: boolean) => void;
  musicEnabled: boolean;
  onToggleMusic: (enabled: boolean) => void;
  rankDecorationsEnabled: boolean;
  onToggleRankDecorations: (enabled: boolean) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  lang,
  soundEnabled,
  onToggleSound,
  vibrationEnabled,
  onToggleVibration,
  difficultyProfile,
  onSelectDifficultyProfile,
  buttonSize,
  onSelectButtonSize,
  handOrientation,
  onSelectHandOrientation,
  controlMode,
  onSelectControlMode,
  colors,
  onUpdateColors,
  lcdEffectsEnabled,
  onToggleLcdEffects,
  smoothMotionEnabled,
  onToggleSmoothMotion,
  musicEnabled,
  onToggleMusic,
  rankDecorationsEnabled,
  onToggleRankDecorations,
}) => {
  const dialogRef = useDialogAccessibility(isOpen, onClose);
  if (!isOpen) return null;

  const controlModesList: ControlMode[] = ['classic', 'alternative', 'swipe'];

  const cycleControlMode = () => {
    soundManager.playButtonClick();
    const currIdx = controlModesList.indexOf(controlMode);
    const nextMode = controlModesList[(currIdx + 1) % controlModesList.length];
    onSelectControlMode(nextMode);
  };

  const handleRandomColors = () => {
    soundManager.playButtonClick();
    const randomHex = () =>
      '#' +
      Math.floor(Math.random() * 16777215)
        .toString(16)
        .padStart(6, '0');

    const newColors: ThemeColors = {
      snakeHead: randomHex(),
      snakeBody: randomHex(),
      food: randomHex(),
      map: randomHex(),
      obstacle: randomHex(),
      bonusOuter: randomHex(),
      bonusInner: randomHex(),
      grid: randomHex(),
      particle: randomHex(),
    };
    onUpdateColors(newColors);
    storage.setItem(STORAGE_KEYS.usedCustomTheme, 'true');
  };

  const handleApplyPreset = (theme: typeof PRESET_THEMES[0]) => {
    soundManager.playButtonClick();
    onUpdateColors({
      snakeHead: theme.snakeHead,
      snakeBody: theme.snakeBody,
      food: theme.food,
      map: theme.map,
      obstacle: theme.obstacle,
      bonusOuter: theme.bonusOuter,
      bonusInner: theme.bonusInner,
      grid: theme.grid,
      particle: theme.particle,
    });
    // track presets used
    const used = storage.getJson<string[]>(STORAGE_KEYS.usedPresetThemes, []);
    if (!used.includes(theme.id)) {
      used.push(theme.id);
      storage.setItem(STORAGE_KEYS.usedPresetThemes, JSON.stringify(used));
      if (used.length >= PRESET_THEMES.length) {
        storage.setItem(STORAGE_KEYS.usedAllThemes, 'true');
      }
    }
  };

  const handleColorChange = (key: keyof ThemeColors, hex: string) => {
    onUpdateColors({
      ...colors,
      [key]: hex,
    });
    storage.setItem(STORAGE_KEYS.usedCustomTheme, 'true');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="settings-dialog-title" tabIndex={-1} className="relative w-full max-w-lg bg-[#C7F0D8] text-[#3A3F44] border-4 border-[#3A3F44] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90dvh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b-2 border-[#3A3F44]/20 bg-[#B5E2C8]">
          <div className="flex items-center gap-2">
            <Sliders className="w-6 h-6 text-[#3A3F44]" />
            <h2 id="settings-dialog-title" className="text-xl sm:text-2xl font-extrabold tracking-wider font-mono-retro">
              {t(lang, 'settings_title')}
            </h2>
          </div>
          <button
            type="button"
            onClick={() => {
              soundManager.playButtonClick();
              onClose();
            }}
            className="p-1 rounded-full hover:bg-black/10 transition cursor-pointer"
            aria-label={t(lang, 'close')}
          >
            <X className="w-6 h-6 text-[#3A3F44]" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {/* Audio & Haptics Section */}
          <div className="p-3.5 bg-white/40 rounded-xl border border-[#3A3F44]/20 space-y-3">
            <div className="text-xs font-bold font-mono-retro uppercase tracking-wider text-[#3A3F44]/80">
              {lang === 'tr' ? 'SES & TİTREŞİM' : 'SOUND & HAPTICS'}
            </div>
            
            {/* Sound Toggle */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                {soundEnabled ? (
                  <Volume2 className="w-5 h-5 text-[#3A3F44]" />
                ) : (
                  <VolumeX className="w-5 h-5 text-red-500" />
                )}
                <span className="font-bold font-mono-retro text-sm">
                  {t(lang, 'sound_settings')}
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={soundEnabled}
                  onChange={(e) => {
                    soundManager.playButtonClick();
                    onToggleSound(e.target.checked);
                  }}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-400 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#3A3F44]" />
              </label>
            </div>

            {/* Music Toggle */}
            <div className="flex items-center justify-between pt-1 border-t border-[#3A3F44]/15">
              <span className="font-bold font-mono-retro text-sm">
                {t(lang, 'music_settings')}
              </span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={musicEnabled}
                  onChange={(e) => {
                    soundManager.playButtonClick();
                    onToggleMusic(e.target.checked);
                  }}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-400 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#3A3F44]" />
              </label>
            </div>

            {/* Vibration Toggle */}
            <div className="flex items-center justify-between pt-1 border-t border-[#3A3F44]/15">
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-[#3A3F44]" />
                <span className="font-bold font-mono-retro text-sm">
                  {t(lang, 'vibration_setting')}
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={vibrationEnabled}
                  onChange={(e) => {
                    soundManager.playButtonClick();
                    onToggleVibration(e.target.checked);
                  }}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-400 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#3A3F44]" />
              </label>
            </div>
          </div>

          {/* Game Balance / Difficulty Profile (FR-10) */}
          <div className="p-3.5 bg-white/40 rounded-xl border border-[#3A3F44]/20 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Gauge className="w-4 h-4 text-[#3A3F44]" />
                <span className="font-bold font-mono-retro text-sm">
                  {t(lang, 'difficulty_profile')}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  soundManager.playButtonClick();
                  onSelectDifficultyProfile('modern');
                }}
                className={`p-2 rounded-lg border-2 text-xs font-bold font-mono-retro transition cursor-pointer ${
                  difficultyProfile === 'modern'
                    ? 'bg-[#3A3F44] text-[#C7F0D8] border-[#3A3F44]'
                    : 'bg-white/50 text-[#3A3F44] border-[#3A3F44]/30 hover:bg-white/80'
                }`}
              >
                {t(lang, 'profile_modern')}
              </button>
              <button
                type="button"
                onClick={() => {
                  soundManager.playButtonClick();
                  onSelectDifficultyProfile('retro');
                }}
                className={`p-2 rounded-lg border-2 text-xs font-bold font-mono-retro transition cursor-pointer ${
                  difficultyProfile === 'retro'
                    ? 'bg-[#3A3F44] text-[#C7F0D8] border-[#3A3F44]'
                    : 'bg-white/50 text-[#3A3F44] border-[#3A3F44]/30 hover:bg-white/80'
                }`}
              >
                {t(lang, 'profile_retro')}
              </button>
            </div>
            <p className="text-[11px] text-[#3A3F44]/80 font-mono-retro">
              {difficultyProfile === 'modern' ? t(lang, 'profile_modern_desc') : t(lang, 'profile_retro_desc')}
            </p>
          </div>

          {/* Control Mode & Ergonomics (FR-12) */}
          <div className="p-3.5 bg-white/40 rounded-xl border border-[#3A3F44]/20 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold font-mono-retro text-sm">
                {t(lang, 'control_mode_label')}
              </span>
              <button
                type="button"
                onClick={cycleControlMode}
                className="px-3 py-1 bg-[#3A3F44] text-[#C7F0D8] text-xs font-bold rounded-lg font-mono-retro hover:bg-black transition cursor-pointer shadow-xs"
              >
                {controlMode === 'classic' && t(lang, 'control_mode_classic')}
                {controlMode === 'alternative' && t(lang, 'control_mode_dpad')}
                {controlMode === 'swipe' && t(lang, 'control_mode_swipe')}
              </button>
            </div>

            {/* Button Size selector */}
            <div className="flex items-center justify-between pt-1 border-t border-[#3A3F44]/15">
              <span className="font-bold font-mono-retro text-xs">
                {t(lang, 'button_size')}
              </span>
              <div className="flex gap-1">
                {(['small', 'medium', 'large'] as ButtonSize[]).map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => {
                      soundManager.playButtonClick();
                      onSelectButtonSize(size);
                    }}
                    className={`px-2.5 py-1 text-[11px] font-bold rounded-md font-mono-retro transition cursor-pointer ${
                      buttonSize === size
                        ? 'bg-[#3A3F44] text-[#C7F0D8]'
                        : 'bg-white/60 text-[#3A3F44] hover:bg-white'
                    }`}
                  >
                    {size === 'small' ? t(lang, 'size_small') : size === 'large' ? t(lang, 'size_large') : t(lang, 'size_medium')}
                  </button>
                ))}
              </div>
            </div>

            {/* Hand Orientation (left/right mirroring) */}
            <div className="flex items-center justify-between pt-1 border-t border-[#3A3F44]/15">
              <div className="flex items-center gap-1.5">
                <Move className="w-3.5 h-3.5 text-[#3A3F44]" />
                <span className="font-bold font-mono-retro text-xs">
                  {t(lang, 'hand_orientation')}
                </span>
              </div>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => {
                    soundManager.playButtonClick();
                    onSelectHandOrientation('right');
                  }}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded-md font-mono-retro transition cursor-pointer ${
                    handOrientation === 'right'
                      ? 'bg-[#3A3F44] text-[#C7F0D8]'
                      : 'bg-white/60 text-[#3A3F44] hover:bg-white'
                  }`}
                >
                  {t(lang, 'hand_right')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    soundManager.playButtonClick();
                    onSelectHandOrientation('left');
                  }}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded-md font-mono-retro transition cursor-pointer ${
                    handOrientation === 'left'
                      ? 'bg-[#3A3F44] text-[#C7F0D8]'
                      : 'bg-white/60 text-[#3A3F44] hover:bg-white'
                  }`}
                >
                  {t(lang, 'hand_left')}
                </button>
              </div>
            </div>

            <div className="text-xs text-[#3A3F44]/80 font-mono-retro pt-1">
              {controlMode === 'classic' &&
                (lang === 'tr'
                  ? 'Klasik 2 tuş: Sol ve Sağ yönü sol/aşağı veya sağ/yukarı döndürür.'
                  : 'Classic 2-button: Turn left/down or right/up relative to movement.')}
              {controlMode === 'alternative' &&
                (lang === 'tr'
                  ? 'D-Pad 4 tuş: Yukarı, Aşağı, Sol, Sağ tam yön kontrolü.'
                  : 'D-Pad 4-button: Full directional Up, Down, Left, Right control.')}
              {controlMode === 'swipe' &&
                (lang === 'tr'
                  ? 'Kaydırma modu: Ekranda istediğiniz yöne kaydırın veya klavye kullanın.'
                  : 'Swipe mode: Touch/pointer gestures or keyboard WASD / Arrows.')}
            </div>
          </div>

          {/* Visual Settings */}
          <div className="p-3.5 bg-white/40 rounded-xl border border-[#3A3F44]/20 space-y-2 font-mono-retro">
            <div className="text-xs font-bold uppercase tracking-wider text-[#3A3F44]/80">
              {lang === 'tr' ? 'GÖRSEL EFEKTLER' : 'VISUAL EFFECTS'}
            </div>
            <label className="flex items-center justify-between text-sm font-bold cursor-pointer">
              <span>{t(lang, 'lcd_effects')}</span>
              <input
                type="checkbox"
                checked={lcdEffectsEnabled}
                onChange={(event) => onToggleLcdEffects(event.target.checked)}
                className="w-4 h-4 cursor-pointer accent-[#3A3F44]"
                aria-label={t(lang, 'lcd_effects')}
              />
            </label>
            <label className="flex items-center justify-between text-sm font-bold cursor-pointer pt-1 border-t border-[#3A3F44]/15">
              <span>{t(lang, 'smooth_motion')}</span>
              <input
                type="checkbox"
                checked={smoothMotionEnabled}
                onChange={(event) => onToggleSmoothMotion(event.target.checked)}
                className="w-4 h-4 cursor-pointer accent-[#3A3F44]"
                aria-label={t(lang, 'smooth_motion')}
              />
            </label>
            <label className="flex items-center justify-between text-sm font-bold cursor-pointer pt-1 border-t border-[#3A3F44]/15">
              <span>{t(lang, 'rank_decorations')}</span>
              <input
                type="checkbox"
                checked={rankDecorationsEnabled}
                onChange={(event) => onToggleRankDecorations(event.target.checked)}
                className="w-4 h-4 cursor-pointer accent-[#3A3F44]"
                aria-label={t(lang, 'rank_decorations')}
              />
            </label>
          </div>

          {/* Live Theme Preview */}
          <div className="flex flex-col items-center p-3.5 bg-white/40 rounded-xl border border-[#3A3F44]/20 space-y-3">
            <span className="text-xs font-bold font-mono-retro uppercase tracking-wider text-[#3A3F44]">
              {lang === 'tr' ? 'CANLI TEMA ÖNİZLEMESİ' : 'LIVE THEME PREVIEW'}
            </span>
            <div className="w-44 h-44 rounded-lg overflow-hidden border-2 border-[#3A3F44] shadow-md flex items-center justify-center">
              <SnakeCanvas
                snake={[]}
                obstacles={[]}
                food={[0, 0]}
                bonusFood={null}
                direction="UP"
                colors={colors}
                isPreview={true}
              />
            </div>

            {/* Presets */}
            <div className="w-full pt-2">
              <div className="text-xs font-bold font-mono-retro mb-2 text-center">
                {t(lang, 'preset_themes')}
              </div>
              <div className="flex flex-wrap justify-center gap-1.5">
                {PRESET_THEMES.map((theme) => (
                  <button
                    key={theme.id}
                    type="button"
                    onClick={() => handleApplyPreset(theme)}
                    className="px-2.5 py-1 text-xs font-bold rounded-lg border border-[#3A3F44]/30 hover:bg-black/10 transition cursor-pointer font-mono-retro flex items-center gap-1.5"
                    style={{ backgroundColor: theme.map, color: theme.snakeBody }}
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full inline-block"
                      style={{ backgroundColor: theme.food }}
                    />
                    {theme.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Color Customizers */}
          <div className="p-3.5 bg-white/40 rounded-xl border border-[#3A3F44]/20 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Palette className="w-5 h-5 text-[#3A3F44]" />
                <span className="font-bold font-mono-retro text-base">
                  {t(lang, 'customize_theme')}
                </span>
              </div>
              <button
                type="button"
                onClick={handleRandomColors}
                className="px-2.5 py-1 bg-[#3A3F44] text-[#C7F0D8] text-xs font-bold rounded-lg font-mono-retro hover:bg-black transition flex items-center gap-1 cursor-pointer"
              >
                <Shuffle className="w-3.5 h-3.5" />
                {t(lang, 'settings_random_color')}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {/* Snake Head */}
              <div className="p-2 bg-white/60 rounded-lg border border-[#3A3F44]/15 flex items-center justify-between">
                <span className="text-xs font-bold font-mono-retro truncate">
                  {t(lang, 'settings_set_head_color')}
                </span>
                <input
                  type="color"
                  value={colors.snakeHead}
                  onChange={(e) => handleColorChange('snakeHead', e.target.value)}
                  className="w-7 h-7 rounded-sm border border-[#3A3F44] cursor-pointer"
                />
              </div>

              {/* Snake Body */}
              <div className="p-2 bg-white/60 rounded-lg border border-[#3A3F44]/15 flex items-center justify-between">
                <span className="text-xs font-bold font-mono-retro truncate">
                  {t(lang, 'settings_set_body_color')}
                </span>
                <input
                  type="color"
                  value={colors.snakeBody}
                  onChange={(e) => handleColorChange('snakeBody', e.target.value)}
                  className="w-7 h-7 rounded-sm border border-[#3A3F44] cursor-pointer"
                />
              </div>

              {/* Food Color */}
              <div className="p-2 bg-white/60 rounded-lg border border-[#3A3F44]/15 flex items-center justify-between">
                <span className="text-xs font-bold font-mono-retro truncate">
                  {t(lang, 'settings_set_food_color')}
                </span>
                <input
                  type="color"
                  value={colors.food}
                  onChange={(e) => handleColorChange('food', e.target.value)}
                  className="w-7 h-7 rounded-sm border border-[#3A3F44] cursor-pointer"
                />
              </div>

              {/* Map Board Color */}
              <div className="p-2 bg-white/60 rounded-lg border border-[#3A3F44]/15 flex items-center justify-between">
                <span className="text-xs font-bold font-mono-retro truncate">
                  {t(lang, 'settings_set_map_color')}
                </span>
                <input
                  type="color"
                  value={colors.map}
                  onChange={(e) => handleColorChange('map', e.target.value)}
                  className="w-7 h-7 rounded-sm border border-[#3A3F44] cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Version */}
          <div className="text-center text-xs font-mono-retro opacity-70 italic">
            {t(lang, 'version_label', { ver: __APP_VERSION__ })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#3A3F44]/20 bg-[#B5E2C8] flex justify-end">
          <button
            type="button"
            onClick={() => {
              soundManager.playButtonClick();
              onClose();
            }}
            className="px-6 py-2.5 bg-[#3A3F44] hover:bg-black text-[#C7F0D8] font-bold rounded-xl font-mono-retro tracking-wider cursor-pointer transition shadow-md"
          >
            {t(lang, 'close')}
          </button>
        </div>
      </div>
    </div>
  );
};
