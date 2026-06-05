package com.example.snakemaze2026

import android.animation.ObjectAnimator
import android.animation.PropertyValuesHolder
import android.annotation.SuppressLint
import android.content.Context
import android.content.Intent
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Paint
import android.graphics.Shader
import android.os.Build
import android.os.Bundle
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import android.util.Log
import android.view.GestureDetector
import android.view.MotionEvent
import android.view.View
import android.widget.ImageButton
import android.widget.LinearLayout
import android.widget.RelativeLayout
import android.widget.TextView
import android.widget.Toast
import androidx.activity.OnBackPressedCallback
import androidx.appcompat.app.AppCompatActivity
import androidx.constraintlayout.widget.ConstraintLayout
import androidx.core.content.edit
import androidx.core.graphics.createBitmap
import androidx.core.graphics.drawable.toDrawable
import androidx.core.graphics.toColorInt
import androidx.core.view.ViewCompat
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.isGone
import androidx.core.view.isVisible
import com.google.android.gms.ads.AdError
import com.google.android.gms.ads.AdRequest
import com.google.android.gms.ads.FullScreenContentCallback
import com.google.android.gms.ads.LoadAdError
import com.google.android.gms.ads.MobileAds
import com.google.android.gms.ads.rewarded.RewardedAd
import com.google.android.gms.ads.rewarded.RewardedAdLoadCallback
import com.google.android.material.button.MaterialButton
import java.util.Locale
import java.util.concurrent.TimeUnit
import kotlin.math.abs
import com.example.snakemaze2026.Constants as AppConstants

class MainActivity : AppCompatActivity() {

    // Views
    private lateinit var snakeView: SnakeView
    private lateinit var scoreTextView: TextView
    private lateinit var menuLayout: LinearLayout
    private lateinit var gameControls: RelativeLayout
    private lateinit var gameControls2: ConstraintLayout
    private lateinit var controlsContainer: View
    private lateinit var btnStart: MaterialButton
    private lateinit var btnCareer: MaterialButton
    private lateinit var btnSettings: MaterialButton
    private lateinit var btnAds: MaterialButton
    private lateinit var btnShareScore: MaterialButton
    private lateinit var titleText: TextView
    private lateinit var finalScoreText: TextView
    private lateinit var rankTextView: TextView
    private lateinit var btnBack: ImageButton
    private lateinit var btnHome: MaterialButton
    private lateinit var highScoreTextView: TextView
    private lateinit var btnResume: MaterialButton
    private lateinit var btnLanguage: MaterialButton
    private lateinit var countdownTextView: TextView
    private lateinit var menuScrollView: View

    // Directional Buttons
    private lateinit var btnLeft: ImageButton
    private lateinit var btnRight: ImageButton
    private lateinit var btnAltUp: ImageButton
    private lateinit var btnAltDown: ImageButton
    private lateinit var btnAltLeft: ImageButton
    private lateinit var btnAltRight: ImageButton
    private lateinit var btnSwipeSensor: View

    // Managers and Services
    private lateinit var achievementsManager: AchievementsManager
    private var rewardedAd: RewardedAd? = null
    private lateinit var soundManager: SoundManager

    // Game State
    private var gameStartTime = 0L
    private val swipeThresholdPx by lazy { AppConstants.UI.SWIPE_THRESHOLD_DP * resources.displayMetrics.density }
    private val swipeVelocityThresholdPx by lazy { AppConstants.UI.SWIPE_VELOCITY_THRESHOLD_DP * resources.displayMetrics.density }

