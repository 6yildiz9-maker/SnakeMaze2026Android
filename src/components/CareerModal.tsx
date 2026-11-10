import React from 'react';
import { Language } from '../types.ts';
import { achievementsManager, ALL_ACHIEVEMENTS } from '../utils/achievementsManager.ts';
import { t } from '../utils/translations.ts';
import { soundManager } from '../utils/soundManager.ts';
import { formatDuration } from '../utils/formatDuration.ts';
import { useDialogAccessibility } from '../hooks/useDialogAccessibility.ts';
import { Trophy, X } from 'lucide-react';
import { RankProgress } from './RankProgress.tsx';
import { AchievementIcon } from './AchievementIcon.tsx';
import { QuestPanel } from './QuestPanel.tsx';
import { questManager } from '../utils/quests.ts';
import { careerManager } from '../utils/career.ts';

interface CareerModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  highScore: number;
  totalFood: number;
  totalPlayTime: number;
}

export const CareerModal: React.FC<CareerModalProps> = ({
  isOpen,
  onClose,
  lang,
  highScore,
  totalFood,
  totalPlayTime,
}) => {
  const dialogRef = useDialogAccessibility(isOpen, onClose);
  if (!isOpen) return null;

  const currentRank = achievementsManager.getRank(highScore, lang);
  const unlockedCount = ALL_ACHIEVEMENTS.filter((a) => achievementsManager.isUnlocked(a.id)).length;
  const careerStats = careerManager.getStats();
  const dailyQuests = questManager.getDailyQuests();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="career-dialog-title" tabIndex={-1} className="relative w-full max-w-lg bg-[#C7F0D8] text-[#3A3F44] border-4 border-[#3A3F44] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90dvh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b-2 border-[#3A3F44]/20 bg-[#B5E2C8]">
          <div className="flex items-center gap-2">
            <Trophy className="w-6 h-6 text-[#3A3F44]" />
            <h2 id="career-dialog-title" className="text-xl sm:text-2xl font-extrabold tracking-wider font-mono-retro">
              {t(lang, 'career_title')}
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

        {/* Scrollable Container */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {/* Stats Row */}
          <div className="bg-black/5 p-3 rounded-xl border border-[#3A3F44]/20 grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
            <div className="bg-white/40 p-2.5 rounded-lg border border-[#3A3F44]/15">
              <div className="text-[10px] uppercase tracking-wide font-bold opacity-75 font-mono-retro">
                {lang === 'tr' ? 'EN YÜKSEK' : 'HIGH SCORE'}
              </div>
              <div className="text-xl sm:text-2xl font-black font-mono-retro text-[#1E2328]">
                {highScore}
              </div>
            </div>

            <div className="bg-white/40 p-2.5 rounded-lg border border-[#3A3F44]/15">
              <div className="text-[10px] uppercase tracking-wide font-bold opacity-75 font-mono-retro">
                {lang === 'tr' ? 'TOPLAM YEMEK' : 'TOTAL FOOD'}
              </div>
              <div className="text-xl sm:text-2xl font-black font-mono-retro text-[#1E2328]">
                {totalFood}
              </div>
            </div>

            <div className="bg-white/40 p-2.5 rounded-lg border border-[#3A3F44]/15">
              <div className="text-[10px] uppercase tracking-wide font-bold opacity-75 font-mono-retro">
                {t(lang, 'play_time')}
              </div>
              <div className="text-base sm:text-lg font-black font-mono-retro text-[#1E2328]">
                {formatDuration(totalPlayTime, lang)}
              </div>
            </div>

            <div className="bg-white/40 p-2.5 rounded-lg border border-[#3A3F44]/15">
              <div className="text-[10px] uppercase tracking-wide font-bold opacity-75 font-mono-retro">
                {t(lang, 'rank_label', { rank: '' }).replace(':', '')}
              </div>
              <div className="text-xs font-bold font-mono-retro truncate text-[#1E2328] mt-1">
                {currentRank}
              </div>
            </div>
          </div>

          {/* Secondary Stats (FR-17) */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-white/40 p-2 rounded-lg border border-[#3A3F44]/15">
              <div className="text-[10px] font-bold font-mono-retro opacity-75">
                {t(lang, 'longest_snake')}
              </div>
              <div className="text-lg font-black font-mono-retro text-[#1E2328]">
                {careerStats.longestSnake}
              </div>
            </div>

            <div className="bg-white/40 p-2 rounded-lg border border-[#3A3F44]/15">
              <div className="text-[10px] font-bold font-mono-retro opacity-75">
                {t(lang, 'highest_level')}
              </div>
              <div className="text-lg font-black font-mono-retro text-[#1E2328]">
                Lvl {careerStats.highestLevel}
              </div>
            </div>

            <div className="bg-white/40 p-2 rounded-lg border border-[#3A3F44]/15">
              <div className="text-[10px] font-bold font-mono-retro opacity-75">
                {t(lang, 'avg_duration')}
              </div>
              <div className="text-lg font-black font-mono-retro text-[#1E2328]">
                {careerStats.averageGameDurationSeconds}s
              </div>
            </div>
          </div>

          {/* Extended Career Analytics (FR-17-R) */}
          <div className="bg-black/5 p-3 rounded-xl border border-[#3A3F44]/20 space-y-2">
            <div className="text-xs font-bold font-mono-retro uppercase tracking-wider text-[#3A3F44] border-b border-[#3A3F44]/20 pb-1 flex justify-between">
              <span>{lang === 'tr' ? 'KARİYER DETAYLARI' : 'CAREER ANALYTICS'}</span>
              <span className="text-[10px] font-normal">{careerStats.mostUsedTheme}</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="bg-white/40 p-2 rounded-lg border border-[#3A3F44]/15">
                <div className="text-[10px] font-bold font-mono-retro opacity-75">
                  {lang === 'tr' ? 'BONUS BAŞARISI' : 'BONUS SUCCESS'}
                </div>
                <div className="text-base font-black font-mono-retro text-[#1E2328]">
                  %{careerStats.bonusSuccessRate}{' '}
                  <span className="text-[10px] font-bold opacity-70">
                    ({careerStats.bonusFoodsCaught}/{careerStats.bonusFoodsSpawned})
                  </span>
                </div>
              </div>

              <div className="bg-white/40 p-2 rounded-lg border border-[#3A3F44]/15">
                <div className="text-[10px] font-bold font-mono-retro opacity-75">
                  {lang === 'tr' ? 'GÜNLÜK / HAFTALIK' : 'DAILY / WEEKLY'}
                </div>
                <div className="text-base font-black font-mono-retro text-[#1E2328]">
                  {careerStats.dailyRecord.score} / {careerStats.weeklyRecord.score}
                </div>
              </div>
            </div>

            {/* Mode High Scores (FR-13-R) */}
            <div className="pt-1">
              <div className="text-[10px] font-bold font-mono-retro opacity-75 mb-1">
                {lang === 'tr' ? 'MOD BAZLI REKORLAR:' : 'MODE RECORDS:'}
              </div>
              <div className="grid grid-cols-4 gap-1.5 text-center">
                <div className="bg-white/50 p-1.5 rounded-md border border-[#3A3F44]/15">
                  <div className="text-[9px] font-bold font-mono-retro opacity-75 uppercase">
                    {lang === 'tr' ? 'Labirent' : 'Maze'}
                  </div>
                  <div className="text-sm font-black font-mono-retro text-[#1E2328]">
                    {careerStats.modeHighScores.maze}
                  </div>
                </div>
                <div className="bg-white/50 p-1.5 rounded-md border border-[#3A3F44]/15">
                  <div className="text-[9px] font-bold font-mono-retro opacity-75 uppercase">
                    {lang === 'tr' ? 'Klasik' : 'Classic'}
                  </div>
                  <div className="text-sm font-black font-mono-retro text-[#1E2328]">
                    {careerStats.modeHighScores.classic}
                  </div>
                </div>
                <div className="bg-white/50 p-1.5 rounded-md border border-[#3A3F44]/15">
                  <div className="text-[9px] font-bold font-mono-retro opacity-75 uppercase">
                    {lang === 'tr' ? 'Zamana K.' : 'Time Att.'}
                  </div>
                  <div className="text-sm font-black font-mono-retro text-[#1E2328]">
                    {careerStats.modeHighScores.time_attack}
                  </div>
                </div>
                <div className="bg-white/50 p-1.5 rounded-md border border-[#3A3F44]/15">
                  <div className="text-[9px] font-bold font-mono-retro opacity-75 uppercase">
                    {lang === 'tr' ? 'Hayatta K.' : 'Survival'}
                  </div>
                  <div className="text-sm font-black font-mono-retro text-[#1E2328]">
                    {careerStats.modeHighScores.survival}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Rank Progress Bar */}
          <div className="bg-white/40 p-3 rounded-xl border border-[#3A3F44]/20">
            <RankProgress score={highScore} lang={lang} />
          </div>

          {/* Daily Quests (FR-15) */}
          <QuestPanel quests={dailyQuests} lang={lang} />

          {/* Achievements Progress bar */}
          <div className="pt-2">
            <div className="px-3 py-2 bg-black/10 rounded-lg flex items-center justify-between text-xs font-bold font-mono-retro mb-2">
              <span>{lang === 'tr' ? 'BAŞARIMLAR' : 'ACHIEVEMENTS'}</span>
              <span>
                {unlockedCount} / {ALL_ACHIEVEMENTS.length}
              </span>
            </div>

            {/* Achievements List */}
            <div className="space-y-2">
          {ALL_ACHIEVEMENTS.map((item) => {
            const isUnlocked = achievementsManager.isUnlocked(item.id);
            return (
              <div
                key={item.id}
                className={`p-3.5 rounded-xl border flex items-start gap-3 transition-all ${
                  isUnlocked
                    ? 'bg-[#C8E6C9] border-[#2E7D32]/40 text-black shadow-xs'
                    : 'bg-[#2B2E33] border-black/40 text-[#9E9E9E]'
                }`}
              >
                <AchievementIcon achievementId={item.id} isUnlocked={isUnlocked} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-sm font-bold font-mono-retro tracking-wide ${
                        isUnlocked ? 'text-black' : 'text-[#CCCCCC]'
                      }`}
                    >
                      {t(lang, item.nameKey)}
                    </span>
                    {isUnlocked && (
                      <span className="text-[10px] uppercase font-bold bg-[#2E7D32]/20 text-[#1B5E20] px-1.5 py-0.5 rounded-sm">
                        {lang === 'tr' ? 'Açıldı' : 'Unlocked'}
                      </span>
                    )}
                  </div>
                  <p
                    className={`text-xs mt-0.5 leading-relaxed ${
                      isUnlocked ? 'text-[#2D3748]' : 'text-[#888888]'
                    }`}
                  >
                    {t(lang, item.descKey)}
                  </p>
                </div>
              </div>
            );
          })}
            </div>
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
