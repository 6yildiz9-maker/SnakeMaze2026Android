import React, { useState, useEffect, useRef, useCallback, useReducer, useMemo } from 'react';
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
  FoodType,
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
import { DIFFICULTY_PROFILES } from './utils/difficultyManager.ts';
import { particleSystem } from './utils/particles.ts';
import { careerManager } from './utils/career.ts';
import { questManager } from './utils/quests.ts';
import { vibrate } from './utils/haptics.ts';
import { t } from './utils/translations.ts';
import { flushStorage, STORAGE_KEYS, storage, getModeHighScore, setModeHighScore } from './utils/storage.ts';
import { createInitialGameState, gameReducer } from './utils/gameReducer.ts';
import { createRandomSeed, currentTimeMs } from './utils/time.ts';
import { InputController } from './utils/inputController.ts';
import { mazeEditorService } from './utils/mazeEditor.ts';
import { findArrivalDirection } from './utils/pathfinding.ts';
import { isCapacitor } from './utils/platform.ts';
import { adService } from './utils/ads.ts';
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
    const saved = storage.getItem(STORAGE_KEYS.difficultyProfile);
    return saved === 'retro' || saved === 'modern' ? saved : 'modern';
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
  const [foodEffect, setFoodEffect] = useState<FoodType | null>(null);
  const [foodEffectDirection, setFoodEffectDirection] = useState<Direction | null>(null);
  const enqueueToast = useCallback((message: ToastMessage) => {
    setToast([message]);
  }, []);
  const dismissToast = useCallback(() => setToast([]), []);
  const handleAchievementUnlocked = useCallback((unlockedAch: AchievementItem) => {
    soundManager.playBonusEat();
    enqueueToast({
      id: unlockedAch.id,
      type: 'achievement',
      title: t(lang, 'achievement_unlocked'),
      message: t(lang, unlockedAch.nameKey),
    });
  }, [enqueueToast, lang]);

  const [selectedCustomMazeId, setSelectedCustomMazeId] = useState<string>(() => {
    return storage.getItem(STORAGE_KEYS.selectedCustomMaze) || '';
  });

  const handleSelectCustomMaze = (mazeId: string) => {
    setSelectedCustomMazeId(mazeId);
    storage.setItem(STORAGE_KEYS.selectedCustomMaze, mazeId);
  };

  // Stats
  const [highScore, setHighScore] = useState<number>(() => {
    return getModeHighScore(selectedMode);
  });
  const [totalFood, setTotalFood] = useState<number>(() => {
    return storage.getNumber(STORAGE_KEYS.totalFood, 0);
  });
  const [totalPlayTime, setTotalPlayTime] = useState<number>(() => {
    return storage.getNumber(STORAGE_KEYS.totalPlayTime, 0);
  });

  // Screen
  const [screen, setScreen] = useState<Screen>('menu');
  const [gameOutcome, setGameOutcome] = useState<'lost' | 'won' | 'time_up'>('lost');
  const [isNewHighScore, setIsNewHighScore] = useState(false);

  // Game Core State
  const gridSize = GameLogic.DEFAULT_GRID_SIZE;
  const gridHeight = GameLogic.DEFAULT_GRID_HEIGHT;

  const [gameState, dispatch] = useReducer(
    gameReducer,
    undefined,
    () => createInitialGameState(selectedMode, [], difficultyProfile)
  );
  const { snake, direction, food, bonusFood, obstacles, score, gameSpeed, foodType } = gameState;
  const foodApproachDirection = useMemo(
    () => foodType === 'regular' || foodType === 'bonus'
      ? null
      : findArrivalDirection(snake[0], food, obstacles, gridSize, gridHeight, snake.slice(1)),
    [foodType, snake, food, obstacles, gridSize, gridHeight]
  );

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
  const foodTypeCountsRef = useRef({ golden: 0, ice: 0, poison: 0, mystery: 0 });
  const playedCustomMazeRef = useRef(false);
  const longestSnakeRef = useRef(3);
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

  const handleShowAdPrivacyOptions = () => {
    void adService.showPrivacyOptions().catch((error: unknown) => {
      console.error('Unable to open ad privacy options:', error);
    });
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
    setHighScore(getModeHighScore(mode));
  };

  // Unified Input Controller layer (FR-12-R)
  const inputControllerRef = useRef<InputController>(
    new InputController(direction, controlMode)
  );

  useEffect(() => {
    inputControllerRef.current.setCurrentDirection(direction);
    inputControllerRef.current.setPendingDirections(gameState.directionQueue);
  }, [direction, gameState.directionQueue]);

  useEffect(() => inputControllerRef.current.setControlMode(controlMode), [controlMode]);

  // Queue direction change through input controller layer (FR-12-R)
  const queueDirection = useCallback((newDir: Direction) => {
    if (countdown !== null && countdown > 0) {
      setCountdown(null);
      return;
    }
    const added = inputControllerRef.current.handleDirection(newDir);
    if (added) dispatch({ type: 'QUEUE_DIRECTION', direction: newDir });
  }, [countdown]);

  // Direction turn actions
  const turnUp = () => queueDirection('UP');
  const turnDown = () => queueDirection('DOWN');
  const turnLeft = () => queueDirection('LEFT');
  const turnRight = () => queueDirection('RIGHT');

  // Nokia 2-button zig-zag logic routed via inputController (FR-12-R)
  const turnZigZagLeft = () => {
    if (countdown !== null && countdown > 0) {
      setCountdown(null);
      return;
    }
    const dir = inputControllerRef.current.handleZigZag('left');
    if (dir) dispatch({ type: 'QUEUE_DIRECTION', direction: dir });
  };

  const turnZigZagRight = () => {
    if (countdown !== null && countdown > 0) {
      setCountdown(null);
      return;
    }
    const dir = inputControllerRef.current.handleZigZag('right');
    if (dir) dispatch({ type: 'QUEUE_DIRECTION', direction: dir });
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
    mode: savedMode = selectedMode,
    timeRemainingMs: savedTimeRemaining = gameState.timeRemainingMs,
    foodType: savedFoodType = gameState.foodType,
    savedDifficultyProfile = difficultyProfile,
  }: {
    snake?: Point[];
    obstacles?: Point[];
    direction?: Direction;
    food?: Point;
    bonusFood?: Point | null;
    score?: number;
    gameSpeed?: number;
    mode?: GameMode;
    timeRemainingMs?: number;
    foodType?: FoodType;
    savedDifficultyProfile?: DifficultyProfile;
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
    storage.setItem(STORAGE_KEYS.savedMode, savedMode);
    storage.setItem(STORAGE_KEYS.savedFoodType, savedFoodType);
    storage.setItem(STORAGE_KEYS.savedDifficultyProfile, savedDifficultyProfile);
    if (savedTimeRemaining !== undefined) {
      storage.setItem(STORAGE_KEYS.savedTimeRemaining, String(savedTimeRemaining));
    } else {
      storage.removeItem(STORAGE_KEYS.savedTimeRemaining);
    }
    storage.setItem(STORAGE_KEYS.savedVersion, '2');
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
  }, [
    snake, obstacles, direction, food, bonusFood, score, gameSpeed, selectedMode,
    gameState.timeRemainingMs, gameState.foodType, difficultyProfile,
  ]);

  // Restore saved game
  const restoreGameState = (): boolean => {
    try {
      const isRunning = storage.getItem(STORAGE_KEYS.savedGameRunning);
      if (isRunning !== 'true') return false;
      const savedVersion = storage.getItem(STORAGE_KEYS.savedVersion);
      if (savedVersion !== null && savedVersion !== '1' && savedVersion !== '2') {
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

      const rawMode = storage.getItem(STORAGE_KEYS.savedMode) as GameMode;
      const validMode: GameMode = ['classic', 'maze', 'time_attack', 'survival'].includes(rawMode)
        ? rawMode
        : 'maze';
      const rawDifficulty = storage.getItem(STORAGE_KEYS.savedDifficultyProfile);
      const restoredDifficulty: DifficultyProfile =
        rawDifficulty === 'retro' || rawDifficulty === 'modern' ? rawDifficulty : difficultyProfile;
      const restoredInitialState = createInitialGameState(validMode, restoredObs, restoredDifficulty);
      const rawFoodType = storage.getItem(STORAGE_KEYS.savedFoodType);
      const restoredFoodType: FoodType =
        rawFoodType === 'bonus' || rawFoodType === 'golden' || rawFoodType === 'ice' ||
        rawFoodType === 'poison' || rawFoodType === 'mystery'
          ? rawFoodType
          : 'regular';
      setSelectedMode(validMode);
      setHighScore(getModeHighScore(validMode));
      setDifficultyProfile(restoredDifficulty);

      const rawTimeRemaining = storage.getItem(STORAGE_KEYS.savedTimeRemaining);
      const restoredTime = restoredInitialState.timeRemainingMs === undefined
        ? undefined
        : rawTimeRemaining === null
          ? restoredInitialState.timeRemainingMs
          : Number(rawTimeRemaining);
      if (
        restoredTime !== undefined &&
        (!Number.isFinite(restoredTime) || restoredTime < 0)
      ) {
        clearSavedGame();
        return false;
      }

      dispatch({
        type: 'RESTORE',
        state: {
          ...restoredInitialState,
          snake: restoredSnake,
          obstacles: restoredObs,
          direction: savedDir,
          food: [foodX, foodY],
          bonusFood: savedBonus,
          score: savedScore,
          gameSpeed: savedSpeed,
          mode: validMode,
          timeRemainingMs: restoredTime === undefined
            ? undefined
            : Math.min(restoredTime, restoredInitialState.timeRemainingMs ?? restoredTime),
          foodType: restoredFoodType,
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
  const startNewGame = (
    requestedMode: GameMode = selectedMode,
    requestedMazeId: string = selectedCustomMazeId
  ) => {
    soundManager.playButtonClick();
    void soundManager.unlockAudio();
    setSelectedMode(requestedMode);
    storage.setItem(STORAGE_KEYS.selectedMode, requestedMode);
    setSelectedCustomMazeId(requestedMazeId);
    storage.setItem(STORAGE_KEYS.selectedCustomMaze, requestedMazeId);
    setHighScore(getModeHighScore(requestedMode));
    clearSavedGame();
    soundManager.setMusicMode(musicEnabled ? 'playing' : 'stopped');

    const totalGames = storage.getNumber(STORAGE_KEYS.totalGamesStarted, 0) + 1;
    storage.setItem(STORAGE_KEYS.totalGamesStarted, String(totalGames));

    const midX = Math.floor(gridSize / 2);
    const midY = Math.floor(gridHeight / 2);
    const initialSnake: Point[] = [
      [midX, midY],
      [midX, midY + 1],
      [midX, midY + 2],
    ];

    let customObstacles: Point[] = [];
    if (requestedMode === 'maze' && requestedMazeId) {
      const found = mazeEditorService.getCustomMazes().find((m) => m.id === requestedMazeId);
      if (found) {
        customObstacles = [...found.obstacles];
      }
    }
    playedCustomMazeRef.current = requestedMode === 'maze' &&
      mazeEditorService.getCustomMazes().some((maze) => maze.id === requestedMazeId);
    foodTypeCountsRef.current = { golden: 0, ice: 0, poison: 0, mystery: 0 };
    longestSnakeRef.current = initialSnake.length;
    setFoodEffect(null);
    setFoodEffectDirection(null);
    inputControllerRef.current.setCurrentDirection('UP');
    inputControllerRef.current.setPendingDirections([]);

    dispatch({
      type: 'RESET',
      state: {
        ...createInitialGameState(requestedMode, customObstacles, difficultyProfile),
        snake: initialSnake,
        food: [midX, midY - 4],
      },
      mode: requestedMode,
      customObstacles,
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

    const selectedMaze = requestedMode === 'maze' && requestedMazeId
      ? mazeEditorService.getCustomMazes().find((maze) => maze.id === requestedMazeId)
      : undefined;
    const modeToast = selectedMaze
      ? t(lang, 'mode_start_toast_custom_maze', { name: selectedMaze.name })
      : t(lang, `mode_start_toast_${requestedMode}` as
        'mode_start_toast_classic' | 'mode_start_toast_maze' |
        'mode_start_toast_survival' | 'mode_start_toast_time_attack');
    enqueueToast({
      id: `mode_start_${requestedMode}_${gameStartTimeRef.current}`,
      type: 'info',
      message: modeToast,
    });
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
    outcome: 'lost' | 'won' | 'time_up' = 'lost'
  ) => {
    if (outcome === 'time_up') {
      vibrate(100);
    } else {
      soundManager.playCrash();
      vibrate(400);
    }
    clearSavedGame();
    adService.onGameFinished();

    const sessionDurationSeconds = Math.max(
      1,
      Math.floor((currentTimeMs() - gameStartTimeRef.current) / 1000)
    );
    const currentHigh = getModeHighScore(selectedMode);
    const isNewHigh = finalScore > currentHigh;
    const finalHigh = Math.max(finalScore, currentHigh);
    const finalTotalFood = totalFood + sessionFoodEatenRef.current;
    const finalTotalTime = totalPlayTime + sessionDurationSeconds;

    // Save per-mode high score (FR-13-R)
    setModeHighScore(selectedMode, finalHigh);
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
      goldenFoodsThisGame: foodTypeCountsRef.current.golden,
      iceFoodsThisGame: foodTypeCountsRef.current.ice,
      poisonFoodsThisGame: foodTypeCountsRef.current.poison,
      mysteryFoodsThisGame: foodTypeCountsRef.current.mystery,
      playedCustomMaze: playedCustomMazeRef.current,
      longestSnakeThisGame: longestSnakeRef.current,
    };

    achievementsManager.checkAchievements(fullGameData, handleAchievementUnlocked);

    // Record in CareerManager with extended analytics (FR-17-R)
    const level = DIFFICULTY_PROFILES[difficultyProfile].getLevel(finalScore);
    const activeTheme = storage.getItem(STORAGE_KEYS.customMapColor) ? 'Custom' : 'Nokia 3310 (Original)';
    careerManager.recordSession(
      gameOverData,
      sessionDurationSeconds,
      longestSnakeRef.current,
      level,
      activeTheme,
      bonusFoodEatenRef.current
    );

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
    difficultyProfile,
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
      particleSystem.triggerNarrowPassSparks(snake[0], 20, colors.particle || colors.snakeHead);
    }

    if (event.type === 'regular-food' || event.type === 'bonus-food') {
      setFoodEffectDirection(direction);
      sessionFoodEatenRef.current += 1;
      longestSnakeRef.current = Math.max(longestSnakeRef.current, snake.length);
      particleSystem.triggerHeadSquash();
      particleSystem.triggerBitePulse();

      if (event.type === 'bonus-food') {
        setFoodEffect('bonus');
        bonusFoodEatenRef.current += 1;
        bonusEatenFastRef.current ||= currentTimeMs() - bonusSpawnTimeRef.current <
          GameLogic.BONUS_FOOD_FAST_EAT_TIMEOUT_MS;
        bonusRemainingRef.current = 0;
        setBonusRemainingMs(0);
        if (bonusTimeoutRef.current) clearTimeout(bonusTimeoutRef.current);
        bonusTimeoutRef.current = null;
        soundManager.playBonusEat();
      } else {
        const effectType: FoodType =
          event.sound === 'golden' ? 'golden' :
          event.sound === 'ice' ? 'ice' :
          event.sound === 'poison' ? 'poison' :
          event.sound === 'bonus' ? 'bonus' :
          event.foodType === 'mystery' ? 'mystery' : 'regular';
        setFoodEffect(effectType);
        if (event.foodType === 'golden' || event.foodType === 'ice' ||
          event.foodType === 'poison' || event.foodType === 'mystery') {
          foodTypeCountsRef.current[event.foodType] += 1;
        }
        if (!wallHitRef.current) foodWithoutWallRef.current += 1;
        if (event.gameSpeedBefore === GameLogic.MIN_SPEED) foodAtMaxSpeedRef.current += 1;

        // Distinct food sounds (FR-14-R)
        if (event.sound === 'golden') {
          soundManager.playGoldenEat();
        } else if (event.sound === 'ice') {
          soundManager.playIceEat();
        } else if (event.sound === 'poison') {
          soundManager.playPoisonEat();
        } else if (event.sound === 'mystery') {
          soundManager.playMysteryEat();
        } else {
          soundManager.playEat();
        }

        if (event.score % GameLogic.BONUS_FOOD_SPAWN_INTERVAL === 0 && bonusFood) {
          bonusSpawnTimeRef.current = currentTimeMs();
          bonusRemainingRef.current = GameLogic.BONUS_FOOD_DISPLAY_TIMEOUT_MS;
          setBonusRemainingMs(GameLogic.BONUS_FOOD_DISPLAY_TIMEOUT_MS);
        }
      }

      achievementsManager.checkScoreAchievements(event.score, handleAchievementUnlocked);
      saveGameState();
    }

    if (event.type === 'time_up') {
      soundManager.playBonusEat();
      finishGame(false, event.score, 'time_up');
    }

    if (event.type === 'collision' || event.type === 'victory') {
      if (event.type === 'collision') {
        particleSystem.triggerCrashExplosion(snake, 20, colors.particle || colors.snakeHead);
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
    colors.particle,
    direction,
  ]);

  useEffect(() => {
    if (!foodEffect) return;
    const timer = setTimeout(() => {
      setFoodEffect(null);
      setFoodEffectDirection(null);
    }, 1800);
    return () => clearTimeout(timer);
  }, [foodEffect]);

  useEffect(() => {
    if (screen !== 'game' || countdown !== null) return;
    const interval = setInterval(
      () => dispatch({ type: 'TICK', randomSeed: createRandomSeed(), elapsedMs: gameSpeed }),
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
      if (document.visibilityState === 'hidden') {
        void soundManager.suspendAudio();
      }
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
  const handleBackInGame = useCallback(() => {
    soundManager.playButtonClick();
    if (bonusFood && bonusTimeoutRef.current) {
      bonusRemainingRef.current = Math.max(0, bonusDeadlineRef.current - currentTimeMs());
      clearTimeout(bonusTimeoutRef.current);
      bonusTimeoutRef.current = null;
    }
    saveGameState();
    setHasSavedGame(true);
    setScreen('pause');
  }, [bonusFood, saveGameState]);

  // Pause menu actions
  const handleResumeFromPause = () => {
    soundManager.playButtonClick();
    void soundManager.unlockAudio();
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
    if (countdown !== null && countdown > 0) {
      setCountdown(null);
      return;
    }
    const dir = inputControllerRef.current.handleSwipe(dx, dy);
    if (dir) {
      soundManager.playButtonClick();
      vibrate(40);
      dispatch({ type: 'QUEUE_DIRECTION', direction: dir });
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

  const lastTickedSecondRef = useRef<number | null>(null);

  // Time Attack countdown audio ticking in the last 10 seconds
  useEffect(() => {
    if (screen !== 'game' || countdown !== null || gameState.timeRemainingMs === undefined) {
      lastTickedSecondRef.current = null;
      return;
    }
    if (gameState.timeRemainingMs <= 10000 && gameState.timeRemainingMs > 0) {
      const currentSec = Math.ceil(gameState.timeRemainingMs / 1000);
      if (lastTickedSecondRef.current !== currentSec) {
        lastTickedSecondRef.current = currentSec;
        soundManager.playTick();
      }
    }
  }, [screen, countdown, gameState.timeRemainingMs]);

  const handleHomeFromGameOver = useCallback(async () => {
    soundManager.playButtonClick();
    setScreen('menu');
    await adService.maybeShowInterstitial();
  }, []);

  // Native Android Capacitor Lifecycle & Back Button Handling (P1)
  useEffect(() => {
    void adService.initialize();

    if (!isCapacitor()) return;

    let cleanupListeners: (() => void) | undefined;

    import('@capacitor/app').then(({ App: CapApp }) => {
      const backPromise = CapApp.addListener('backButton', () => {
        if (isCareerOpen) {
          setIsCareerOpen(false);
          return;
        }
        if (isSettingsOpen) {
          setIsSettingsOpen(false);
          return;
        }
        if (screen === 'game') {
          handleBackInGame();
          return;
        }
        if (screen === 'pause' || screen === 'maze_editor') {
          setScreen('menu');
          return;
        }
        if (screen === 'game_over') {
          void handleHomeFromGameOver();
          return;
        }
        if (screen === 'menu') {
          void CapApp.exitApp();
        }
      });

      const statePromise = CapApp.addListener('appStateChange', (state) => {
        if (!state.isActive) {
          void soundManager.suspendAudio();
        }
        if (!state.isActive && screen === 'game') {
          handleBackInGame();
        }
        if (!state.isActive) {
          void flushStorage().catch((error: unknown) => {
            console.error('Unable to flush saved game data before backgrounding:', error);
          });
        }
      });

      cleanupListeners = () => {
        backPromise.then((h) => h.remove());
        statePromise.then((h) => h.remove());
      };
    });

    return () => {
      cleanupListeners?.();
    };
  }, [screen, isCareerOpen, isSettingsOpen, handleBackInGame, handleHomeFromGameOver]);

  const handleSupportRewarded = () => {
    soundManager.playBonusEat();
    confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
    enqueueToast({
      id: 'support_reward',
      type: 'achievement',
      title: t(lang, 'thank_you_for_support'),
      message: t(lang, 'ad_support_desc'),
    });
  };

  const handleAdNotReady = () => {
    enqueueToast({
      id: 'ad_not_ready',
      type: 'info',
      message: t(lang, 'ad_not_ready'),
    });
  };

  return (
    <div className="app-shell w-full flex flex-col items-center justify-between bg-nokia-grid overflow-hidden text-[#3A3F44] font-nokia select-none">
      <Toast toast={toast} onDismiss={dismissToast} />
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
        onShowPrivacyOptions={handleShowAdPrivacyOptions}
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
          selectedCustomMazeId={selectedCustomMazeId}
          onSelectCustomMaze={handleSelectCustomMaze}
          onToggleLang={handleToggleLang}
          onNewGame={startNewGame}
          onResume={resumeSavedGame}
          onCareer={openCareer}
          onSettings={openSettings}
          onMazeEditor={() => setScreen('maze_editor')}
          onSupportRewarded={handleSupportRewarded}
          onAdNotReady={handleAdNotReady}
        />
      )}
      {screen === 'maze_editor' && (
        <MazeEditorScreen
          lang={lang}
          onBack={() => setScreen('menu')}
          onPlayMaze={(mazeId) => startNewGame('maze', mazeId)}
        />
      )}
      {screen === 'game' && (
        <GameScreen
          lang={lang}
          mode={selectedMode}
          controlMode={controlMode}
          buttonSize={buttonSize}
          handOrientation={handOrientation}
          snake={snake}
          obstacles={obstacles}
          food={food}
          bonusFood={bonusFood}
          bonusRemainingMs={bonusRemainingMs}
          timeRemainingMs={gameState.timeRemainingMs}
          foodType={gameState.foodType}
          foodApproachDirection={foodApproachDirection}
          direction={direction}
          colors={colors}
          score={score}
          foodEffect={foodEffect}
          foodEffectDirection={foodEffectDirection}
          level={DIFFICULTY_PROFILES[difficultyProfile].getLevel(score)}
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
          outcome={gameOutcome}
          isNewHighScore={isNewHighScore}
          mode={selectedMode}
          onTryAgain={startNewGame}
          onShare={handleShareScore}
          onHome={handleHomeFromGameOver}
        />
      )}
    </div>
  );
};
export default App;
