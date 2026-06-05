package com.example.snakemaze2026

import android.annotation.SuppressLint
import android.content.Context
import android.content.SharedPreferences
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.RectF
import android.os.Handler
import android.os.Looper
import android.util.AttributeSet
import android.view.MotionEvent
import android.view.View
import androidx.core.content.edit
import androidx.core.graphics.toColorInt
import java.util.Queue
import java.util.Random
import java.util.concurrent.ConcurrentLinkedQueue
import java.util.concurrent.atomic.AtomicInteger

data class GameOverData(
    val score: Int,
    val sessionFoodEaten: Int,
    val bonusFoodEatenInGame: Int,
    val foodEatenWithoutWall: Int,
    val foodEatenAtMaxSpeed: Int,
    val bonusEatenFast: Boolean,
    val diedToOwnTail: Boolean,
    val wallHit: Boolean,
    val mazePasses: Int,
    val usedSingleDirection: Boolean
)

class SnakeView(context: Context, attrs: AttributeSet? = null) : View(context, attrs) {

    var isPreviewMode = false
    private val paintSnakeBody = Paint(Paint.ANTI_ALIAS_FLAG).apply { color = Color.BLACK }
    private val paintSnakeHead = Paint(Paint.ANTI_ALIAS_FLAG).apply { color = Color.DKGRAY }
    private val paintFood = Paint(Paint.ANTI_ALIAS_FLAG).apply { color = Color.RED }
    private val paintObstacle = Paint(Paint.ANTI_ALIAS_FLAG).apply { color = "#424242".toColorInt() }
    private val paintBonusFood = Paint(Paint.ANTI_ALIAS_FLAG).apply { color = Color.YELLOW }
    private val paintBonusFood2 = Paint(Paint.ANTI_ALIAS_FLAG).apply { color = Color.MAGENTA }
    private val paintEyes = Paint(Paint.ANTI_ALIAS_FLAG).apply { color = Color.WHITE }
    private val paintPupils = Paint(Paint.ANTI_ALIAS_FLAG).apply { color = Color.BLACK }
    private val paintGrid = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        color = Color.WHITE
        alpha = 28
        strokeWidth = 1f
    }
    private val random = Random()
    private var backgroundColor = "#C8E6C9".toColorInt()

    private val obstacles: MutableList<Pair<Int, Int>> = mutableListOf()
    private var gridSize = 20
    private var gridHeight = 20
    private var cellSize = 0f

    private var snake: MutableList<Pair<Int, Int>> = mutableListOf()
    var direction: String = "UP"
    private val directionQueue: Queue<String> = ConcurrentLinkedQueue()

    private var food: Pair<Int, Int> = Pair(0, 0)
    private var bonusFood: Pair<Int, Int>? = null
    private var bonusFoodSpawnTime = 0L

    private var bonusEatenFastInSession = false
    private var foodEatenWithoutWall = 0
    private var wallHitInSession = false
    private var bonusFoodEatenInGame = 0
    private var foodEatenAtMaxSpeed = 0
    private var mazePasses = 0
    private var directionsUsed = mutableSetOf<String>()

    var isGameOver: Boolean = true
    var isGameRunning: Boolean = false
    var isGamePaused: Boolean = false
    private var isCountingDown = false

    private val handler = Handler(Looper.getMainLooper())
    private val minSpeed = Constants.GameLogic.MIN_SPEED
    private var gameSpeed = Constants.GameLogic.INITIAL_SPEED
    private var countdownRunnable: Runnable? = null

    var score = 0
        private set
    private var sessionFoodEaten = 0

    var onScoreUpdate: ((Int) -> Unit)? = null
    var onGameOver: ((data: GameOverData) -> Unit)? = null
    var onCountdownUpdate: ((Int) -> Unit)? = null
    var onEat: (() -> Unit)? = null
    var onBonusEat: (() -> Unit)? = null

    private val rect = RectF()
    private var previewSnake: List<Pair<Int, Int>> = emptyList()
    private var previewFood: Pair<Int, Int> = Pair(0, 0)
    private var lastNarrowPassCell: Pair<Int, Int>? = null

    private val hideBonusFoodRunnable = Runnable {
        bonusFood = null
        invalidate()
    }

    private val gameLoopRunnable = object : Runnable {
        override fun run() {
            if (isGameRunning && !isGameOver && !isGamePaused) {
                moveSnake()
                invalidate()
                handler.postDelayed(this, gameSpeed)
            }
        }
    }

    fun setSnakeColor(bodyColor: Int, headColor: Int) {
        paintSnakeBody.color = bodyColor
        paintSnakeHead.color = headColor
    }

    fun setBoardColor(color: Int) {
        backgroundColor = color
    }

    fun setFoodColor(color: Int) {
        paintFood.color = color
    }

    override fun onSizeChanged(w: Int, h: Int, oldw: Int, oldh: Int) {
        super.onSizeChanged(w, h, oldw, oldh)
        if (w > 0 && h > 0) {
            cellSize = w / gridSize.toFloat()
            gridHeight = (h / cellSize).toInt().coerceAtLeast(12)
            previewSnake = listOf(
                Pair(gridSize / 2, gridHeight / 2),
                Pair(gridSize / 2, gridHeight / 2 + 1),
                Pair(gridSize / 2, gridHeight / 2 + 2)
            )
            previewFood = Pair(gridSize / 2 + 2, gridHeight / 2)
        }
    }

    fun startGame() {
        reset()
        isGameOver = false
        isGameRunning = true
        isGamePaused = false
        startGameLoop()
    }

    fun pauseGame() {
        isGamePaused = true
        handler.removeCallbacks(gameLoopRunnable)
        countdownRunnable?.let(handler::removeCallbacks)
        countdownRunnable = null
        isCountingDown = false
    }

    fun resumeGame() {
        if (isGameOver || !isGameRunning) return

        handler.removeCallbacks(gameLoopRunnable)
        countdownRunnable?.let(handler::removeCallbacks)
        isGamePaused = false
        isCountingDown = true
        val secondsLeft = AtomicInteger(Constants.GameLogic.COUNTDOWN_SECONDS)
        countdownRunnable = object : Runnable {
            override fun run() {
                val current = secondsLeft.get()
                onCountdownUpdate?.invoke(current)
                if (current > 0) {
                    secondsLeft.decrementAndGet()
                    handler.postDelayed(this, Constants.GameLogic.COUNTDOWN_DELAY_MS)
                } else {
                    isCountingDown = false
                    countdownRunnable = null
                    startGameLoop()
                }
            }
        }
        handler.post(countdownRunnable!!)
    }

    private fun startGameLoop() {
        handler.removeCallbacks(gameLoopRunnable)
        handler.post(gameLoopRunnable)
    }

    private fun reset() {
        handler.removeCallbacks(gameLoopRunnable)
        handler.removeCallbacks(hideBonusFoodRunnable)
        countdownRunnable?.let(handler::removeCallbacks)
        countdownRunnable = null
        isCountingDown = false
        snake.clear()
        obstacles.clear()
        bonusFood = null

        bonusEatenFastInSession = false
        foodEatenWithoutWall = 0
        wallHitInSession = false
        bonusFoodEatenInGame = 0
        foodEatenAtMaxSpeed = 0
        mazePasses = 0
        lastNarrowPassCell = null
        directionsUsed.clear()

        val startX = gridSize / 2
        val startY = gridHeight / 2
        snake.addAll(listOf(Pair(startX, startY), Pair(startX, startY + 1), Pair(startX, startY + 2)))
        direction = "UP"
        directionQueue.clear()
        score = 0
        sessionFoodEaten = 0
        onScoreUpdate?.invoke(score)
        gameSpeed = Constants.GameLogic.INITIAL_SPEED
        spawnFood()
        invalidate()
    }

    private fun moveSnake() {
        if (isGamePaused || isCountingDown) return

        directionQueue.poll()?.let {
            if (isValidDirectionChange(direction, it)) {
                directionsUsed.add(it)
                direction = it
            }
        }

        val head = snake.first()
        var newHead = when (direction) {
            "UP" -> Pair(head.first, head.second - 1)
            "DOWN" -> Pair(head.first, head.second + 1)
            "LEFT" -> Pair(head.first - 1, head.second)
            "RIGHT" -> Pair(head.first + 1, head.second)
            else -> head
        }

        if (newHead.first !in 0 until gridSize || newHead.second !in 0 until gridHeight) {
            wallHitInSession = true
            newHead = when {
                newHead.first < 0 -> Pair(gridSize - 1, newHead.second)
                newHead.first >= gridSize -> Pair(0, newHead.second)
                newHead.second < 0 -> Pair(newHead.first, gridHeight - 1)
                else -> Pair(newHead.first, 0)
            }
        }

        val isNarrowPass = snake.size > Constants.GameLogic.MIN_SNAKE_LENGTH_FOR_NARROW_PASS && isNarrowPass(newHead)
        if (isNarrowPass && lastNarrowPassCell != newHead) {
            mazePasses++
            lastNarrowPassCell = newHead
        } else if (!isNarrowPass) {
            lastNarrowPassCell = null
        }

        val diedToOwnTail = snake.contains(newHead)
        if (diedToOwnTail || obstacles.contains(newHead)) {
            finishGame(diedToOwnTail)
            return
        }

        snake.add(0, newHead)

        if (bonusFood != null && newHead == bonusFood) {
            if (System.currentTimeMillis() - bonusFoodSpawnTime < Constants.GameLogic.BONUS_FOOD_TIMEOUT_MS) bonusEatenFastInSession = true
            score += Constants.GameLogic.BONUS_POINTS
            sessionFoodEaten++
            bonusFoodEatenInGame++
            onScoreUpdate?.invoke(score)
            updateMaze(score)
            snake.add(snake.last())
            snake.add(snake.last())
            bonusFood = null
            handler.removeCallbacks(hideBonusFoodRunnable)
            triggerAutoSave()
            onBonusEat?.invoke()
        } else if (newHead == food) {
            score += Constants.GameLogic.REGULAR_POINTS
            sessionFoodEaten++
            if (!wallHitInSession) foodEatenWithoutWall++
            if (gameSpeed == minSpeed) foodEatenAtMaxSpeed++
            onScoreUpdate?.invoke(score)
            updateMaze(score)
            if (score > 0 && score % Constants.GameLogic.BONUS_FOOD_SPAWN_INTERVAL == 0) {
                spawnBonusFood()
            }
            gameSpeed = (gameSpeed - Constants.GameLogic.SPEED_INCREMENT).coerceAtLeast(minSpeed)
            spawnFood()
            triggerAutoSave()
            onEat?.invoke()
        } else {
            snake.removeAt(snake.size - 1)
        }
    }

    private fun triggerAutoSave() {
        val prefs = context.getSharedPreferences(Constants.PrefsKeys.PREFS_NAME, Context.MODE_PRIVATE)
        saveState(prefs)
    }

    private fun finishGame(diedToOwnTail: Boolean) {
        isGameOver = true
        isGameRunning = false
        isCountingDown = false
        handler.removeCallbacks(gameLoopRunnable)
        handler.removeCallbacks(hideBonusFoodRunnable)
        countdownRunnable?.let(handler::removeCallbacks)
        countdownRunnable = null

        val gameOverData = GameOverData(
            score = score,
            sessionFoodEaten = sessionFoodEaten,
            bonusFoodEatenInGame = bonusFoodEatenInGame,
            foodEatenWithoutWall = foodEatenWithoutWall,
            foodEatenAtMaxSpeed = foodEatenAtMaxSpeed,
            bonusEatenFast = bonusEatenFastInSession,
            diedToOwnTail = diedToOwnTail,
            wallHit = wallHitInSession,
            mazePasses = mazePasses,
            usedSingleDirection = directionsUsed.size == 1
        )
        onGameOver?.invoke(gameOverData)
    }

    private fun updateMaze(currentScore: Int) {
        val level = currentScore / 10
        if (level > 0 && obstacles.size < level * 4 && freeCells().size > 12) {
            addRandomObstacleBlock()
        }
    }

    private fun addRandomObstacleBlock() {
        var placed = false
        var attempts = 0
        while (!placed && attempts < 100) {
            val startX = random.nextInt(gridSize - 4) + 2
            val startY = random.nextInt(gridHeight - 4) + 2

            val areaIsClear = (startX..startX + 1).all { x ->
                (startY..startY + 1).all { y ->
                    val cell = Pair(x, y)
                    !snake.contains(cell) && food != cell && bonusFood != cell && !obstacles.contains(cell)
                }
            }

            if (areaIsClear) {
                for (i in 0..1) {
                    for (j in 0..1) {
                        obstacles.add(Pair(startX + i, startY + j))
                    }
                }
                placed = true
            }
            attempts++
        }
    }

    private fun spawnFood() {
        food = freeCells()
            .filter { it != bonusFood }
            .randomOrNull(random)
            ?: run {
                finishGame(diedToOwnTail = false)
                return
            }
    }

    private fun spawnBonusFood() {
        handler.removeCallbacks(hideBonusFoodRunnable)
        bonusFood = freeCells()
            .filter { it != food }
            .randomOrNull(random)
            ?: return

        bonusFoodSpawnTime = System.currentTimeMillis()
        handler.postDelayed(hideBonusFoodRunnable, Constants.GameLogic.BONUS_FOOD_DISPLAY_TIMEOUT_MS)
    }

    private fun freeCells(): List<Pair<Int, Int>> {
        val occupied = HashSet<Pair<Int, Int>>(snake.size + obstacles.size + 2)
        occupied.addAll(snake)
        occupied.addAll(obstacles)
        return buildList {
            for (x in 0 until gridSize) {
                for (y in 0 until gridHeight) {
                    val cell = Pair(x, y)
                    if (cell !in occupied) add(cell)
                }
            }
        }
    }

    private fun isNarrowPass(cell: Pair<Int, Int>): Boolean {
        val left = Pair(cell.first - 1, cell.second)
        val right = Pair(cell.first + 1, cell.second)
        val up = Pair(cell.first, cell.second - 1)
        val down = Pair(cell.first, cell.second + 1)
        return (isBlockedCell(left) && isBlockedCell(right)) || (isBlockedCell(up) && isBlockedCell(down))
    }

    private fun isBlockedCell(cell: Pair<Int, Int>): Boolean {
        return cell.first !in 0 until gridSize ||
            cell.second !in 0 until gridHeight ||
            cell in obstacles
    }

    private fun <T> List<T>.randomOrNull(random: Random): T? {
        if (isEmpty()) return null
        return this[random.nextInt(size)]
    }

    private fun getPendingDirection(): String = directionQueue.lastOrNull() ?: direction

    fun turnRight() {
        addDirection("RIGHT")
    }

    fun turnLeft() {
        addDirection("LEFT")
    }

    fun turnUp() {
        addDirection("UP")
    }

    fun turnDown() {
        addDirection("DOWN")
    }

    fun turnZigZagLeft() {
        val newDirection = when (getPendingDirection()) {
            "UP", "DOWN" -> "LEFT"
            else -> "DOWN"
        }
        addDirection(newDirection)
    }

    fun turnZigZagRight() {
        val newDirection = when (getPendingDirection()) {
            "UP", "DOWN" -> "RIGHT"
            else -> "UP"
        }
        addDirection(newDirection)
    }

    private fun addDirection(newDirection: String) {
        if (isCountingDown) {
            if (isValidDirectionChange(direction, newDirection)) {
                direction = newDirection
                directionQueue.clear()
                invalidate()
            }
            return
        }

        if (directionQueue.size < 3) {
            val lastDir = directionQueue.lastOrNull() ?: direction
            if (isValidDirectionChange(lastDir, newDirection)) {
                directionQueue.add(newDirection)
            }
        }
    }

    private fun isValidDirectionChange(current: String, next: String): Boolean {
        return when (current) {
            "UP" -> next != "DOWN"
            "DOWN" -> next != "UP"
            "LEFT" -> next != "RIGHT"
            "RIGHT" -> next != "LEFT"
            else -> true
        }
    }

    fun saveState(prefs: SharedPreferences) {
        prefs.edit {
            val snakeStr = snake.joinToString(";") { "${it.first},${it.second}" }
            val obstaclesStr = obstacles.joinToString(";") { "${it.first},${it.second}" }

            putString("saved_snake_body", snakeStr)
            putString("saved_obstacles", obstaclesStr)
            putString("saved_direction", direction)
            putInt("saved_food_x", food.first)
            putInt("saved_food_y", food.second)
            putInt("saved_score", score)
            putLong("saved_game_speed", gameSpeed)
            putBoolean("saved_is_game_running", isGameRunning)

            bonusFood?.let {
                putInt("saved_bonus_food_x", it.first)
                putInt("saved_bonus_food_y", it.second)
            } ?: run {
                remove("saved_bonus_food_x")
                remove("saved_bonus_food_y")
            }
        }
    }

    fun restoreState(prefs: SharedPreferences): Boolean {
        if (!prefs.contains("saved_is_game_running")) return false

        val snakeStr = prefs.getString("saved_snake_body", null) ?: return false
        snake.clear()
        snake.addAll(snakeStr.split(";").mapNotNull {
            try {
                val (x, y) = it.split(",")
                Pair(x.toInt(), y.toInt())
            } catch (_: Exception) {
                null
            }
        })

        val obstaclesStr = prefs.getString("saved_obstacles", "")!!
        obstacles.clear()
        if(obstaclesStr.isNotEmpty()) {
            obstacles.addAll(obstaclesStr.split(";").mapNotNull {
                try {
                    val (x, y) = it.split(",")
                    Pair(x.toInt(), y.toInt())
                } catch (_: Exception) {
                    null
                }
            })
        }

        direction = prefs.getString("saved_direction", "UP")!!
        val foodX = prefs.getInt("saved_food_x", 0)
        val foodY = prefs.getInt("saved_food_y", 0)
        food = Pair(foodX, foodY)

        score = prefs.getInt("saved_score", 0)
        gameSpeed = prefs.getLong("saved_game_speed", Constants.GameLogic.INITIAL_SPEED)

        if (prefs.contains("saved_bonus_food_x")) {
            val bonusFoodX = prefs.getInt("saved_bonus_food_x", 0)
            val bonusFoodY = prefs.getInt("saved_bonus_food_y", 0)
            bonusFood = Pair(bonusFoodX, bonusFoodY)
        }

        isGameRunning = true
        isGamePaused = true
        isGameOver = false

        onScoreUpdate?.invoke(score)
        invalidate()
        return true
    }

    @SuppressLint("ClickableViewAccessibility")
    override fun onTouchEvent(event: MotionEvent): Boolean {
        return true
    }

    override fun onDraw(canvas: Canvas) {
        super.onDraw(canvas)
        if (isInEditMode || cellSize == 0f) return

        canvas.drawColor(backgroundColor)
        drawGrid(canvas)

        for ((x, y) in obstacles) {
            rect.set(x * cellSize, y * cellSize, (x + 1) * cellSize, (y + 1) * cellSize)
            canvas.drawRoundRect(rect, 8f, 8f, paintObstacle)
        }

        if (isPreviewMode) {
            rect.set(previewFood.first * cellSize, previewFood.second * cellSize, (previewFood.first + 1) * cellSize, (previewFood.second + 1) * cellSize)
            canvas.drawRoundRect(rect, 15f, 15f, paintFood)

            for ((index, pair) in previewSnake.withIndex()) {
                val (x, y) = pair
                val paint = if (index == 0) paintSnakeHead else paintSnakeBody
                rect.set(
                    x * cellSize + cellSize * 0.06f,
                    y * cellSize + cellSize * 0.06f,
                    (x + 1) * cellSize - cellSize * 0.06f,
                    (y + 1) * cellSize - cellSize * 0.06f
                )
                canvas.drawRoundRect(rect, 10f, 10f, paint)
            }
        } else {
            if (isGameOver && !isGamePaused) return

            if (bonusFood != null) {
                val (x, y) = bonusFood!!
                val left = x * cellSize
                val top = y * cellSize
                val right = (x + 1) * cellSize
                val bottom = (y + 1) * cellSize
                val midX = (left + right) / 2
                val midY = (top + bottom) / 2
                val radius = (right - left) / 2

                canvas.drawCircle(midX, midY, radius, paintBonusFood)
                canvas.drawCircle(midX, midY, radius * 0.7f, paintBonusFood2)
            } else {
                rect.set(food.first * cellSize, food.second * cellSize, (food.first + 1) * cellSize, (food.second + 1) * cellSize)
                canvas.drawRoundRect(rect, 15f, 15f, paintFood)
            }

            for ((index, pair) in snake.withIndex()) {
                val (x, y) = pair
                val paint = if (index == 0) paintSnakeHead else paintSnakeBody
                rect.set(x * cellSize, y * cellSize, (x + 1) * cellSize, (y + 1) * cellSize)
                canvas.drawRoundRect(rect, 10f, 10f, paint)

                // Draw eyes on the head
                if (index == 0) {
                    val eyeRadius = cellSize / 8f
                    val pupilRadius = cellSize / 16f
                    val offset = cellSize / 4f
                    
                    val eyeCoordinates = when (direction) {
                        "UP" -> floatArrayOf(
                            x * cellSize + offset, y * cellSize + offset,
                            (x + 1) * cellSize - offset, y * cellSize + offset
                        )
                        "DOWN" -> floatArrayOf(
                            x * cellSize + offset, (y + 1) * cellSize - offset,
                            (x + 1) * cellSize - offset, (y + 1) * cellSize - offset
                        )
                        "LEFT" -> floatArrayOf(
                            x * cellSize + offset, y * cellSize + offset,
                            x * cellSize + offset, (y + 1) * cellSize - offset
                        )
                        "RIGHT" -> floatArrayOf(
                            (x + 1) * cellSize - offset, y * cellSize + offset,
                            (x + 1) * cellSize - offset, (y + 1) * cellSize - offset
                        )
                        else -> floatArrayOf(0f, 0f, 0f, 0f)
                    }

                    if (eyeCoordinates[0] != 0f) {
                        canvas.drawCircle(eyeCoordinates[0], eyeCoordinates[1], eyeRadius, paintEyes)
                        canvas.drawCircle(eyeCoordinates[2], eyeCoordinates[3], eyeRadius, paintEyes)
                        canvas.drawCircle(eyeCoordinates[0], eyeCoordinates[1], pupilRadius, paintPupils)
                        canvas.drawCircle(eyeCoordinates[2], eyeCoordinates[3], pupilRadius, paintPupils)
                    }
                }
            }
        }
    }

    private fun drawGrid(canvas: Canvas) {
        val width = gridSize * cellSize
        val height = gridHeight * cellSize
        var x = 0f
        while (x <= width) {
            canvas.drawLine(x, 0f, x, height, paintGrid)
            x += cellSize
        }
        var y = 0f
        while (y <= height) {
            canvas.drawLine(0f, y, width, y, paintGrid)
            y += cellSize
        }
    }
}
