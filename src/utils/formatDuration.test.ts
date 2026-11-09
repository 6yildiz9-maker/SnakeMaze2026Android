import { describe, expect, it } from 'vitest';
import { formatDuration } from './formatDuration.ts';

describe('formatDuration', () => {
  it('formats Turkish hours and zero-padded minutes', () => {
    expect(formatDuration(3600, 'tr')).toBe('1s 00dk');
  });

  it('formats English hours and minutes', () => {
    expect(formatDuration(3660, 'en')).toBe('1h 01m');
  });

  it('clamps negative durations to zero', () => {
    expect(formatDuration(-5, 'tr')).toBe('0dk');
  });
});
