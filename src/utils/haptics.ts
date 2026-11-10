import { STORAGE_KEYS, storage } from './storage.ts';

let isVibrationEnabledCache: boolean = storage.getItem(STORAGE_KEYS.vibrationEnabled) !== 'false';

export function setVibrationEnabled(enabled: boolean): void {
  isVibrationEnabledCache = enabled;
  storage.setItem(STORAGE_KEYS.vibrationEnabled, String(enabled));
}

export function getVibrationEnabled(): boolean {
  return isVibrationEnabledCache;
}

export function vibrate(ms: number = 50): void {
  if (!isVibrationEnabledCache) return;
  if (typeof window !== 'undefined' && 'navigator' in window && typeof navigator.vibrate === 'function') {
    try {
      navigator.vibrate(ms);
    } catch {
      // ignore
    }
  }
}
