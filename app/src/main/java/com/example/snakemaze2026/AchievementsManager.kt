package com.example.snakemaze2026

import android.content.Context
import android.widget.Toast
import androidx.core.content.edit

data class Achievement(
    val id: String,
    val name: String,
    val description: String,
    var isUnlocked: Boolean = false
)

class AchievementsManager(private val context: Context) {

    private val prefs = context.getSharedPreferences(Constants.PrefsKeys.PREFS_ACHIEVEMENTS, Context.MODE_PRIVATE)
    private var lastToast: Toast? = null

    private val allAchievements = mapOf(
        // Milestones
        "egg_breaker" to Achievement("egg_breaker", context.getString(R.string.ach_egg_breaker), context.getString(R.string.ach_desc_egg_breaker)),
        "crawling_started" to Achievement("crawling_started", context.getString(R.string.ach_crawling_started), context.getString(R.string.ach_desc_crawling_started)),
        "fast_crawler" to Achievement("fast_crawler", context.getString(R.string.ach_fast_crawler), context.getString(R.string.ach_desc_fast_crawler)),
        "python_path" to Achievement("python_path", context.getString(R.string.ach_python_path), context.getString(R.string.ach_desc_python_path)),
        "legendary_dragon" to Achievement("legendary_dragon", context.getString(R.string.ach_legendary_dragon), context.getString(R.string.ach_desc_legendary_dragon)),
        // Skill
        "wall_phobia" to Achievement("wall_phobia", context.getString(R.string.ach_wall_phobia), context.getString(R.string.ach_desc_wall_phobia)),
        "narrow_passer" to Achievement("narrow_passer", context.getString(R.string.ach_narrow_passer), context.getString(R.string.ach_desc_narrow_passer)),
        "bonus_hunter" to Achievement("bonus_hunter", context.getString(R.string.ach_bonus_hunter), context.getString(R.string.ach_desc_bonus_hunter)),
        "light_speed" to Achievement("light_speed", context.getString(R.string.ach_light_speed), context.getString(R.string.ach_desc_light_speed)),
        "survivor" to Achievement("survivor", context.getString(R.string.ach_survivor), context.getString(R.string.ach_desc_survivor)),
        "no_return" to Achievement("no_return", context.getString(R.string.ach_no_return), context.getString(R.string.ach_desc_no_return)),
        // Cumulative
        "glutton" to Achievement("glutton", context.getString(R.string.ach_glutton), context.getString(R.string.ach_desc_glutton)),
        "loyal_player" to Achievement("loyal_player", context.getString(R.string.ach_loyal_player), context.getString(R.string.ach_desc_loyal_player)),
        "time_traveler" to Achievement("time_traveler", context.getString(R.string.ach_time_traveler), context.getString(R.string.ach_desc_time_traveler)),
        "fashion_icon" to Achievement("fashion_icon", context.getString(R.string.ach_fashion_icon), context.getString(R.string.ach_desc_fashion_icon)),
        "artist" to Achievement("artist", context.getString(R.string.ach_artist), context.getString(R.string.ach_desc_artist)),
        // Hidden
        "ouroboros" to Achievement("ouroboros", context.getString(R.string.ach_ouroboros), context.getString(R.string.ach_desc_ouroboros)),
        "so_close" to Achievement("so_close", context.getString(R.string.ach_so_close), context.getString(R.string.ach_desc_so_close)),
        "fast_and_furious" to Achievement("fast_and_furious", context.getString(R.string.ach_fast_and_furious), context.getString(R.string.ach_desc_fast_and_furious))
    )

    fun getAllAchievements(): List<Achievement> {
        return allAchievements.values.toList().onEach { it.isUnlocked = prefs.getBoolean(it.id, false) }
    }

