# Pixelfang: Snake Maze rules

## Modes

| Mode | Board rules | Timer | Specialized food |
|---|---|---:|---|
| Maze | Wrapping edges; maze obstacles are enabled and new obstacles may appear as the score rises. Custom mazes can be played. | None | Enabled from 15 points |
| Classic | Wrapping edges; no maze obstacles. | None | Disabled |
| Time Attack | Wrapping edges; no maze obstacles. | 60 seconds | Disabled |
| Survival | Mode-specific speed progression and obstacle rules. | None | Enabled from 15 points |

Regular food scores one point and grows the snake. In modes with specialized food, golden food grants bonus points, ice slows the snake, poison reduces score and length, and mystery food applies a random effect. The entry-direction indicator shows the final direction the snake must travel to enter the current special-food cell; it is a route hint, not a requirement or penalty.

The game ends on a collision or, in Time Attack, when the countdown reaches zero. The current score is retained when the timer expires.

## Custom mazes

The editor validates the maze before saving or exporting it. A maze includes a description and difficulty label and can be shared as a map code. Version 1 map codes remain importable; new exports use version 2 and include the metadata. During play, the snake and food are placed on open cells, and newly spawned obstacles are checked against the next food location for reachability.
