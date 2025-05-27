/**
 * AEGot Minecraft服务器状态API
 * 用于获取服务器状态、在线玩家和排行榜数据
 */

// 配置
const SERVER_API = {
    // 服务器API地址 (示例URL，实际使用时需替换为真实API地址)
    STATUS_API: 'https://api.example.com/server/status',
    PLAYERS_API: 'https://api.example.com/server/players',
    LEADERBOARD_API: 'https://api.example.com/server/leaderboard',
    
    // 刷新间隔 (毫秒)
    REFRESH_INTERVAL: 60000, // 1分钟
    
    // 服务器信息
    SERVER_ADDRESS: 'mc.aegot.com',
    SERVER_PORT: 25565,
    SERVER_PASSWORD: '' // 服务器访问密码，如果需要认证则填写
};

// 缓存数据
let cachedServerStatus = null;
let cachedPlayersData = null;
let cachedLeaderboardData = null;
let lastRefreshTime = 0;

/**
 * 初始化服务器状态监控
 */
function initServerMonitor() {
    // 初始加载
    refreshServerStatus();
    
    // 设置定时刷新
    setInterval(refreshServerStatus, SERVER_API.REFRESH_INTERVAL);
    
    // 绑定刷新按钮事件
    document.getElementById('refresh-status').addEventListener('click', function() {
        this.disabled = true;
        const refreshIcon = this.querySelector('.refresh-icon');
        refreshIcon.textContent = '⏳';
        
        refreshServerStatus().finally(() => {
            setTimeout(() => {
                this.disabled = false;
                refreshIcon.textContent = '🔄';
            }, 2000);
        });
    });
    
    // 绑定排行榜标签切换事件
    const tabButtons = document.querySelectorAll('.tab-btn');
    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            // 移除所有活动标签
            tabButtons.forEach(btn => btn.classList.remove('active'));
            // 添加当前活动标签
            this.classList.add('active');
            
            // 加载对应排行榜数据
            const tabType = this.getAttribute('data-tab');
            loadLeaderboardData(tabType);
        });
    });
}

/**
 * 刷新服务器状态
 */
async function refreshServerStatus() {
    try {
        // 更新状态为加载中
        updateStatusIndicator('loading', '正在检查...');
        
        // 模拟API请求 (实际使用时替换为真实API调用)
        // 构建API请求URL，包含端口和认证信息
        // const apiUrl = new URL(SERVER_API.STATUS_API);
        // apiUrl.searchParams.append('port', SERVER_API.SERVER_PORT);
        // if (SERVER_API.SERVER_PASSWORD) {
        //     apiUrl.searchParams.append('auth', SERVER_API.SERVER_PASSWORD);
        // }
        // const response = await fetch(apiUrl.toString());
        // const data = await response.json();
        
        // 模拟数据 (开发测试用)
        const data = await simulateApiResponse('status');
        
        // 缓存数据
        cachedServerStatus = data;
        lastRefreshTime = Date.now();
        
        // 更新UI
        updateServerStatusUI(data);
        
        // 加载玩家数据
        loadPlayersData();
        
        // 加载排行榜数据 (默认为游戏时长)
        loadLeaderboardData('playtime');
        
        return data;
    } catch (error) {
        console.error('获取服务器状态失败:', error);
        updateStatusIndicator('offline', '无法连接到服务器');
        
        // 显示错误信息
        document.getElementById('online-players').textContent = '-';
        document.getElementById('max-players').textContent = '-';
        document.getElementById('server-version').textContent = '-';
        document.getElementById('uptime').textContent = '-';
        
        document.getElementById('players-container').innerHTML = 
            '<div class="no-data">无法获取玩家数据</div>';
        
        document.getElementById('leaderboard-body').innerHTML = 
            '<tr><td colspan="4" class="no-data">无法获取排行榜数据</td></tr>';
        
        return null;
    }
}

/**
 * 更新状态指示器
 * @param {string} status - 状态类型: 'online', 'offline', 'loading'
 * @param {string} text - 状态文本
 */
function updateStatusIndicator(status, text) {
    const statusDot = document.getElementById('status-dot');
    const statusText = document.getElementById('status-text');
    
    // 移除所有状态类
    statusDot.classList.remove('status-online', 'status-offline', 'status-loading');
    
    // 添加当前状态类
    statusDot.classList.add(`status-${status}`);
    statusText.textContent = text;
}

