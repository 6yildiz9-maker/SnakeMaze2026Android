import React from 'react';
import { Language } from '../types.ts';
import { RankThresholds } from '../constants/gameConstants.ts';
import { t } from '../utils/translations.ts';

interface RankProgressProps {
  score: number;
  lang: Language;
}

const rankThresholds = [
  RankThresholds.WORM,
  RankThresholds.ROOKIE,
  RankThresholds.RATTLER,
  RankThresholds.MAZE_MASTER,
  RankThresholds.COBRA_KING,
  RankThresholds.LEGENDARY,
];

export const RankProgress: React.FC<RankProgressProps> = ({ score, lang }) => {
  const nextThreshold = rankThresholds.find((threshold) => score <= threshold);
  const previousThreshold = nextThreshold === undefined
    ? RankThresholds.LEGENDARY
    : rankThresholds[rankThresholds.indexOf(nextThreshold) - 1] ?? 0;
  const progress = nextThreshold === undefined
    ? 100
    : Math.max(0, Math.min(100, ((score - previousThreshold) / (nextThreshold - previousThreshold)) * 100));

  return (
    <div className="w-full font-mono-retro" aria-label={t(lang, 'rank_progress')}>
      <div className="mb-1 flex justify-between gap-2 text-xs">
        <span>{t(lang, 'rank_progress')}</span>
        <span>{nextThreshold === undefined ? t(lang, 'rank_max') : `${score} / ${nextThreshold}`}</span>
      </div>
      <div
        className="h-2 overflow-hidden rounded-full border border-[#3A3F44]/50 bg-black/10"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(progress)}
      >
        <div
          className="h-full bg-[#2E7D32] transition-[width] duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};