    fun checkAchievements(gameData: GameData) {
        // Milestones
        if (gameData.score in Constants.Achievements.CRAWLING_SCORE_MIN..Constants.Achievements.CRAWLING_SCORE_MAX) unlockAchievement("crawling_started")
        if (gameData.score >= Constants.Achievements.EGG_BREAKER_SCORE) unlockAchievement("egg_breaker")
        if (gameData.score >= Constants.Achievements.FAST_CRAWLER_SCORE) unlockAchievement("fast_crawler")
        if (gameData.score >= Constants.Achievements.PYTHON_PATH_SCORE) unlockAchievement("python_path")
        if (gameData.score >= Constants.Achievements.LEGENDARY_DRAGON_SCORE) unlockAchievement("legendary_dragon")

        // Skill
        if (gameData.foodEatenWithoutWall >= Constants.Achievements.WALL_PHOBIA_FOOD) unlockAchievement("wall_phobia")
        if (gameData.mazePasses >= Constants.Achievements.NARROW_PASSER_PASSES) unlockAchievement("narrow_passer")
        if (gameData.bonusFoodEatenInGame >= Constants.Achievements.BONUS_HUNTER_FOOD) unlockAchievement("bonus_hunter")
        if (gameData.foodEatenAtMaxSpeed >= Constants.Achievements.LIGHT_SPEED_FOOD) unlockAchievement("light_speed")
        if (gameData.sessionPlayTime >= Constants.Achievements.SURVIVOR_TIME_SECONDS) unlockAchievement("survivor")
        if (gameData.usedSingleDirection) unlockAchievement("no_return")

        // Cumulative
        if (gameData.totalFoodEaten >= Constants.Achievements.GLUTTON_FOOD) unlockAchievement("glutton")
        if (gameData.totalGamesStarted >= Constants.Achievements.LOYAL_PLAYER_GAMES) unlockAchievement("loyal_player")
        if (gameData.totalPlayTime >= Constants.Achievements.TIME_TRAVELER_SECONDS) unlockAchievement("time_traveler")
        if (gameData.usedAllThemes) unlockAchievement("fashion_icon")
        if (gameData.usedCustomTheme) unlockAchievement("artist")

        // Hidden
        if (gameData.diedToOwnTail && gameData.score > 100) unlockAchievement("ouroboros")
        if (gameData.diedNearHighScore) unlockAchievement("so_close")
        if (gameData.diedFast) unlockAchievement("fast_and_furious")
    }

    private fun unlockAchievement(id: String) {
        if (!prefs.getBoolean(id, false)) {
            prefs.edit { putBoolean(id, true) }
            val achievement = allAchievements[id]
            if (achievement != null) {
                // Cancel previous toast to prevent accumulation
                lastToast?.cancel()
                lastToast = Toast.makeText(context, "${context.getString(R.string.achievement_unlocked)}: ${achievement.name}", Toast.LENGTH_SHORT)
                lastToast?.show()
            }
        }
    }

    fun getRank(score: Int): String {
        return when {
            score > Constants.RankThresholds.LEGENDARY -> context.getString(R.string.rank_mythical_leviathan)
            score > Constants.RankThresholds.COBRA_KING -> context.getString(R.string.rank_lord_of_serpents)
            score > Constants.RankThresholds.MAZE_MASTER -> context.getString(R.string.rank_cobra_king)
            score > Constants.RankThresholds.RATTLER -> context.getString(R.string.rank_maze_master)
            score > Constants.RankThresholds.ROOKIE -> context.getString(R.string.rank_rattler)
            score > Constants.RankThresholds.WORM -> context.getString(R.string.rank_rookie_snake)
            else -> context.getString(R.string.rank_worm)
        }
    }
}

data class GameData(
    val score: Int = 0,
    val sessionPlayTime: Long = 0,
    val totalPlayTime: Long = 0,
    val totalFoodEaten: Long = 0,
    val totalGamesStarted: Int = 0,
    val foodEatenWithoutWall: Int = 0,
    val bonusFoodEatenInGame: Int = 0,
    val foodEatenAtMaxSpeed: Int = 0,
    val mazePasses: Int = 0,
    val usedSingleDirection: Boolean = false,
    val usedAllThemes: Boolean = false,
    val usedCustomTheme: Boolean = false,
    val diedToOwnTail: Boolean = false,
    val diedNearHighScore: Boolean = false,
    val diedFast: Boolean = false
)
