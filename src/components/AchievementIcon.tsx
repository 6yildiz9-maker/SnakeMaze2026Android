import React from 'react';

const patterns: Record<string, string[]> = {
  egg_breaker: ['00100', '01110', '11111', '10101', '01110'],
  crawling_started: ['11000', '11100', '01110', '00111', '00011'],
  fast_crawler: ['00100', '01100', '11111', '00110', '00100'],
  python_path: ['01110', '10001', '10111', '10000', '01110'],
  legendary_dragon: ['00100', '01110', '11111', '10101', '11111'],
  wall_phobia: ['10101', '10101', '00100', '10101', '10101'],
  narrow_passer: ['11011', '11011', '00000', '11011', '11011'],
  bonus_hunter: ['00100', '01110', '11111', '01110', '00100'],
  light_speed: ['00011', '00110', '01100', '11000', '10000'],
  survivor: ['00100', '01110', '11111', '00100', '00100'],
  no_return: ['11111', '10001', '10101', '10001', '11111'],
  glutton: ['01110', '11111', '10101', '11111', '01110'],
  loyal_player: ['00100', '01110', '11111', '01110', '00100'],
  time_traveler: ['01110', '10001', '10111', '10001', '01110'],
  fashion_icon: ['10001', '01010', '00100', '01010', '10001'],
  artist: ['11100', '10110', '11111', '01101', '00111'],
  ouroboros: ['01110', '11011', '10101', '11011', '01110'],
  so_close: ['00100', '01110', '11011', '10001', '01110'],
  fast_and_furious: ['10101', '01110', '11111', '01110', '10101'],
};

const colors = ['#F2C94C', '#56CCF2', '#EB5757', '#6FCF97', '#BB6BD9'];

interface AchievementIconProps {
  achievementId: string;
  isUnlocked: boolean;
}

export const AchievementIcon: React.FC<AchievementIconProps> = ({ achievementId, isUnlocked }) => {
  const pattern = patterns[achievementId] ?? patterns.egg_breaker;
  const color = colors[Object.keys(patterns).indexOf(achievementId) % colors.length];

  return (
    <svg viewBox="0 0 5 5" className="mt-0.5 h-7 w-7 shrink-0" aria-hidden="true">
      {pattern.flatMap((row, y) =>
        [...row].flatMap((pixel, x) =>
          pixel === '1'
            ? [<rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" fill={isUnlocked ? color : '#757575'} />]
            : []
        )
      )}
    </svg>
  );
};
