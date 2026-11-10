import React, { useState, useEffect, useRef, useCallback, useReducer } from 'react';
import {
  Direction,
  Point,
  ControlMode,
  Language,
  ThemeColors,
  GameOverData,
  GameData,
  ButtonSize,
  HandOrientation,
  DifficultyProfile,
  GameMode,
} from './types.ts';
import {
  GameLogic,
  DefaultColors,
} from './constants/gameConstants.ts';
import { MenuScreen } from './components/MenuScreen.tsx';
import { GameScreen } from './components/GameScreen.tsx';
import { PauseScreen } from './components/PauseScreen.tsx';
import { GameOverScreen } from './components/GameOverScreen.tsx';
import { CareerModal } from './components/CareerModal.tsx';
import { SettingsModal } from './components/SettingsModal.tsx';
import { MazeEditorScreen } from './components/MazeEditorScreen.tsx';
import { Toast, ToastMessage } from './components/Toast.tsx';
import { soundManager } from './utils/soundManager.ts';
import { achievementsManager, type AchievementItem } from './utils/achievementsManager.ts';
import { difficultyManager } from './utils/difficultyManager.ts';
import { particleSystem } from './utils/particles.ts';
import { careerManager } from './utils/career.ts';
import { questManager } from './utils/quests.ts';
import { vibrate } from './utils/haptics.ts';
import { t } from './utils/translations.ts';
import { STORAGE_KEYS, storage } from './utils/storage.ts';
import { createInitialGameState, gameReducer } from './utils/gameReducer.ts';
import { createRandomSeed, currentTimeMs } from './utils/time.ts';
import confetti from 'canvas-confetti';

type Screen = 'menu' | 'game' | 'pause' | 'game_over' | 'maze_editor';

