package com.example.snakemaze2026

import android.content.SharedPreferences
import android.graphics.Color
import android.os.Bundle
import android.view.View
import android.widget.TextView
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.edit
import androidx.core.graphics.toColorInt
import com.google.android.material.button.MaterialButton
import com.google.android.material.slider.Slider
import com.google.android.material.switchmaterial.SwitchMaterial
import java.util.Random

class SettingsActivity : AppCompatActivity() {

    private lateinit var prefs: SharedPreferences
    private lateinit var snakeViewPreview: SnakeView
    private val random = Random()  // Single instance instead of new Random() each time
    private val controlModes = Constants.Controls.ALL_MODES

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        androidx.core.view.WindowCompat.setDecorFitsSystemWindows(window, false)

        setContentView(R.layout.activity_settings)

        prefs = getSharedPreferences(Constants.PrefsKeys.PREFS_NAME, MODE_PRIVATE)

        setupWindowInsets()

        snakeViewPreview = findViewById(R.id.snakeViewPreview)
        snakeViewPreview.isPreviewMode = true

        findViewById<MaterialButton>(R.id.btnSetSnakeHeadColor).setOnClickListener {
            showColorPickerDialog(Constants.PrefsKeys.CUSTOM_SNAKE_HEAD_COLOR)
        }

        findViewById<MaterialButton>(R.id.btnSetSnakeBodyColor).setOnClickListener {
            showColorPickerDialog(Constants.PrefsKeys.CUSTOM_SNAKE_BODY_COLOR)
        }

        findViewById<MaterialButton>(R.id.btnSetFoodColor).setOnClickListener {
            showColorPickerDialog(Constants.PrefsKeys.CUSTOM_FOOD_COLOR)
        }

        findViewById<MaterialButton>(R.id.btnSetMapColor).setOnClickListener {
            showColorPickerDialog(Constants.PrefsKeys.CUSTOM_MAP_COLOR)
        }

        findViewById<MaterialButton>(R.id.btnRandomColor).setOnClickListener {
            setRandomColors()
        }

        val switchSound = findViewById<SwitchMaterial>(R.id.switchSound)
        switchSound.isChecked = prefs.getBoolean(Constants.PrefsKeys.SOUND_ON, Constants.Defaults.SOUND_ENABLED)
        switchSound.setOnCheckedChangeListener { _, isChecked ->
            prefs.edit {
                putBoolean(Constants.PrefsKeys.SOUND_ON, isChecked)
                apply()
            }
        }

        val btnCycleControls = findViewById<MaterialButton>(R.id.btnCycleControls)
        var currentControlMode = prefs.getString(Constants.PrefsKeys.CONTROL_PREFERENCE, Constants.Defaults.CONTROL_MODE) ?: Constants.Defaults.CONTROL_MODE
        updateControlPreview(currentControlMode, btnCycleControls)

        btnCycleControls.setOnClickListener {
            val currentIndex = controlModes.indexOf(currentControlMode)
            currentControlMode = controlModes[(currentIndex + 1) % controlModes.size]
            prefs.edit {
                putString(Constants.PrefsKeys.CONTROL_PREFERENCE, currentControlMode)
                apply()
            }
            updateControlPreview(currentControlMode, btnCycleControls)
        }

        loadAndApplyColors()

