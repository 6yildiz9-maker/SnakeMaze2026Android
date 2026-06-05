package com.example.snakemaze2026

import android.graphics.Color
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import androidx.recyclerview.widget.RecyclerView

class AchievementAdapter(private val achievements: List<Achievement>) :
    RecyclerView.Adapter<AchievementAdapter.ViewHolder>() {

    class ViewHolder(view: View) : RecyclerView.ViewHolder(view) {
        val nameTextView: TextView = view.findViewById(R.id.achievementName)
        val descriptionTextView: TextView = view.findViewById(R.id.achievementDescription)
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
        val view = LayoutInflater.from(parent.context)
            .inflate(R.layout.item_achievement, parent, false)
        return ViewHolder(view)
    }

    override fun onBindViewHolder(holder: ViewHolder, position: Int) {
        val achievement = achievements[position]
        holder.nameTextView.text = achievement.name
        holder.descriptionTextView.text = achievement.description

        if (achievement.isUnlocked) {
            holder.itemView.setBackgroundColor(Constants.Colors.ACHIEVEMENT_UNLOCKED_BG)
            holder.nameTextView.setTextColor(Constants.Colors.ACHIEVEMENT_UNLOCKED_TEXT)
            holder.descriptionTextView.setTextColor(Constants.Colors.ACHIEVEMENT_UNLOCKED_TEXT)
        } else {
            holder.itemView.setBackgroundColor(Constants.Colors.ACHIEVEMENT_LOCKED_BG)
            holder.nameTextView.setTextColor(Constants.Colors.ACHIEVEMENT_LOCKED_TEXT)
            holder.descriptionTextView.setTextColor(Constants.Colors.ACHIEVEMENT_LOCKED_TEXT)
        }
    }

    override fun getItemCount() = achievements.size
}