    private val swipeGestureDetector by lazy {
        GestureDetector(this, object : GestureDetector.SimpleOnGestureListener() {
            override fun onDown(e: MotionEvent): Boolean = true
            override fun onFling(e1: MotionEvent?, e2: MotionEvent, velocityX: Float, velocityY: Float): Boolean {
                if (e1 == null) return false
                val diffY = e2.y - e1.y
                val diffX = e2.x - e1.x
                if (abs(diffX) > abs(diffY)) {
                    if (abs(diffX) > swipeThresholdPx && abs(velocityX) > swipeVelocityThresholdPx) {
                        if (diffX > 0) {
                            handleDirectionalClick(snakeView::turnRight)
                        } else {
                            handleDirectionalClick(snakeView::turnLeft)
                        }
                        return true
                    }
                } else if (abs(diffY) > swipeThresholdPx && abs(velocityY) > swipeVelocityThresholdPx) {
                    if (diffY > 0) {
                        handleDirectionalClick(snakeView::turnDown)
                    } else {
                        handleDirectionalClick(snakeView::turnUp)
                    }
                    return true
                }
                return false
            }
        })
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        loadLocale()
        super.onCreate(savedInstanceState)

        WindowCompat.setDecorFitsSystemWindows(window, false)

        setContentView(R.layout.activity_main)

        soundManager = SoundManager(this)
        soundManager.addSound(AppConstants.Sounds.BUTTON_CLICK, R.raw.button_click_sound)
        soundManager.addSound(AppConstants.Sounds.EAT, R.raw.eat_sound)
        soundManager.addSound(AppConstants.Sounds.CRASH, R.raw.crash_sound)
        achievementsManager = AchievementsManager(this)

        Thread {
            MobileAds.initialize(this) {}
        }.start()
        loadRewardedAd()

        findViews()
        setupViewListeners()
        setupButtonListeners()
        setupWindowInsets()

        showMainMenu()

        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                handleBackAction()
            }
        })
    }

    override fun onDestroy() {
        super.onDestroy()
        soundManager.release()
        // Clean up listeners to prevent memory leaks
        snakeView.onScoreUpdate = null
        snakeView.onGameOver = null
        snakeView.onEat = null
        snakeView.onBonusEat = null
        snakeView.onCountdownUpdate = null
    }

    private fun findViews() {
        snakeView = findViewById(R.id.snakeView)
        scoreTextView = findViewById(R.id.scoreTextView)
        menuLayout = findViewById(R.id.menuLayout)
        gameControls = findViewById(R.id.gameControls)
        gameControls2 = findViewById(R.id.gameControls2)
        controlsContainer = findViewById(R.id.controlsContainer)
        btnStart = findViewById(R.id.btnStart)
        btnCareer = findViewById(R.id.btnCareer)
        btnSettings = findViewById(R.id.btnSettings)
        btnAds = findViewById(R.id.btnAds)
        btnShareScore = findViewById(R.id.btnShareScore)
        titleText = findViewById(R.id.titleText)
        finalScoreText = findViewById(R.id.finalScoreText)
        rankTextView = findViewById(R.id.rankTextView)
        btnBack = findViewById(R.id.btnBack)
        btnHome = findViewById(R.id.btnHome)
        highScoreTextView = findViewById(R.id.highScoreTextView)
        btnResume = findViewById(R.id.btnResume)
        btnLanguage = findViewById(R.id.btnLanguage)
        countdownTextView = findViewById(R.id.countdownTextView)
        menuScrollView = findViewById(R.id.menuScrollView)

        btnLeft = findViewById(R.id.btnLeft)
        btnRight = findViewById(R.id.btnRight)
        btnAltUp = findViewById(R.id.btnAltUp)
        btnAltDown = findViewById(R.id.btnAltDown)
        btnAltLeft = findViewById(R.id.btnAltLeft)
        btnAltRight = findViewById(R.id.btnAltRight)
        btnSwipeSensor = findViewById(R.id.btnSwipeSensor)

        setupGridBackground()
    }

    private fun setupWindowInsets() {
        val root = findViewById<View>(R.id.mainRoot)
        ViewCompat.setOnApplyWindowInsetsListener(root) { _, windowInsets ->
            val insets = windowInsets.getInsets(WindowInsetsCompat.Type.systemBars())
            val density = resources.displayMetrics.density

            menuLayout.setPadding(
                (density * 30).toInt(),
                insets.top + (density * 10).toInt(),
                (density * 30).toInt(),
                insets.bottom + (density * 10).toInt()
            )

            controlsContainer.setPadding(0, 0, 0, insets.bottom)

            scoreTextView.setPadding(
                scoreTextView.paddingLeft,
                insets.top + (density * 16).toInt(),
                scoreTextView.paddingRight,
                scoreTextView.paddingBottom
            )

            windowInsets
        }
    }

    private fun setupGridBackground() {
        try {
            val tileSize = (resources.displayMetrics.density * AppConstants.UI.GRID_TILE_SIZE_DP).toInt()
            if (tileSize <= AppConstants.UI.TILE_SIZE_MIN) return

            val bitmap = createBitmap(tileSize, tileSize, Bitmap.Config.ARGB_8888)
            val canvas = Canvas(bitmap)

            canvas.drawColor(getColor(R.color.nokia_bg))

            val paint = Paint()
            paint.color = getColor(R.color.nokia_grid_line)
            paint.strokeWidth = resources.displayMetrics.density * 0.5f

            canvas.drawLine(0f, 0f, tileSize.toFloat(), 0f, paint)
            canvas.drawLine(0f, 0f, 0f, tileSize.toFloat(), paint)

            val drawable = bitmap.toDrawable(resources)
            drawable.tileModeX = Shader.TileMode.REPEAT
            drawable.tileModeY = Shader.TileMode.REPEAT

            menuScrollView.background = drawable
        } catch (e: Exception) {
            Log.e(AppConstants.Logging.TAG_MAIN, "Error creating grid background", e)
        }
    }

    private fun setupViewListeners() {
        snakeView.onScoreUpdate = { score ->
            scoreTextView.text = getString(R.string.score, score)
        }

        snakeView.onGameOver = { data ->
            runOnUiThread {
                soundManager.playSound(AppConstants.Sounds.CRASH)
                vibrate(AppConstants.UI.VIBRATION_DURATION_MS)
                clearSavedGame()
                val totalPlayTime = saveGameStats(data.score, data.sessionFoodEaten)
                val fullGameData = gatherFullGameData(data, totalPlayTime)
                achievementsManager.checkAchievements(fullGameData)

                showGameOverMenu(data.score)
            }
        }

        snakeView.onEat = {
            soundManager.playSound(AppConstants.Sounds.EAT)
        }

        snakeView.onBonusEat = {
            soundManager.playSound(AppConstants.Sounds.EAT)
        }

        snakeView.onCountdownUpdate = { seconds ->
            runOnUiThread {
                if (seconds > 0) {
                    countdownTextView.isVisible = true
                    countdownTextView.text = seconds.toString()
                    val pulse = ObjectAnimator.ofPropertyValuesHolder(
                        countdownTextView,
                        PropertyValuesHolder.ofFloat("scaleX", 1.2f),
                        PropertyValuesHolder.ofFloat("scaleY", 1.2f),
                        PropertyValuesHolder.ofFloat("alpha", 0.5f)
                    )
                    pulse.duration = AppConstants.UI.ANIMATION_PULSE_DURATION_MS
                    pulse.start()
                } else {
                    countdownTextView.isGone = true
                    countdownTextView.scaleX = 1.0f
                    countdownTextView.scaleY = 1.0f
                    countdownTextView.alpha = 1.0f
                }
            }
        }
    }

    @SuppressLint("ClickableViewAccessibility")
    private fun setupButtonListeners() {
        btnStart.setOnClickListener {
            soundManager.playSound(AppConstants.Sounds.BUTTON_CLICK)
            clearSavedGame()
            val prefs = getSharedPreferences(AppConstants.PrefsKeys.PREFS_NAME, MODE_PRIVATE)
            val totalGamesStarted = prefs.getInt(AppConstants.PrefsKeys.TOTAL_GAMES_STARTED, 0) + 1
            prefs.edit { putInt(AppConstants.PrefsKeys.TOTAL_GAMES_STARTED, totalGamesStarted).apply() }

            showGameUI()
            gameStartTime = System.currentTimeMillis()

            snakeView.startGame()
        }

        btnResume.setOnClickListener {
            soundManager.playSound(AppConstants.Sounds.BUTTON_CLICK)
            showGameUI()

            val prefs = getSharedPreferences(AppConstants.PrefsKeys.PREFS_NAME, MODE_PRIVATE)

            if (snakeView.restoreState(prefs)) {
                snakeView.resumeGame()
            } else {
                Toast.makeText(this, "No saved game found!", Toast.LENGTH_SHORT).show()
                showMainMenu()
            }
        }

        btnCareer.setOnClickListener {
            soundManager.playSound(AppConstants.Sounds.BUTTON_CLICK)
            startActivity(Intent(this, CareerActivity::class.java))
        }

        btnSettings.setOnClickListener {
            soundManager.playSound(AppConstants.Sounds.BUTTON_CLICK)
            startActivity(Intent(this, SettingsActivity::class.java))
        }

        btnAds.setOnClickListener {
            soundManager.playSound(AppConstants.Sounds.BUTTON_CLICK)
            rewardedAd?.let { ad ->
                ad.show(this) {
                    grantAdReward()
                }
            } ?: run {
                Toast.makeText(this, getString(R.string.ad_not_ready), Toast.LENGTH_SHORT).show()
                loadRewardedAd()
            }
        }

        btnShareScore.setOnClickListener {
            soundManager.playSound(AppConstants.Sounds.BUTTON_CLICK)
            shareScore(snakeView.score)
        }

        btnBack.setOnClickListener {
            soundManager.playSound(AppConstants.Sounds.BUTTON_CLICK)
            handleBackAction()
        }

        btnHome.setOnClickListener {
            soundManager.playSound(AppConstants.Sounds.BUTTON_CLICK)

            if (snakeView.isGameRunning && !snakeView.isGameOver) {
                val prefs = getSharedPreferences(AppConstants.PrefsKeys.PREFS_NAME, MODE_PRIVATE)
                snakeView.saveState(prefs)
            } else {
                clearSavedGame()
            }
            showMainMenu()
        }

        val currentLang = getSharedPreferences(AppConstants.PrefsKeys.PREFS_SETTINGS, MODE_PRIVATE).getString(AppConstants.PrefsKeys.LANGUAGE, AppConstants.Defaults.LANGUAGE)
        btnLanguage.text = if (currentLang == AppConstants.Defaults.LANGUAGE) "EN" else "TR"

        btnLanguage.setOnClickListener {
            soundManager.playSound(AppConstants.Sounds.BUTTON_CLICK)
            if (currentLang == AppConstants.Defaults.LANGUAGE) {
                setLocale("en")
            } else {
                setLocale(AppConstants.Defaults.LANGUAGE)
            }
        }

        setupDirectionalButtons()

        btnSwipeSensor.setOnTouchListener { v, event ->
            swipeGestureDetector.onTouchEvent(event)
            if (event.action == MotionEvent.ACTION_UP) {
                v.performClick()
            }
            true
        }
    }

    private fun setLocale(languageCode: String) {
        val locale = Locale.forLanguageTag(languageCode)
        Locale.setDefault(locale)

        val config = resources.configuration
        config.setLocale(locale)

        @Suppress("DEPRECATION")
        baseContext.resources.updateConfiguration(config, baseContext.resources.displayMetrics)

        getSharedPreferences(AppConstants.PrefsKeys.PREFS_SETTINGS, MODE_PRIVATE).edit {
            putString(AppConstants.PrefsKeys.LANGUAGE, languageCode)
        }

        finish()
        startActivity(Intent(this, MainActivity::class.java).apply {
            addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_NEW_TASK)
        })
    }

    private fun loadLocale() {
        val prefs = getSharedPreferences(AppConstants.PrefsKeys.PREFS_SETTINGS, MODE_PRIVATE)
        val language = prefs.getString(AppConstants.PrefsKeys.LANGUAGE, "tr")
        if (language != null) {
            val locale = Locale.forLanguageTag(language)
            Locale.setDefault(locale)
            val config = resources.configuration
            config.setLocale(locale)
            @Suppress("DEPRECATION")
            baseContext.resources.updateConfiguration(config, baseContext.resources.displayMetrics)
        }
    }

    private fun grantAdReward() {
        Toast.makeText(this, getString(R.string.thank_you_for_support), Toast.LENGTH_LONG).show()
    }

    private fun loadRewardedAd() {
        val adRequest = AdRequest.Builder().build()
        RewardedAd.load(this, AppConstants.Ads.REWARDED_AD_UNIT_ID, adRequest, object : RewardedAdLoadCallback() {
            override fun onAdFailedToLoad(adError: LoadAdError) {
                Log.d(AppConstants.Logging.TAG_MAIN, adError.message)
                rewardedAd = null
            }

            override fun onAdLoaded(ad: RewardedAd) {
                rewardedAd = ad
                ad.fullScreenContentCallback = object : FullScreenContentCallback() {
                    override fun onAdDismissedFullScreenContent() {
                        rewardedAd = null
                        loadRewardedAd()
                    }

                    override fun onAdFailedToShowFullScreenContent(adError: AdError) {
                        rewardedAd = null
                        loadRewardedAd()
                    }
                }
            }
        })
    }

    private fun gatherFullGameData(gameOverData: GameOverData, totalPlayTime: Long): GameData {
        val prefs = getSharedPreferences(AppConstants.PrefsKeys.PREFS_NAME, MODE_PRIVATE)

        return GameData(
            score = gameOverData.score,
            sessionPlayTime = TimeUnit.MILLISECONDS.toSeconds(System.currentTimeMillis() - gameStartTime),
            totalPlayTime = totalPlayTime,
            totalFoodEaten = prefs.getLong(AppConstants.PrefsKeys.TOTAL_FOOD, 0),
            totalGamesStarted = prefs.getInt(AppConstants.PrefsKeys.TOTAL_GAMES_STARTED, 0),
            foodEatenWithoutWall = gameOverData.foodEatenWithoutWall,
            bonusFoodEatenInGame = gameOverData.bonusFoodEatenInGame,
            foodEatenAtMaxSpeed = gameOverData.foodEatenAtMaxSpeed,
            mazePasses = gameOverData.mazePasses,
            usedSingleDirection = gameOverData.usedSingleDirection,
            usedAllThemes = prefs.getBoolean(AppConstants.PrefsKeys.USED_ALL_THEMES, false),
            usedCustomTheme = prefs.getBoolean(AppConstants.PrefsKeys.USED_CUSTOM_THEME, false),
            diedToOwnTail = gameOverData.diedToOwnTail,
            diedNearHighScore = gameOverData.score > 0 && gameOverData.score == prefs.getInt(AppConstants.PrefsKeys.HIGH_SCORE, 0) - 1,
            diedFast = (System.currentTimeMillis() - gameStartTime) < AppConstants.UI.FAST_DEATH_THRESHOLD_MS && !gameOverData.diedToOwnTail
        )
    }

    private fun saveGameStats(score: Int, foodEaten: Int): Long {
        val sharedPreferences = getSharedPreferences(AppConstants.PrefsKeys.PREFS_NAME, MODE_PRIVATE)
        val sessionPlayTime = TimeUnit.MILLISECONDS.toSeconds(System.currentTimeMillis() - gameStartTime)
        val totalFood = sharedPreferences.getLong(AppConstants.PrefsKeys.TOTAL_FOOD, 0) + foodEaten
        val totalPlayTime = sharedPreferences.getLong(AppConstants.PrefsKeys.TOTAL_PLAY_TIME, 0) + sessionPlayTime

        sharedPreferences.edit {
            putLong(AppConstants.PrefsKeys.TOTAL_FOOD, totalFood)
            putLong(AppConstants.PrefsKeys.TOTAL_PLAY_TIME, totalPlayTime)
            if (score > sharedPreferences.getInt(AppConstants.PrefsKeys.HIGH_SCORE, 0)) {
                putInt(AppConstants.PrefsKeys.HIGH_SCORE, score)
            }
            apply()
        }
        return totalPlayTime
    }

    private fun shareScore(score: Int) {
        val shareIntent = Intent(Intent.ACTION_SEND).apply {
            type = "text/plain"
            putExtra(Intent.EXTRA_TEXT, getString(R.string.share_text, score))
        }
        startActivity(Intent.createChooser(shareIntent, getString(R.string.share_score)))
    }

    override fun onResume() {
        super.onResume()
        soundManager.loadSettings()
        if (hasSavedGame()) {
            btnResume.isVisible = true
        }

        updateControlVisibility()

        if (!snakeView.isGameRunning) {
            showMainMenu()
        }

        applyCustomColors()
    }

    override fun onPause() {
        super.onPause()
        if (snakeView.isGameRunning && !snakeView.isGamePaused) {
            snakeView.pauseGame()
            val prefs = getSharedPreferences("SnakeGame", MODE_PRIVATE)
            snakeView.saveState(prefs)
        }
    }

    private fun handleBackAction() {
        if (snakeView.isGameRunning && !snakeView.isGamePaused) {
            snakeView.pauseGame()
            showPauseMenu()
        } else {
            if (hasSavedGame()) {
                btnResume.isVisible = true
            }
            showMainMenu()
        }
    }

    private fun showMainMenu() {
        menuScrollView.isVisible = true
        snakeView.isGone = true
        scoreTextView.isGone = true
        controlsContainer.isGone = true
        rankTextView.isGone = true
        btnBack.isGone = true
        btnStart.isVisible = true
        btnCareer.isVisible = true
        btnSettings.isVisible = true
        btnAds.isVisible = true
        btnLanguage.isVisible = true
        btnHome.isGone = true
        btnShareScore.isGone = true
        countdownTextView.isGone = true
        titleText.text = getString(R.string.title_name)

        val prefs = getSharedPreferences("SnakeGame", MODE_PRIVATE)
        val highScore = prefs.getInt("high_score", 0)
        highScoreTextView.text = getString(R.string.high_score, highScore)
        btnResume.isVisible = hasSavedGame()
    }

    private fun showGameUI() {
        menuScrollView.isGone = true
        snakeView.isVisible = true
        scoreTextView.isVisible = true
        controlsContainer.isVisible = true

        updateControlVisibility()

        btnBack.isVisible = true
        btnBack.bringToFront()
    }

    private fun updateControlVisibility() {
        val prefs = getSharedPreferences("SnakeGame", MODE_PRIVATE)
        val controlType = prefs.getString("control_preference", "classic")

        when (controlType) {
            "classic" -> {
                gameControls.isVisible = true
                gameControls2.isGone = true
                btnSwipeSensor.isGone = true
            }
            "alternative" -> {
                gameControls.isGone = true
                gameControls2.isVisible = true
                btnSwipeSensor.isGone = true
            }
            "swipe" -> {
                gameControls.isGone = true
                gameControls2.isGone = true
                btnSwipeSensor.isVisible = true
            }
        }
    }

    private fun showGameOverMenu(score: Int) {
        titleText.text = getString(R.string.game_over)
        finalScoreText.text = getString(R.string.your_score, score)
        finalScoreText.isVisible = true
        rankTextView.text = getString(R.string.rank_label, achievementsManager.getRank(score))
        rankTextView.isVisible = true
        btnShareScore.isVisible = score > 0
        menuScrollView.isVisible = true
        snakeView.isGone = true
        scoreTextView.isGone = true
        controlsContainer.isGone = true
        btnBack.isGone = true
        btnStart.isVisible = true
        btnCareer.isGone = true
        btnSettings.isGone = true
        btnAds.isGone = true
        btnResume.isGone = true
        btnLanguage.isGone = true
        btnHome.isVisible = true
        countdownTextView.isGone = true
    }

    private fun showPauseMenu() {
        titleText.text = getString(R.string.game_paused_title)
        menuScrollView.isVisible = true
        snakeView.isGone = true
        scoreTextView.isGone = true
        controlsContainer.isGone = true
        btnBack.isGone = true
        rankTextView.isGone = true
        finalScoreText.isGone = true

        btnStart.isGone = true
        btnCareer.isGone = true
        btnSettings.isGone = true
        btnAds.isGone = true
        btnShareScore.isGone = true

        btnResume.isVisible = true
        btnHome.isVisible = true
        btnLanguage.isGone = true
        countdownTextView.isGone = true
    }

    private fun hasSavedGame(): Boolean {
        val prefs = getSharedPreferences("SnakeGame", MODE_PRIVATE)
        return prefs.contains("saved_is_game_running")
    }

    private fun clearSavedGame() {
        val prefs = getSharedPreferences("SnakeGame", MODE_PRIVATE)
        prefs.edit {
            remove("saved_snake_body")
            remove("saved_obstacles")
            remove("saved_direction")
            remove("saved_food_x")
            remove("saved_food_y")
            remove("saved_score")
            remove("saved_game_speed")
            remove("saved_bonus_food_x")
            remove("saved_bonus_food_y")
            remove("saved_is_game_running")
            apply()
        }
    }

    private fun setupDirectionalButtons() {
        btnLeft.setOnClickListener { handleDirectionalClick(snakeView::turnZigZagLeft) }
        btnRight.setOnClickListener { handleDirectionalClick(snakeView::turnZigZagRight) }
        btnAltUp.setOnClickListener { handleDirectionalClick(snakeView::turnUp) }
        btnAltDown.setOnClickListener { handleDirectionalClick(snakeView::turnDown) }
        btnAltLeft.setOnClickListener { handleDirectionalClick(snakeView::turnLeft) }
        btnAltRight.setOnClickListener { handleDirectionalClick(snakeView::turnRight) }
    }

    private fun handleDirectionalClick(turnFunction: () -> Unit) {
        soundManager.playSound("button_click")
        vibrate(50)
        turnFunction()
    }

    @SuppressLint("MissingPermission")
    private fun vibrate(duration: Long) {
        val vibrator = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            val vibratorManager = getSystemService(VIBRATOR_MANAGER_SERVICE) as VibratorManager
            vibratorManager.defaultVibrator
        } else {
            @Suppress("DEPRECATION")
            getSystemService(VIBRATOR_SERVICE) as Vibrator
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            vibrator.vibrate(VibrationEffect.createOneShot(duration, VibrationEffect.DEFAULT_AMPLITUDE))
        } else {
            @Suppress("DEPRECATION")
            vibrator.vibrate(duration)
        }
    }

    private fun applyCustomColors() {
        val prefs = getSharedPreferences("SnakeGame", MODE_PRIVATE)
        val headColor = prefs.getInt(AppConstants.PrefsKeys.CUSTOM_SNAKE_HEAD_COLOR, "#808080".toColorInt())
        val bodyColor = prefs.getInt(AppConstants.PrefsKeys.CUSTOM_SNAKE_BODY_COLOR, "#000000".toColorInt())
        val foodColor = prefs.getInt(AppConstants.PrefsKeys.CUSTOM_FOOD_COLOR, "#FF0000".toColorInt())
        val mapColor = prefs.getInt(AppConstants.PrefsKeys.CUSTOM_MAP_COLOR, "#C7F0D8".toColorInt())

        snakeView.setSnakeColor(bodyColor, headColor)
        snakeView.setFoodColor(foodColor)
        snakeView.setBoardColor(mapColor)
        snakeView.invalidate()
    }
}