        try {
            val pInfo = packageManager.getPackageInfo(packageName, 0)
            val version = pInfo.versionName
            findViewById<TextView>(R.id.tvVersion).text = getString(R.string.version_label, version)
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    private fun showColorPickerDialog(colorKey: String) {
        val dialogView = layoutInflater.inflate(R.layout.dialog_color_picker, null)
        val sliderRed = dialogView.findViewById<Slider>(R.id.sliderRed)
        val sliderGreen = dialogView.findViewById<Slider>(R.id.sliderGreen)
        val sliderBlue = dialogView.findViewById<Slider>(R.id.sliderBlue)
        val colorPreview = dialogView.findViewById<View>(R.id.colorPreview)

        val currentColor = prefs.getInt(colorKey, Color.WHITE)
        sliderRed.value = Color.red(currentColor).toFloat()
        sliderGreen.value = Color.green(currentColor).toFloat()
        sliderBlue.value = Color.blue(currentColor).toFloat()
        colorPreview.setBackgroundColor(currentColor)

        val colorChangedListener = Slider.OnChangeListener { _, _, _ ->
            val red = sliderRed.value.toInt()
            val green = sliderGreen.value.toInt()
            val blue = sliderBlue.value.toInt()
            colorPreview.setBackgroundColor(Color.rgb(red, green, blue))
        }

        sliderRed.addOnChangeListener(colorChangedListener)
        sliderGreen.addOnChangeListener(colorChangedListener)
        sliderBlue.addOnChangeListener(colorChangedListener)

        val builder = AlertDialog.Builder(this)
        builder.setView(dialogView)
        builder.setPositiveButton("Save") { _, _ ->
            val red = sliderRed.value.toInt()
            val green = sliderGreen.value.toInt()
            val blue = sliderBlue.value.toInt()
            val color = Color.rgb(red, green, blue)

            prefs.edit {
                putInt(colorKey, color)
                apply()
            }
            loadAndApplyColors()
        }
        builder.setNegativeButton("Cancel", null)
        builder.create().show()
    }

    private fun setRandomColors() {
        val headColor = Color.rgb(random.nextInt(256), random.nextInt(256), random.nextInt(256))
        val bodyColor = Color.rgb(random.nextInt(256), random.nextInt(256), random.nextInt(256))
        val foodColor = Color.rgb(random.nextInt(256), random.nextInt(256), random.nextInt(256))
        val mapColor = Color.rgb(random.nextInt(256), random.nextInt(256), random.nextInt(256))

        prefs.edit {
            putInt(Constants.PrefsKeys.CUSTOM_SNAKE_HEAD_COLOR, headColor)
            putInt(Constants.PrefsKeys.CUSTOM_SNAKE_BODY_COLOR, bodyColor)
            putInt(Constants.PrefsKeys.CUSTOM_FOOD_COLOR, foodColor)
            putInt(Constants.PrefsKeys.CUSTOM_MAP_COLOR, mapColor)
            apply()
        }
        loadAndApplyColors()
    }

    private fun setupWindowInsets() {
        val root = findViewById<View>(R.id.settingsRoot)
        androidx.core.view.ViewCompat.setOnApplyWindowInsetsListener(root) { view, windowInsets ->
            val insets = windowInsets.getInsets(androidx.core.view.WindowInsetsCompat.Type.systemBars())
            val density = resources.displayMetrics.density
            
            val hPadding = (density * Constants.UI.CONTROL_PADDING_DP).toInt()
            
            view.setPadding(
                hPadding,
                insets.top + (density * Constants.UI.WINDOW_INSETS_PADDING_DP).toInt(),
                hPadding,
                insets.bottom + (density * Constants.UI.WINDOW_INSETS_PADDING_DP).toInt()
            )
            windowInsets
        }
    }

    private fun updateControlPreview(mode: String, btn: MaterialButton) {
        val previewClassic = findViewById<View>(R.id.previewClassic)
        val previewDpad = findViewById<View>(R.id.previewDpad)
        val previewSwipe = findViewById<View>(R.id.previewSwipe)
        
        when (mode) {
            Constants.Controls.MODE_ALTERNATIVE -> { // D-Pad
                btn.text = getString(R.string.control_mode_dpad)
                previewClassic.visibility = View.GONE
                previewDpad.visibility = View.VISIBLE
                previewSwipe.visibility = View.GONE
            }
            Constants.Controls.MODE_SWIPE -> { // Swipe
                btn.text = getString(R.string.control_mode_swipe)
                previewClassic.visibility = View.GONE
                previewDpad.visibility = View.GONE
                previewSwipe.visibility = View.VISIBLE
            }
            else -> { // Classic
                btn.text = getString(R.string.control_mode_classic)
                previewClassic.visibility = View.VISIBLE
                previewDpad.visibility = View.GONE
                previewSwipe.visibility = View.GONE
            }
        }
    }

    private fun loadAndApplyColors() {
        val headColor = prefs.getInt(Constants.PrefsKeys.CUSTOM_SNAKE_HEAD_COLOR, Constants.Colors.SNAKE_HEAD_DEFAULT)
        val bodyColor = prefs.getInt(Constants.PrefsKeys.CUSTOM_SNAKE_BODY_COLOR, Constants.Colors.SNAKE_BODY_DEFAULT)
        val foodColor = prefs.getInt(Constants.PrefsKeys.CUSTOM_FOOD_COLOR, Constants.Colors.FOOD_DEFAULT)
        val mapColor = prefs.getInt(Constants.PrefsKeys.CUSTOM_MAP_COLOR, Constants.Colors.NOKIA_BG)

        snakeViewPreview.setSnakeColor(bodyColor, headColor)
        snakeViewPreview.setFoodColor(foodColor)
        snakeViewPreview.setBoardColor(mapColor)
        snakeViewPreview.invalidate()
    }
}
