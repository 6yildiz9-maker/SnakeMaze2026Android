import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { STORAGE_KEYS, storage } from './storage.ts';

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
    return Array.from(this.data.keys())[index] ?? null;
  }

  removeItem(key: string) {
    this.data.delete(key);
  }

  setItem(key: string, value: string) {
    this.data.set(key, String(value));
  }
}

const originalWindow = Object.getOwnPropertyDescriptor(globalThis, 'window');
const memoryStorage = new MemoryStorage();

beforeAll(() => {
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: { localStorage: memoryStorage },
  });
});

afterEach(() => memoryStorage.clear());

describe('storage', () => {
  it('reads and writes legacy keys without renaming user data', () => {
    storage.setItem(STORAGE_KEYS.language, 'tr');
    expect(storage.getItem('My_Lang')).toBe('tr');
  });

  it('uses the fallback for malformed numbers and JSON', () => {
    storage.setItem(STORAGE_KEYS.highScore, 'not-a-number');
    storage.setItem(STORAGE_KEYS.usedPresetThemes, '{broken');

    expect(storage.getNumber(STORAGE_KEYS.highScore, 12)).toBe(12);
    expect(storage.getJson<string[]>(STORAGE_KEYS.usedPresetThemes, [])).toEqual([]);
  });
});

afterAll(() => {
  if (originalWindow) {
    Object.defineProperty(globalThis, 'window', originalWindow);
  } else {
    Reflect.deleteProperty(globalThis, 'window');
  }
});
