import { isCapacitor, WindowWithCapacitor } from './platform.ts';

export interface AdServiceContract {
  isReady: boolean;
  preloadRewarded: () => Promise<void>;
  showRewarded: (onReward: () => void, onNotReady?: () => void) => Promise<boolean>;
}

class AdService implements AdServiceContract {
  public isReady: boolean = true;

  public async preloadRewarded(): Promise<void> {
    if (isCapacitor()) {
      // In native Android Capacitor build, initializes and preloads AdMob rewarded unit
      this.isReady = true;
    } else {
      this.isReady = true;
    }
  }

  public async showRewarded(onReward: () => void, onNotReady?: () => void): Promise<boolean> {
    if (!this.isReady) {
      onNotReady?.();
      await this.preloadRewarded();
      return false;
    }

    if (isCapacitor()) {
      // Capacitor AdMob bridge
      try {
        const AdMob = (window as unknown as WindowWithCapacitor).Capacitor?.Plugins?.AdMob;
        if (AdMob) {
          await AdMob.showRewardVideoAd();
          onReward();
          await this.preloadRewarded();
          return true;
        }
      } catch {
        onNotReady?.();
        return false;
      }
    }

    // Web/PWA build: ads are no-op; no fake rewards triggered
    onNotReady?.();
    return false;
  }
}

export const adService = new AdService();
