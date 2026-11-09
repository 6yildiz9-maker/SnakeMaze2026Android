import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Direction,
  Point,
  ControlMode,
  Language,
  ThemeColors,
  GameOverData,
  GameData,
} from './types.ts';
import {
  GameLogic,
  DefaultColors,
} from './constants/gameConstants.ts';
import { SnakeCanvas } from './components/SnakeCanvas.tsx';
import { Controls } from './components/Controls.tsx';
import { CareerModal } from './components/CareerModal.tsx';
import { SettingsModal } from './components/SettingsModal.tsx';
import { AdModal } from './components/AdModal.tsx';
import { Toast, ToastMessage } from './components/Toast.tsx';
import { soundManager } from './utils/soundManager.ts';
import { achievementsManager } from './utils/achievementsManager.ts';
import { vibrate } from './utils/haptics.ts';
import { t } from './utils/translations.ts';
import confetti from 'canvas-confetti';
import {
  ArrowLeft,
  Trophy,
  Sliders,
  Play,
  RotateCcw,
  Share2,
  Tv,
  Globe,
  Home,
} from 'lucide-react';

type Screen = 'menu' | 'game' | 'pause' | 'game_over';

export const App: React.FC = () => {
  // Localization & Settings
  const [lang, setLang] = useState<Language>(() => {
    const saved = localStorage.getItem('My_Lang');
    return (saved === 'en' || saved === 'tr') ? saved : 'en';
  });

  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    return soundManager.getSoundEnabled();
  });

  const [controlMode, setControlMode] = useState<ControlMode>(() => {
    const saved = localStorage.getItem('control_preference');
    return saved === 'classic' || saved === 'alternative' || saved === 'swipe'
      ? saved
      : 'classic';
  });

  const [colors, setColors] = useState<ThemeColors>(() => {
    return {
      snakeHead: localStorage.getItem('custom_snake_head_color') || DefaultColors.SNAKE_HEAD,
      snakeBody: localStorage.getItem('custom_snake_body_color') || DefaultColors.SNAKE_BODY,
      food: localStorage.getItem('custom_food_color') || DefaultColors.FOOD,
      map: localStorage.getItem('custom_map_color') || DefaultColors.NOKIA_BG,
    };
  });

  // Modals
  const [isCareerOpen, setIsCareerOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAdOpen, setIsAdOpen] = useState(false);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  // Stats
  const [highScore, setHighScore] = useState<number>(() => {
    return parseInt(localStorage.getItem('high_score') || '0', 10);
  });
  const [totalFood, setTotalFood] = useState<number>(() => {
    return parseInt(localStorage.getItem('total_food') || '0', 10);
  });
  const [totalPlayTime, setTotalPlayTime] = useState<number>(() => {
    return parseInt(localStorage.getItem('total_play_time') || '0', 10);
  });

  // Screen
  const [screen, setScreen] = useState<Screen>('menu');

  // Game Core State
  const gridSize = GameLogic.DEFAULT_GRID_SIZE;
  const gridHeight = GameLogic.DEFAULT_GRID_HEIGHT;

  const [snake, setSnake] = useState<Point[]>([
    [10, 10],
    [10, 11],
    [10, 12],
  ]);
  const [direction, setDirection] = useState<Direction>('UP');
  const [food, setFood] = useState<Point>([10, 6]);
  const [bonusFood, setBonusFood] = useState<Point | null>(null);
  const [obstacles, setObstacles] = useState<Point[]>([]);
  const [score, setScore] = useState<number>(0);
  const [gameSpeed, setGameSpeed] = useState<number>(GameLogic.INITIAL_SPEED);

  // Countdown
  const [countdown, setCountdown] = useState<number | null>(null);

  // Session tracking
  const directionQueueRef = useRef<Direction[]>([]);
  const bonusSpawnTimeRef = useRef<number>(0);
  const bonusTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const gameStartTimeRef = useRef<number>(0);
  const sessionFoodEatenRef = useRef<number>(0);
  const bonusFoodEatenRef = useRef<number>(0);
  const foodWithoutWallRef = useRef<number>(0);
  const foodAtMaxSpeedRef = useRef<number>(0);
  const bonusEatenFastRef = useRef<boolean>(false);
  const wallHitRef = useRef<boolean>(false);
  const mazePassesRef = useRef<number>(0);
  const lastNarrowCellRef = useRef<Point | null>(null);
  const directionsUsedRef = useRef<Set<Direction>>(new Set(['UP']));

  // Check saved game presence
  const [hasSavedGame, setHasSavedGame] = useState<boolean>(() => {
    return localStorage.getItem('saved_is_game_running') === 'true';
  });

  // Handle language switch
  const handleToggleLang = () => {
    soundManager.playButtonClick();
    const nextLang: Language = lang === 'en' ? 'tr' : 'en';
    setLang(nextLang);
    localStorage.setItem('My_Lang', nextLang);
  };

  // Sound toggle
  const handleToggleSound = (enabled: boolean) => {
    setSoundEnabled(enabled);
    soundManager.setSoundEnabled(enabled);
  };

  // Color updates
  const handleUpdateColors = (newColors: ThemeColors) => {
    setColors(newColors);
    localStorage.setItem('custom_snake_head_color', newColors.snakeHead);
    localStorage.setItem('custom_snake_body_color', newColors.snakeBody);
    localStorage.setItem('custom_food_color', newColors.food);
    localStorage.setItem('custom_map_color', newColors.map);
  };

  // Control mode
  const handleSelectControlMode = (mode: ControlMode) => {
    setControlMode(mode);
    localStorage.setItem('control_preference', mode);
  };

  // Helper: check if valid direction change (no 180 flip)
  const isValidDirectionChange = (current: Direction, next: Direction): boolean => {
    if (current === 'UP' && next === 'DOWN') return false;
    if (current === 'DOWN' && next === 'UP') return false;
    if (current === 'LEFT' && next === 'RIGHT') return false;
    if (current === 'RIGHT' && next === 'LEFT') return false;
    return true;
  };

  // Queue direction change
  const queueDirection = useCallback((newDir: Direction) => {
    if (countdown !== null && countdown > 0) {
      if (isValidDirectionChange(direction, newDir)) {
        setDirection(newDir);
        directionQueueRef.current = [];
      }
      return;
    }

    if (directionQueueRef.current.length < 3) {
      const lastDir = directionQueueRef.current[directionQueueRef.current.length - 1] || direction;
      if (isValidDirectionChange(lastDir, newDir)) {
        directionQueueRef.current.push(newDir);
      }
    }
  }, [countdown, direction]);

  // Direction turn actions
  const turnUp = () => queueDirection('UP');
  const turnDown = () => queueDirection('DOWN');
  const turnLeft = () => queueDirection('LEFT');
  const turnRight = () => queueDirection('RIGHT');

  // Nokia 2-button zig-zag logic:
  const turnZigZagLeft = () => {
    const pending = directionQueueRef.current[directionQueueRef.current.length - 1] || direction;
    const nextDir: Direction = pending === 'UP' || pending === 'DOWN' ? 'LEFT' : 'DOWN';
    queueDirection(nextDir);
  };

  const turnZigZagRight = () => {
    const pending = directionQueueRef.current[directionQueueRef.current.length - 1] || direction;
    const nextDir: Direction = pending === 'UP' || pending === 'DOWN' ? 'RIGHT' : 'UP';
    queueDirection(nextDir);
  };

  // Find all free cells on grid
  const getFreeCells = (
    currentSnake: Point[],
    currentObstacles: Point[],
    excludeList: (Point | null)[] = []
  ): Point[] => {
    const occupied = new Set<string>();
    currentSnake.forEach(([x, y]) => occupied.add(`${x},${y}`));
    currentObstacles.forEach(([x, y]) => occupied.add(`${x},${y}`));
    excludeList.forEach((p) => {
      if (p) occupied.add(`${p[0]},${p[1]}`);
    });

    const free: Point[] = [];
    for (let x = 0; x < gridSize; x++) {
      for (let y = 0; y < gridHeight; y++) {
        if (!occupied.has(`${x},${y}`)) {
          free.push([x, y]);
        }
      }
    }
    return free;
  };

  // Spawn regular food
  const spawnFood = (
    currentSnake: Point[],
    currentObstacles: Point[],
    currBonusFood: Point | null
  ): Point | null => {
    const free = getFreeCells(currentSnake, currentObstacles, [currBonusFood]);
    if (free.length === 0) return null;
    const idx = Math.floor(Math.random() * free.length);
    return free[idx];
  };

  // Spawn bonus food
  const triggerSpawnBonusFood = (
    currentSnake: Point[],
    currentObstacles: Point[],
    currFood: Point
  ) => {
    if (bonusTimeoutRef.current) {
      clearTimeout(bonusTimeoutRef.current);
    }
    const free = getFreeCells(currentSnake, currentObstacles, [currFood]);
    if (free.length === 0) return;
    const idx = Math.floor(Math.random() * free.length);
    const bonus = free[idx];
    setBonusFood(bonus);
    bonusSpawnTimeRef.current = Date.now();

    // Hide after timeout
    bonusTimeoutRef.current = setTimeout(() => {
      setBonusFood(null);
    }, GameLogic.BONUS_FOOD_DISPLAY_TIMEOUT_MS);
  };

  // Spawn 2x2 maze obstacle block
  const tryAddObstacle = (
    currentObstacles: Point[],
    currentSnake: Point[],
    currFood: Point,
    currBonus: Point | null
  ): Point[] => {
    let attempts = 0;
    while (attempts < 80) {
      const startX = Math.floor(Math.random() * (gridSize - 4)) + 2;
      const startY = Math.floor(Math.random() * (gridHeight - 4)) + 2;

      let isClear = true;
      for (let i = 0; i <= 1; i++) {
        for (let j = 0; j <= 1; j++) {
          const cx = startX + i;
          const cy = startY + j;
          if (
            currentSnake.some(([sx, sy]) => sx === cx && sy === cy) ||
            (currFood[0] === cx && currFood[1] === cy) ||
            (currBonus && currBonus[0] === cx && currBonus[1] === cy) ||
            currentObstacles.some(([ox, oy]) => ox === cx && oy === cy)
          ) {
            isClear = false;
            break;
          }
        }
        if (!isClear) break;
      }

      if (isClear) {
        const newObs = [...currentObstacles];
        for (let i = 0; i <= 1; i++) {
          for (let j = 0; j <= 1; j++) {
            newObs.push([startX + i, startY + j]);
          }
        }
        return newObs;
      }
      attempts++;
    }
    return currentObstacles;
  };

  // Narrow pass check
  const isNarrowPass = (cell: Point, currentObstacles: Point[]): boolean => {
    const isBlocked = (cx: number, cy: number) => {
      if (cx < 0 || cx >= gridSize || cy < 0 || cy >= gridHeight) return true;
      return currentObstacles.some(([ox, oy]) => ox === cx && oy === cy);
    };

    const left = isBlocked(cell[0] - 1, cell[1]);
    const right = isBlocked(cell[0] + 1, cell[1]);
    const up = isBlocked(cell[0], cell[1] - 1);
    const down = isBlocked(cell[0], cell[1] + 1);

    return (left && right) || (up && down);
  };

  // Clear saved game
  const clearSavedGame = () => {
    localStorage.removeItem('saved_snake_body');
    localStorage.removeItem('saved_obstacles');
    localStorage.removeItem('saved_direction');
    localStorage.removeItem('saved_food_x');
    localStorage.removeItem('saved_food_y');
    localStorage.removeItem('saved_score');
    localStorage.removeItem('saved_game_speed');
    localStorage.removeItem('saved_bonus_food_x');
    localStorage.removeItem('saved_bonus_food_y');
    localStorage.removeItem('saved_is_game_running');
    setHasSavedGame(false);
  };

  // Save current game state
  const saveGameState = () => {
    localStorage.setItem(
      'saved_snake_body',
      snake.map(([x, y]) => `${x},${y}`).join(';')
    );
    localStorage.setItem(
      'saved_obstacles',
      obstacles.map(([x, y]) => `${x},${y}`).join(';')
    );
    localStorage.setItem('saved_direction', direction);
    localStorage.setItem('saved_food_x', String(food[0]));
    localStorage.setItem('saved_food_y', String(food[1]));
    localStorage.setItem('saved_score', String(score));
    localStorage.setItem('saved_game_speed', String(gameSpeed));
    localStorage.setItem('saved_is_game_running', 'true');

    if (bonusFood) {
      localStorage.setItem('saved_bonus_food_x', String(bonusFood[0]));
      localStorage.setItem('saved_bonus_food_y', String(bonusFood[1]));
    } else {
      localStorage.removeItem('saved_bonus_food_x');
      localStorage.removeItem('saved_bonus_food_y');
    }
    setHasSavedGame(true);
  };

  // Restore saved game
  const restoreGameState = (): boolean => {
    try {
      const isRunning = localStorage.getItem('saved_is_game_running');
      if (isRunning !== 'true') return false;

      const snakeStr = localStorage.getItem('saved_snake_body');
      if (!snakeStr) return false;

      const restoredSnake: Point[] = snakeStr.split(';').map((s) => {
        const [x, y] = s.split(',').map(Number);
        return [x, y];
      });

      const obsStr = localStorage.getItem('saved_obstacles') || '';
      const restoredObs: Point[] = obsStr
        ? obsStr.split(';').map((s) => {
            const [x, y] = s.split(',').map(Number);
            return [x, y];
          })
        : [];

      const savedDir = (localStorage.getItem('saved_direction') || 'UP') as Direction;
      const foodX = parseInt(localStorage.getItem('saved_food_x') || '0', 10);
      const foodY = parseInt(localStorage.getItem('saved_food_y') || '0', 10);
      const savedScore = parseInt(localStorage.getItem('saved_score') || '0', 10);
      const savedSpeed = parseInt(
        localStorage.getItem('saved_game_speed') || String(GameLogic.INITIAL_SPEED),
        10
      );

      let savedBonus: Point | null = null;
      if (localStorage.getItem('saved_bonus_food_x')) {
        const bx = parseInt(localStorage.getItem('saved_bonus_food_x') || '0', 10);
        const by = parseInt(localStorage.getItem('saved_bonus_food_y') || '0', 10);
        savedBonus = [bx, by];
      }

      setSnake(restoredSnake);
      setObstacles(restoredObs);
      setDirection(savedDir);
      setFood([foodX, foodY]);
      setBonusFood(savedBonus);
      setScore(savedScore);
      setGameSpeed(savedSpeed);

      return true;
    } catch {
      return false;
    }
  };

  // Start new game
  const startNewGame = () => {
    soundManager.playButtonClick();
    clearSavedGame();

    const totalGames = parseInt(localStorage.getItem('total_games_started') || '0', 10) + 1;
    localStorage.setItem('total_games_started', String(totalGames));

    const midX = Math.floor(gridSize / 2);
    const midY = Math.floor(gridHeight / 2);
    const initialSnake: Point[] = [
      [midX, midY],
      [midX, midY + 1],
      [midX, midY + 2],
    ];

    setSnake(initialSnake);
    setObstacles([]);
    setBonusFood(null);
    setDirection('UP');
    directionQueueRef.current = [];
    setScore(0);
    setGameSpeed(GameLogic.INITIAL_SPEED);

    sessionFoodEatenRef.current = 0;
    bonusFoodEatenRef.current = 0;
    foodWithoutWallRef.current = 0;
    foodAtMaxSpeedRef.current = 0;
    bonusEatenFastRef.current = false;
    wallHitRef.current = false;
    mazePassesRef.current = 0;
    lastNarrowCellRef.current = null;
    directionsUsedRef.current = new Set(['UP']);

    const newFood = spawnFood(initialSnake, [], null) || [midX, midY - 4];
    setFood(newFood);

    setScreen('game');
    gameStartTimeRef.current = Date.now();
    startCountdown();
  };

  // Resume saved game
  const resumeSavedGame = () => {
    soundManager.playButtonClick();
    if (restoreGameState()) {
      setScreen('game');
      gameStartTimeRef.current = Date.now();
      startCountdown();
    } else {
      setScreen('menu');
    }
  };

  // Countdown timer on start/resume
  const startCountdown = () => {
    setCountdown(GameLogic.COUNTDOWN_SECONDS);
  };

  useEffect(() => {
    if (countdown === null) return;
    if (countdown <= 0) {
      setCountdown(null);
      return;
    }

    const timer = setTimeout(() => {
      setCountdown(countdown - 1);
    }, GameLogic.COUNTDOWN_DELAY_MS);

    return () => clearTimeout(timer);
  }, [countdown]);

  // Finish Game (Game Over)
  const finishGame = (diedToOwnTail: boolean) => {
    soundManager.playCrash();
    vibrate(400);
    clearSavedGame();

    const sessionDurationSeconds = Math.max(
      1,
      Math.floor((Date.now() - gameStartTimeRef.current) / 1000)
    );
    const currentHigh = parseInt(localStorage.getItem('high_score') || '0', 10);
    const isNewHigh = score > currentHigh;
    const finalHigh = Math.max(score, currentHigh);
    const finalTotalFood = totalFood + sessionFoodEatenRef.current;
    const finalTotalTime = totalPlayTime + sessionDurationSeconds;

    // Save stats
    localStorage.setItem('high_score', String(finalHigh));
    localStorage.setItem('total_food', String(finalTotalFood));
    localStorage.setItem('total_play_time', String(finalTotalTime));

    setHighScore(finalHigh);
    setTotalFood(finalTotalFood);
    setTotalPlayTime(finalTotalTime);

    if (isNewHigh && score > 0) {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    }

    const gameOverData: GameOverData = {
      score,
      sessionFoodEaten: sessionFoodEatenRef.current,
      bonusFoodEatenInGame: bonusFoodEatenRef.current,
      foodEatenWithoutWall: foodWithoutWallRef.current,
      foodEatenAtMaxSpeed: foodAtMaxSpeedRef.current,
      bonusEatenFast: bonusEatenFastRef.current,
      diedToOwnTail,
      wallHit: wallHitRef.current,
      mazePasses: mazePassesRef.current,
      usedSingleDirection: directionsUsedRef.current.size === 1,
    };

    const fullGameData: GameData = {
      score: gameOverData.score,
      sessionPlayTime: sessionDurationSeconds,
      totalPlayTime: finalTotalTime,
      totalFoodEaten: finalTotalFood,
      totalGamesStarted: parseInt(localStorage.getItem('total_games_started') || '0', 10),
      foodEatenWithoutWall: gameOverData.foodEatenWithoutWall,
      bonusFoodEatenInGame: gameOverData.bonusFoodEatenInGame,
      foodEatenAtMaxSpeed: gameOverData.foodEatenAtMaxSpeed,
      mazePasses: gameOverData.mazePasses,
      usedSingleDirection: gameOverData.usedSingleDirection,
      usedAllThemes: localStorage.getItem('used_all_themes') === 'true',
      usedCustomTheme: localStorage.getItem('used_custom_theme') === 'true',
      diedToOwnTail: gameOverData.diedToOwnTail,
      diedNearHighScore: score > 0 && score === currentHigh - 1,
      diedFast:
        Date.now() - gameStartTimeRef.current < GameLogic.FAST_DEATH_THRESHOLD_MS &&
        !diedToOwnTail,
    };

    achievementsManager.checkAchievements(fullGameData, (unlockedAch) => {
      soundManager.playBonusEat();
      setToast({
        id: unlockedAch.id,
        type: 'achievement',
        title: t(lang, 'achievement_unlocked'),
        message: t(lang, unlockedAch.nameKey),
      });
    });

    setScreen('game_over');
  };

  // Main game tick
  useEffect(() => {
    if (screen !== 'game' || countdown !== null) return;

    const interval = setInterval(() => {
      setSnake((prevSnake) => {
        // Poll direction queue
        let currentDir = direction;
        if (directionQueueRef.current.length > 0) {
          const nextDir = directionQueueRef.current.shift()!;
          if (isValidDirectionChange(currentDir, nextDir)) {
            currentDir = nextDir;
            setDirection(nextDir);
            directionsUsedRef.current.add(nextDir);
          }
        }

        const head = prevSnake[0];
        let nx = head[0];
        let ny = head[1];

        switch (currentDir) {
          case 'UP':
            ny -= 1;
            break;
          case 'DOWN':
            ny += 1;
            break;
          case 'LEFT':
            nx -= 1;
            break;
          case 'RIGHT':
            nx += 1;
            break;
        }

        // Wall boundary check and wrap
        if (nx < 0 || nx >= gridSize || ny < 0 || ny >= gridHeight) {
          wallHitRef.current = true;
          if (nx < 0) nx = gridSize - 1;
          else if (nx >= gridSize) nx = 0;
          if (ny < 0) ny = gridHeight - 1;
          else if (ny >= gridHeight) ny = 0;
        }

        const newHead: Point = [nx, ny];

        // Narrow pass detection
        const isNarrow =
          prevSnake.length > GameLogic.MIN_SNAKE_LENGTH_FOR_NARROW_PASS &&
          isNarrowPass(newHead, obstacles);
        if (
          isNarrow &&
          (!lastNarrowCellRef.current ||
            lastNarrowCellRef.current[0] !== newHead[0] ||
            lastNarrowCellRef.current[1] !== newHead[1])
        ) {
          mazePassesRef.current += 1;
          lastNarrowCellRef.current = newHead;
        } else if (!isNarrow) {
          lastNarrowCellRef.current = null;
        }

        // Collision with self
        const hitOwnTail = prevSnake.some(([sx, sy]) => sx === newHead[0] && sy === newHead[1]);
        if (hitOwnTail) {
          finishGame(true);
          return prevSnake;
        }

        // Collision with obstacles
        const hitObstacle = obstacles.some(([ox, oy]) => ox === newHead[0] && oy === newHead[1]);
        if (hitObstacle) {
          finishGame(false);
          return prevSnake;
        }

        const newSnake = [newHead, ...prevSnake];

        // Check Bonus food collision
        if (bonusFood && newHead[0] === bonusFood[0] && newHead[1] === bonusFood[1]) {
          if (Date.now() - bonusSpawnTimeRef.current < GameLogic.BONUS_FOOD_FAST_EAT_TIMEOUT_MS) {
            bonusEatenFastRef.current = true;
          }
          const nextScore = score + GameLogic.BONUS_POINTS;
          setScore(nextScore);
          sessionFoodEatenRef.current += 1;
          bonusFoodEatenRef.current += 1;

          // Snake grows by 2 extra segments (total 3 including new head)
          const tail = prevSnake[prevSnake.length - 1];
          newSnake.push(tail);
          newSnake.push(tail);

          setBonusFood(null);
          if (bonusTimeoutRef.current) {
            clearTimeout(bonusTimeoutRef.current);
          }
          soundManager.playBonusEat();

          // Spawn obstacles at level thresholds
          const level = Math.floor(nextScore / 10);
          if (level > 0 && obstacles.length < level * 4) {
            setObstacles((prevObs) => tryAddObstacle(prevObs, newSnake, food, null));
          }

          saveGameState();
          return newSnake;
        }

        // Check regular food collision
        if (newHead[0] === food[0] && newHead[1] === food[1]) {
          const nextScore = score + GameLogic.REGULAR_POINTS;
          setScore(nextScore);
          sessionFoodEatenRef.current += 1;

          if (!wallHitRef.current) {
            foodWithoutWallRef.current += 1;
          }
          if (gameSpeed === GameLogic.MIN_SPEED) {
            foodAtMaxSpeedRef.current += 1;
          }

          soundManager.playEat();

          // Increase speed
          const nextSpeed = Math.max(GameLogic.MIN_SPEED, gameSpeed - GameLogic.SPEED_INCREMENT);
          setGameSpeed(nextSpeed);

          // Level maze obstacle update
          const level = Math.floor(nextScore / 10);
          let updatedObs = obstacles;
          if (level > 0 && obstacles.length < level * 4) {
            updatedObs = tryAddObstacle(obstacles, newSnake, food, bonusFood);
            setObstacles(updatedObs);
          }

          // Bonus food spawn interval
          if (nextScore > 0 && nextScore % GameLogic.BONUS_FOOD_SPAWN_INTERVAL === 0) {
            triggerSpawnBonusFood(newSnake, updatedObs, food);
          }

          // Next food
          const nextFood = spawnFood(newSnake, updatedObs, bonusFood);
          if (!nextFood) {
            // Screen full - victory finish
            finishGame(false);
            return newSnake;
          }
          setFood(nextFood);

          saveGameState();
          return newSnake;
        }

        // Regular move - drop tail
        newSnake.pop();
        return newSnake;
      });
    }, gameSpeed);

    return () => clearInterval(interval);
  }, [screen, countdown, gameSpeed, direction, food, bonusFood, obstacles, score]);

  // Back button in Game -> Pause menu
  const handleBackInGame = () => {
    soundManager.playButtonClick();
    saveGameState();
    setScreen('pause');
  };

  // Pause menu actions
  const handleResumeFromPause = () => {
    soundManager.playButtonClick();
    setScreen('game');
    startCountdown();
  };

  const handleHomeFromPause = () => {
    soundManager.playButtonClick();
    saveGameState();
    setScreen('menu');
  };

  // Share score
  const handleShareScore = () => {
    soundManager.playButtonClick();
    const shareText = t(lang, 'share_text', { score });
    if (typeof navigator !== 'undefined' && navigator.share) {
      navigator
        .share({
          title: t(lang, 'title_name'),
          text: shareText,
          url: window.location.href,
        })
        .catch(() => {});
    } else {
      navigator.clipboard.writeText(shareText).then(() => {
        setToast({
          id: 'share_copied',
          type: 'info',
          message: t(lang, 'score_copied'),
        });
      });
    }
  };

  // Rewarded Ad watched
  const handleAdReward = () => {
    setToast({
      id: 'support_reward',
      type: 'support',
      message: t(lang, 'thank_you_for_support'),
    });
  };

  return (
    <div className="w-full h-screen flex flex-col items-center justify-between bg-nokia-grid overflow-hidden text-[#3A3F44] font-nokia select-none">
      {/* Toast notifications */}
      <Toast toast={toast} onDismiss={() => setToast(null)} />

      {/* Career Modal */}
      <CareerModal
        isOpen={isCareerOpen}
        onClose={() => setIsCareerOpen(false)}
        lang={lang}
        highScore={highScore}
        totalFood={totalFood}
        totalPlayTime={totalPlayTime}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        lang={lang}
        soundEnabled={soundEnabled}
        onToggleSound={handleToggleSound}
        controlMode={controlMode}
        onSelectControlMode={handleSelectControlMode}
        colors={colors}
        onUpdateColors={handleUpdateColors}
      />

      {/* Ad Modal */}
      <AdModal
        isOpen={isAdOpen}
        onClose={() => setIsAdOpen(false)}
        onReward={handleAdReward}
        lang={lang}
      />

      {/* ================= MAIN MENU SCREEN ================= */}
      {screen === 'menu' && (
        <div className="w-full h-full flex flex-col items-center justify-between p-4 sm:p-8 max-w-md mx-auto overflow-y-auto">
          {/* Top Bar with Language Toggle */}
          <div className="w-full flex justify-end">
            <button
              type="button"
              onClick={handleToggleLang}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#3A3F44] text-[#C7F0D8] rounded-lg font-bold font-mono-retro text-sm hover:bg-black transition cursor-pointer shadow-md"
            >
              <Globe className="w-4 h-4" />
              <span>{lang.toUpperCase()}</span>
            </button>
          </div>

          {/* Title and High Score */}
          <div className="text-center my-auto py-4">
            <h1 className="text-4xl sm:text-5xl font-black tracking-widest text-[#3A3F44] font-mono-retro uppercase drop-shadow-xs">
              {t(lang, 'title_name')}
            </h1>
            <div className="mt-3 text-lg sm:text-xl font-bold font-mono-retro tracking-wider text-[#1E2328]">
              {t(lang, 'high_score', { score: highScore })}
            </div>
          </div>

          {/* Menu Buttons Stack */}
          <div className="w-full space-y-3 max-w-xs mb-4">
            {/* New Game */}
            <button
              type="button"
              onClick={startNewGame}
              className="w-full py-3.5 px-6 rounded-xl border-3 border-[#3A3F44] bg-transparent hover:bg-[#3A3F44] text-[#3A3F44] hover:text-[#C7F0D8] font-black font-mono-retro text-lg tracking-wider transition-all duration-150 cursor-pointer shadow-sm active:scale-98"
            >
              {t(lang, 'new_game')}
            </button>

            {/* Resume Game (if saved) */}
            {hasSavedGame && (
              <button
                type="button"
                onClick={resumeSavedGame}
                className="w-full py-3.5 px-6 rounded-xl border-3 border-[#3A3F44] bg-[#3A3F44]/10 hover:bg-[#3A3F44] text-[#3A3F44] hover:text-[#C7F0D8] font-black font-mono-retro text-lg tracking-wider transition-all duration-150 cursor-pointer shadow-sm active:scale-98 flex items-center justify-center gap-2"
              >
                <Play className="w-5 h-5 fill-current" />
                {t(lang, 'resume_game')}
              </button>
            )}

            {/* Career */}
            <button
              type="button"
              onClick={() => {
                soundManager.playButtonClick();
                setIsCareerOpen(true);
              }}
              className="w-full py-3.5 px-6 rounded-xl border-3 border-[#3A3F44] bg-transparent hover:bg-[#3A3F44] text-[#3A3F44] hover:text-[#C7F0D8] font-black font-mono-retro text-lg tracking-wider transition-all duration-150 cursor-pointer shadow-sm active:scale-98 flex items-center justify-center gap-2"
            >
              <Trophy className="w-5 h-5" />
              {t(lang, 'career')}
            </button>

            {/* Settings */}
            <button
              type="button"
              onClick={() => {
                soundManager.playButtonClick();
                setIsSettingsOpen(true);
              }}
              className="w-full py-3.5 px-6 rounded-xl border-3 border-[#3A3F44] bg-transparent hover:bg-[#3A3F44] text-[#3A3F44] hover:text-[#C7F0D8] font-black font-mono-retro text-lg tracking-wider transition-all duration-150 cursor-pointer shadow-sm active:scale-98 flex items-center justify-center gap-2"
            >
              <Sliders className="w-5 h-5" />
              {t(lang, 'settings')}
            </button>
          </div>

          {/* Support Developer & Watch Ads button */}
          <div className="w-full max-w-xs text-center pt-2 pb-2">
            <span className="text-[11px] text-[#3A3F44]/70 font-mono-retro block mb-1">
              {t(lang, 'support_developer')}
            </span>
            <button
              type="button"
              onClick={() => {
                soundManager.playButtonClick();
                setIsAdOpen(true);
              }}
              className="w-full py-2.5 px-4 rounded-lg border-2 border-[#3A3F44]/60 bg-black/5 hover:bg-[#3A3F44] text-[#3A3F44] hover:text-[#C7F0D8] font-bold font-mono-retro text-sm tracking-wider transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <Tv className="w-4 h-4" />
              {t(lang, 'watch_ads')}
            </button>
          </div>
        </div>
      )}

      {/* ================= ACTIVE GAME SCREEN ================= */}
      {screen === 'game' && (
        <div className="w-full h-full flex flex-col items-center justify-between p-2 sm:p-4 max-w-md mx-auto">
          {/* Top Bar: Back arrow and Score */}
          <div className="w-full flex items-center justify-between px-2 pt-1 pb-1">
            <button
              type="button"
              onClick={handleBackInGame}
              aria-label={t(lang, 'back')}
              className="p-2 rounded-xl bg-red-600/10 hover:bg-red-600/20 text-red-600 transition cursor-pointer"
            >
              <ArrowLeft className="w-6 h-6 stroke-[3]" />
            </button>

            <div className="text-2xl sm:text-3xl font-black font-mono-retro tracking-wider text-[#1E2328]">
              {t(lang, 'score', { score })}
            </div>

            <div className="w-8" />
          </div>

          {/* Play Field Canvas with Countdown Overlay */}
          <div className="relative w-full flex items-center justify-center p-1 my-auto">
            <SnakeCanvas
              snake={snake}
              obstacles={obstacles}
              food={food}
              bonusFood={bonusFood}
              direction={direction}
              colors={colors}
            />

            {/* Countdown Overlay */}
            {countdown !== null && countdown > 0 && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-2xs rounded-lg">
                <span className="text-7xl sm:text-8xl font-black text-white font-mono-retro drop-shadow-lg animate-countdown">
                  {countdown}
                </span>
              </div>
            )}
          </div>

          {/* Controls Area */}
          <div className="w-full pb-2">
            <Controls
              mode={controlMode}
              currentDirection={direction}
              onTurnUp={turnUp}
              onTurnDown={turnDown}
              onTurnLeft={turnLeft}
              onTurnRight={turnRight}
              onZigZagLeft={turnZigZagLeft}
              onZigZagRight={turnZigZagRight}
              lang={lang}
            />
          </div>
        </div>
      )}

      {/* ================= PAUSE MENU SCREEN ================= */}
      {screen === 'pause' && (
        <div className="w-full h-full flex flex-col items-center justify-center p-6 max-w-md mx-auto space-y-6">
          <div className="text-center">
            <h2 className="text-3xl sm:text-4xl font-black font-mono-retro tracking-widest text-[#3A3F44] uppercase">
              {t(lang, 'game_paused_title')}
            </h2>
            <div className="text-xl font-bold font-mono-retro mt-2">
              {t(lang, 'score', { score })}
            </div>
          </div>

          <div className="w-full space-y-3 max-w-xs">
            <button
              type="button"
              onClick={handleResumeFromPause}
              className="w-full py-4 px-6 rounded-xl border-3 border-[#3A3F44] bg-[#3A3F44] text-[#C7F0D8] hover:bg-black font-black font-mono-retro text-lg tracking-wider transition cursor-pointer shadow-md flex items-center justify-center gap-2"
            >
              <Play className="w-5 h-5 fill-current" />
              {t(lang, 'resume_game')}
            </button>

            <button
              type="button"
              onClick={handleHomeFromPause}
              className="w-full py-4 px-6 rounded-xl border-3 border-red-600 bg-transparent text-red-600 hover:bg-red-600 hover:text-white font-black font-mono-retro text-lg tracking-wider transition cursor-pointer shadow-sm flex items-center justify-center gap-2"
            >
              <Home className="w-5 h-5" />
              {t(lang, 'main_menu')}
            </button>
          </div>
        </div>
      )}

      {/* ================= GAME OVER SCREEN ================= */}
      {screen === 'game_over' && (
        <div className="w-full h-full flex flex-col items-center justify-center p-6 max-w-md mx-auto space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-4xl sm:text-5xl font-black font-mono-retro tracking-widest text-red-600 uppercase drop-shadow-xs">
              {t(lang, 'game_over')}
            </h2>
            <div className="text-2xl font-bold font-mono-retro text-[#1E2328]">
              {t(lang, 'your_score', { score })}
            </div>
            <div className="text-lg font-bold font-mono-retro text-[#2E7D32] bg-[#2E7D32]/10 py-1 px-4 rounded-full inline-block border border-[#2E7D32]/30">
              {t(lang, 'rank_label', { rank: achievementsManager.getRank(score, lang) })}
            </div>
          </div>

          <div className="w-full space-y-3 max-w-xs">
            {/* Try Again */}
            <button
              type="button"
              onClick={startNewGame}
              className="w-full py-3.5 px-6 rounded-xl border-3 border-[#3A3F44] bg-[#3A3F44] text-[#C7F0D8] hover:bg-black font-black font-mono-retro text-lg tracking-wider transition cursor-pointer shadow-md flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-5 h-5" />
              {t(lang, 'try_again')}
            </button>

            {/* Share Score (if score > 0) */}
            {score > 0 && (
              <button
                type="button"
                onClick={handleShareScore}
                className="w-full py-3.5 px-6 rounded-xl border-2 border-[#3A3F44] bg-white/40 hover:bg-white text-[#3A3F44] font-bold font-mono-retro text-base tracking-wider transition cursor-pointer shadow-xs flex items-center justify-center gap-2"
              >
                <Share2 className="w-5 h-5" />
                {t(lang, 'share_score')}
              </button>
            )}

            {/* Main Menu */}
            <button
              type="button"
              onClick={() => {
                soundManager.playButtonClick();
                setScreen('menu');
              }}
              className="w-full py-3.5 px-6 rounded-xl border-2 border-[#3A3F44]/50 hover:bg-black/10 text-[#3A3F44] font-bold font-mono-retro text-base tracking-wider transition cursor-pointer flex items-center justify-center gap-2"
            >
              <Home className="w-5 h-5" />
              {t(lang, 'main_menu')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
export default App;
