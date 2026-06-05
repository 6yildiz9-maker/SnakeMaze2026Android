package com.example.snakemaze2026

import android.graphics.Color
import androidx.core.graphics.toColorInt

/**
 * Centralized constants for the Snake Maze game.
 * Improves maintainability and reduces magic numbers throughout the codebase.
 */
object Constants {
    
    // SharedPreferences Keys
    object PrefsKeys {
        const val PREFS_NAME = "SnakeGame"
        const val PREFS_SETTINGS = "Settings"
        const val PREFS_ACHIEVEMENTS = "SnakeGameAchievements"
        
        // Game stats
        const val HIGH_SCORE = "high_score"
        const val TOTAL_FOOD = "total_food"
        const val TOTAL_PLAY_TIME = "total_play_time"
        const val TOTAL_GAMES_STARTED = "total_games_started"
        
        // Game state
        const val GAME_SNAKE = "snake"
        const val GAME_FOOD = "food"
        const val GAME_BONUS_FOOD = "bonus_food"
        const val GAME_SCORE = "score"
        const val GAME_SPEED = "speed"
        const val GAME_DIRECTION = "direction"
        const val GAME_SESSION_FOOD_EATEN = "session_food_eaten"
        const val GAME_OBSTACLES = "obstacles"
        const val GAME_BONUS_EATEN_FAST = "bonus_eaten_fast"
        const val GAME_FOOD_WITHOUT_WALL = "food_without_wall"
        const val GAME_WALL_HIT = "wall_hit"
        const val GAME_BONUS_FOOD_EATEN = "bonus_food_eaten"
        const val GAME_FOOD_AT_MAX_SPEED = "food_at_max_speed"
        const val GAME_MAZE_PASSES = "maze_passes"
        const val GAME_SINGLE_DIRECTION = "single_direction"
        
        // Settings
        const val SOUND_ON = "sound_on"
        const val CONTROL_PREFERENCE = "control_preference"
        const val LANGUAGE = "My_Lang"
        
        // Colors
        const val CUSTOM_SNAKE_HEAD_COLOR = "custom_snake_head_color"
        const val CUSTOM_SNAKE_BODY_COLOR = "custom_snake_body_color"
        const val CUSTOM_FOOD_COLOR = "custom_food_color"
        const val CUSTOM_MAP_COLOR = "custom_map_color"
        
        // Theme usage
        const val USED_ALL_THEMES = "used_all_themes"
        const val USED_CUSTOM_THEME = "used_custom_theme"
    }
    
    // Game Logic Constants
    object GameLogic {
        const val DEFAULT_GRID_SIZE = 20
        const val DEFAULT_GRID_HEIGHT = 20
        const val MIN_SPEED = 80L
        const val INITIAL_SPEED = 300L
        const val SPEED_INCREMENT = 2L
        const val BONUS_FOOD_TIMEOUT_MS = 2000L
        const val BONUS_FOOD_DISPLAY_TIMEOUT_MS = 5000L
        const val BONUS_FOOD_SPAWN_INTERVAL = 10  // Every 10th food
        const val BONUS_FOOD_SPAWN_CHANCE = 0.3f
        const val BONUS_POINTS = 3
        const val REGULAR_POINTS = 1
        const val COUNTDOWN_SECONDS = 5
        const val COUNTDOWN_DELAY_MS = 1000L
        const val MIN_SNAKE_LENGTH_FOR_NARROW_PASS = 20
        const val NARROW_PASS_THRESHOLD = 3  // Cells in width
    }
    
    // UI Constants
    object UI {
        const val GRID_TILE_SIZE_DP = 40f
        const val ANIMATION_PULSE_DURATION_MS = 800L
        const val MENU_PADDING_DP = 30f
        const val MENU_TOP_PADDING_DP = 10f
        const val SCORE_TOP_PADDING_DP = 16f
        const val WINDOW_INSETS_PADDING_DP = 16f
        const val CONTROL_PADDING_DP = 16f
        const val GRID_LINE_WIDTH_DP = 0.5f
        const val TILE_SIZE_MIN = 1
        const val SWIPE_THRESHOLD_DP = 36f
        const val SWIPE_VELOCITY_THRESHOLD_DP = 36f
        const val VIBRATION_DURATION_MS = 400L
        const val FAST_DEATH_THRESHOLD_MS = 5000L
    }
    
