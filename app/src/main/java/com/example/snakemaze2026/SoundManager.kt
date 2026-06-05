package com.example.snakemaze2026

import android.content.Context
import android.media.AudioAttributes
import android.media.SoundPool
import android.util.Log

class SoundManager(private val context: Context) {

    private var soundPool: SoundPool
    private val soundMap = mutableMapOf<String, Int>()
    private val loadedSounds = mutableSetOf<Int>()
    private var soundEnabled = true

    init {
        val audioAttributes = AudioAttributes.Builder()
            .setUsage(AudioAttributes.USAGE_GAME)
            .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
            .build()

        soundPool = SoundPool.Builder()
            .setMaxStreams(Constants.Sounds.MAX_STREAMS)
            .setAudioAttributes(audioAttributes)
            .build()

        soundPool.setOnLoadCompleteListener { _, sampleId, status ->
            if (status == 0) {
                loadedSounds.add(sampleId)
            }
        }
        
        loadSettings()
    }

    fun loadSettings() {
        val prefs = context.getSharedPreferences(Constants.PrefsKeys.PREFS_NAME, Context.MODE_PRIVATE)
        soundEnabled = prefs.getBoolean(Constants.PrefsKeys.SOUND_ON, Constants.Defaults.SOUND_ENABLED)
    }

    fun addSound(key: String, resourceId: Int) {
        try {
            val soundId = soundPool.load(context, resourceId, 1)
            soundMap[key] = soundId
        } catch (e: Exception) {
            Log.e(Constants.Logging.TAG_SOUND, "Error loading sound: $key", e)
        }
    }

    fun playSound(key: String) {
        if (!soundEnabled) return

        soundMap[key]?.let { soundId ->
            if (loadedSounds.contains(soundId)) {
                try {
                    soundPool.play(soundId, 1.0f, 1.0f, 1, 0, 1.0f)
                } catch (e: Exception) {
                    Log.e(Constants.Logging.TAG_SOUND, "Error playing sound: $key", e)
                }
            }
        }
    }

    fun release() {
        try {
            soundPool.release()
        } catch (e: Exception) {
            Log.e(Constants.Logging.TAG_SOUND, "Error releasing SoundPool", e)
        }
    }
}
