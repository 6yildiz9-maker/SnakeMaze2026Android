import { isCapacitor } from './platform.ts';
import { STORAGE_KEYS, storage } from './storage.ts';

const productionAdMobIds = {
  rewardedUnitId: 'ca-app-pub-3710029547742219/6583522230',
  interstitialUnitId: 'ca-app-pub-3710029547742219/3893595589',
};

const testAdMobIds = {
  rewardedUnitId: 'ca-app-pub-3940256099942544/1712485313',
  interstitialUnitId: 'ca-app-pub-3940256099942544/1033173712',
};

const useTestAds = import.meta.env.VITE_ADMOB_USE_TEST_IDS !== 'false';

export const AD_CONFIG = {
  ...(useTestAds ? testAdMobIds : productionAdMobIds),
  initializeForTesting: useTestAds,
  thresholdChoices: [3, 4, 5] as const,
};

export function rollInterstitialThreshold(): number {
  const choices = AD_CONFIG.thresholdChoices;
  return choices[Math.floor(Math.random() * choices.length)];
}

export class AdService {
  private initialized = false;
  private canRequestAds = false;
  private isRewardedLoaded = false;
  private isInterstitialLoaded = false;

  public constructor(private readonly isNativePlatform = isCapacitor) {}

  public async initialize(): Promise<void> {
    if (this.initialized) return;
    if (this.isNativePlatform()) {
      try {
        const { AdMob, AdmobConsentStatus } = await import('@capacitor-community/admob');
        let consent = await AdMob.requestConsentInfo();
        if (
          consent.isConsentFormAvailable &&
          consent.status === AdmobConsentStatus.REQUIRED
        ) {
          consent = await AdMob.showConsentForm();
        }
        this.canRequestAds = consent.canRequestAds;
        if (!consent.canRequestAds) {
          this.initialized = true;
          return;
        }
        await AdMob.initialize({
          testingDevices: [],
          initializeForTesting: AD_CONFIG.initializeForTesting,
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

  public async showPrivacyOptions(): Promise<void> {
    if (!this.isNativePlatform()) return;
    const { AdMob } = await import('@capacitor-community/admob');
    const currentConsent = await AdMob.requestConsentInfo();
    if (String(currentConsent.privacyOptionsRequirementStatus) !== 'REQUIRED') return;
    await AdMob.showPrivacyOptionsForm();
    const updatedConsent = await AdMob.requestConsentInfo();
    this.canRequestAds = updatedConsent.canRequestAds;
    this.isRewardedLoaded = false;
    this.isInterstitialLoaded = false;
    if (this.canRequestAds) {
      this.initialized = false;
      await this.initialize();
    }
  }

  public async preloadRewarded(): Promise<boolean> {
    if (!this.isNativePlatform()) return false;
    try {
      const { AdMob } = await import('@capacitor-community/admob');
      await AdMob.prepareRewardVideoAd({
        adId: AD_CONFIG.rewardedUnitId,
      });
      this.isRewardedLoaded = true;
      return true;
    } catch {
      this.isRewardedLoaded = false;
      return false;
    }
  }

  public async showRewarded(onReward: () => void, onNotReady?: () => void): Promise<boolean> {
    if (!this.isNativePlatform()) {
      // Strict web no-op: no fake rewards
      onNotReady?.();
      return false;
    }
    if (!this.canRequestAds) return false;

    let rewardEarned = false;
    let dismissed = false;
    let notReady = false;
    let adStarted = false;
    let rewardListener: { remove: () => Promise<void> } | undefined;
    let dismissedListener: { remove: () => Promise<void> } | undefined;
    try {
      const { AdMob, RewardAdPluginEvents } = await import('@capacitor-community/admob');
      rewardListener = await AdMob.addListener(
        RewardAdPluginEvents.Rewarded,
        () => {
          rewardEarned = true;
        }
      );
      dismissedListener = await AdMob.addListener(
        RewardAdPluginEvents.Dismissed,
        () => {
          dismissed = true;
        }
      );
      if (!this.isRewardedLoaded) {
        const loaded = await this.preloadRewarded();
        if (!loaded) {
          notReady = true;
        } else {
          adStarted = true;
        }
      } else {
        adStarted = true;
      }
      if (adStarted) {
        try {
          await AdMob.showRewardVideoAd();
        } catch (error) {
          if (!dismissed) {
            console.warn('Rewarded ad failed to show:', error);
            notReady = true;
          }
        }
      }
    } catch (error) {
      console.warn('Unable to complete rewarded ad flow:', error);
      if (!dismissed) notReady = true;
    } finally {
      const cleanupResults = await Promise.allSettled([
        rewardListener?.remove(),
        dismissedListener?.remove(),
      ].filter((cleanup): cleanup is Promise<void> => cleanup !== undefined));
      for (const result of cleanupResults) {
        if (result.status === 'rejected') {
          console.warn('Unable to remove a rewarded-ad listener:', result.reason);
        }
      }
      if (adStarted) {
        this.isRewardedLoaded = false;
        void this.preloadRewarded();
      }
    }

    if (rewardEarned) {
      onReward();
      return true;
    }
    if (notReady) onNotReady?.();
    return false;
  }

  public async preloadInterstitial(): Promise<void> {
    if (!this.isNativePlatform()) return;
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
    if (!this.isNativePlatform()) return;
    const count = this.getGameCount() + 1;
    this.setGameCount(count);
    // Ensure threshold is initialized
    this.getThreshold();
  }

  public shouldShowInterstitial(): boolean {
    if (!this.isNativePlatform()) return false;
    return this.getGameCount() >= this.getThreshold();
  }

  /**
   * Called ONLY on transition from game_over -> menu (never on 'try_again' / restart)
   */
  public async maybeShowInterstitial(): Promise<boolean> {
    if (!this.isNativePlatform()) return false;
    if (!this.canRequestAds) return false;
    if (!this.shouldShowInterstitial()) {
      return false;
    }

    // Reset counter and set fresh random 3/4/5 threshold
    this.setGameCount(0);
    this.setThreshold(rollInterstitialThreshold());

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
