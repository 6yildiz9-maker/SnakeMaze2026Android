import React, { useState } from 'react';
import { Point, Language } from '../types.ts';
import { GameLogic } from '../constants/gameConstants.ts';
import { mazeEditorService } from '../utils/mazeEditor.ts';
import { isPathAvailable } from '../utils/pathfinding.ts';
import { soundManager } from '../utils/soundManager.ts';
import { ArrowLeft, Save, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';

interface MazeEditorScreenProps {
  onBack: () => void;
  lang: Language;
}

export const MazeEditorScreen: React.FC<MazeEditorScreenProps> = ({ onBack, lang }) => {
  const [mazeName, setMazeName] = useState(lang === 'tr' ? 'Özel Labirent' : 'Custom Maze');
  const [obstacles, setObstacles] = useState<Point[]>([]);
  const [statusMessage, setStatusMessage] = useState<{ text: string; isError: boolean } | null>(null);

  const gridSize = GameLogic.DEFAULT_GRID_SIZE;
  const gridHeight = GameLogic.DEFAULT_GRID_HEIGHT;

  const midX = Math.floor(gridSize / 2);
  const midY = Math.floor(gridHeight / 2);
  const startHead: Point = [midX, midY];
  const startFood: Point = [midX, midY - 4];

  const toggleCell = (x: number, y: number) => {
    // Cannot place obstacle on start head or food
    if ((x === startHead[0] && y === startHead[1]) || (x === startFood[0] && y === startFood[1])) {
      return;
    }
    soundManager.playButtonClick();

    const exists = obstacles.some(([ox, oy]) => ox === x && oy === y);
    if (exists) {
      setObstacles(obstacles.filter(([ox, oy]) => ox !== x || oy !== y));
    } else {
      setObstacles([...obstacles, [x, y]]);
    }
  };

  const handleTestSolve = () => {
    soundManager.playButtonClick();
    const solvable = isPathAvailable(startHead, startFood, obstacles, gridSize, gridHeight);
    if (solvable) {
      soundManager.playBonusEat();
      setStatusMessage({
        text: lang === 'tr' ? 'Labirent çözülebilir! Yol açık.' : 'Maze is solvable! Path exists.',
        isError: false,
      });
    } else {
      soundManager.playCrash();
      setStatusMessage({
        text: lang === 'tr' ? 'Hata: Yeme ulaşan yol kapalı!' : 'Error: No path to the food!',
        isError: true,
      });
    }
  };

  const handleSave = () => {
    soundManager.playButtonClick();
    const res = mazeEditorService.saveMaze(mazeName, obstacles);
    if (res.success && res.maze) {
      soundManager.playBonusEat();
      const code = mazeEditorService.exportToBase64(res.maze);
      navigator.clipboard?.writeText(code).catch(() => {});
      setStatusMessage({
        text: lang === 'tr' ? 'Kaydedildi ve kod panoya kopyalandı!' : 'Saved and map code copied!',
        isError: false,
      });
    } else {
      soundManager.playCrash();
      setStatusMessage({
        text: res.error || 'Failed to save',
        isError: true,
      });
    }
  };

  const handleClear = () => {
    soundManager.playButtonClick();
    setObstacles([]);
    setStatusMessage(null);
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-between p-3 sm:p-4 max-w-md mx-auto text-[#3A3F44] font-nokia select-none">
      {/* Top Header */}
      <div className="w-full flex items-center justify-between">
        <button
          type="button"
          onClick={() => {
            soundManager.playButtonClick();
            onBack();
          }}
          className="p-2 rounded-xl bg-[#3A3F44]/10 hover:bg-[#3A3F44]/20 transition cursor-pointer"
        >
          <ArrowLeft className="w-6 h-6 stroke-[3]" />
        </button>
        <div className="text-xl font-black font-mono-retro tracking-wider">
          {lang === 'tr' ? 'LABİRENT EDİTÖRÜ' : 'MAZE EDITOR'}
        </div>
        <div className="w-8" />
      </div>

      {/* Name Input */}
      <div className="w-full my-2 flex items-center gap-2">
        <input
          type="text"
          value={mazeName}
          onChange={(e) => setMazeName(e.target.value)}
          placeholder={lang === 'tr' ? 'Harita Adı...' : 'Map Name...'}
          className="flex-1 py-1.5 px-3 rounded-lg border-2 border-[#3A3F44]/40 bg-white/60 font-mono-retro font-bold text-sm text-[#3A3F44] outline-hidden focus:border-[#3A3F44]"
        />
        <button
          type="button"
          onClick={handleClear}
          className="p-2 rounded-lg bg-red-600/10 text-red-700 hover:bg-red-600/20 transition cursor-pointer"
          title={lang === 'tr' ? 'Temizle' : 'Clear'}
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </div>

      {/* Grid Editor */}
      <div className="relative w-full aspect-square max-w-[380px] bg-[#C7F0D8] border-3 border-[#3A3F44] rounded-xl overflow-hidden shadow-inner grid grid-cols-20 grid-rows-20 p-1">
        {Array.from({ length: gridHeight }).map((_, y) =>
          Array.from({ length: gridSize }).map((_, x) => {
            const isObstacle = obstacles.some(([ox, oy]) => ox === x && oy === y);
            const isHead = x === startHead[0] && y === startHead[1];
            const isFood = x === startFood[0] && y === startFood[1];

            return (
              <div
                key={`${x}-${y}`}
                onClick={() => toggleCell(x, y)}
                className={`w-full h-full border-[0.5px] border-[#A2C5B1]/50 cursor-pointer flex items-center justify-center transition-colors ${
                  isObstacle
                    ? 'bg-[#3A3F44]'
                    : isHead
                    ? 'bg-[#2E7D32]'
                    : isFood
                    ? 'bg-[#D32F2F]'
                    : 'hover:bg-black/10'
                }`}
              >
                {isHead && <span className="text-[8px] text-white font-bold">S</span>}
                {isFood && <span className="text-[8px] text-white font-bold">F</span>}
              </div>
            );
          })
        )}
      </div>

      {/* Status Alert */}
      {statusMessage && (
        <div
          className={`w-full p-2 rounded-lg text-xs font-mono-retro font-bold mt-2 flex items-center gap-1.5 ${
            statusMessage.isError
              ? 'bg-red-500/15 text-red-800 border border-red-500/30'
              : 'bg-green-500/15 text-green-800 border border-green-500/30'
          }`}
        >
          {statusMessage.isError ? (
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
          ) : (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-green-600" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Action Buttons */}
      <div className="w-full flex items-center gap-2 mt-3">
        <button
          type="button"
          onClick={handleTestSolve}
          className="flex-1 py-2.5 px-3 rounded-xl border-2 border-[#3A3F44] bg-white/50 text-[#3A3F44] font-bold font-mono-retro text-sm hover:bg-white transition cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs"
        >
          <CheckCircle2 className="w-4 h-4" />
          {lang === 'tr' ? 'Test Et (BFS)' : 'Test (BFS)'}
        </button>

        <button
          type="button"
          onClick={handleSave}
          className="flex-1 py-2.5 px-3 rounded-xl border-2 border-[#3A3F44] bg-[#3A3F44] text-[#C7F0D8] font-bold font-mono-retro text-sm hover:bg-black transition cursor-pointer flex items-center justify-center gap-1.5 shadow-md"
        >
          <Save className="w-4 h-4" />
          {lang === 'tr' ? 'Kaydet & Paylaş' : 'Save & Share'}
        </button>
      </div>
    </div>
  );
};
