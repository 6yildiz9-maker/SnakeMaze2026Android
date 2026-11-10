import React, { useEffect, useRef, useState } from 'react';
import { Direction, FoodType, Point, ThemeColors } from '../types.ts';
import { particleSystem } from '../utils/particles.ts';

interface SnakeCanvasProps {
  gridSize?: number;
  gridHeight?: number;
  snake: Point[];
  obstacles: Point[];
  food: Point;
  bonusFood: Point | null;
  bonusRemainingMs?: number;
  direction: Direction;
  colors: ThemeColors;
  foodType?: FoodType;
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
  bonusRemainingMs = 5000,
  direction,
  colors,
  foodType = 'regular',
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

    const draw = (progress = 1, now = performance.now()) => {
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const cellSize = width / gridSize;

      // Screen shake offset on crash (FR-03)
      const shake = prefersReducedMotion
        ? { x: 0, y: 0 }
        : particleSystem.getScreenShakeOffset(now);

      ctx.save();
      if (shake.x !== 0 || shake.y !== 0) {
        ctx.translate(shake.x, shake.y);
      }

      // 1. Clear background
      ctx.fillStyle = colors.map;
      ctx.fillRect(0, 0, width, height);

      // 2. Grid lines using theme color
      ctx.strokeStyle = colors.grid || 'rgba(255, 255, 255, 0.2)';
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
        fillColor: string,
        strokeColor?: string
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

        if (strokeColor) {
          ctx.strokeStyle = strokeColor;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
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

        drawRoundedRect(
          previewFood[0] * cellSize + 2,
          previewFood[1] * cellSize + 2,
          cellSize - 4,
          cellSize - 4,
          6,
          colors.food
        );

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

        ctx.restore();
        return;
      }

      // Normal game render

      // 1. Draw obstacles with theme color
      const obstacleColor = colors.obstacle || '#424242';
      for (const [ox, oy] of obstacles) {
        drawRoundedRect(
          ox * cellSize + 1,
          oy * cellSize + 1,
          cellSize - 2,
          cellSize - 2,
          4,
          obstacleColor
        );
      }

      // 2. Draw bonus food or regular/specialized food (FR-14-R, FR-03-R)
      if (bonusFood) {
        const [bx, by] = bonusFood;
        const midX = (bx + 0.5) * cellSize;
        const midY = (by + 0.5) * cellSize;
        const radius = cellSize * 0.46;

        // Flashing in last 1.5s (static if prefers-reduced-motion)
        const isUrgent = bonusRemainingMs <= 1500;
        const flashAlpha = isUrgent && !prefersReducedMotion ? Math.sin(now / 80) * 0.35 + 0.65 : 1;

        ctx.save();
        ctx.globalAlpha = flashAlpha;

        // 8-bit rotating guide sparklers around bonus food (static if prefers-reduced-motion)
        const angleOffset = prefersReducedMotion ? 0 : (now / 400) % (Math.PI * 2);
        ctx.strokeStyle = colors.bonusOuter || '#FFD700';
        ctx.lineWidth = 1.5;
        for (let i = 0; i < 4; i++) {
          const a = angleOffset + (i * Math.PI) / 2;
          const sx = midX + Math.cos(a) * (radius + 2);
          const sy = midY + Math.sin(a) * (radius + 2);
          const ex = midX + Math.cos(a) * (radius + 5);
          const ey = midY + Math.sin(a) * (radius + 5);
          ctx.beginPath();
          ctx.moveTo(sx, sy);
          ctx.lineTo(ex, ey);
          ctx.stroke();
        }

        ctx.beginPath();
        ctx.arc(midX, midY, radius, 0, Math.PI * 2);
        ctx.fillStyle = colors.bonusOuter || '#FFFF00';
        ctx.fill();

        ctx.beginPath();
        ctx.arc(midX, midY, radius * 0.7, 0, Math.PI * 2);
        ctx.fillStyle = colors.bonusInner || '#FF00FF';
        ctx.fill();
        ctx.restore();
      } else if (food) {
        const [fx, fy] = food;
        const midX = (fx + 0.5) * cellSize;
        const midY = (fx + 0.5) * cellSize;

        switch (foodType) {
          case 'golden': {
            // 5-point star
            const spikes = 5;
            const outerR = cellSize * 0.45;
            const innerR = cellSize * 0.22;
            let rot = (Math.PI / 2) * 3;
            const step = Math.PI / spikes;
            ctx.beginPath();
            ctx.moveTo(midX, midY - outerR);
            for (let i = 0; i < spikes; i++) {
              ctx.lineTo(midX + Math.cos(rot) * outerR, midY + Math.sin(rot) * outerR);
              rot += step;
              ctx.lineTo(midX + Math.cos(rot) * innerR, midY + Math.sin(rot) * innerR);
              rot += step;
            }
            ctx.lineTo(midX, midY - outerR);
            ctx.closePath();
            ctx.fillStyle = '#FFD700';
            ctx.fill();
            ctx.strokeStyle = '#B8860B';
            ctx.lineWidth = 1.5;
            ctx.stroke();
            break;
          }
          case 'ice': {
            // Diamond (rotated square)
            const r = cellSize * 0.42;
            ctx.beginPath();
            ctx.moveTo(midX, midY - r);
            ctx.lineTo(midX + r, midY);
            ctx.lineTo(midX, midY + r);
            ctx.lineTo(midX - r, midY);
            ctx.closePath();
            ctx.fillStyle = '#00E5FF';
            ctx.fill();
            ctx.strokeStyle = '#0097A7';
            ctx.lineWidth = 1.5;
            ctx.stroke();
            break;
          }
          case 'poison': {
            // Equilateral triangle
            const r = cellSize * 0.44;
            ctx.beginPath();
            ctx.moveTo(midX, midY - r);
            ctx.lineTo(midX + r, midY + r * 0.85);
            ctx.lineTo(midX - r, midY + r * 0.85);
            ctx.closePath();
            ctx.fillStyle = '#9C27B0';
            ctx.fill();
            ctx.strokeStyle = '#4A148C';
            ctx.lineWidth = 1.5;
            ctx.stroke();
            break;
          }
          case 'mystery': {
            // Rounded badge with ?
            drawRoundedRect(
              fx * cellSize + 2,
              fy * cellSize + 2,
              cellSize - 4,
              cellSize - 4,
              5,
              '#FF9800',
              '#E65100'
            );
            ctx.fillStyle = '#FFFFFF';
            ctx.font = `bold ${Math.floor(cellSize * 0.65)}px monospace`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('?', midX, midY + 1);
            break;
          }
          case 'regular':
          default:
            drawRoundedRect(
              fx * cellSize + 2,
              fy * cellSize + 2,
              cellSize - 4,
              cellSize - 4,
              6,
              colors.food
            );
            break;
        }
      }

      // 3. Draw snake segments with squash & stretch and bite pulse (FR-03)
      const headSquash = particleSystem.getHeadSquashScale(now);

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

        // Check if a bite pulse wave is passing through this segment
        const hasPulse = particleSystem.bitePulses.some((p) => p.segmentIndex === index);
        const pulseExpansion = hasPulse ? 2 : 0;

        let w = cellSize - 2 + pulseExpansion;
        let h = cellSize - 2 + pulseExpansion;
        let px = sx * cellSize + 1 - pulseExpansion / 2;
        let py = sy * cellSize + 1 - pulseExpansion / 2;

        if (isHead && (headSquash.scaleX !== 1 || headSquash.scaleY !== 1)) {
          w *= headSquash.scaleX;
          h *= headSquash.scaleY;
          px = (sx + 0.5) * cellSize - w / 2;
          py = (sy + 0.5) * cellSize - h / 2;
        }

        drawRoundedRect(px, py, w, h, 5, segmentColor);

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
            ctx.beginPath();
            ctx.arc(eye1X, eye1Y, eyeRadius, 0, Math.PI * 2);
            ctx.fillStyle = '#FFFFFF';
            ctx.fill();

            ctx.beginPath();
            ctx.arc(eye1X, eye1Y, pupilRadius, 0, Math.PI * 2);
            ctx.fillStyle = '#000000';
            ctx.fill();

            ctx.beginPath();
            ctx.arc(eye2X, eye2Y, eyeRadius, 0, Math.PI * 2);
            ctx.fillStyle = '#FFFFFF';
            ctx.fill();

            ctx.beginPath();
            ctx.arc(eye2X, eye2Y, pupilRadius, 0, Math.PI * 2);
            ctx.fillStyle = '#000000';
            ctx.fill();
          }

          // Rank Head Decorations
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

      // 4. Update and render particle effects layer
      particleSystem.updateAndDraw(ctx, prefersReducedMotion);

      ctx.restore();
    };

    const animate = (now: number) => {
      const progress =
        smoothMotion && !prefersReducedMotion
          ? Math.min((now - animationStart) / gameSpeed, 1)
          : 1;
      draw(progress, now);
      // Keep rAF loop running for particles and pulses
      animationFrame = requestAnimationFrame(animate);
    };

    animationFrame = requestAnimationFrame(animate);
    const resizeObserver = new ResizeObserver(() =>
      draw(
        smoothMotion && !prefersReducedMotion
          ? Math.min((performance.now() - animationStart) / gameSpeed, 1)
          : 1
      )
    );
    resizeObserver.observe(canvas);

    return () => {
      cancelAnimationFrame(animationFrame);
      resizeObserver.disconnect();
    };
  }, [
    gridSize,
    gridHeight,
    snake,
    obstacles,
    food,
    bonusFood,
    bonusRemainingMs,
    direction,
    colors,
    isPreview,
    smoothMotion,
    gameSpeed,
    rankDecorationsEnabled,
    rankDecoration,
    prefersReducedMotion,
    foodType,
  ]);

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
