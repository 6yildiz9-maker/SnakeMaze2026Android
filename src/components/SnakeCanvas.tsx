import React, { useEffect, useRef, useState } from 'react';
import { Direction, Point, ThemeColors } from '../types.ts';

interface SnakeCanvasProps {
  gridSize?: number;
  gridHeight?: number;
  snake: Point[];
  obstacles: Point[];
  food: Point;
  bonusFood: Point | null;
  direction: Direction;
  colors: ThemeColors;
  isPreview?: boolean;
  className?: string;
  smoothMotion?: boolean;
  gameSpeed?: number;
  rankDecorationsEnabled?: boolean;
  rankDecoration?: string;
}

export const SnakeCanvas: React.FC<SnakeCanvasProps> = ({
  gridSize = 20,
  gridHeight = 20,
  snake,
  obstacles,
  food,
  bonusFood,
  direction,
  colors,
  isPreview = false,
  className = '',
  smoothMotion = false,
  gameSpeed = 300,
  rankDecorationsEnabled = false,
  rankDecoration = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const previousSnakeRef = useRef(snake);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updatePreference = () => setPrefersReducedMotion(preference.matches);
    updatePreference();
    preference.addEventListener('change', updatePreference);
    return () => preference.removeEventListener('change', updatePreference);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const previousSnake = previousSnakeRef.current;
    previousSnakeRef.current = snake;
    const animationStart = performance.now();
    let animationFrame = 0;
    const draw = (progress = 1) => {
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const cellSize = width / gridSize;

    // Clear background
    ctx.fillStyle = colors.map;
    ctx.fillRect(0, 0, width, height);

    // Grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1;

    for (let x = 0; x <= width; x += cellSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y <= height; y += cellSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    const drawRoundedRect = (
      x: number,
      y: number,
      w: number,
      h: number,
      radius: number,
      fillColor: string
    ) => {
      ctx.fillStyle = fillColor;
      ctx.beginPath();
      const r = Math.min(radius, w / 2, h / 2);
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r);
      ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r);
      ctx.arcTo(x, y, x + w, y, r);
      ctx.closePath();
      ctx.fill();
    };

    if (isPreview) {
      // Preview mode render
      const midX = Math.floor(gridSize / 2);
      const midY = Math.floor(gridHeight / 2);
      const previewSnake: Point[] = [
        [midX, midY],
        [midX, midY + 1],
        [midX, midY + 2],
      ];
      const previewFood: Point = [midX + 2, midY];

      // Draw preview food
      drawRoundedRect(
        previewFood[0] * cellSize + 2,
        previewFood[1] * cellSize + 2,
        cellSize - 4,
        cellSize - 4,
        6,
        colors.food
      );

      // Draw preview snake
      previewSnake.forEach(([x, y], idx) => {
        const color = idx === 0 ? colors.snakeHead : colors.snakeBody;
        drawRoundedRect(
          x * cellSize + 1.5,
          y * cellSize + 1.5,
          cellSize - 3,
          cellSize - 3,
          5,
          color
        );
      });

      return;
    }

    // Normal game render

    // 1. Draw obstacles
    for (const [ox, oy] of obstacles) {
      drawRoundedRect(
        ox * cellSize + 1,
        oy * cellSize + 1,
        cellSize - 2,
        cellSize - 2,
        4,
        '#424242'
      );
    }

    // 2. Draw bonus food or regular food
    if (bonusFood) {
      const [bx, by] = bonusFood;
      const midX = (bx + 0.5) * cellSize;
      const midY = (by + 0.5) * cellSize;
      const radius = cellSize * 0.46;

      ctx.beginPath();
      ctx.arc(midX, midY, radius, 0, Math.PI * 2);
      ctx.fillStyle = '#FFFF00';
      ctx.fill();

      ctx.beginPath();
      ctx.arc(midX, midY, radius * 0.7, 0, Math.PI * 2);
      ctx.fillStyle = '#FF00FF';
      ctx.fill();
    } else if (food) {
      const [fx, fy] = food;
      drawRoundedRect(
        fx * cellSize + 2,
        fy * cellSize + 2,
        cellSize - 4,
        cellSize - 4,
        6,
        colors.food
      );
    }

    // 3. Draw snake segments
    snake.forEach(([rawX, rawY], index) => {
      let sx = rawX;
      let sy = rawY;
      const previous = index === 0 ? previousSnake[0] : previousSnake[index - 1];
      if (smoothMotion && previous) {
        let dx = rawX - previous[0];
        let dy = rawY - previous[1];
        if (dx > gridSize / 2) dx -= gridSize;
        if (dx < -gridSize / 2) dx += gridSize;
        if (dy > gridHeight / 2) dy -= gridHeight;
        if (dy < -gridHeight / 2) dy += gridHeight;
        if (Math.abs(dx) + Math.abs(dy) <= 1) {
          sx = ((previous[0] + dx * progress) % gridSize + gridSize) % gridSize;
          sy = ((previous[1] + dy * progress) % gridHeight + gridHeight) % gridHeight;
        }
      }
      const isHead = index === 0;
      const segmentColor = isHead ? colors.snakeHead : colors.snakeBody;

      drawRoundedRect(
        sx * cellSize + 1,
        sy * cellSize + 1,
        cellSize - 2,
        cellSize - 2,
        5,
        segmentColor
      );

      // Draw eyes on head
      if (isHead) {
        const eyeRadius = cellSize / 8;
        const pupilRadius = cellSize / 16;
        const offset = cellSize / 4;

        let eye1X = 0;
        let eye1Y = 0;
        let eye2X = 0;
        let eye2Y = 0;

        switch (direction) {
          case 'UP':
            eye1X = sx * cellSize + offset;
            eye1Y = sy * cellSize + offset;
            eye2X = (sx + 1) * cellSize - offset;
            eye2Y = sy * cellSize + offset;
            break;
          case 'DOWN':
            eye1X = sx * cellSize + offset;
            eye1Y = (sy + 1) * cellSize - offset;
            eye2X = (sx + 1) * cellSize - offset;
            eye2Y = (sy + 1) * cellSize - offset;
            break;
          case 'LEFT':
            eye1X = sx * cellSize + offset;
            eye1Y = sy * cellSize + offset;
            eye2X = sx * cellSize + offset;
            eye2Y = (sy + 1) * cellSize - offset;
            break;
          case 'RIGHT':
            eye1X = (sx + 1) * cellSize - offset;
            eye1Y = sy * cellSize + offset;
            eye2X = (sx + 1) * cellSize - offset;
            eye2Y = (sy + 1) * cellSize - offset;
            break;
        }

        if (eye1X > 0) {
          // Eye 1
          ctx.beginPath();
          ctx.arc(eye1X, eye1Y, eyeRadius, 0, Math.PI * 2);
          ctx.fillStyle = '#FFFFFF';
          ctx.fill();

          ctx.beginPath();
          ctx.arc(eye1X, eye1Y, pupilRadius, 0, Math.PI * 2);
          ctx.fillStyle = '#000000';
          ctx.fill();

          // Eye 2
          ctx.beginPath();
          ctx.arc(eye2X, eye2Y, eyeRadius, 0, Math.PI * 2);
          ctx.fillStyle = '#FFFFFF';
          ctx.fill();

          ctx.beginPath();
          ctx.arc(eye2X, eye2Y, pupilRadius, 0, Math.PI * 2);
          ctx.fillStyle = '#000000';
          ctx.fill();
        }

        if (rankDecorationsEnabled && rankDecoration === 'rank_maze_master') {
          ctx.fillStyle = '#D84343';
          ctx.fillRect(sx * cellSize + 2, sy * cellSize + cellSize * 0.3, cellSize - 4, 3);
          ctx.fillRect(sx * cellSize + cellSize * 0.72, sy * cellSize + cellSize * 0.38, 4, 3);
        } else if (rankDecorationsEnabled && rankDecoration === 'rank_cobra_king') {
          ctx.fillStyle = '#F2C94C';
          ctx.fillRect(sx * cellSize + 3, sy * cellSize + 2, 4, 4);
          ctx.fillRect(sx * cellSize + cellSize / 2 - 2, sy * cellSize + 1, 4, 6);
          ctx.fillRect(sx * cellSize + cellSize - 7, sy * cellSize + 2, 4, 4);
          ctx.fillRect(sx * cellSize + 3, sy * cellSize + 6, cellSize - 6, 2);
        } else if (rankDecorationsEnabled && rankDecoration === 'rank_mythical_leviathan') {
          ctx.fillStyle = '#FF6B35';
          ctx.fillRect(sx * cellSize + 3, sy * cellSize + 2, 4, 5);
          ctx.fillRect(sx * cellSize + cellSize / 2 - 2, sy * cellSize, 4, 7);
          ctx.fillRect(sx * cellSize + cellSize - 7, sy * cellSize + 2, 4, 5);
          ctx.fillStyle = '#FFD166';
          ctx.fillRect(sx * cellSize + 4, sy * cellSize + 3, 2, 3);
          ctx.fillRect(sx * cellSize + cellSize / 2 - 1, sy * cellSize + 2, 2, 3);
          ctx.fillRect(sx * cellSize + cellSize - 6, sy * cellSize + 3, 2, 3);
        }
      }
    });
    };

    const animate = (now: number) => {
      const progress = smoothMotion && !prefersReducedMotion
        ? Math.min((now - animationStart) / gameSpeed, 1)
        : 1;
      draw(progress);
      if (smoothMotion && !prefersReducedMotion && progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };
    animationFrame = requestAnimationFrame(animate);
    const resizeObserver = new ResizeObserver(() => draw(
      smoothMotion && !prefersReducedMotion
        ? Math.min((performance.now() - animationStart) / gameSpeed, 1)
        : 1
    ));
    resizeObserver.observe(canvas);
    return () => {
      cancelAnimationFrame(animationFrame);
      resizeObserver.disconnect();
    };
  }, [gridSize, gridHeight, snake, obstacles, food, bonusFood, direction, colors, isPreview, smoothMotion, gameSpeed, rankDecorationsEnabled, rankDecoration, prefersReducedMotion]);

  return (
    <canvas
      ref={canvasRef}
      width={400}
      height={400}
      className={`rounded-md shadow-inner border border-[#3A3F44]/20 ${className}`}
      style={{
        width: '100%',
        maxWidth: isPreview ? '200px' : '440px',
        aspectRatio: '1/1',
        imageRendering: 'auto',
      }}
    />
  );
};
