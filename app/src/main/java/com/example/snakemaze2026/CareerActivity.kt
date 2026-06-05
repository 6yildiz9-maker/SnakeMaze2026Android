package com.example.snakemaze2026

import android.os.Bundle
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView

class CareerActivity : AppCompatActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        // Edge-to-Edge
        androidx.core.view.WindowCompat.setDecorFitsSystemWindows(window, false)
        
        setContentView(R.layout.activity_career)
        setupWindowInsets()

        val prefs = getSharedPreferences(Constants.PrefsKeys.PREFS_NAME, MODE_PRIVATE)
        val highScore = prefs.getInt(Constants.PrefsKeys.HIGH_SCORE, 0)
        val totalPlayTime = prefs.getLong(Constants.PrefsKeys.TOTAL_PLAY_TIME, 0)
        val totalFood = prefs.getLong(Constants.PrefsKeys.TOTAL_FOOD, 0)

        findViewById<TextView>(R.id.highScoreTextView).text = getString(R.string.high_score, highScore)
        findViewById<TextView>(R.id.totalPlayTimeTextView).text = getString(R.string.total_play_time, totalPlayTime)
        findViewById<TextView>(R.id.totalFoodTextView).text = getString(R.string.total_food, totalFood)

        val achievementsManager = AchievementsManager(this)
        val achievements = achievementsManager.getAllAchievements()

        val recyclerView = findViewById<RecyclerView>(R.id.achievementsRecyclerView)
        recyclerView.layoutManager = LinearLayoutManager(this)
        recyclerView.adapter = AchievementAdapter(achievements)
    }

    private fun setupWindowInsets() {
        val root = findViewById<android.view.View>(R.id.careerRoot)
        androidx.core.view.ViewCompat.setOnApplyWindowInsetsListener(root) { view, windowInsets ->
            val insets = windowInsets.getInsets(androidx.core.view.WindowInsetsCompat.Type.systemBars())
            val density = resources.displayMetrics.density
            view.setPadding(
                view.paddingLeft,
                insets.top + (density * Constants.UI.WINDOW_INSETS_PADDING_DP).toInt(),
                view.paddingRight,
                insets.bottom + (density * Constants.UI.WINDOW_INSETS_PADDING_DP).toInt()
            )
            windowInsets
        }
    }
}