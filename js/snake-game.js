/**
 * 我的世界贪吃蛇游戏
 * 为AEGot我的世界服务器网站开发的小游戏
 */

document.addEventListener('DOMContentLoaded', function() {
    // 获取游戏元素
    const canvas = document.getElementById('game-board');
    const ctx = canvas.getContext('2d');
    const startBtn = document.getElementById('start-btn');
    const pauseBtn = document.getElementById('pause-btn');
    const restartBtn = document.getElementById('restart-btn');
    const scoreElement = document.getElementById('score');
    const highScoreElement = document.getElementById('high-score');
    const levelElement = document.getElementById('level');
    const finalScoreElement = document.getElementById('final-score');
    const gameOverOverlay = document.getElementById('game-over');
    
    // 游戏配置
    const blockSize = 20; // 方块大小
    const gridSize = canvas.width / blockSize; // 网格大小
    const gameSpeed = {
        initial: 150, // 初始速度（毫秒）
        current: 150, // 当前速度
        speedIncrease: 5 // 每级增加的速度
    };
    
    // 游戏状态
    let snake = [];
    let food = {};
    let direction = 'right';
    let nextDirection = 'right';
    let score = 0;
    let highScore = localStorage.getItem('snakeHighScore') || 0;
    let level = 1;
    let gameInterval;
    let isPaused = false;
    let isGameOver = false;
    let isGameStarted = false;
    
    // Minecraft方块类型（用于食物）
    const blockTypes = [
        { name: 'diamond', color: '#41f9f3' },
        { name: 'emerald', color: '#50c878' },
        { name: 'gold', color: '#ffdf00' },
        { name: 'redstone', color: '#ff0000' },
        { name: 'lapis', color: '#345ec3' },
        { name: 'coal', color: '#36454f' },
        { name: 'iron', color: '#d3d3d3' },
        { name: 'netherite', color: '#654740' }
    ];
    
    // 初始化游戏
    function initGame() {
        // 重置游戏状态
        snake = [
            {x: 6, y: 10},
            {x: 5, y: 10},
            {x: 4, y: 10}
        ];
        direction = 'right';
        nextDirection = 'right';
        score = 0;
        level = 1;
        gameSpeed.current = gameSpeed.initial;
        isGameOver = false;
        isPaused = false;
        
        // 更新UI
        scoreElement.textContent = score;
        highScoreElement.textContent = highScore;
        levelElement.textContent = level;
        gameOverOverlay.classList.remove('visible');
        
        // 生成第一个食物
        generateFood();
        
        // 绘制初始状态
        drawGame();
    }
    
    // 开始游戏
    function startGame() {
        if (isGameStarted) return;
        
        isGameStarted = true;
        startBtn.disabled = true;
        pauseBtn.disabled = false;
        
        // 设置游戏循环
        gameInterval = setInterval(gameLoop, gameSpeed.current);
    }
    
    // 暂停游戏
    function togglePause() {
        if (!isGameStarted) return;
        
        isPaused = !isPaused;
        pauseBtn.textContent = isPaused ? '继续' : '暂停';
    }
    
    // 游戏主循环
    function gameLoop() {
        if (isPaused || isGameOver) return;
        
        // 更新蛇的位置
        updateSnake();
        
        // 检查碰撞
        if (checkCollision()) {
            gameOver();
            return;
        }
        
        // 检查是否吃到食物
        if (snake[0].x === food.x && snake[0].y === food.y) {
            eatFood();
        } else {
            // 如果没有吃到食物，移除尾部
            snake.pop();
        }
        
        // 重新绘制游戏
        drawGame();
    }
    
    // 更新蛇的位置
    function updateSnake() {
        // 更新方向
        direction = nextDirection;
        
        // 获取蛇头位置
        const head = {x: snake[0].x, y: snake[0].y};
        
        // 根据方向移动蛇头
        switch(direction) {
            case 'up':
                head.y -= 1;
                break;
            case 'down':
                head.y += 1;
                break;
            case 'left':
                head.x -= 1;
                break;
            case 'right':
                head.x += 1;
                break;
        }
        
        // 处理穿墙
        if (head.x < 0) head.x = gridSize - 1;
        if (head.x >= gridSize) head.x = 0;
        if (head.y < 0) head.y = gridSize - 1;
        if (head.y >= gridSize) head.y = 0;
        
        // 将新头部添加到蛇身前面
        snake.unshift(head);
    }
    
    // 检查碰撞
    function checkCollision() {
        const head = snake[0];
        
        // 检查是否撞到自己
        for (let i = 1; i < snake.length; i++) {
            if (head.x === snake[i].x && head.y === snake[i].y) {
                return true;
            }
        }
        
        return false;
    }
    
    // 生成食物
    function generateFood() {
        // 随机选择一个方块类型
        food.type = blockTypes[Math.floor(Math.random() * blockTypes.length)];
        
        // 随机生成食物位置
        let newFoodPosition;
        do {
            newFoodPosition = {
                x: Math.floor(Math.random() * gridSize),
                y: Math.floor(Math.random() * gridSize)
            };
        } while (isPositionOccupied(newFoodPosition));
        
        food.x = newFoodPosition.x;
        food.y = newFoodPosition.y;
    }
    
    // 检查位置是否被蛇占用
    function isPositionOccupied(position) {
        return snake.some(segment => segment.x === position.x && segment.y === position.y);
    }
    
    // 吃到食物
    function eatFood() {
        // 增加分数
        score += food.type.name === 'diamond' ? 10 : 5;
        scoreElement.textContent = score;
        
        // 更新最高分
        if (score > highScore) {
            highScore = score;
            highScoreElement.textContent = highScore;
            localStorage.setItem('snakeHighScore', highScore);
        }
        
        // 每50分升一级
        if (score % 50 === 0) {
            levelUp();
        }
        
        // 生成新食物
        generateFood();
    }
    
    // 升级
    function levelUp() {
        level++;
        levelElement.textContent = level;
        
        // 增加游戏速度
        gameSpeed.current = Math.max(50, gameSpeed.initial - (level - 1) * gameSpeed.speedIncrease);
        clearInterval(gameInterval);
        gameInterval = setInterval(gameLoop, gameSpeed.current);
    }
    
    // 游戏结束
    function gameOver() {
        isGameOver = true;
        isGameStarted = false;
        clearInterval(gameInterval);
        
        // 显示游戏结束界面
        finalScoreElement.textContent = score;
        gameOverOverlay.classList.add('visible');
        
        // 重置按钮状态
        startBtn.disabled = false;
        pauseBtn.disabled = true;
        pauseBtn.textContent = '暂停';
        
        // 保存分数到排行榜
        saveScore();
    }
    
    // 保存分数到排行榜
    function saveScore() {
        // 获取现有排行榜数据
        let leaderboard = JSON.parse(localStorage.getItem('snakeLeaderboard') || '[]');
        
        // 添加新分数
        const playerName = localStorage.getItem('playerName') || '玩家' + Math.floor(Math.random() * 1000);
        leaderboard.push({
            name: playerName,
            score: score,
            level: level,
            date: new Date().toISOString()
        });
        
        // 按分数排序
        leaderboard.sort((a, b) => b.score - a.score);
        
        // 只保留前10名
        leaderboard = leaderboard.slice(0, 10);
        
        // 保存回本地存储
        localStorage.setItem('snakeLeaderboard', JSON.stringify(leaderboard));
        
        // 更新排行榜显示
        updateLeaderboard();
    }
    
    // 更新排行榜显示
    function updateLeaderboard() {
        const leaderboardBody = document.getElementById('leaderboard-body');
        const leaderboard = JSON.parse(localStorage.getItem('snakeLeaderboard') || '[]');
        
        // 清空现有内容
        leaderboardBody.innerHTML = '';
        
        // 添加排行榜数据
        leaderboard.forEach((entry, index) => {
            const row = document.createElement('tr');
            
            const rankCell = document.createElement('td');
            rankCell.textContent = index + 1;
            
            const nameCell = document.createElement('td');
            nameCell.textContent = entry.name;
            
            const scoreCell = document.createElement('td');
            scoreCell.textContent = entry.score;
            
            const levelCell = document.createElement('td');
            levelCell.textContent = entry.level;
            
            row.appendChild(rankCell);
            row.appendChild(nameCell);
            row.appendChild(scoreCell);
            row.appendChild(levelCell);
            
            leaderboardBody.appendChild(row);
        });
        
        // 如果没有数据，显示提示
        if (leaderboard.length === 0) {
            const row = document.createElement('tr');
            const cell = document.createElement('td');
            cell.textContent = '暂无数据';
            cell.colSpan = 4;
            cell.style.textAlign = 'center';
            row.appendChild(cell);
            leaderboardBody.appendChild(row);
        }
    }
    
    // 绘制游戏
    function drawGame() {
        // 清空画布
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // 绘制网格背景
        drawGrid();
        
        // 绘制食物
        drawFood();
        
        // 绘制蛇
        drawSnake();
    }
    
    // 绘制网格
    function drawGrid() {
        ctx.strokeStyle = 'rgba(77, 119, 255, 0.1)';
        ctx.lineWidth = 0.5;
        
        for (let i = 0; i < gridSize; i++) {
            // 绘制垂直线
            ctx.beginPath();
            ctx.moveTo(i * blockSize, 0);
            ctx.lineTo(i * blockSize, canvas.height);
            ctx.stroke();
            
            // 绘制水平线
            ctx.beginPath();
            ctx.moveTo(0, i * blockSize);
            ctx.lineTo(canvas.width, i * blockSize);
            ctx.stroke();
        }
    }
    
    // 绘制食物
    function drawFood() {
        ctx.fillStyle = food.type.color;
        ctx.fillRect(food.x * blockSize, food.y * blockSize, blockSize, blockSize);
        
        // 添加内部细节
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 2;
        ctx.strokeRect(food.x * blockSize + 4, food.y * blockSize + 4, blockSize - 8, blockSize - 8);
    }
    
    // 绘制蛇
    function drawSnake() {
        snake.forEach((segment, index) => {
            // 蛇头使用不同颜色
            if (index === 0) {
                ctx.fillStyle = '#4D77FF';
            } else {
                // 蛇身使用渐变色
                const gradientPosition = index / snake.length;
                ctx.fillStyle = `rgba(77, 119, 255, ${1 - gradientPosition * 0.6})`;
            }
            
            ctx.fillRect(segment.x * blockSize, segment.y * blockSize, blockSize, blockSize);
            
            // 添加内部细节
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.lineWidth = 1;
            ctx.strokeRect(segment.x * blockSize + 2, segment.y * blockSize + 2, blockSize - 4, blockSize - 4);
            
            // 为蛇头添加眼睛
            if (index === 0) {
                drawSnakeEyes(segment);
            }
        });
    }
    
    // 绘制蛇眼睛
    function drawSnakeEyes(head) {
        ctx.fillStyle = 'white';
        
        // 根据方向绘制眼睛
        switch(direction) {
            case 'up':
                ctx.fillRect(head.x * blockSize + 4, head.y * blockSize + 4, 4, 4);
                ctx.fillRect(head.x * blockSize + blockSize - 8, head.y * blockSize + 4, 4, 4);
                break;
            case 'down':
                ctx.fillRect(head.x * blockSize + 4, head.y * blockSize + blockSize - 8, 4, 4);
                ctx.fillRect(head.x * blockSize + blockSize - 8, head.y * blockSize + blockSize - 8, 4, 4);
                break;
            case 'left':
                ctx.fillRect(head.x * blockSize + 4, head.y * blockSize + 4, 4, 4);
                ctx.fillRect(head.x * blockSize + 4, head.y * blockSize + blockSize - 8, 4, 4);
                break;
            case 'right':
                ctx.fillRect(head.x * blockSize + blockSize - 8, head.y * blockSize + 4, 4, 4);
                ctx.fillRect(head.x * blockSize + blockSize - 8, head.y * blockSize + blockSize - 8, 4, 4);
                break;
        }
    }
    
    // 键盘控制
    function handleKeydown(e) {
        // 如果游戏结束或未开始，不处理按键
        if (isGameOver || !isGameStarted) return;
        
        // 根据按键设置方向
        switch(e.key) {
            case 'ArrowUp':
            case 'w':
            case 'W':
                if (direction !== 'down') nextDirection = 'up';
                break;
            case 'ArrowDown':
            case 's':
            case 'S':
                if (direction !== 'up') nextDirection = 'down';
                break;
            case 'ArrowLeft':
            case 'a':
            case 'A':
                if (direction !== 'right') nextDirection = 'left';
                break;
            case 'ArrowRight':
            case 'd':
            case 'D':
                if (direction !== 'left') nextDirection = 'right';
                break;
            case ' ':
                // 空格键暂停/继续
                togglePause();
                break;
        }
    }
    
    // 移动端触摸控制
    let touchStartX = 0;
    let touchStartY = 0;
    let touchThreshold = 30; // 触摸灵敏度阈值
    
    function handleTouchStart(e) {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
        
        // 防止页面滚动
        e.preventDefault();
    }
    
    function handleTouchMove(e) {
        if (!touchStartX || !touchStartY || isGameOver || !isGameStarted) return;
        
        const touchEndX = e.touches[0].clientX;
        const touchEndY = e.touches[0].clientY;
        
        const diffX = touchStartX - touchEndX;
        const diffY = touchStartY - touchEndY;
        
        // 只有当滑动距离超过阈值时才改变方向
        if (Math.abs(diffX) > touchThreshold || Math.abs(diffY) > touchThreshold) {
            // 判断滑动方向
            if (Math.abs(diffX) > Math.abs(diffY)) {
                // 水平滑动
                if (diffX > 0) {
                    // 向左滑
                    if (direction !== 'right') nextDirection = 'left';
                } else {
                    // 向右滑
                    if (direction !== 'left') nextDirection = 'right';
                }
            } else {
                // 垂直滑动
                if (diffY > 0) {
                    // 向上滑
                    if (direction !== 'down') nextDirection = 'up';
                } else {
                    // 向下滑
                    if (direction !== 'up') nextDirection = 'down';
                }
            }
            
            // 重置触摸起点，防止连续触发
            touchStartX = 0;
            touchStartY = 0;
        }
        
        // 防止页面滚动
        e.preventDefault();
    }
    
    function handleTouchEnd(e) {
        // 重置触摸起点
        touchStartX = 0;
        touchStartY = 0;
    }
    
    // 虚拟方向按钮控制
    function setupDirectionButtons() {
        const btnUp = document.getElementById('btn-up');
        const btnDown = document.getElementById('btn-down');
        const btnLeft = document.getElementById('btn-left');
        const btnRight = document.getElementById('btn-right');
        
        if (btnUp && btnDown && btnLeft && btnRight) {
            btnUp.addEventListener('click', function() {
                if (isGameStarted && !isGameOver && direction !== 'down') {
                    nextDirection = 'up';
                }
            });
            
            btnDown.addEventListener('click', function() {
                if (isGameStarted && !isGameOver && direction !== 'up') {
                    nextDirection = 'down';
                }
            });
            
            btnLeft.addEventListener('click', function() {
                if (isGameStarted && !isGameOver && direction !== 'right') {
                    nextDirection = 'left';
                }
            });
            
            btnRight.addEventListener('click', function() {
                if (isGameStarted && !isGameOver && direction !== 'left') {
                    nextDirection = 'right';
                }
            });
        }
    }
    
    // 事件监听
    startBtn.addEventListener('click', startGame);
    pauseBtn.addEventListener('click', togglePause);
    restartBtn.addEventListener('click', function() {
        initGame();
        startGame();
    });
    document.addEventListener('keydown', handleKeydown);
    canvas.addEventListener('touchstart', handleTouchStart, {passive: false});
    canvas.addEventListener('touchmove', handleTouchMove, {passive: false});
    canvas.addEventListener('touchend', handleTouchEnd, {passive: false});
    
    // 设置虚拟方向按钮
    setupDirectionButtons();
    
    // 响应式调整画布大小
    function resizeGameCanvas() {
        const gameContainer = document.querySelector('.game-container');
        const containerWidth = gameContainer.clientWidth;
        
        // 在小屏幕设备上调整画布大小
        if (window.innerWidth <= 768) {
            const newSize = Math.min(containerWidth - 20, 400); // 减去一些边距
            canvas.width = newSize;
            canvas.height = newSize;
            // 重新计算方块大小和网格大小
            const newBlockSize = newSize / 20; // 保持20x20的网格
            blockSize = newBlockSize;
            gridSize = newSize / blockSize;
        } else {
            // 恢复默认大小
            canvas.width = 400;
            canvas.height = 400;
            blockSize = 20;
            gridSize = canvas.width / blockSize;
        }
        
        // 重新绘制游戏
        if (isGameStarted && !isGameOver) {
            drawGame();
        } else {
            initGame();
        }
    }
    
    // 监听窗口大小变化
    window.addEventListener('resize', resizeGameCanvas);
    
    // 初始化游戏
    initGame();
    updateLeaderboard();
    
    // 设置玩家名称（如果没有）
    if (!localStorage.getItem('playerName')) {
        const randomName = '玩家' + Math.floor(Math.random() * 1000);
        localStorage.setItem('playerName', randomName);
    }
    
    // 初始调整画布大小
    resizeGameCanvas();
});