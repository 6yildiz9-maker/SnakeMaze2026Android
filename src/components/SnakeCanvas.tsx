import React, { useEffect, useRef } from 'react';
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
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
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
    snake.forEach(([sx, sy], index) => {
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
      }
    });
  }, [gridSize, gridHeight, snake, obstacles, food, bonusFood, direction, colors, isPreview]);

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
      }}
    />
  );
};