/**
 * 更新服务器状态UI
 * @param {Object} data - 服务器状态数据
 */
function updateServerStatusUI(data) {
    if (!data) return;
    
    // 更新状态指示器
    updateStatusIndicator(
        data.online ? 'online' : 'offline', 
        data.online ? '服务器在线' : '服务器离线'
    );
    
    // 更新服务器信息
    document.getElementById('online-players').textContent = 
        data.online ? `${data.players.online}` : '0';
    
    document.getElementById('max-players').textContent = 
        data.online ? `${data.players.max}` : '-';
    
    document.getElementById('server-version').textContent = 
        data.online ? data.version.name : '-';
    
    document.getElementById('uptime').textContent = 
        data.online ? formatUptime(data.uptime) : '-';
}

/**
 * 加载玩家数据
 */
async function loadPlayersData() {
    try {
        // 如果服务器离线，不加载玩家数据
        if (!cachedServerStatus || !cachedServerStatus.online) {
            document.getElementById('players-container').innerHTML = 
                '<div class="no-data">服务器当前离线</div>';
            return;
        }
        
        // 模拟API请求
        // 构建API请求URL，包含端口和认证信息
        // const apiUrl = new URL(SERVER_API.PLAYERS_API);
        // apiUrl.searchParams.append('port', SERVER_API.SERVER_PORT);
        // if (SERVER_API.SERVER_PASSWORD) {
        //     apiUrl.searchParams.append('auth', SERVER_API.SERVER_PASSWORD);
        // }
        // const response = await fetch(apiUrl.toString());
        // const data = await response.json();
        
        // 模拟数据
        const data = await simulateApiResponse('players');
        cachedPlayersData = data;
        
        // 更新UI
        updatePlayersUI(data);
    } catch (error) {
        console.error('获取玩家数据失败:', error);
        document.getElementById('players-container').innerHTML = 
            '<div class="no-data">无法获取玩家数据</div>';
    }
}

/**
 * 更新玩家列表UI
 * @param {Array} players - 玩家数据数组
 */