    // Default Colors
    object Colors {
        val NOKIA_BG = "#C8E6C9".toColorInt()
        const val NOKIA_GRID_LINE = 0xFFFFFFFF.toInt()  // White with alpha
        const val SNAKE_BODY_DEFAULT = Color.BLACK
        const val SNAKE_HEAD_DEFAULT = Color.DKGRAY
        const val FOOD_DEFAULT = Color.RED
        const val OBSTACLE_DEFAULT = 0xFF424242.toInt()  // Dark gray
        const val BONUS_FOOD_YELLOW = Color.YELLOW
        const val BONUS_FOOD_MAGENTA = Color.MAGENTA
        const val EYES_COLOR = Color.WHITE
        const val PUPILS_COLOR = Color.BLACK
        
        // Achievement colors
        const val ACHIEVEMENT_LOCKED_BG = 0xFF333333.toInt()
        const val ACHIEVEMENT_LOCKED_TEXT = 0xFFAAAAAA.toInt()
        const val ACHIEVEMENT_UNLOCKED_BG = 0xFFC8E6C9.toInt()
        const val ACHIEVEMENT_UNLOCKED_TEXT = Color.BLACK
    }
    
    // Sound Keys
    object Sounds {
        const val BUTTON_CLICK = "button_click"
        const val EAT = "eat"
        const val CRASH = "crash"
        const val MAX_STREAMS = 5
    }
    
    // Ad Unit IDs
    object Ads {
        const val APPLICATION_ID = "ca-app-pub-3710029547742219~6978419692"
        const val REWARDED_AD_UNIT_ID = "ca-app-pub-3710029547742219/6583522230"
    }
    
    // Control Modes
    object Controls {
        const val MODE_CLASSIC = "classic"
        const val MODE_ALTERNATIVE = "alternative"  // D-Pad
        const val MODE_SWIPE = "swipe"
        val ALL_MODES = listOf(MODE_CLASSIC, MODE_ALTERNATIVE, MODE_SWIPE)
    }
    
    // Log Tags
    object Logging {
        const val TAG_MAIN = "MainActivity"
        const val TAG_SNAKE_VIEW = "SnakeView"
        const val TAG_SOUND = "SoundManager"
        const val TAG_ACHIEVEMENTS = "AchievementsManager"
        const val TAG_SETTINGS = "SettingsActivity"
    }
    
    // Rank Thresholds
    object RankThresholds {
        const val LEGENDARY = 500
        const val COBRA_KING = 350
        const val MAZE_MASTER = 200
        const val RATTLER = 100
        const val ROOKIE = 50
        const val WORM = 20
    }
    
    // Achievement Unlock Thresholds
    object Achievements {
        const val CRAWLING_SCORE_MIN = 50
        const val CRAWLING_SCORE_MAX = 99
        const val EGG_BREAKER_SCORE = 50
        const val FAST_CRAWLER_SCORE = 100
        const val PYTHON_PATH_SCORE = 250
        const val LEGENDARY_DRAGON_SCORE = 500
        const val WALL_PHOBIA_FOOD = 30
        const val NARROW_PASSER_PASSES = 5
        const val BONUS_HUNTER_FOOD = 5
        const val LIGHT_SPEED_FOOD = 10
        const val SURVIVOR_TIME_SECONDS = 300L
        const val GLUTTON_FOOD = 1000L
        const val LOYAL_PLAYER_GAMES = 100
        const val TIME_TRAVELER_SECONDS = 3600L
    }
    
    // Default settings
    object Defaults {
        const val SOUND_ENABLED = true
        const val LANGUAGE = "tr"
        const val CONTROL_MODE = Controls.MODE_CLASSIC
    }
}
