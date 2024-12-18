document.addEventListener('DOMContentLoaded', function() {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    const scoreElement = document.getElementById('score');
    const actionElement = document.getElementById('action');
    const startTrainingButton = document.getElementById('start-training-button');
    let score = 0;
    let gameOver = false;
    let gameStarted = false;
    let training = false;

    const rlAgent = new RLAgent();

    const player = {
        x: canvas.width / 2,
        y: canvas.height - 30,
        width: 10,
        height: 10,
        speed: 5
    };

    const actions = ['left', 'right', 'up', 'down'];

    const targets = [];
    const targetCount = 5;

    function initTargets() {
        for (let i = 0; i < targetCount; i++) {
            targets.push({
                x: Math.random() * (canvas.width - 20),
                y: Math.random() * (canvas.height - 20),
                width: 20,
                height: 20
            });
        }
    }

    function drawPlayer() {
        ctx.fillStyle = 'blue';
        ctx.fillRect(player.x, player.y, player.width, player.height);
    }

    function drawTargets() {
        ctx.fillStyle = 'red';
        targets.forEach(target => {
            ctx.fillRect(target.x, target.y, target.width, target.height);
        });
    }

    function checkCollision() {
        targets.forEach((target, index) => {
            if (player.x < target.x + target.width &&
                player.x + player.width > target.x &&
                player.y < target.y + target.height &&
                player.y + player.height > target.y) {
                targets.splice(index, 1);
                score += 10;
                scoreElement.textContent = '分數: ' + score;
            }
        });
    }

    function updateGame() {
        if (targets.length === 0) {
            gameOver = true;
            gameStarted = false;
            if (training) {
                resetGame();
            }
        }
    }

    function draw() {
        if (!gameStarted) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawPlayer();
        drawTargets();
        checkCollision();
        updateGame();
        
        if (!gameOver) {
            requestAnimationFrame(draw);
        }
    }

    function movePlayer(direction) {
        let hitWall = false;
        if (direction === 'left') {
            if (player.x > 0) {
                player.x -= player.speed;
            } else {
                hitWall = true;
            }
        } else if (direction === 'right') {
            if (player.x < canvas.width - player.width) {
                player.x += player.speed;
            } else {
                hitWall = true;
            }
        } else if (direction === 'up') {
            if (player.y > 0) {
                player.y -= player.speed;
            } else {
                hitWall = true;
            }
        } else if (direction === 'down') {
            if (player.y < canvas.height - player.height) {
                player.y += player.speed;
            } else {
                hitWall = true;
            }
        }
        return hitWall;
    }

    let steps = 0; // 計步數
    let bestSteps = Infinity; // 最短步數

    function getState() {
        if (targets.length === 0) return 'terminal';
        const target = targets[0];

        // 將座標離散化，形成更詳細的狀態表示
        const playerGridX = Math.floor(player.x / 20);
        const playerGridY = Math.floor(player.y / 20);
        const targetGridX = Math.floor(target.x / 20);
        const targetGridY = Math.floor(target.y / 20);
        const state = `px:${playerGridX},py:${playerGridY},tx:${targetGridX},ty:${targetGridY}`;
        return state;
    }

    function getReward(hitWall) {
        if (gameOver) {
            return 100; // 獲勝獎勵
        }
        if (hitWall) {
            return -10; // 撞牆懲罰
        }
        return -1; // 每個步驟的時間懲罰
    }

    function resetGame() {
        gameOver = false;
        score = 0;
        steps = 0;
        scoreElement.textContent = '分數: ' + score;
        player.x = canvas.width / 2;
        player.y = canvas.height - 30;
        targets.length = 0;
        initTargets();
    }

    function trainingLoop() {
        if (!training) return;
    
        const state = getState();
        const actionIndex = rlAgent.getAction(state);
        const action = actions[actionIndex];
        actionElement.textContent = '行動: ' + action;
    
        const hitWall = movePlayer(action); // 接收撞牆標記
        checkCollision();
        steps++; // 增加步數
    
        const reward = getReward(hitWall); // 傳遞撞牆狀態
        const nextState = getState();
        rlAgent.updateQValue(state, actionIndex, reward, nextState);
    
        updateGame();
    
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawPlayer();
        drawTargets();
    
        if (!gameOver) {
            setTimeout(trainingLoop, 0); // 控制訓練速度
        } else {
            resetGame();
            setTimeout(trainingLoop, 0);
        }
    }

    // 添加保存模型按鈕
    const saveModelButton = document.createElement('button');
    saveModelButton.textContent = '保存模型';
    saveModelButton.id = 'save-model-button';
    document.getElementById('game-container').appendChild(saveModelButton);

    saveModelButton.addEventListener('click', () => {
        rlAgent.saveQTable();
    });

    // 添加載入模型按鈕
    const loadModelButton = document.createElement('button');
    loadModelButton.textContent = '載入模型';
    loadModelButton.id = 'load-model-button';
    document.getElementById('game-container').appendChild(loadModelButton);

    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.json';
    fileInput.style.display = 'none';
    document.body.appendChild(fileInput);

    loadModelButton.addEventListener('click', () => {
        fileInput.click();
    });

    fileInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            rlAgent.loadQTable(e.target.result);
            alert('模型已載入');
        };
        reader.readAsText(file);
    });

    // 添加測試模式按鈕
    const testButton = document.createElement('button');
    testButton.textContent = '開始測試';
    testButton.id = 'test-button';
    document.getElementById('game-container').appendChild(testButton);

    let testing = false;

    testButton.addEventListener('click', () => {
        if (!testing) {
            testing = true;
            gameStarted = true;
            resetGame();
            testLoop();
            testButton.textContent = '停止測試';
        } else {
            testing = false;
            gameStarted = false;
            testButton.textContent = '開始測試';
        }
    });

    function testLoop() {
        if (!testing) return;

        const state = getState();
        const actionIndex = rlAgent.getBestAction(state);
        const action = actions[actionIndex] || actions[Math.floor(Math.random() * 4)]; // 避免未知狀態報錯
        actionElement.textContent = '行動: ' + action;

        movePlayer(action);
        checkCollision();
        steps++; // 增加步數

        updateGame();

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawPlayer();
        drawTargets();

        if (!gameOver) {
            setTimeout(testLoop, 100); // 控制測試速度
        } else {
            if (steps < bestSteps) {
                bestSteps = steps;
                alert('新的最短步數紀錄：' + bestSteps);
            }
            resetGame();
            steps = 0;
            setTimeout(testLoop, 100);
        }
    }

    // 修改開始訓練按鈕事件
    startTrainingButton.addEventListener('click', () => {
        if (!training) {
            training = true;
            gameStarted = true;
            resetGame();
            trainingLoop();
            startTrainingButton.textContent = '停止訓練';
        } else {
            training = false;
            gameStarted = false;
            startTrainingButton.textContent = '開始訓練';
        }
    });
});