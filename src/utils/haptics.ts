import { STORAGE_KEYS, storage } from './storage.ts';
import { isCapacitor } from './platform.ts';

let isVibrationEnabledCache: boolean = storage.getItem(STORAGE_KEYS.vibrationEnabled) !== 'false';

export function setVibrationEnabled(enabled: boolean): void {
  isVibrationEnabledCache = enabled;
  storage.setItem(STORAGE_KEYS.vibrationEnabled, String(enabled));
}

export function getVibrationEnabled(): boolean {
  return isVibrationEnabledCache;
}

export async function vibrate(ms: number = 50): Promise<void> {
  if (!isVibrationEnabledCache) return;

  if (isCapacitor()) {
    try {
      const { Haptics, ImpactStyle } = await import('@capacitor/haptics');
      if (ms <= 60) {
        await Haptics.impact({ style: ImpactStyle.Light });
      } else if (ms <= 150) {
        await Haptics.impact({ style: ImpactStyle.Medium });
      } else {
        await Haptics.vibrate({ duration: ms });
      }
      return;
    } catch {
      // fallback to browser navigator
    }
  }

  if (typeof window !== 'undefined' && 'navigator' in window && typeof navigator.vibrate === 'function') {
    try {
      navigator.vibrate(ms);
    } catch {
      // ignore
    }
  }
}
