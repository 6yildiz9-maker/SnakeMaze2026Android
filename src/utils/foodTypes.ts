import { FoodType, Point } from '../types.ts';

export interface FoodItem {
  type: FoodType;
  position: Point;
  points: number;
  durationMs?: number;
  spawnTime: number;
}

export interface FoodDefinition {
  type: FoodType;
  nameKey: string;
  points: number;
  shape: 'square' | 'circle' | 'star' | 'diamond' | 'triangle' | 'mystery';
  color: string;
  borderColor: string;
  descriptionKey: string;
}

export const FOOD_DEFINITIONS: Record<FoodType, FoodDefinition> = {
  regular: {
    type: 'regular',
    nameKey: 'food_regular',
    points: 1,
    shape: 'square',
    color: '#D32F2F',
    borderColor: '#B71C1C',
    descriptionKey: 'food_regular_desc',
  },
  bonus: {
    type: 'bonus',
    nameKey: 'food_bonus',
    points: 3,
    shape: 'circle',
    color: '#FFD700',
    borderColor: '#E91E63',
    descriptionKey: 'food_bonus_desc',
  },
  golden: {
    type: 'golden',
    nameKey: 'food_golden',
    points: 5,
    shape: 'star',
    color: '#FFD700',
    borderColor: '#B8860B',
    descriptionKey: 'food_golden_desc',
  },
  ice: {
    type: 'ice',
    nameKey: 'food_ice',
    points: 2,
    shape: 'diamond',
    color: '#00E5FF',
    borderColor: '#0097A7',
    descriptionKey: 'food_ice_desc',
  },
  poison: {
    type: 'poison',
    nameKey: 'food_poison',
    points: -1,
    shape: 'triangle',
    color: '#9C27B0',
    borderColor: '#4A148C',
    descriptionKey: 'food_poison_desc',
  },
  mystery: {
    type: 'mystery',
    nameKey: 'food_mystery',
    points: 2,
    shape: 'mystery',
    color: '#FF9800',
    borderColor: '#E65100',
    descriptionKey: 'food_mystery_desc',
  },
};

export interface FoodEffectResult {
  scoreDelta: number;
  speedDelta: number; // positive = slows down (adds ms to tick interval)
  segmentsDelta: number; // -1 for poison
  sound: 'regular' | 'bonus' | 'golden' | 'ice' | 'poison' | 'mystery';
}

export function applyFoodEffect(
  type: FoodType,
  random: () => number = Math.random
): FoodEffectResult {
  switch (type) {
    case 'golden':
      return { scoreDelta: 5, speedDelta: 0, segmentsDelta: 1, sound: 'golden' };
    case 'ice':
      // Slows down snake (adds 40ms to frame interval)
      return { scoreDelta: 2, speedDelta: 40, segmentsDelta: 1, sound: 'ice' };
    case 'poison':
      // Penalty: -1 point, drops 1 tail segment
      return { scoreDelta: -1, speedDelta: 0, segmentsDelta: -1, sound: 'poison' };
    case 'mystery': {
      const roll = random();
      if (roll < 0.35) {
        return { scoreDelta: 5, speedDelta: 0, segmentsDelta: 1, sound: 'golden' };
      } else if (roll < 0.7) {
        return { scoreDelta: 2, speedDelta: 40, segmentsDelta: 1, sound: 'ice' };
      } else {
        return { scoreDelta: 3, speedDelta: -10, segmentsDelta: 2, sound: 'bonus' };
      }
    }
    case 'bonus':
      return { scoreDelta: 3, speedDelta: 0, segmentsDelta: 2, sound: 'bonus' };
    case 'regular':
    default:
      return { scoreDelta: 1, speedDelta: 0, segmentsDelta: 1, sound: 'regular' };
  }
}
