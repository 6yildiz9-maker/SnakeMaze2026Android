import { describe, it, expect, beforeEach } from 'vitest';
import { AdService, rollInterstitialThreshold, AD_CONFIG } from './ads.ts';
import { STORAGE_KEYS, storage } from './storage.ts';

describe('AdService Interstitial & Rewarded Logic', () => {
  let service: AdService;

  beforeEach(() => {
    storage.removeItem(STORAGE_KEYS.interstitialGameCount);
    storage.removeItem(STORAGE_KEYS.interstitialThreshold);
    service = new AdService();
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
});
