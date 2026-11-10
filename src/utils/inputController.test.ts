import { describe, expect, it } from 'vitest';
import {
  InputController,
  resolveZigZagDirection,
  isValidDirectionChange,
} from './inputController.ts';

describe('InputController', () => {
  it('prevents 180-degree instant reversal', () => {
    expect(isValidDirectionChange('UP', 'DOWN')).toBe(false);
    expect(isValidDirectionChange('DOWN', 'UP')).toBe(false);
    expect(isValidDirectionChange('LEFT', 'RIGHT')).toBe(false);
    expect(isValidDirectionChange('RIGHT', 'LEFT')).toBe(false);

    expect(isValidDirectionChange('UP', 'LEFT')).toBe(true);
    expect(isValidDirectionChange('UP', 'RIGHT')).toBe(true);
  });

  it('correctly resolves zig-zag 2-button directions', () => {
    // Going UP -> Left button turns LEFT, Right button turns RIGHT
    expect(resolveZigZagDirection('left', 'UP')).toBe('LEFT');
    expect(resolveZigZagDirection('right', 'UP')).toBe('RIGHT');

    // Going LEFT -> Left button turns DOWN, Right button turns UP
    expect(resolveZigZagDirection('left', 'LEFT')).toBe('DOWN');
    expect(resolveZigZagDirection('right', 'LEFT')).toBe('UP');
  });

  it('unifies keyboard, swipe and button inputs producing identical queued directions', () => {
    const controller = new InputController('UP', 'alternative');

    // Key press ArrowRight
    const keyRes = controller.handleKey('ArrowRight');
    expect(keyRes).toBe('RIGHT');
    expect(controller.popNextDirection()).toBe('RIGHT');

    // Swipe right (dx=50, dy=0)
    controller.setCurrentDirection('UP');
    const swipeRes = controller.handleSwipe(50, 0);
    expect(swipeRes).toBe('RIGHT');
    expect(controller.popNextDirection()).toBe('RIGHT');

    // Direct direction
    controller.setCurrentDirection('UP');
    const dirRes = controller.handleDirection('RIGHT');
    expect(dirRes).toBe(true);
    expect(controller.popNextDirection()).toBe('RIGHT');
  });

  it('limits queue size to 3 items', () => {
    const controller = new InputController('UP', 'alternative');
    expect(controller.handleDirection('RIGHT')).toBe(true);
    expect(controller.handleDirection('DOWN')).toBe(true);
    expect(controller.handleDirection('LEFT')).toBe(true);
    expect(controller.handleDirection('UP')).toBe(false); // exceeds 3
  });

  it('keeps rapid turns queued against the last pending turn', () => {
    const controller = new InputController('UP', 'alternative');

    expect(controller.handleDirection('RIGHT')).toBe(true);
    expect(controller.handleDirection('DOWN')).toBe(true);
    expect(controller.handleDirection('LEFT')).toBe(true);
    expect(controller.handleDirection('UP')).toBe(false);
    expect(controller.getQueue()).toEqual(['RIGHT', 'DOWN', 'LEFT']);

    controller.setCurrentDirection('RIGHT');
    controller.setPendingDirections(['DOWN', 'LEFT']);
    expect(controller.handleDirection('UP')).toBe(true);
    expect(controller.getQueue()).toEqual(['DOWN', 'LEFT', 'UP']);
  });

  it('ignores repeated input for the same pending direction', () => {
    const controller = new InputController('UP', 'alternative');
    expect(controller.handleDirection('RIGHT')).toBe(true);
    expect(controller.handleDirection('RIGHT')).toBe(false);
    expect(controller.getQueue()).toEqual(['RIGHT']);
  });

  it('handles zig-zag button input directly via controller layer', () => {
    const controller = new InputController('UP', 'classic');
    const dir = controller.handleZigZag('left');
    expect(dir).toBe('LEFT');
    expect(controller.popNextDirection()).toBe('LEFT');

    controller.setCurrentDirection('LEFT');
    const dir2 = controller.handleZigZag('left');
    expect(dir2).toBe('DOWN');
    expect(controller.popNextDirection()).toBe('DOWN');
  });
});
