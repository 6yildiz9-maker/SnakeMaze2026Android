import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AdService, rollInterstitialThreshold, AD_CONFIG } from './ads.ts';
import { STORAGE_KEYS, storage } from './storage.ts';

const admobMock = vi.hoisted(() => {
  const listeners = new Map<string, (payload?: unknown) => void>();
  return {
    listeners,
    addListener: vi.fn(async (event: string, callback: (payload?: unknown) => void) => {
      listeners.set(event, callback);
      return { remove: vi.fn(async () => { listeners.delete(event); }) };
    }),
    initialize: vi.fn(async () => {}),
    requestConsentInfo: vi.fn(async () => ({
      isConsentFormAvailable: false,
      status: 'NOT_REQUIRED',
      canRequestAds: true,
    })),
    showConsentForm: vi.fn(async () => ({
      isConsentFormAvailable: false,
      status: 'OBTAINED',
      canRequestAds: true,
    })),
    showPrivacyOptionsForm: vi.fn(async () => ({
      isConsentFormAvailable: false,
      status: 'OBTAINED',
      canRequestAds: true,
    })),
    prepareRewardVideoAd: vi.fn(async () => {}),
    showRewardVideoAd: vi.fn(async () => {}),
    prepareInterstitial: vi.fn(async () => {}),
    showInterstitial: vi.fn(async () => {}),
  };
});

vi.mock('@capacitor-community/admob', () => ({
  AdMob: admobMock,
  RewardAdPluginEvents: {
    Rewarded: 'onRewardedVideoAdReward',
    Dismissed: 'onRewardedVideoAdDismissed',
  },
  AdmobConsentStatus: {
    REQUIRED: 'REQUIRED',
    NOT_REQUIRED: 'NOT_REQUIRED',
    OBTAINED: 'OBTAINED',
  },
  PrivacyOptionsRequirementStatus: {
    REQUIRED: 'REQUIRED',
    NOT_REQUIRED: 'NOT_REQUIRED',
  },
}));

