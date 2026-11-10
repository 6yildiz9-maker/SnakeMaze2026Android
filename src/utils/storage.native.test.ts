import { afterEach, describe, expect, it, vi } from 'vitest';

const preferenceValues = vi.hoisted(() => new Map<string, string>());

vi.mock('@capacitor/preferences', () => ({
  Preferences: {
    keys: vi.fn(async () => ({ keys: [...preferenceValues.keys()] })),
    get: vi.fn(async ({ key }: { key: string }) => ({
      value: preferenceValues.get(key) ?? null,
    })),
    set: vi.fn(async ({ key, value }: { key: string; value: string }) => {
      preferenceValues.set(key, value);
    }),
    remove: vi.fn(async ({ key }: { key: string }) => {
      preferenceValues.delete(key);
    }),
  },
}));

import { flushStorage, initializeStorage, storage } from './storage.ts';

class MemoryStorage implements Storage {
  private readonly data = new Map<string, string>();

  get length() {
    return this.data.size;
  }

  clear() {
    this.data.clear();
  }

  getItem(key: string) {
    return this.data.get(key) ?? null;
  }

  key(index: number) {
    return [...this.data.keys()][index] ?? null;
  }

  removeItem(key: string) {
    this.data.delete(key);
  }

  setItem(key: string, value: string) {
    this.data.set(key, String(value));
  }
}

const legacyStorage = new MemoryStorage();

afterEach(() => {
  preferenceValues.clear();
  legacyStorage.clear();
  Reflect.deleteProperty(globalThis, 'window');
});

describe('native storage', () => {
  it('migrates existing WebView values without overwriting Preferences data', async () => {
    legacyStorage.setItem('My_Lang', 'tr');
    legacyStorage.setItem('high_score', '42');
    preferenceValues.set('high_score', '99');
    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      value: {
        Capacitor: { isNativePlatform: () => true },
        localStorage: legacyStorage,
      },
    });

    await initializeStorage();

    expect(storage.getItem('My_Lang')).toBe('tr');
    expect(storage.getItem('high_score')).toBe('99');
    expect(legacyStorage.length).toBe(0);
    expect(preferenceValues.get('My_Lang')).toBe('tr');
  });

  it('persists new values and removals to native Preferences', async () => {
    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      value: {
        Capacitor: { isNativePlatform: () => true },
        localStorage: legacyStorage,
      },
    });
    await initializeStorage();

    storage.setItem('custom_setting', 'enabled');
    await flushStorage();
    expect(preferenceValues.get('custom_setting')).toBe('enabled');

    storage.removeItem('custom_setting');
    await flushStorage();
    expect(preferenceValues.has('custom_setting')).toBe(false);
  });
});
