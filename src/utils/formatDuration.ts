import { Language } from '../types.ts';

export function formatDuration(seconds: number, lang: Language): string {
  const totalMinutes = Math.floor(Math.max(0, seconds) / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (lang === 'tr') {
    return hours > 0
      ? `${hours}s ${String(minutes).padStart(2, '0')}dk`
      : `${minutes}dk`;
  }
  return hours > 0
    ? `${hours}h ${String(minutes).padStart(2, '0')}m`
    : `${minutes}m`;
}
