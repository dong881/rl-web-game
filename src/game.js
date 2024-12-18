document.addEventListener('DOMContentLoaded', function() {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    const scoreElement = document.getElementById('score');
    const startButton = document.getElementById('start-button');
    let score = 0;
    let gameOver = false;
    let gameStarted = false;

    const player = {
        x: canvas.width / 2,
        y: canvas.height - 30,
        width: 10,
        height: 10,
        speed: 5
    };

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
            alert('你贏了！你的分數是: ' + score);
            startButton.style.display = 'block';
            gameStarted = false;
        }
    }

    function draw() {
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
        if (direction === 'left' && player.x > 0) {
            player.x -= player.speed;
        } else if (direction === 'right' && player.x < canvas.width - player.width) {
            player.x += player.speed;
        } else if (direction === 'up' && player.y > 0) {
            player.y -= player.speed;
        } else if (direction === 'down' && player.y < canvas.height - player.height) {
            player.y += player.speed;
        }
    }

    document.addEventListener('keydown', (event) => {
        if (gameStarted) {
            switch (event.key) {
                case 'ArrowLeft':
                    movePlayer('left');
                    break;
                case 'ArrowRight':
                    movePlayer('right');
                    break;
                case 'ArrowUp':
                    movePlayer('up');
                    break;
                case 'ArrowDown':
                    movePlayer('down');
                    break;
            }
        }
    });

    startButton.addEventListener('click', () => {
        if (!gameStarted) {
            gameStarted = true;
            gameOver = false;
            score = 0;
            scoreElement.textContent = '分數: ' + score;
            player.x = canvas.width / 2;
            player.y = canvas.height - 30;
            targets.length = 0;
            initTargets();
            startButton.style.display = 'none';
            draw();
        }
    });
});