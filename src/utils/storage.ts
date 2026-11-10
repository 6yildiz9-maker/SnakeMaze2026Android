import { isCapacitor } from './platform.ts';

export const STORAGE_KEYS = {
  language: 'My_Lang',
  soundEnabled: 'sound_on',
  controlMode: 'control_preference',
  customSnakeHeadColor: 'custom_snake_head_color',
  customSnakeBodyColor: 'custom_snake_body_color',
  customFoodColor: 'custom_food_color',
  customMapColor: 'custom_map_color',
  lcdEffectsEnabled: 'lcd_effects_enabled',
  smoothMotionEnabled: 'smooth_motion_enabled',
  musicEnabled: 'music_enabled',
  musicHintShown: 'music_hint_shown',
  rankDecorationsEnabled: 'rank_decorations_enabled',
  highScore: 'high_score',
  totalFood: 'total_food',
  totalPlayTime: 'total_play_time',
  totalGamesStarted: 'total_games_started',
  savedVersion: 'saved_v',
  savedSnake: 'saved_snake_body',
  savedObstacles: 'saved_obstacles',
  savedDirection: 'saved_direction',
  savedFoodX: 'saved_food_x',
  savedFoodY: 'saved_food_y',
  savedScore: 'saved_score',
  savedGameSpeed: 'saved_game_speed',
  savedBonusFoodX: 'saved_bonus_food_x',
  savedBonusFoodY: 'saved_bonus_food_y',
  savedBonusFoodRemaining: 'saved_bonus_food_remaining',
  savedGameRunning: 'saved_is_game_running',
  savedMode: 'saved_mode',
  savedTimeRemaining: 'saved_time_remaining_ms',
  vibrationEnabled: 'vibration_enabled',
  buttonSize: 'button_size',
  handOrientation: 'hand_orientation',
  difficultyProfile: 'difficulty_profile',
  selectedMode: 'selected_mode',
  selectedCustomMaze: 'selected_custom_maze',
  careerData: 'career_data',
  dailyQuests: 'daily_quests',
  customMazes: 'custom_mazes',
  usedAllThemes: 'used_all_themes',
  usedCustomTheme: 'used_custom_theme',
  usedPresetThemes: 'used_preset_themes',
  interstitialGameCount: 'interstitial_game_count',
  interstitialThreshold: 'interstitial_threshold',
  achievementPrefix: 'achievement_',
} as const;

export function getModeHighScore(mode: string): number {
  const specific = storage.getNumber(`high_score_${mode}`, -1);
  if (specific >= 0) return specific;
  if (mode === 'maze') {
    return storage.getNumber(STORAGE_KEYS.highScore, 0);
  }
  return 0;
}

export function setModeHighScore(mode: string, score: number): void {
  storage.setItem(`high_score_${mode}`, String(score));
  if (mode === 'maze') {
    storage.setItem(STORAGE_KEYS.highScore, String(score));
  }
}

const inMemoryStore = new Map<string, string>();
const nativeValues = new Map<string, string>();
type KeyValueStore = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

let nativePreferences: typeof import('@capacitor/preferences').Preferences | null = null;
let nativeStorageInitialized = false;
let persistenceQueue = Promise.resolve();
const persistenceErrors: unknown[] = [];

function getBrowserStorage(): KeyValueStore | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function queueNativeWrite(write: () => Promise<void>): void {
  persistenceQueue = persistenceQueue.then(write).catch((error: unknown) => {
    persistenceErrors.push(error);
    console.error('Unable to persist native preferences:', error);
  });
}

function getStorage(): KeyValueStore {
  if (isCapacitor()) {
    if (!nativeStorageInitialized || !nativePreferences) {
      throw new Error('Native preferences are not initialized.');
    }
    return {
      getItem: (key) => nativeValues.get(key) ?? null,
      setItem: (key, value) => {
        nativeValues.set(key, value);
        queueNativeWrite(() => nativePreferences!.set({ key, value }));
      },
      removeItem: (key) => {
        nativeValues.delete(key);
        queueNativeWrite(() => nativePreferences!.remove({ key }));
      },
    };
  }

  const browserStorage = getBrowserStorage();
  if (browserStorage) return browserStorage;
  return {
    getItem: (key: string) => inMemoryStore.get(key) ?? null,
    setItem: (key: string, value: string) => inMemoryStore.set(key, String(value)),
    removeItem: (key: string) => inMemoryStore.delete(key),
  };
}

export async function initializeStorage(): Promise<void> {
  if (!isCapacitor()) {
    nativeStorageInitialized = true;
    return;
  }

  const { Preferences } = await import('@capacitor/preferences');
  nativePreferences = Preferences;
  const browserStorage = getBrowserStorage();
  const legacyValues = new Map<string, string>();
  if (browserStorage && typeof window !== 'undefined') {
    try {
      for (let index = 0; index < window.localStorage.length; index += 1) {
        const key = window.localStorage.key(index);
        if (key === null) continue;
        const value = window.localStorage.getItem(key);
        if (value !== null) legacyValues.set(key, value);
      }
    } catch (error) {
      console.warn('Unable to read legacy WebView storage for migration:', error);
    }
  }

  const { keys: storedKeys } = await Preferences.keys();
  const existingKeys = new Set(storedKeys);
  for (const [key, value] of legacyValues) {
    if (!existingKeys.has(key)) {
      await Preferences.set({ key, value });
      existingKeys.add(key);
    }
  }

  const storedValues = await Promise.all(
    [...existingKeys].map(async (key) => {
      const { value } = await Preferences.get({ key });
      return [key, value] as const;
    })
  );
  nativeValues.clear();
  for (const [key, value] of storedValues) {
    if (value !== null) nativeValues.set(key, value);
  }

  if (browserStorage) {
    for (const key of legacyValues.keys()) browserStorage.removeItem(key);
  }
  nativeStorageInitialized = true;
}

export async function flushStorage(): Promise<void> {
  await persistenceQueue;
  if (persistenceErrors.length > 0) {
    persistenceErrors.splice(0, persistenceErrors.length);
    const error = new Error('One or more native preference writes failed.');
    error.name = 'StoragePersistenceError';
    throw error;
  }
}

export const storage = {
  getItem(key: string): string | null {
    return getStorage().getItem(key);
  },
  setItem(key: string, value: string): void {
    getStorage().setItem(key, value);
  },
  removeItem(key: string): void {
    getStorage().removeItem(key);
  },
  getNumber(key: string, fallback: number): number {
    const value = Number(this.getItem(key));
    return Number.isFinite(value) ? value : fallback;
  },
  getJson<T>(key: string, fallback: T): T {
    const value = this.getItem(key);
    if (value === null) return fallback;
    try {
      return JSON.parse(value) as T;
    } catch (error) {
      console.warn(`Invalid stored JSON for "${key}":`, error);
      return fallback;
    }
  },
};

export function achievementStorageKey(id: string): string {
  return `${STORAGE_KEYS.achievementPrefix}${id}`;
}
