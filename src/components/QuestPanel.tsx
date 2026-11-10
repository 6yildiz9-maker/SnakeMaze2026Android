import React from 'react';
import { Quest } from '../utils/quests.ts';
import { Language } from '../types.ts';
import { t } from '../utils/translations.ts';
import { CheckCircle2, Clock, Calendar } from 'lucide-react';

interface QuestPanelProps {
  quests: Quest[];
  lang: Language;
}

export const QuestPanel: React.FC<QuestPanelProps> = ({ quests, lang }) => {
  return (
    <div className="w-full space-y-2 mt-4">
      <div className="flex items-center justify-between text-xs font-bold font-mono-retro text-[#3A3F44]/90 px-1">
        <div className="flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-[#3A3F44]" />
          <span>{lang === 'tr' ? 'GÜNLÜK GÖREVLER' : 'DAILY QUESTS'}</span>
        </div>
        <div className="flex items-center gap-1 text-[10px] opacity-75">
          <Clock className="w-3 h-3" />
          <span>{lang === 'tr' ? 'Her gün sıfırlanır' : 'Resets daily'}</span>
        </div>
      </div>

      <div className="space-y-2">
        {quests.map((q) => {
          const percent = Math.min(100, Math.round((q.current / q.target) * 100));
          return (
            <div
              key={q.id}
              className={`p-2.5 rounded-lg border text-xs font-mono-retro transition-all ${
                q.completed
                  ? 'bg-[#C8E6C9] border-[#2E7D32]/30 text-black'
                  : 'bg-white/40 border-[#3A3F44]/20 text-[#3A3F44]'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold flex items-center gap-1.5">
                  {q.completed ? (
                    <CheckCircle2 className="w-4 h-4 text-[#2E7D32]" />
                  ) : (
                    <span className="w-2 h-2 rounded-full bg-[#3A3F44]/50" />
                  )}
                  {t(lang, q.titleKey)}
                </span>
                <span className="font-bold">
                  {q.current} / {q.target}
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full h-1.5 bg-black/10 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    q.completed ? 'bg-[#2E7D32]' : 'bg-[#3A3F44]'
                  }`}
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
