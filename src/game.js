document.addEventListener('DOMContentLoaded', function() {
    'use strict';

    // ===== 配置常數 =====
    var CONFIG = {
        CANVAS_WIDTH: 800,
        CANVAS_HEIGHT: 600,
        PLAYER_SIZE: 10,
        PLAYER_SPEED: 5,
        TARGET_SIZE: 20,
        TARGET_COUNT: 5,
        GRID_CELL_SIZE: 20,
        TRAINING_DELAY: 0,
        TRAINING_BATCH_SIZE: 10,
        TEST_DELAY: 50,
        SCORE_PER_TARGET: 10,
        REWARD_WIN: 100,
        REWARD_WALL_HIT: -10,
        REWARD_STEP: -1,
        NOTIFICATION_DURATION: 3000,
        PLAYER_COLOR: '#3498db',
        TARGET_COLOR: '#e74c3c',
        CANVAS_BG_COLOR: '#ecf0f1'
    };

    // ===== DOM 元素參照 =====
    var canvas = document.getElementById('gameCanvas');
    var ctx = canvas.getContext('2d');
    var scoreElement = document.getElementById('score');
    var actionElement = document.getElementById('action');
    var startTrainingButton = document.getElementById('start-training-button');
    var saveModelButton = document.getElementById('save-model-button');
    var loadModelButton = document.getElementById('load-model-button');
    var testButton = document.getElementById('test-button');
    var resetButton = document.getElementById('reset-button');
    var fileInput = document.getElementById('file-input');
    var statsElement = document.getElementById('stats');
    var notificationElement = document.getElementById('notification');
    var speedSlider = document.getElementById('speed-slider');
    var speedValue = document.getElementById('speed-value');
    var modeIndicator = document.getElementById('mode-indicator');

    // ===== 遊戲狀態 =====
    var score = 0;
    var gameOver = false;
    var training = false;
    var testing = false;
    var manualMode = false;
    var steps = 0;
    var bestSteps = Infinity;
    var trainingSpeed = 1;
    var notificationTimer = null;

    // ===== RL 代理 =====
    var rlAgent = new RLAgent();

    // ===== 遊戲物件 =====
    var player = {
        x: canvas.width / 2,
        y: canvas.height - 30,
        width: CONFIG.PLAYER_SIZE,
        height: CONFIG.PLAYER_SIZE,
        speed: CONFIG.PLAYER_SPEED
    };

    var actions = ['left', 'right', 'up', 'down'];
    var targets = [];

    // ===== 通知系統（取代 alert） =====
    function showNotification(message, type) {
        type = type || 'info';
        if (!notificationElement) return;
        notificationElement.textContent = message;
        notificationElement.className = 'notification show ' + type;
        if (notificationTimer) {
            clearTimeout(notificationTimer);
        }
        notificationTimer = setTimeout(function() {
            notificationElement.className = 'notification';
            notificationTimer = null;
        }, CONFIG.NOTIFICATION_DURATION);
    }

    // ===== 模式指示器 =====
    function updateModeIndicator() {
        if (!modeIndicator) return;
        if (training) {
            modeIndicator.textContent = '模式: 訓練中';
            modeIndicator.className = 'mode-indicator training';
        } else if (testing) {
            modeIndicator.textContent = '模式: 測試中';
            modeIndicator.className = 'mode-indicator testing';
        } else if (manualMode) {
            modeIndicator.textContent = '模式: 手動遊玩';
            modeIndicator.className = 'mode-indicator manual';
        } else {
            modeIndicator.textContent = '模式: 閒置';
            modeIndicator.className = 'mode-indicator idle';
        }
    }

    // ===== 統計資訊更新 =====
    function updateStats() {
        if (!statsElement) return;
        var stateCount = rlAgent.getStateCount();
        var exploration = (rlAgent.explorationRate * 100).toFixed(1);
        statsElement.innerHTML =
            '回合: ' + rlAgent.episodeCount +
            ' | 探索率: ' + exploration + '%' +
            ' | 已知狀態: ' + stateCount +
            ' | 步數: ' + steps +
            (bestSteps < Infinity ? ' | 最佳: ' + bestSteps : '');
    }

    // ===== 目標管理 =====
    function initTargets() {
        targets.length = 0;
        for (var i = 0; i < CONFIG.TARGET_COUNT; i++) {
            targets.push({
                x: Math.random() * (canvas.width - CONFIG.TARGET_SIZE),
                y: Math.random() * (canvas.height - CONFIG.TARGET_SIZE),
                width: CONFIG.TARGET_SIZE,
                height: CONFIG.TARGET_SIZE
            });
        }
    }

    // ===== 繪圖函式 =====
    function drawBackground() {
        ctx.fillStyle = CONFIG.CANVAS_BG_COLOR;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    function drawPlayer() {
        ctx.fillStyle = CONFIG.PLAYER_COLOR;
        ctx.beginPath();
        var centerX = player.x + player.width / 2;
        var centerY = player.y + player.height / 2;
        var radius = player.width / 2;
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.fill();
    }

    function drawTargets() {
        ctx.fillStyle = CONFIG.TARGET_COLOR;
        for (var i = 0; i < targets.length; i++) {
            var t = targets[i];
            // 繪製圓角矩形目標
            var r = 4;
            ctx.beginPath();
            ctx.moveTo(t.x + r, t.y);
            ctx.lineTo(t.x + t.width - r, t.y);
            ctx.quadraticCurveTo(t.x + t.width, t.y, t.x + t.width, t.y + r);
            ctx.lineTo(t.x + t.width, t.y + t.height - r);
            ctx.quadraticCurveTo(t.x + t.width, t.y + t.height, t.x + t.width - r, t.y + t.height);
            ctx.lineTo(t.x + r, t.y + t.height);
            ctx.quadraticCurveTo(t.x, t.y + t.height, t.x, t.y + t.height - r);
            ctx.lineTo(t.x, t.y + r);
            ctx.quadraticCurveTo(t.x, t.y, t.x + r, t.y);
            ctx.closePath();
            ctx.fill();
        }
    }

    function drawTargetIndicator() {
        if (targets.length === 0) return;
        var target = targets[0];
        ctx.strokeStyle = 'rgba(231, 76, 60, 0.3)';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(player.x + player.width / 2, player.y + player.height / 2);
        ctx.lineTo(target.x + target.width / 2, target.y + target.height / 2);
        ctx.stroke();
        ctx.setLineDash([]);
    }

    function drawRemainingCount() {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.font = '14px Arial';
        ctx.textAlign = 'left';
        ctx.fillText('剩餘目標: ' + targets.length, 10, 20);
    }

    function render() {
        drawBackground();
        drawTargetIndicator();
        drawTargets();
        drawPlayer();
        drawRemainingCount();
    }

    // ===== 碰撞檢測（修復 forEach+splice 問題）=====
    function checkCollision() {
        var collected = false;
        for (var i = targets.length - 1; i >= 0; i--) {
            var target = targets[i];
            if (player.x < target.x + target.width &&
                player.x + player.width > target.x &&
                player.y < target.y + target.height &&
                player.y + player.height > target.y) {
                targets.splice(i, 1);
                score += CONFIG.SCORE_PER_TARGET;
                scoreElement.textContent = '分數: ' + score;
                collected = true;
            }
        }
        return collected;
    }

    // ===== 遊戲狀態更新 =====
    function updateGame() {
        if (targets.length === 0) {
            gameOver = true;
        }
    }

    // ===== 玩家移動 =====
    function movePlayer(direction) {
        var hitWall = false;
        switch (direction) {
            case 'left':
                if (player.x > 0) {
                    player.x = Math.max(0, player.x - player.speed);
                } else {
                    hitWall = true;
                }
                break;
            case 'right':
                if (player.x < canvas.width - player.width) {
                    player.x = Math.min(canvas.width - player.width, player.x + player.speed);
                } else {
                    hitWall = true;
                }
                break;
            case 'up':
                if (player.y > 0) {
                    player.y = Math.max(0, player.y - player.speed);
                } else {
                    hitWall = true;
                }
                break;
            case 'down':
                if (player.y < canvas.height - player.height) {
                    player.y = Math.min(canvas.height - player.height, player.y + player.speed);
                } else {
                    hitWall = true;
                }
                break;
        }
        return hitWall;
    }

    // ===== 狀態表示 =====
    function getState() {
        if (targets.length === 0) return 'terminal';
        var target = targets[0];
        var playerGridX = Math.floor(player.x / CONFIG.GRID_CELL_SIZE);
        var playerGridY = Math.floor(player.y / CONFIG.GRID_CELL_SIZE);
        var targetGridX = Math.floor(target.x / CONFIG.GRID_CELL_SIZE);
        var targetGridY = Math.floor(target.y / CONFIG.GRID_CELL_SIZE);
        return 'px:' + playerGridX + ',py:' + playerGridY + ',tx:' + targetGridX + ',ty:' + targetGridY;
    }

    // ===== 獎勵計算（含距離獎勵塑形）=====
    function getReward(hitWall, collected) {
        if (collected) {
            return CONFIG.REWARD_WIN;
        }
        if (hitWall) {
            return CONFIG.REWARD_WALL_HIT;
        }
        // 距離獎勵塑形：離目標越近獎勵越高
        if (targets.length > 0) {
            var target = targets[0];
            var dx = (player.x + player.width / 2) - (target.x + target.width / 2);
            var dy = (player.y + player.height / 2) - (target.y + target.height / 2);
            var dist = Math.sqrt(dx * dx + dy * dy);
            var maxDist = Math.sqrt(canvas.width * canvas.width + canvas.height * canvas.height);
            return CONFIG.REWARD_STEP + (1 - dist / maxDist) * 0.5;
        }
        return CONFIG.REWARD_STEP;
    }

    // ===== 遊戲重置 =====
    function resetGame() {
        gameOver = false;
        score = 0;
        steps = 0;
        scoreElement.textContent = '分數: ' + score;
        player.x = canvas.width / 2;
        player.y = canvas.height - 30;
        initTargets();
    }

    // ===== 停止所有模式 =====
    function stopAllModes() {
        training = false;
        testing = false;
        manualMode = false;
        startTrainingButton.textContent = '開始訓練';
        testButton.textContent = '開始測試';
        updateModeIndicator();
        updateButtonStates();
    }

    // ===== 按鈕狀態管理 =====
    function updateButtonStates() {
        var isActive = training || testing || manualMode;
        startTrainingButton.disabled = isActive && !training;
        testButton.disabled = isActive && !testing;
    }

    // ===== 訓練迴圈（支援批量訓練）=====
    function trainingLoop() {
        if (!training) return;

        var batchSize = CONFIG.TRAINING_BATCH_SIZE * trainingSpeed;
        for (var b = 0; b < batchSize; b++) {
            if (!training) break;

            var state = getState();
            if (state === 'terminal') {
                rlAgent.incrementEpisode();
                resetGame();
                continue;
            }

            var actionIndex = rlAgent.getAction(state);
            var action = actions[actionIndex];

            var hitWall = movePlayer(action);
            var collected = checkCollision();
            steps++;

            var reward = getReward(hitWall, collected);
            var nextState = getState();
            rlAgent.updateQValue(state, actionIndex, reward, nextState);

            updateGame();

            if (gameOver) {
                rlAgent.incrementEpisode();
                resetGame();
            }
        }

        // 每個批次後更新顯示（減少 DOM 操作）
        actionElement.textContent = '行動: 訓練中...';
        render();
        updateStats();

        setTimeout(trainingLoop, CONFIG.TRAINING_DELAY);
    }

    // ===== 測試迴圈 =====
    function testLoop() {
        if (!testing) return;

        var state = getState();
        if (state === 'terminal') {
            resetGame();
        }

        var actionIndex = rlAgent.getBestAction(state);
        var action = actions[actionIndex];
        actionElement.textContent = '行動: ' + action;

        movePlayer(action);
        checkCollision();
        steps++;

        updateGame();
        render();
        updateStats();

        if (!gameOver) {
            setTimeout(testLoop, CONFIG.TEST_DELAY);
        } else {
            if (steps < bestSteps) {
                bestSteps = steps;
                showNotification('新的最短步數紀錄: ' + bestSteps + ' 步！', 'success');
            }
            rlAgent.incrementEpisode();
            resetGame();
            setTimeout(testLoop, CONFIG.TEST_DELAY);
        }
    }

    // ===== 手動遊玩迴圈 =====
    function manualRender() {
        if (!manualMode) return;
        render();
        updateStats();
        updateGame();
        if (gameOver) {
            showNotification('恭喜！收集完所有目標，共 ' + steps + ' 步', 'success');
            resetGame();
        }
        requestAnimationFrame(manualRender);
    }

    // ===== 鍵盤控制 =====
    document.addEventListener('keydown', function(e) {
        if (!manualMode) return;
        var direction = null;
        switch (e.key) {
            case 'ArrowLeft': case 'a': case 'A':
                direction = 'left'; break;
            case 'ArrowRight': case 'd': case 'D':
                direction = 'right'; break;
            case 'ArrowUp': case 'w': case 'W':
                direction = 'up'; break;
            case 'ArrowDown': case 's': case 'S':
                direction = 'down'; break;
        }
        if (direction) {
            e.preventDefault();
            movePlayer(direction);
            checkCollision();
            steps++;
            actionElement.textContent = '行動: ' + direction;
        }
    });

    // ===== 事件綁定 =====

    // 開始/停止訓練
    startTrainingButton.addEventListener('click', function() {
        if (!training) {
            stopAllModes();
            training = true;
            resetGame();
            updateModeIndicator();
            updateButtonStates();
            startTrainingButton.textContent = '停止訓練';
            trainingLoop();
        } else {
            training = false;
            startTrainingButton.textContent = '開始訓練';
            updateModeIndicator();
            updateButtonStates();
            showNotification('訓練已停止，共 ' + rlAgent.episodeCount + ' 回合', 'info');
        }
    });

    // 開始/停止測試
    testButton.addEventListener('click', function() {
        if (!testing) {
            stopAllModes();
            testing = true;
            resetGame();
            updateModeIndicator();
            updateButtonStates();
            testButton.textContent = '停止測試';
            testLoop();
        } else {
            testing = false;
            testButton.textContent = '開始測試';
            updateModeIndicator();
            updateButtonStates();
        }
    });

    // 保存模型
    saveModelButton.addEventListener('click', function() {
        if (rlAgent.getStateCount() === 0) {
            showNotification('Q 表為空，請先進行訓練', 'error');
            return;
        }
        rlAgent.saveQTable();
        showNotification('模型已保存（' + rlAgent.getStateCount() + ' 個狀態）', 'success');
    });

    // 載入模型
    loadModelButton.addEventListener('click', function() {
        fileInput.click();
    });

    fileInput.addEventListener('change', function(event) {
        var file = event.target.files[0];
        if (!file) return;
        var reader = new FileReader();
        reader.onload = function(e) {
            var success = rlAgent.loadQTable(e.target.result);
            if (success) {
                showNotification('模型已載入（' + rlAgent.getStateCount() + ' 個狀態）', 'success');
                updateStats();
            } else {
                showNotification('模型載入失敗，請檢查檔案格式', 'error');
            }
        };
        reader.onerror = function() {
            showNotification('檔案讀取失敗', 'error');
        };
        reader.readAsText(file);
        // 重置 fileInput 以允許重新載入相同檔案
        fileInput.value = '';
    });

    // 重置按鈕
    resetButton.addEventListener('click', function() {
        stopAllModes();
        rlAgent.clearQTable();
        resetGame();
        bestSteps = Infinity;
        render();
        updateStats();
        actionElement.textContent = '行動: 無';
        showNotification('已重置所有資料', 'info');
    });

    // 速度滑桿
    speedSlider.addEventListener('input', function() {
        trainingSpeed = parseInt(this.value, 10);
        speedValue.textContent = trainingSpeed + 'x';
    });

    // 手動遊玩模式（點擊 canvas 開始）
    canvas.addEventListener('click', function() {
        if (training || testing) return;
        if (!manualMode) {
            stopAllModes();
            manualMode = true;
            resetGame();
            updateModeIndicator();
            updateButtonStates();
            showNotification('手動模式：使用方向鍵或 WASD 移動', 'info');
            manualRender();
        } else {
            manualMode = false;
            updateModeIndicator();
            updateButtonStates();
        }
    });

    // ===== 初始化 =====
    initTargets();
    render();
    updateStats();
    updateModeIndicator();
    updateButtonStates();
});