export const App: React.FC = () => {
  // Localization & Settings
  const [lang, setLang] = useState<Language>(() => {
    const saved = storage.getItem(STORAGE_KEYS.language);
    return (saved === 'en' || saved === 'tr') ? saved : 'en';
  });

  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    return soundManager.getSoundEnabled();
  });
  const [vibrationEnabled, setVibrationEnabled] = useState<boolean>(() => {
    return storage.getItem(STORAGE_KEYS.vibrationEnabled) !== 'false';
  });
  const [difficultyProfile, setDifficultyProfile] = useState<DifficultyProfile>(() => {
    return difficultyManager.getProfile();
  });
  const [buttonSize, setButtonSize] = useState<ButtonSize>(() => {
    const saved = storage.getItem(STORAGE_KEYS.buttonSize);
    return (saved === 'small' || saved === 'medium' || saved === 'large') ? saved : 'medium';
  });
  const [handOrientation, setHandOrientation] = useState<HandOrientation>(() => {
    const saved = storage.getItem(STORAGE_KEYS.handOrientation);
    return (saved === 'right' || saved === 'left') ? saved : 'right';
  });
  const [selectedMode, setSelectedMode] = useState<GameMode>(() => {
    const saved = storage.getItem(STORAGE_KEYS.selectedMode);
    return (saved === 'classic' || saved === 'maze' || saved === 'time_attack' || saved === 'survival')
      ? saved
      : 'maze';
  });

  const [lcdEffectsEnabled, setLcdEffectsEnabled] = useState(
    () => storage.getItem(STORAGE_KEYS.lcdEffectsEnabled) !== 'false'
  );
  const [smoothMotionEnabled, setSmoothMotionEnabled] = useState(
    () => storage.getItem(STORAGE_KEYS.smoothMotionEnabled) === 'true'
  );
  const [musicEnabled, setMusicEnabled] = useState(() => soundManager.getMusicEnabled());
  const [rankDecorationsEnabled, setRankDecorationsEnabled] = useState(
    () => storage.getItem(STORAGE_KEYS.rankDecorationsEnabled) !== 'false'
  );

  const [controlMode, setControlMode] = useState<ControlMode>(() => {
    const saved = storage.getItem(STORAGE_KEYS.controlMode);
    return saved === 'classic' || saved === 'alternative' || saved === 'swipe'
      ? saved
      : 'classic';
  });

  const [colors, setColors] = useState<ThemeColors>(() => {
    return {
      snakeHead: storage.getItem(STORAGE_KEYS.customSnakeHeadColor) || DefaultColors.snakeHead,
      snakeBody: storage.getItem(STORAGE_KEYS.customSnakeBodyColor) || DefaultColors.snakeBody,
      food: storage.getItem(STORAGE_KEYS.customFoodColor) || DefaultColors.food,
      map: storage.getItem(STORAGE_KEYS.customMapColor) || DefaultColors.map,
      obstacle: DefaultColors.obstacle,
      bonusOuter: DefaultColors.bonusOuter,
      bonusInner: DefaultColors.bonusInner,
      grid: DefaultColors.grid,
      particle: DefaultColors.particle,
    };
  });

  const [bonusRemainingMs, setBonusRemainingMs] = useState<number>(0);

  // Modals
  const [isCareerOpen, setIsCareerOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [toast, setToast] = useState<ToastMessage[]>([]);
  const enqueueToast = useCallback((message: ToastMessage) => {
    setToast((queue) => [...queue, message].slice(-3));
  }, []);
  const handleAchievementUnlocked = useCallback((unlockedAch: AchievementItem) => {
    soundManager.playBonusEat();
    enqueueToast({
      id: unlockedAch.id,
      type: 'achievement',
      title: t(lang, 'achievement_unlocked'),
      message: t(lang, unlockedAch.nameKey),
    });
  }, [enqueueToast, lang]);

  // Stats
  const [highScore, setHighScore] = useState<number>(() => {
    return storage.getNumber(STORAGE_KEYS.highScore, 0);
  });
  const [totalFood, setTotalFood] = useState<number>(() => {
    return storage.getNumber(STORAGE_KEYS.totalFood, 0);
  });
  const [totalPlayTime, setTotalPlayTime] = useState<number>(() => {
    return storage.getNumber(STORAGE_KEYS.totalPlayTime, 0);
  });

  // Screen
  const [screen, setScreen] = useState<Screen>('menu');
  const [gameOutcome, setGameOutcome] = useState<'lost' | 'won'>('lost');
  const [isNewHighScore, setIsNewHighScore] = useState(false);

  // Game Core State
  const gridSize = GameLogic.DEFAULT_GRID_SIZE;
  const gridHeight = GameLogic.DEFAULT_GRID_HEIGHT;

  const [gameState, dispatch] = useReducer(gameReducer, undefined, createInitialGameState);
  const { snake, direction, food, bonusFood, obstacles, score, gameSpeed } = gameState;

  // Countdown
  const [countdown, setCountdown] = useState<number | null>(null);

  // Session tracking
  const bonusSpawnTimeRef = useRef<number>(0);
  const bonusDeadlineRef = useRef<number>(0);
  const bonusRemainingRef = useRef<number>(0);
  const bonusTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const gameStartTimeRef = useRef<number>(0);
  const sessionFoodEatenRef = useRef<number>(0);
  const bonusFoodEatenRef = useRef<number>(0);
  const foodWithoutWallRef = useRef<number>(0);
  const foodAtMaxSpeedRef = useRef<number>(0);
  const bonusEatenFastRef = useRef<boolean>(false);
  const wallHitRef = useRef<boolean>(false);
  const mazePassesRef = useRef<number>(0);
  const directionsUsedRef = useRef<Set<Direction>>(new Set(['UP']));
  const swipeStartRef = useRef<{ x: number; y: number } | null>(null);
  const processedGameEventRef = useRef(0);

  // Check saved game presence
  const [hasSavedGame, setHasSavedGame] = useState<boolean>(() => {
    return storage.getItem(STORAGE_KEYS.savedGameRunning) === 'true';
  });

  // Handle language switch
  const handleToggleLang = () => {
    soundManager.playButtonClick();
    const nextLang: Language = lang === 'en' ? 'tr' : 'en';
    setLang(nextLang);
    storage.setItem(STORAGE_KEYS.language, nextLang);
  };

  // Sound toggle
  const handleToggleSound = (enabled: boolean) => {
    setSoundEnabled(enabled);
    soundManager.setSoundEnabled(enabled);
  };

  const handleToggleLcdEffects = (enabled: boolean) => {
    setLcdEffectsEnabled(enabled);
    storage.setItem(STORAGE_KEYS.lcdEffectsEnabled, String(enabled));
  };

  const handleToggleSmoothMotion = (enabled: boolean) => {
    setSmoothMotionEnabled(enabled);
    storage.setItem(STORAGE_KEYS.smoothMotionEnabled, String(enabled));
  };

  const handleToggleMusic = (enabled: boolean) => {
    setMusicEnabled(enabled);
    soundManager.setMusicEnabled(enabled);
  };

  const handleToggleRankDecorations = (enabled: boolean) => {
    setRankDecorationsEnabled(enabled);
    storage.setItem(STORAGE_KEYS.rankDecorationsEnabled, String(enabled));
  };

  // Color updates
  const handleUpdateColors = (newColors: ThemeColors) => {
    setColors(newColors);
    storage.setItem(STORAGE_KEYS.customSnakeHeadColor, newColors.snakeHead);
    storage.setItem(STORAGE_KEYS.customSnakeBodyColor, newColors.snakeBody);
    storage.setItem(STORAGE_KEYS.customFoodColor, newColors.food);
    storage.setItem(STORAGE_KEYS.customMapColor, newColors.map);
  };

  // Control mode
  const handleSelectControlMode = (mode: ControlMode) => {
    setControlMode(mode);
    storage.setItem(STORAGE_KEYS.controlMode, mode);
  };

  const handleToggleVibration = (enabled: boolean) => {
    setVibrationEnabled(enabled);
    storage.setItem(STORAGE_KEYS.vibrationEnabled, String(enabled));
  };

  const handleSelectDifficultyProfile = (profile: DifficultyProfile) => {
    setDifficultyProfile(profile);
    difficultyManager.setProfile(profile);
    storage.setItem(STORAGE_KEYS.difficultyProfile, profile);
    dispatch({ type: 'SET_DIFFICULTY_PROFILE', profile });
  };

  const handleSelectButtonSize = (size: ButtonSize) => {
    setButtonSize(size);
    storage.setItem(STORAGE_KEYS.buttonSize, size);
  };

  const handleSelectHandOrientation = (orientation: HandOrientation) => {
    setHandOrientation(orientation);
    storage.setItem(STORAGE_KEYS.handOrientation, orientation);
  };

  const handleSelectMode = (mode: GameMode) => {
    setSelectedMode(mode);
    storage.setItem(STORAGE_KEYS.selectedMode, mode);
  };

  // Queue direction change
  const queueDirection = useCallback((newDir: Direction) => {
    if (countdown !== null && countdown > 0) {
      setCountdown(null);
      return;
    }
    dispatch({ type: 'QUEUE_DIRECTION', direction: newDir });
  }, [countdown]);

  // Direction turn actions
  const turnUp = () => queueDirection('UP');
  const turnDown = () => queueDirection('DOWN');
  const turnLeft = () => queueDirection('LEFT');
  const turnRight = () => queueDirection('RIGHT');

  // Nokia 2-button zig-zag logic:
  const turnZigZagLeft = () => {
    const pending = gameState.directionQueue[gameState.directionQueue.length - 1] || direction;
    const nextDir: Direction = pending === 'UP' || pending === 'DOWN' ? 'LEFT' : 'DOWN';
    queueDirection(nextDir);
  };

  const turnZigZagRight = () => {
    const pending = gameState.directionQueue[gameState.directionQueue.length - 1] || direction;
    const nextDir: Direction = pending === 'UP' || pending === 'DOWN' ? 'RIGHT' : 'UP';
    queueDirection(nextDir);
  };

  // Clear saved game
  const clearSavedGame = useCallback(() => {
    Object.values(STORAGE_KEYS)
      .filter((key) => key.startsWith('saved_'))
      .forEach((key) => storage.removeItem(key));
    setHasSavedGame(false);
  }, []);

  // Save current game state
  const saveGameState = useCallback(({
    snake: savedSnake = snake,
    obstacles: savedObstacles = obstacles,
    direction: savedDirection = direction,
    food: savedFood = food,
    bonusFood: savedBonusFood = bonusFood,
    score: savedScore = score,
    gameSpeed: savedGameSpeed = gameSpeed,
  }: {
    snake?: Point[];
    obstacles?: Point[];
    direction?: Direction;
    food?: Point;
    bonusFood?: Point | null;
    score?: number;
    gameSpeed?: number;
  } = {}) => {
    storage.setItem(
      STORAGE_KEYS.savedSnake,
      savedSnake.map(([x, y]) => `${x},${y}`).join(';')
    );
    storage.setItem(
      STORAGE_KEYS.savedObstacles,
      savedObstacles.map(([x, y]) => `${x},${y}`).join(';')
    );
    storage.setItem(STORAGE_KEYS.savedDirection, savedDirection);
    storage.setItem(STORAGE_KEYS.savedFoodX, String(savedFood[0]));
    storage.setItem(STORAGE_KEYS.savedFoodY, String(savedFood[1]));
    storage.setItem(STORAGE_KEYS.savedScore, String(savedScore));
    storage.setItem(STORAGE_KEYS.savedGameSpeed, String(savedGameSpeed));
    storage.setItem(STORAGE_KEYS.savedVersion, '1');
    storage.setItem(STORAGE_KEYS.savedGameRunning, 'true');

    if (savedBonusFood) {
      storage.setItem(STORAGE_KEYS.savedBonusFoodX, String(savedBonusFood[0]));
      storage.setItem(STORAGE_KEYS.savedBonusFoodY, String(savedBonusFood[1]));
      storage.setItem(STORAGE_KEYS.savedBonusFoodRemaining, String(bonusRemainingRef.current));
    } else {
      storage.removeItem(STORAGE_KEYS.savedBonusFoodX);
      storage.removeItem(STORAGE_KEYS.savedBonusFoodY);
      storage.removeItem(STORAGE_KEYS.savedBonusFoodRemaining);
    }
  }, [snake, obstacles, direction, food, bonusFood, score, gameSpeed]);

  // Restore saved game
  const restoreGameState = (): boolean => {
    try {
      const isRunning = storage.getItem(STORAGE_KEYS.savedGameRunning);
      if (isRunning !== 'true') return false;
      const savedVersion = storage.getItem(STORAGE_KEYS.savedVersion);
      if (savedVersion !== null && savedVersion !== '1') {
        clearSavedGame();
        return false;
      }

      const snakeStr = storage.getItem(STORAGE_KEYS.savedSnake);
      if (!snakeStr) {
        clearSavedGame();
        return false;
      }
      const requiredKeys = [
        STORAGE_KEYS.savedDirection,
        STORAGE_KEYS.savedFoodX,
        STORAGE_KEYS.savedFoodY,
        STORAGE_KEYS.savedScore,
        STORAGE_KEYS.savedGameSpeed,
      ];
      if (requiredKeys.some((key) => storage.getItem(key) === null)) {
        clearSavedGame();
        return false;
      }

      const restoredSnake: Point[] = snakeStr.split(';').map((s) => {
        const [x, y] = s.split(',').map(Number);
        return [x, y];
      });

      const obsStr = storage.getItem(STORAGE_KEYS.savedObstacles) || '';
      const restoredObs: Point[] = obsStr
        ? obsStr.split(';').map((s) => {
            const [x, y] = s.split(',').map(Number);
            return [x, y];
          })
        : [];

      const savedDir = (storage.getItem(STORAGE_KEYS.savedDirection) || 'UP') as Direction;
      const foodX = Number(storage.getItem(STORAGE_KEYS.savedFoodX));
      const foodY = Number(storage.getItem(STORAGE_KEYS.savedFoodY));
      const savedScore = Number(storage.getItem(STORAGE_KEYS.savedScore));
      const savedSpeed = Number(
        storage.getItem(STORAGE_KEYS.savedGameSpeed) || String(GameLogic.INITIAL_SPEED),
      );

      const validPoint = ([x, y]: Point) =>
        Number.isInteger(x) &&
        Number.isInteger(y) &&
        x >= 0 &&
        x < gridSize &&
        y >= 0 &&
        y < gridHeight;
      if (
        restoredSnake.length === 0 ||
        restoredSnake.some((point) => !validPoint(point)) ||
        restoredObs.some((point) => !validPoint(point)) ||
        !['UP', 'DOWN', 'LEFT', 'RIGHT'].includes(savedDir) ||
        !Number.isInteger(foodX) ||
        !Number.isInteger(foodY) ||
        !validPoint([foodX, foodY]) ||
        !Number.isFinite(savedScore) ||
        savedScore < 0 ||
        !Number.isFinite(savedSpeed) ||
        savedSpeed < GameLogic.MIN_SPEED ||
        savedSpeed > GameLogic.INITIAL_SPEED
      ) {
        clearSavedGame();
        return false;
      }

      let savedBonus: Point | null = null;
      if (storage.getItem(STORAGE_KEYS.savedBonusFoodX)) {
        if (storage.getItem(STORAGE_KEYS.savedBonusFoodY) === null) {
          clearSavedGame();
          return false;
        }
        const bx = Number(storage.getItem(STORAGE_KEYS.savedBonusFoodX));
        const by = Number(storage.getItem(STORAGE_KEYS.savedBonusFoodY));
        const remaining = Number(
          storage.getItem(STORAGE_KEYS.savedBonusFoodRemaining) ||
            GameLogic.BONUS_FOOD_DISPLAY_TIMEOUT_MS
        );
        if (!validPoint([bx, by]) || !Number.isFinite(remaining)) {
          clearSavedGame();
          return false;
        }
        savedBonus = [bx, by];
        bonusRemainingRef.current = Math.max(
          0,
          Math.min(GameLogic.BONUS_FOOD_DISPLAY_TIMEOUT_MS, remaining)
        );
      }

      dispatch({
        type: 'RESTORE',
        state: {
          ...createInitialGameState(),
          snake: restoredSnake,
          obstacles: restoredObs,
          direction: savedDir,
          food: [foodX, foodY],
          bonusFood: savedBonus,
          score: savedScore,
          gameSpeed: savedSpeed,
        },
      });

      return true;
    } catch (error) {
      console.warn('Unable to restore saved game:', error);
      clearSavedGame();
      return false;
    }
  };

  // Start new game
  const startNewGame = () => {
    soundManager.playButtonClick();
    clearSavedGame();
    if (!musicEnabled && !storage.getItem(STORAGE_KEYS.musicHintShown)) {
      enqueueToast({
        id: 'music_hint',
        type: 'info',
        message: t(lang, 'music_hint'),
      });
      storage.setItem(STORAGE_KEYS.musicHintShown, 'true');
    }

    const totalGames = storage.getNumber(STORAGE_KEYS.totalGamesStarted, 0) + 1;
    storage.setItem(STORAGE_KEYS.totalGamesStarted, String(totalGames));

    const midX = Math.floor(gridSize / 2);
    const midY = Math.floor(gridHeight / 2);
    const initialSnake: Point[] = [
      [midX, midY],
      [midX, midY + 1],
      [midX, midY + 2],
    ];

    dispatch({
      type: 'RESET',
      state: {
        ...createInitialGameState(),
        snake: initialSnake,
        food: [midX, midY - 4],
      },
      randomSeed: createRandomSeed(),
    });

    sessionFoodEatenRef.current = 0;
    bonusFoodEatenRef.current = 0;
    foodWithoutWallRef.current = 0;
    foodAtMaxSpeedRef.current = 0;
    bonusEatenFastRef.current = false;
    wallHitRef.current = false;
    mazePassesRef.current = 0;
    directionsUsedRef.current = new Set(['UP']);

    setScreen('game');
    gameStartTimeRef.current = currentTimeMs();
    startCountdown();
  };

  // Resume saved game
  const resumeSavedGame = () => {
    soundManager.playButtonClick();
    if (restoreGameState()) {
      setScreen('game');
      gameStartTimeRef.current = currentTimeMs();
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
    const timer = setTimeout(() => {
      setCountdown(countdown <= 1 ? null : countdown - 1);
    }, GameLogic.COUNTDOWN_DELAY_MS);

    return () => clearTimeout(timer);
  }, [countdown]);

  // Finish Game (Game Over)
  const finishGame = useCallback((
    diedToOwnTail: boolean,
    finalScore = score,
    outcome: 'lost' | 'won' = 'lost'
  ) => {
    soundManager.playCrash();
    vibrate(400);
    clearSavedGame();

    const sessionDurationSeconds = Math.max(
      1,
      Math.floor((currentTimeMs() - gameStartTimeRef.current) / 1000)
    );
    const currentHigh = storage.getNumber(STORAGE_KEYS.highScore, 0);
    const isNewHigh = finalScore > currentHigh;
    const finalHigh = Math.max(finalScore, currentHigh);
    const finalTotalFood = totalFood + sessionFoodEatenRef.current;
    const finalTotalTime = totalPlayTime + sessionDurationSeconds;

    // Save stats
    storage.setItem(STORAGE_KEYS.highScore, String(finalHigh));
    storage.setItem(STORAGE_KEYS.totalFood, String(finalTotalFood));
    storage.setItem(STORAGE_KEYS.totalPlayTime, String(finalTotalTime));

    setHighScore(finalHigh);
    setTotalFood(finalTotalFood);
    setTotalPlayTime(finalTotalTime);
    setIsNewHighScore(isNewHigh && finalScore > 0);
    setGameOutcome(outcome);

    if (isNewHigh && finalScore > 0) {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    }

    const gameOverData: GameOverData = {
      score: finalScore,
      sessionFoodEaten: sessionFoodEatenRef.current,
      bonusFoodEatenInGame: bonusFoodEatenRef.current,
      foodEatenWithoutWall: foodWithoutWallRef.current,
      foodEatenAtMaxSpeed: foodAtMaxSpeedRef.current,
      bonusEatenFast: bonusEatenFastRef.current,
      diedToOwnTail,
      wallHit: wallHitRef.current,
      mazePasses: mazePassesRef.current,
      usedSingleDirection: directionsUsedRef.current.size === 1,
      mode: selectedMode,
    };

    const fullGameData: GameData = {
      score: gameOverData.score,
      sessionPlayTime: sessionDurationSeconds,
      totalPlayTime: finalTotalTime,
      totalFoodEaten: finalTotalFood,
      totalGamesStarted: storage.getNumber(STORAGE_KEYS.totalGamesStarted, 0),
      foodEatenWithoutWall: gameOverData.foodEatenWithoutWall,
      bonusFoodEatenInGame: gameOverData.bonusFoodEatenInGame,
      foodEatenAtMaxSpeed: gameOverData.foodEatenAtMaxSpeed,
      mazePasses: gameOverData.mazePasses,
      usedSingleDirection: gameOverData.usedSingleDirection,
      usedAllThemes: storage.getItem(STORAGE_KEYS.usedAllThemes) === 'true',
      usedCustomTheme: storage.getItem(STORAGE_KEYS.usedCustomTheme) === 'true',
      diedToOwnTail: gameOverData.diedToOwnTail,
      diedNearHighScore: finalScore > 0 && finalScore === currentHigh - 1,
      diedFast:
        currentTimeMs() - gameStartTimeRef.current < GameLogic.FAST_DEATH_THRESHOLD_MS &&
        !diedToOwnTail,
      mode: selectedMode,
    };

    achievementsManager.checkAchievements(fullGameData, handleAchievementUnlocked);

    // Record in CareerManager (FR-17)
    const level = difficultyManager.getLevel(finalScore);
    careerManager.recordSession(gameOverData, sessionDurationSeconds, snake.length, level);

    // Process daily quests (FR-15)
    questManager.processGameSession(gameOverData, (unlockedQuest) => {
      soundManager.playBonusEat();
      enqueueToast({
        id: unlockedQuest.id,
        type: 'achievement',
        title: lang === 'tr' ? 'Görev Tamamlandı!' : 'Quest Completed!',
        message: t(lang, unlockedQuest.titleKey),
      });
    });

    setScreen('game_over');
  }, [
    clearSavedGame,
    handleAchievementUnlocked,
    score,
    totalFood,
    totalPlayTime,
    selectedMode,
    snake.length,
    enqueueToast,
    lang,
  ]);

  // Process reducer events outside the pure game transition.
  useEffect(() => {
    const event = gameState.event;
    if (!event || processedGameEventRef.current === gameState.eventId) return;
    processedGameEventRef.current = gameState.eventId;

    if (event.directionChanged) directionsUsedRef.current.add(event.directionChanged);
    if (event.wallHit) wallHitRef.current = true;
    if (event.narrowPass) {
      mazePassesRef.current += 1;
      particleSystem.triggerNarrowPassSparks(snake[0], 20, colors.snakeHead);
    }

    if (event.type === 'regular-food' || event.type === 'bonus-food') {
      sessionFoodEatenRef.current += 1;
      particleSystem.triggerHeadSquash();
      particleSystem.triggerBitePulse();

      if (event.type === 'bonus-food') {
        bonusFoodEatenRef.current += 1;
        bonusEatenFastRef.current ||= currentTimeMs() - bonusSpawnTimeRef.current <
          GameLogic.BONUS_FOOD_FAST_EAT_TIMEOUT_MS;
        bonusRemainingRef.current = 0;
        setBonusRemainingMs(0);
        if (bonusTimeoutRef.current) clearTimeout(bonusTimeoutRef.current);
        bonusTimeoutRef.current = null;
        soundManager.playBonusEat();
      } else {
        if (!wallHitRef.current) foodWithoutWallRef.current += 1;
        if (event.gameSpeedBefore === GameLogic.MIN_SPEED) foodAtMaxSpeedRef.current += 1;
        soundManager.playEat();
        if (event.score % GameLogic.BONUS_FOOD_SPAWN_INTERVAL === 0 && bonusFood) {
          bonusSpawnTimeRef.current = currentTimeMs();
          bonusRemainingRef.current = GameLogic.BONUS_FOOD_DISPLAY_TIMEOUT_MS;
          setBonusRemainingMs(GameLogic.BONUS_FOOD_DISPLAY_TIMEOUT_MS);
        }
      }

      achievementsManager.checkScoreAchievements(event.score, handleAchievementUnlocked);
      saveGameState();
    }

    if (event.type === 'collision' || event.type === 'victory') {
      if (event.type === 'collision') {
        particleSystem.triggerCrashExplosion(snake, 20, colors.snakeHead);
      }
      finishGame(
        event.diedToOwnTail,
        event.score,
        event.type === 'victory' ? 'won' : 'lost'
      );
    }
  }, [
    gameState.eventId,
    gameState.event,
    bonusFood,
    finishGame,
    handleAchievementUnlocked,
    saveGameState,
    snake,
    colors.snakeHead,
  ]);

  useEffect(() => {
    if (screen !== 'game' || countdown !== null) return;
    const interval = setInterval(
      () => dispatch({ type: 'TICK', randomSeed: createRandomSeed() }),
      gameSpeed
    );
    return () => clearInterval(interval);
  }, [screen, countdown, gameSpeed]);

  useEffect(() => {
    soundManager.setMusicMode(
      screen === 'game' ? 'playing' : screen === 'pause' ? 'paused' : 'stopped'
    );
  }, [screen, musicEnabled]);

  useEffect(() => {
    if (screen !== 'game' || countdown !== null || !bonusFood) return;
    if (bonusRemainingRef.current <= 0) {
      dispatch({ type: 'CLEAR_BONUS' });
      return;
    }

    bonusDeadlineRef.current = currentTimeMs() + bonusRemainingRef.current;
    bonusTimeoutRef.current = setTimeout(() => {
      bonusRemainingRef.current = 0;
      bonusTimeoutRef.current = null;
      dispatch({ type: 'CLEAR_BONUS' });
    }, bonusRemainingRef.current);
    return () => {
      if (bonusTimeoutRef.current) {
        bonusRemainingRef.current = Math.max(0, bonusDeadlineRef.current - currentTimeMs());
        clearTimeout(bonusTimeoutRef.current);
        bonusTimeoutRef.current = null;
      }
    };
  }, [screen, countdown, bonusFood, saveGameState]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState !== 'hidden' || screen !== 'game') return;
      if (bonusFood && bonusTimeoutRef.current) {
        bonusRemainingRef.current = Math.max(0, bonusDeadlineRef.current - currentTimeMs());
        clearTimeout(bonusTimeoutRef.current);
        bonusTimeoutRef.current = null;
      }
      saveGameState();
      setHasSavedGame(true);
      setScreen('pause');
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [screen, snake, obstacles, direction, food, bonusFood, score, gameSpeed, saveGameState]);

  // BFR-04-R: Update bonusRemainingMs smoothly for bonus countdown bar
  useEffect(() => {
    if (screen !== 'game' || countdown !== null || !bonusFood) {
      setBonusRemainingMs(0);
      return;
    }
    const timer = setInterval(() => {
      const remaining = Math.max(0, bonusDeadlineRef.current - currentTimeMs());
      setBonusRemainingMs(remaining);
    }, 50);
    return () => clearInterval(timer);
  }, [screen, countdown, bonusFood]);

  // BFR-03-R: Autosave on tab close, navigate away, or iOS Safari backgrounding (pagehide/beforeunload)
  useEffect(() => {
    const handlePersist = () => {
      if (screen === 'game' || screen === 'pause') {
        if (bonusFood && bonusTimeoutRef.current) {
          bonusRemainingRef.current = Math.max(0, bonusDeadlineRef.current - currentTimeMs());
        }
        saveGameState();
        setHasSavedGame(true);
      }
    };
    window.addEventListener('beforeunload', handlePersist);
    window.addEventListener('pagehide', handlePersist);
    return () => {
      window.removeEventListener('beforeunload', handlePersist);
      window.removeEventListener('pagehide', handlePersist);
    };
  }, [screen, bonusFood, saveGameState]);

  // Back button in Game -> Pause menu
  const handleBackInGame = () => {
    soundManager.playButtonClick();
    if (bonusFood && bonusTimeoutRef.current) {
      bonusRemainingRef.current = Math.max(0, bonusDeadlineRef.current - currentTimeMs());
      clearTimeout(bonusTimeoutRef.current);
      bonusTimeoutRef.current = null;
    }
    saveGameState();
    setHasSavedGame(true);
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
    setHasSavedGame(true);
    setScreen('menu');
  };

  const handleSwipeStart = (event: React.TouchEvent<HTMLDivElement>) => {
    const touch = event.touches[0];
    swipeStartRef.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleSwipeEnd = (event: React.TouchEvent<HTMLDivElement>) => {
    const start = swipeStartRef.current;
    swipeStartRef.current = null;
    if (!start) return;
    const touch = event.changedTouches[0];
    const dx = touch.clientX - start.x;
    const dy = touch.clientY - start.y;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 25) return;
    soundManager.playButtonClick();
    vibrate(40);
    if (Math.abs(dx) > Math.abs(dy)) {
      queueDirection(dx > 0 ? 'RIGHT' : 'LEFT');
    } else {
      queueDirection(dy > 0 ? 'DOWN' : 'UP');
    }
  };

  useEffect(() => {
    if (screen !== 'game' && screen !== 'pause') return;
    const handleSpace = (event: KeyboardEvent) => {
      if (event.code !== 'Space' || (event.target instanceof HTMLElement &&
        ['INPUT', 'TEXTAREA', 'BUTTON'].includes(event.target.tagName))) return;
      event.preventDefault();
      soundManager.playButtonClick();
      if (screen === 'game') {
        if (bonusFood && bonusTimeoutRef.current) {
          bonusRemainingRef.current = Math.max(0, bonusDeadlineRef.current - currentTimeMs());
          clearTimeout(bonusTimeoutRef.current);
          bonusTimeoutRef.current = null;
        }
        saveGameState();
        setHasSavedGame(true);
        setScreen('pause');
      } else {
        setScreen('game');
        startCountdown();
      }
    };
    window.addEventListener('keydown', handleSpace);
    return () => window.removeEventListener('keydown', handleSpace);
  }, [screen, snake, obstacles, direction, food, bonusFood, score, gameSpeed, saveGameState]);

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
        enqueueToast({
          id: 'share_copied',
          type: 'info',
          message: t(lang, 'score_copied'),
        });
      });
    }
  };

  const openCareer = () => {
    soundManager.playButtonClick();
    setIsCareerOpen(true);
  };

  const openSettings = () => {
    soundManager.playButtonClick();
    setIsSettingsOpen(true);
  };

  const handleHomeFromGameOver = () => {
    soundManager.playButtonClick();
    setScreen('menu');
  };

  return (
    <div className="app-shell w-full flex flex-col items-center justify-between bg-nokia-grid overflow-hidden text-[#3A3F44] font-nokia select-none">
      <Toast toast={toast} onDismiss={() => setToast((queue) => queue.slice(1))} />
      <CareerModal
        isOpen={isCareerOpen}
        onClose={() => setIsCareerOpen(false)}
        lang={lang}
        highScore={highScore}
        totalFood={totalFood}
        totalPlayTime={totalPlayTime}
      />
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        lang={lang}
        soundEnabled={soundEnabled}
        onToggleSound={handleToggleSound}
        vibrationEnabled={vibrationEnabled}
        onToggleVibration={handleToggleVibration}
        difficultyProfile={difficultyProfile}
        onSelectDifficultyProfile={handleSelectDifficultyProfile}
        buttonSize={buttonSize}
        onSelectButtonSize={handleSelectButtonSize}
        handOrientation={handOrientation}
        onSelectHandOrientation={handleSelectHandOrientation}
        lcdEffectsEnabled={lcdEffectsEnabled}
        onToggleLcdEffects={handleToggleLcdEffects}
        smoothMotionEnabled={smoothMotionEnabled}
        onToggleSmoothMotion={handleToggleSmoothMotion}
        musicEnabled={musicEnabled}
        onToggleMusic={handleToggleMusic}
        rankDecorationsEnabled={rankDecorationsEnabled}
        onToggleRankDecorations={handleToggleRankDecorations}
        controlMode={controlMode}
        onSelectControlMode={handleSelectControlMode}
        colors={colors}
        onUpdateColors={handleUpdateColors}
      />

      {screen === 'menu' && (
        <MenuScreen
          lang={lang}
          highScore={highScore}
          hasSavedGame={hasSavedGame}
          selectedMode={selectedMode}
          onSelectMode={handleSelectMode}
          onToggleLang={handleToggleLang}
          onNewGame={startNewGame}
          onResume={resumeSavedGame}
          onCareer={openCareer}
          onSettings={openSettings}
          onMazeEditor={() => setScreen('maze_editor')}
        />
      )}
      {screen === 'maze_editor' && (
        <MazeEditorScreen
          lang={lang}
          onBack={() => setScreen('menu')}
        />
      )}
      {screen === 'game' && (
        <GameScreen
          lang={lang}
          controlMode={controlMode}
          buttonSize={buttonSize}
          handOrientation={handOrientation}
          snake={snake}
          obstacles={obstacles}
          food={food}
          bonusFood={bonusFood}
          bonusRemainingMs={bonusRemainingMs}
          direction={direction}
          colors={colors}
          score={score}
          level={difficultyManager.getLevel(score)}
          countdown={countdown}
          gameSpeed={gameSpeed}
          lcdEffectsEnabled={lcdEffectsEnabled}
          smoothMotionEnabled={smoothMotionEnabled}
          rankDecorationsEnabled={rankDecorationsEnabled}
          rankDecoration={achievementsManager.getRankKey(highScore)}
          onBack={handleBackInGame}
          onTurnUp={turnUp}
          onTurnDown={turnDown}
          onTurnLeft={turnLeft}
          onTurnRight={turnRight}
          onZigZagLeft={turnZigZagLeft}
          onZigZagRight={turnZigZagRight}
          onSwipeStart={handleSwipeStart}
          onSwipeMove={(event) => event.preventDefault()}
          onSwipeEnd={handleSwipeEnd}
        />
      )}
      {screen === 'pause' && (
        <PauseScreen
          lang={lang}
          score={score}
          onResume={handleResumeFromPause}
          onHome={handleHomeFromPause}
        />
      )}
      {screen === 'game_over' && (
        <GameOverScreen
          lang={lang}
          score={score}
          rank={achievementsManager.getRank(score, lang)}
          won={gameOutcome === 'won'}
          isNewHighScore={isNewHighScore}
          onTryAgain={startNewGame}
          onShare={handleShareScore}
          onHome={handleHomeFromGameOver}
        />
      )}
    </div>
  );
};
export default App;