function updatePlayersUI(players) {
    const container = document.getElementById('players-container');
    
    // 如果没有玩家在线
    if (!players || players.length === 0) {
        container.innerHTML = '<div class="no-data">当前没有玩家在线</div>';
        return;
    }
    
    // 生成玩家列表HTML
    let html = '';
    players.forEach(player => {
        html += `
            <div class="player-item">
                <div class="player-avatar">
                    <img src="https://crafatar.com/avatars/${player.uuid}?size=40&overlay" alt="${player.name}">
                </div>
                <div class="player-info">
                    <div class="player-name">${player.name}</div>
                    <div class="player-status">${player.status || '在线'}</div>
                </div>
                <div class="player-time">${formatPlayTime(player.playTime)}</div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

/**
 * 加载排行榜数据
 * @param {string} type - 排行榜类型: 'playtime', 'kills', 'deaths', 'blocks'
 */
async function loadLeaderboardData(type = 'playtime') {
    try {
        // 模拟API请求
        // 构建API请求URL，包含端口和认证信息
        // const apiUrl = new URL(SERVER_API.LEADERBOARD_API);
        // apiUrl.searchParams.append('type', type);
        // apiUrl.searchParams.append('port', SERVER_API.SERVER_PORT);
        // if (SERVER_API.SERVER_PASSWORD) {
        //     apiUrl.searchParams.append('auth', SERVER_API.SERVER_PASSWORD);
        // }
        // const response = await fetch(apiUrl.toString());
        // const data = await response.json();
        
        // 模拟数据
        const data = await simulateApiResponse('leaderboard', type);
        cachedLeaderboardData = data;
        
        // 更新UI
        updateLeaderboardUI(data, type);
    } catch (error) {
        console.error('获取排行榜数据失败:', error);
        document.getElementById('leaderboard-body').innerHTML = 
            '<tr><td colspan="4" class="no-data">无法获取排行榜数据</td></tr>';
    }
}

/**
 * 更新排行榜UI
 * @param {Array} data - 排行榜数据
 * @param {string} type - 排行榜类型
 */
function updateLeaderboardUI(data, type) {
    const tableBody = document.getElementById('leaderboard-body');
    const tableHead = document.querySelector('.leaderboard-table thead tr');
    
    // 更新表头
    let thirdColumnName = '游戏时长';
    switch (type) {
        case 'kills': thirdColumnName = '击杀数'; break;
        case 'deaths': thirdColumnName = '死亡数'; break;
        case 'blocks': thirdColumnName = '放置方块'; break;
    }
    tableHead.children[2].textContent = thirdColumnName;
    
    // 如果没有数据
    if (!data || data.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="4" class="no-data">暂无排行榜数据</td></tr>';
        return;
    }
    
    // 生成排行榜HTML
    let html = '';
    data.forEach((player, index) => {
        const rankClass = index < 3 ? `rank-${index + 1}` : '';
        let valueDisplay = '';
        
        // 根据类型格式化显示值
        switch (type) {
            case 'playtime': 
                valueDisplay = formatPlayTime(player.value);
                break;
            case 'kills':
            case 'deaths':
            case 'blocks':
                valueDisplay = player.value.toLocaleString();
                break;
        }
        
        html += `
            <tr>
                <td class="rank ${rankClass}">#${index + 1}</td>
                <td>
                    <div class="player-row">
                        <img src="https://crafatar.com/avatars/${player.uuid}?size=30&overlay" alt="${player.name}">
                        ${player.name}
                    </div>
                </td>
                <td>${valueDisplay}</td>
                <td>${formatLastSeen(player.lastSeen)}</td>
            </tr>
        `;
    });
    
    tableBody.innerHTML = html;
}

/**
 * 格式化游戏时长
 * @param {number} minutes - 游戏时长（分钟）
 * @returns {string} 格式化后的时长
 */
function formatPlayTime(minutes) {
    if (!minutes && minutes !== 0) return '-';
    
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours > 0) {
        return `${hours}小时${mins > 0 ? ` ${mins}分钟` : ''}`;
    }
    return `${mins}分钟`;
}

/**
 * 格式化运行时间
 * @param {number} seconds - 运行时间（秒）
 * @returns {string} 格式化后的时间
 */
function formatUptime(seconds) {
    if (!seconds && seconds !== 0) return '-';
    
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) {
        return `${days}天${hours > 0 ? ` ${hours}小时` : ''}`;
    }
    if (hours > 0) {
        return `${hours}小时${minutes > 0 ? ` ${minutes}分钟` : ''}`;
    }
    return `${minutes}分钟`;
}

/**
 * 格式化最后在线时间
 * @param {number} timestamp - 时间戳
 * @returns {string} 格式化后的时间
 */
function formatLastSeen(timestamp) {
    if (!timestamp) return '未知';
    
    const now = Date.now();
    const diff = now - timestamp;
    
    // 如果是当前在线
    if (timestamp === 'online') return '当前在线';
    
    // 计算时间差
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (minutes < 60) {
        return `${minutes}分钟前`;
    } else if (hours < 24) {
        return `${hours}小时前`;
    } else if (days < 30) {
        return `${days}天前`;
    } else {
        const date = new Date(timestamp);
        return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
    }
}

/**
 * 模拟API响应（仅用于开发测试）
 * @param {string} type - 请求类型: 'status', 'players', 'leaderboard'
 * @param {string} leaderboardType - 排行榜类型
 * @returns {Promise<Object>} 模拟的响应数据
 */
async function simulateApiResponse(type, leaderboardType = 'playtime') {
    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // 注意：实际部署时，应该使用SERVER_API.SERVER_PORT和SERVER_API.SERVER_PASSWORD进行API认证
    // 例如：const apiUrl = `https://api.example.com/server/${type}?port=${SERVER_API.SERVER_PORT}&auth=${SERVER_API.SERVER_PASSWORD}`;
    // const response = await fetch(apiUrl);
    // return await response.json();
    
    switch (type) {
        case 'status':
            return {
                online: true,
                version: {
                    name: 'Paper 1.20.1',
                    protocol: 761
                },
                players: {
                    online: 8,
                    max: 50
                },
                description: 'AEGot Minecraft服务器',
                favicon: 'data:image/png;base64,...',
                uptime: 259200 // 3天
            };
            
        case 'players':
            return [
                {
                    uuid: 'c06f89e4-3121-4781-9b5c-5c4c1cdf0d05',
                    name: '末影猎手',
                    status: '在主世界探索',
                    playTime: 240 // 4小时
                },
                {
                    uuid: '7f11e31a-9e2e-4a55-8b95-e4656e74a37c',
                    name: '烈焰使者',
                    status: '在地狱冒险',
                    playTime: 180 // 3小时
                },
                {
                    uuid: '19efa3c7-4a5f-4bda-9d2e-c3b53319b5c4',
                    name: '龙之勇士',
                    status: '在末地战斗',
                    playTime: 120 // 2小时
                },
                {
                    uuid: 'a2e8e6c4-3f7b-4b1d-9c5a-6d8e7f9a2b1c',
                    name: '红石大师',
                    status: '在建造',
                    playTime: 90 // 1.5小时
                },
                {
                    uuid: 'f1e2d3c4-b5a6-7890-1234-567890abcdef',
                    name: '钻石守护者',
                    status: '在挖矿',
                    playTime: 60 // 1小时
                },
                {
                    uuid: '1a2b3c4d-5e6f-7890-abcd-ef1234567890',
                    name: '海洋之心',
                    status: '在钓鱼',
                    playTime: 30 // 30分钟
                },
                {
                    uuid: 'abcdef12-3456-7890-abcd-ef1234567890',
                    name: '丰收使者',
                    status: '在农场',
                    playTime: 15 // 15分钟
                },
                {
                    uuid: '12345678-90ab-cdef-1234-567890abcdef',
                    name: '新手冒险家',
                    status: '刚刚加入',
                    playTime: 5 // 5分钟
                }
            ];
            
        case 'leaderboard':
            // 根据排行榜类型返回不同的数据
            const baseData = [
                {
                    uuid: 'c06f89e4-3121-4781-9b5c-5c4c1cdf0d05',
                    name: '玩家1',
                    lastSeen: 'online'
                },
                {
                    uuid: '7f11e31a-9e2e-4a55-8b95-e4656e74a37c',
                    name: '玩家2',
                    lastSeen: 'online'
                },
                {
                    uuid: '19efa3c7-4a5f-4bda-9d2e-c3b53319b5c4',
                    name: '玩家3',
                    lastSeen: 'online'
                },
                {
                    uuid: 'a2e8e6c4-3f7b-4b1d-9c5a-6d8e7f9a2b1c',
                    name: '玩家4',
                    lastSeen: 'online'
                },
                {
                    uuid: 'f1e2d3c4-b5a6-7890-1234-567890abcdef',
                    name: '玩家5',
                    lastSeen: 'online'
                },
                {
                    uuid: '1a2b3c4d-5e6f-7890-abcd-ef1234567890',
                    name: '玩家6',
                    lastSeen: Date.now() - 3600000 // 1小时前
                },
                {
                    uuid: 'abcdef12-3456-7890-abcd-ef1234567890',
                    name: '玩家7',
                    lastSeen: Date.now() - 86400000 // 1天前
                },
                {
                    uuid: '12345678-90ab-cdef-1234-567890abcdef',
                    name: '玩家8',
                    lastSeen: Date.now() - 259200000 // 3天前
                },
                {
                    uuid: '87654321-fedc-ba98-7654-321fedcba987',
                    name: '玩家9',
                    lastSeen: Date.now() - 604800000 // 7天前
                },
                {
                    uuid: 'fedcba98-7654-3210-fedc-ba9876543210',
                    name: '玩家10',
                    lastSeen: Date.now() - 2592000000 // 30天前
                }
            ];
            
            // 根据不同类型设置不同的值
            switch (leaderboardType) {
                case 'playtime':
                    return baseData.map((player, index) => ({
                        ...player,
                        value: 10000 - index * 1000 // 游戏时长（分钟）
                    }));
                    
                case 'kills':
                    return baseData.map((player, index) => ({
                        ...player,
                        value: 5000 - index * 500 // 击杀数
                    }));
                    
                case 'deaths':
                    return baseData.map((player, index) => ({
                        ...player,
                        value: 1000 - index * 100 // 死亡数
                    }));
                    
                case 'blocks':
                    return baseData.map((player, index) => ({
                        ...player,
                        value: 100000 - index * 10000 // 放置方块数
                    }));
            }
            
        default:
            return null;
    }
}

// 当页面加载完成时初始化
document.addEventListener('DOMContentLoaded', initServerMonitor);