describe('AdService Interstitial & Rewarded Logic', () => {
  let service: AdService;
  const windowDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'window');

  beforeEach(() => {
    storage.removeItem(STORAGE_KEYS.interstitialGameCount);
    storage.removeItem(STORAGE_KEYS.interstitialThreshold);
    service = new AdService(() => true);
    admobMock.listeners.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    if (windowDescriptor) {
      Object.defineProperty(globalThis, 'window', windowDescriptor);
    } else {
      Reflect.deleteProperty(globalThis, 'window');
    }
  });

  it('rolls threshold only from allowed choices [3, 4, 5]', () => {
    for (let i = 0; i < 50; i++) {
      const rolled = rollInterstitialThreshold();
      expect(AD_CONFIG.thresholdChoices).toContain(rolled);
    }
  });

  it('increments game count across finished sessions', () => {
    expect(service.getGameCount()).toBe(0);
    service.onGameFinished();
    expect(service.getGameCount()).toBe(1);
    service.onGameFinished();
    expect(service.getGameCount()).toBe(2);
    expect(storage.getNumber(STORAGE_KEYS.interstitialGameCount, 0)).toBe(2);
  });

  it('persists threshold across reads and respects custom threshold', () => {
    service.setThreshold(4);
    expect(service.getThreshold()).toBe(4);
    expect(storage.getNumber(STORAGE_KEYS.interstitialThreshold, 0)).toBe(4);
  });

  it('does not trigger interstitial before threshold is reached', async () => {
    service.setThreshold(3);
    service.setGameCount(2);

    expect(service.shouldShowInterstitial()).toBe(false);
    const shown = await service.maybeShowInterstitial();
    expect(shown).toBe(false);
    expect(service.getGameCount()).toBe(2);
  });

  it('triggers and resets counter when threshold is reached upon game_over -> menu transition', async () => {
    await service.initialize();
    service.setThreshold(3);
    service.setGameCount(3);

    expect(service.shouldShowInterstitial()).toBe(true);
    const triggered = await service.maybeShowInterstitial();
    expect(triggered).toBe(true);

    // Counter must reset to 0
    expect(service.getGameCount()).toBe(0);
    // New threshold must be drawn from [3, 4, 5]
    expect(AD_CONFIG.thresholdChoices).toContain(service.getThreshold());
  });

  it('does not show rewarded ad on web (strict no-op without fake rewards)', async () => {
    service = new AdService(() => false);
    let rewarded = false;
    let notReadyCalled = false;

    const result = await service.showRewarded(
      () => {
        rewarded = true;
      },
      () => {
        notReadyCalled = true;
      }
    );

    expect(result).toBe(false);
    expect(rewarded).toBe(false);
    expect(notReadyCalled).toBe(true);
  });

  it('does not write interstitial state on web when games finish or ads are checked', async () => {
    service = new AdService(() => false);
    const setItem = vi.spyOn(storage, 'setItem');

    service.onGameFinished();
    expect(await service.maybeShowInterstitial()).toBe(false);
    expect(setItem).not.toHaveBeenCalledWith(
      STORAGE_KEYS.interstitialGameCount,
      expect.any(String)
    );
    expect(setItem).not.toHaveBeenCalledWith(
      STORAGE_KEYS.interstitialThreshold,
      expect.any(String)
    );
  });

  it('grants rewarded ads only when AdMob emits the earned-reward event', async () => {
    const onReward = vi.fn();
    const onNotReady = vi.fn();
    await service.initialize();
    admobMock.showRewardVideoAd.mockImplementationOnce(async () => {
      admobMock.listeners.get('onRewardedVideoAdReward')?.({ amount: 1, type: 'bonus' });
    });

    await expect(service.showRewarded(onReward, onNotReady)).resolves.toBe(true);
    expect(onReward).toHaveBeenCalledOnce();
    expect(onNotReady).not.toHaveBeenCalled();
    expect(admobMock.initialize).toHaveBeenCalledOnce();
  });

  it('does not grant a reward when the ad is dismissed without the reward event', async () => {
    const onReward = vi.fn();
    const onNotReady = vi.fn();
    await service.initialize();
    admobMock.showRewardVideoAd.mockImplementationOnce(async () => {
      admobMock.listeners.get('onRewardedVideoAdDismissed')?.();
    });

    await expect(service.showRewarded(onReward, onNotReady)).resolves.toBe(false);
    expect(onReward).not.toHaveBeenCalled();
    expect(onNotReady).not.toHaveBeenCalled();
  });

  it('uses official demo ad unit IDs by default', () => {
    expect(AD_CONFIG.rewardedUnitId).toBe('ca-app-pub-3940256099942544/1712485313');
    expect(AD_CONFIG.interstitialUnitId).toBe('ca-app-pub-3940256099942544/1033173712');
    expect(AD_CONFIG.initializeForTesting).toBe(true);
  });

  it('collects consent before requesting ads', async () => {
    const service = new AdService(() => true);
    admobMock.requestConsentInfo.mockResolvedValueOnce({
      isConsentFormAvailable: true,
      status: 'REQUIRED',
      canRequestAds: false,
    });
    admobMock.showConsentForm.mockResolvedValueOnce({
      isConsentFormAvailable: true,
      status: 'OBTAINED',
      canRequestAds: true,
    });

    await service.initialize();

    expect(admobMock.showConsentForm).toHaveBeenCalledOnce();
    expect(admobMock.initialize).toHaveBeenCalledOnce();
    expect(admobMock.prepareRewardVideoAd).toHaveBeenCalledOnce();
  });

  it('does not initialize AdMob when consent does not allow ad requests', async () => {
    const service = new AdService(() => true);
    admobMock.requestConsentInfo.mockResolvedValueOnce({
      isConsentFormAvailable: false,
      status: 'REQUIRED',
      canRequestAds: false,
    });

    await service.initialize();

    expect(admobMock.initialize).not.toHaveBeenCalled();
    expect(admobMock.prepareRewardVideoAd).not.toHaveBeenCalled();
  });
});
