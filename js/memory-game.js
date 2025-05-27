/**
 * AEGot 我的世界服务器 - 记忆配对游戏
 * 实现记忆配对游戏的核心逻辑
 */

// 游戏数据
const gameItems = [
    { id: 1, name: 'grass_block', image: './images/p1.png' },
    { id: 2, name: 'diamond', image: './images/p2.png' },
    { id: 3, name: 'crafting_table', image: './images/p3.png' },
    { id: 4, name: 'tnt', image: './images/p4.png' },
    { id: 5, name: 'creeper', image: './images/p5.png' },
    { id: 6, name: 'chest', image: './images/p6.png' },
    { id: 7, name: 'ender_pearl', image: './images/p1.png' },
    { id: 8, name: 'enchanting_table', image: './images/p2.png' }
];

// 游戏状态
let cards = [];
let flippedCards = [];
let matchedPairs = 0;
let moves = 0;
let timer = 0;
let timerInterval = null;
let isGameActive = false;

// DOM元素
let gameBoard;
let movesElement;
let matchesElement;
let timerElement;
let restartButton;
let leaderboardBody;

// 初始化函数
function initMemoryGame() {
    // 获取DOM元素
    gameBoard = document.getElementById('game-board');
    movesElement = document.getElementById('moves');
    matchesElement = document.getElementById('matches');
    timerElement = document.getElementById('timer');
    restartButton = document.getElementById('restart-btn');
    leaderboardBody = document.getElementById('leaderboard-body');
    
    // 绑定重新开始按钮事件
    restartButton.addEventListener('click', initGame);
    
    // 加载排行榜
    loadLeaderboard();
    
    // 初始化游戏
    initGame();
}

// 初始化游戏
function initGame() {
    // 重置游戏状态
    cards = [];
    flippedCards = [];
    matchedPairs = 0;
    moves = 0;
    timer = 0;
    isGameActive = true;
    
    // 更新UI
    movesElement.textContent = moves;
    matchesElement.textContent = `0/8`;
    timerElement.textContent = '00:00';
    
    // 清除计时器
    if (timerInterval) {
        clearInterval(timerInterval);
    }
    
    // 开始计时
    timerInterval = setInterval(() => {
        timer++;
        const minutes = Math.floor(timer / 60);
        const seconds = timer % 60;
        timerElement.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }, 1000);
    
    // 准备卡片
    const cardPairs = [...gameItems, ...gameItems];
    cards = shuffleArray(cardPairs);
    
    // 渲染游戏板
    renderGameBoard();
}

// 渲染游戏板
function renderGameBoard() {
    gameBoard.innerHTML = '';
    
    cards.forEach((card, index) => {
        const cardElement = document.createElement('div');
        cardElement.classList.add('card');
        cardElement.dataset.index = index;
        
        const cardFront = document.createElement('div');
        cardFront.classList.add('card-front');
        
        const cardBack = document.createElement('div');
        cardBack.classList.add('card-back');
        
        const cardImage = document.createElement('img');
        cardImage.src = card.image;
        cardImage.alt = card.name;
        
        cardBack.appendChild(cardImage);
        cardElement.appendChild(cardFront);
        cardElement.appendChild(cardBack);
        
        cardElement.addEventListener('click', () => flipCard(index));
        
        gameBoard.appendChild(cardElement);
    });
}

// 翻转卡片
function flipCard(index) {
    // 如果游戏未激活、已经匹配的卡片或已经翻转的卡片，则不执行操作
    if (!isGameActive || flippedCards.includes(index) || cards[index].matched) {
        return;
    }
    
    // 如果已经翻转了两张卡片，则不执行操作
    if (flippedCards.length === 2) {
        return;
    }
    
    // 翻转卡片
    const cardElement = document.querySelector(`.card[data-index="${index}"]`);
    cardElement.classList.add('flipped');
    flippedCards.push(index);
    
    // 如果翻转了两张卡片，检查是否匹配
    if (flippedCards.length === 2) {
        moves++;
        movesElement.textContent = moves;
        
        const [firstIndex, secondIndex] = flippedCards;
        
        if (cards[firstIndex].id === cards[secondIndex].id) {
            // 匹配成功
            cards[firstIndex].matched = true;
            cards[secondIndex].matched = true;
            flippedCards = [];
            matchedPairs++;
            matchesElement.textContent = `${matchedPairs}/8`;
            
            // 检查游戏是否结束
            if (matchedPairs === 8) {
                endGame();
            }
        } else {
            // 匹配失败，延迟翻转回去
            setTimeout(() => {
                document.querySelector(`.card[data-index="${firstIndex}"]`).classList.remove('flipped');
                document.querySelector(`.card[data-index="${secondIndex}"]`).classList.remove('flipped');
                flippedCards = [];
            }, 1000);
        }
    }
}

