import { isCapacitor } from './platform.ts';
import { STORAGE_KEYS, storage } from './storage.ts';

export const AD_CONFIG = {
  appId: 'ca-app-pub-3710029547742219~6978419692',
  rewardedUnitId: 'ca-app-pub-3710029547742219/6583522230',
  interstitialUnitId: 'ca-app-pub-3710029547742219/3893595589',
  thresholdChoices: [3, 4, 5] as const,
};

export function rollInterstitialThreshold(): number {
  const choices = AD_CONFIG.thresholdChoices;
  return choices[Math.floor(Math.random() * choices.length)];
}

export class AdService {
  private initialized = false;
  private isRewardedLoaded = false;
  private isInterstitialLoaded = false;

  public async initialize(): Promise<void> {
    if (this.initialized) return;
    if (isCapacitor()) {
      try {
        const { AdMob } = await import('@capacitor-community/admob');
        await AdMob.initialize({
          testingDevices: [],
          initializeForTesting: false,
        });
        this.initialized = true;
        await Promise.all([this.preloadRewarded(), this.preloadInterstitial()]);
      } catch (err) {
        console.warn('AdMob initialization error:', err);
      }
    } else {
      this.initialized = true;
    }
  }

  public async preloadRewarded(): Promise<void> {
    if (!isCapacitor()) return;
    try {
      const { AdMob } = await import('@capacitor-community/admob');
      await AdMob.prepareRewardVideoAd({
        adId: AD_CONFIG.rewardedUnitId,
      });
      this.isRewardedLoaded = true;
    } catch {
      this.isRewardedLoaded = false;
    }
  }

  public async showRewarded(onReward: () => void, onNotReady?: () => void): Promise<boolean> {
    if (!isCapacitor()) {
      // Strict web no-op: no fake rewards
      onNotReady?.();
      return false;
    }

    try {
      const { AdMob } = await import('@capacitor-community/admob');
      if (!this.isRewardedLoaded) {
        await this.preloadRewarded();
      }
      await AdMob.showRewardVideoAd();
      this.isRewardedLoaded = false;
      onReward();
      void this.preloadRewarded();
      return true;
    } catch {
      onNotReady?.();
      void this.preloadRewarded();
      return false;
    }
  }

  public async preloadInterstitial(): Promise<void> {
    if (!isCapacitor()) return;
    try {
      const { AdMob } = await import('@capacitor-community/admob');
      await AdMob.prepareInterstitial({
        adId: AD_CONFIG.interstitialUnitId,
      });
      this.isInterstitialLoaded = true;
    } catch {
      this.isInterstitialLoaded = false;
    }
  }

  // Interstitial counter & 3/4/5 threshold methods
  public getGameCount(): number {
    return storage.getNumber(STORAGE_KEYS.interstitialGameCount, 0);
  }

  public setGameCount(count: number): void {
    storage.setItem(STORAGE_KEYS.interstitialGameCount, String(count));
  }

  public getThreshold(): number {
    const saved = storage.getNumber(STORAGE_KEYS.interstitialThreshold, 0);
    if ([3, 4, 5].includes(saved)) {
      return saved;
    }
    const fresh = rollInterstitialThreshold();
    storage.setItem(STORAGE_KEYS.interstitialThreshold, String(fresh));
    return fresh;
  }

  public setThreshold(val: number): void {
    storage.setItem(STORAGE_KEYS.interstitialThreshold, String(val));
  }

  public onGameFinished(): void {
    const count = this.getGameCount() + 1;
    this.setGameCount(count);
    // Ensure threshold is initialized
    this.getThreshold();
  }

  public shouldShowInterstitial(): boolean {
    return this.getGameCount() >= this.getThreshold();
  }

  /**
   * Called ONLY on transition from game_over -> menu (never on 'try_again' / restart)
   */
  public async maybeShowInterstitial(): Promise<boolean> {
    if (!this.shouldShowInterstitial()) {
      return false;
    }

    // Reset counter and set fresh random 3/4/5 threshold
    this.setGameCount(0);
    this.setThreshold(rollInterstitialThreshold());

    if (!isCapacitor()) {
      // On web, counter resets cleanly, but no ads shown
      return true;
    }

    try {
      const { AdMob } = await import('@capacitor-community/admob');
      if (!this.isInterstitialLoaded) {
        await this.preloadInterstitial();
      }
      await AdMob.showInterstitial();
      this.isInterstitialLoaded = false;
      void this.preloadInterstitial();
      return true;
    } catch {
      void this.preloadInterstitial();
      return false;
    }
  }
}

export const adService = new AdService();