// 结束游戏
function endGame() {
    isGameActive = false;
    clearInterval(timerInterval);
    
    // 显示游戏结束信息
    setTimeout(() => {
        const playerName = prompt('恭喜你完成了游戏！请输入你的名字保存成绩：', '玩家' + Math.floor(Math.random() * 1000));
        
        if (playerName) {
            // 保存成绩
            saveScore(playerName, timer, moves);
            
            // 重新加载排行榜
            loadLeaderboard();
        }
    }, 500);
}

// 保存分数
function saveScore(playerName, time, moves) {
    // 获取现有排行榜
    let leaderboard = JSON.parse(localStorage.getItem('memoryGameLeaderboard')) || [];
    
    // 添加新分数
    leaderboard.push({
        name: playerName,
        time: time,
        moves: moves,
        date: new Date().toISOString()
    });
    
    // 按时间和移动次数排序
    leaderboard.sort((a, b) => {
        // 首先按完成时间排序
        if (a.time !== b.time) {
            return a.time - b.time;
        }
        // 如果时间相同，按移动次数排序
        return a.moves - b.moves;
    });
    
    // 只保留前10名
    leaderboard = leaderboard.slice(0, 10);
    
    // 保存到本地存储
    localStorage.setItem('memoryGameLeaderboard', JSON.stringify(leaderboard));
}

// 加载排行榜
function loadLeaderboard() {
    const leaderboard = JSON.parse(localStorage.getItem('memoryGameLeaderboard')) || [];
    
    // 清空排行榜
    leaderboardBody.innerHTML = '';
    
    // 如果没有数据，显示提示信息
    if (leaderboard.length === 0) {
        const row = document.createElement('tr');
        const cell = document.createElement('td');
        cell.colSpan = 4;
        cell.textContent = '暂无数据，快来挑战吧！';
        cell.style.textAlign = 'center';
        row.appendChild(cell);
        leaderboardBody.appendChild(row);
        return;
    }
    
    // 添加排行榜数据
    leaderboard.forEach((score, index) => {
        const row = document.createElement('tr');
        
        // 排名
        const rankCell = document.createElement('td');
        rankCell.textContent = index + 1;
        row.appendChild(rankCell);
        
        // 玩家名
        const nameCell = document.createElement('td');
        nameCell.textContent = score.name;
        row.appendChild(nameCell);
        
        // 时间
        const timeCell = document.createElement('td');
        const minutes = Math.floor(score.time / 60);
        const seconds = score.time % 60;
        timeCell.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        row.appendChild(timeCell);
        
        // 移动次数
        const movesCell = document.createElement('td');
        movesCell.textContent = score.moves;
        row.appendChild(movesCell);
        
        leaderboardBody.appendChild(row);
    });
}

// 洗牌算法
function shuffleArray(array) {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
}

// 页面加载完成后初始化游戏
document.addEventListener('DOMContentLoaded', initMemoryGame);

// 加载动画控制
document.addEventListener('DOMContentLoaded', function() {
    // 获取加载动画元素
    const loaderWrapper = document.querySelector('.loader-wrapper');
    
    // 页面加载完成后，添加隐藏类
    window.addEventListener('load', function() {
        setTimeout(function() {
            loaderWrapper.classList.add('loader-hidden');
        }, 800); // 延迟800毫秒后隐藏，让用户能看到动画
    });
});