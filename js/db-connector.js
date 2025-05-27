/**
 * AEGot Minecraft服务器留言板数据库连接器
 * 用于处理与Supabase数据库的连接和初始化
 */

// 数据库连接器
const DBConnector = (function() {
    // Supabase配置
    const supabaseUrl = 'https://ubehqevpuchbuejdmskt.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InViZWhxZXZwdWNoYnVlamRtc2t0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQzNTAzNzEsImV4cCI6MjA1OTkyNjM3MX0.s_HuhqiRXJiUleJhaF7gvpJE4ZLK3FX5Vf0FF3tL-9Y';
    
    // 持久化存储键名
    const DB_CONNECTION_STATE_KEY = 'dbConnectionState';
    const DB_LAST_CONNECTED_KEY = 'dbLastConnected';
    const DB_ERROR_MESSAGE_KEY = 'dbErrorMessage';
    
    // 全局Supabase客户端
    let supabaseClient = null;
    
    // 连接状态
    let isConnected = false;
    
    // 连接错误信息
    let connectionError = null;
    
    /**
     * 初始化数据库连接
     * @returns {Promise<boolean>} 连接是否成功
     */
    async function initDatabase() {
        try {
            console.log('初始化数据库连接...');
            connectionError = null; // 重置错误信息
            
            // 检查是否有缓存的连接状态
            const cachedState = localStorage.getItem(DB_CONNECTION_STATE_KEY);
            const lastConnected = localStorage.getItem(DB_LAST_CONNECTED_KEY);
            
            // 如果最近30分钟内已成功连接过，直接使用缓存状态
            if (cachedState === 'true' && lastConnected) {
                const lastConnTime = new Date(lastConnected).getTime();
                const thirtyMinutesAgo = Date.now() - 30 * 60 * 1000;
                
                if (lastConnTime > thirtyMinutesAgo) {
                    console.log('使用缓存的数据库连接状态: 已连接');
                    isConnected = true;
                    return true;
                }
            }
            
            // 加载Supabase客户端
            const clientLoaded = await loadSupabaseClient();
            if (!clientLoaded) {
                connectionError = '无法加载Supabase客户端库';
                console.error(connectionError);
                localStorage.setItem(DB_ERROR_MESSAGE_KEY, connectionError);
                isConnected = false;
                localStorage.setItem(DB_CONNECTION_STATE_KEY, 'false');
                return false;
            }
            
            // 测试连接
            if (supabaseClient) {
                console.log('尝试连接到Supabase数据库...');
                try {
                    const { data, error } = await supabaseClient
                        .from('messages')
                        .select('count')
                        .limit(1);
                        
                    if (error) {
                        connectionError = `数据库连接测试失败: ${error.message}`;
                        console.error(connectionError);
                        localStorage.setItem(DB_ERROR_MESSAGE_KEY, connectionError);
                        isConnected = false;
                        localStorage.setItem(DB_CONNECTION_STATE_KEY, 'false');
                        return false;
                    }
                    
                    console.log('数据库连接成功');
                    isConnected = true;
                    
                    // 保存连接状态和时间戳到localStorage
                    localStorage.setItem(DB_CONNECTION_STATE_KEY, 'true');
                    localStorage.setItem(DB_LAST_CONNECTED_KEY, new Date().toISOString());
                    localStorage.removeItem(DB_ERROR_MESSAGE_KEY); // 清除之前的错误信息
                    return true;
                } catch (testError) {
                    connectionError = `数据库连接测试异常: ${testError.message || '未知错误'}`;
                    console.error(connectionError);
                    localStorage.setItem(DB_ERROR_MESSAGE_KEY, connectionError);
                    isConnected = false;
                    localStorage.setItem(DB_CONNECTION_STATE_KEY, 'false');
                    return false;
                }
            } else {
                connectionError = 'Supabase客户端初始化失败';
                console.error(connectionError);
                localStorage.setItem(DB_ERROR_MESSAGE_KEY, connectionError);
                isConnected = false;
                localStorage.setItem(DB_CONNECTION_STATE_KEY, 'false');
                return false;
            }
        } catch (error) {
            connectionError = `初始化数据库失败: ${error.message || '未知错误'}`;
            console.error(connectionError, error);
            localStorage.setItem(DB_ERROR_MESSAGE_KEY, connectionError);
            isConnected = false;
            localStorage.setItem(DB_CONNECTION_STATE_KEY, 'false');
            return false;
        }
    }
    
    /**
     * 加载Supabase客户端
     * @returns {Promise<void>}
     */
    async function loadSupabaseClient() {
        return new Promise((resolve, reject) => {
            try {
                // 检查是否已经加载
                if (window.supabase) {
                    console.log('Supabase客户端已加载，使用现有实例');
                    supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);
                    // 将客户端保存到全局变量
                    window.supabaseClient = supabaseClient;
                    resolve(true);
                    return;
                }
                
                console.log('尝试从CDN加载Supabase客户端...');
                
                // 设置加载超时
                const timeoutId = setTimeout(() => {
                    console.error('加载Supabase客户端超时');
                    reject(new Error('加载Supabase客户端超时'));
                }, 10000); // 10秒超时
                
                // 创建script标签加载Supabase客户端
                const script = document.createElement('script');
                // 尝试使用备用CDN
                script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
                script.onload = () => {
                    clearTimeout(timeoutId);
                    console.log('Supabase客户端加载成功');
                    try {
                        // 创建Supabase客户端实例
                        if (typeof supabase === 'undefined') {
                            console.error('Supabase库加载成功但全局变量不可用');
                            reject(new Error('Supabase库加载成功但全局变量不可用'));
                            return;
                        }
                        
                        supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);
                        // 将客户端保存到全局变量
                        window.supabaseClient = supabaseClient;
                        resolve(true);
                    } catch (initError) {
                        console.error('初始化Supabase客户端失败:', initError);
                        reject(initError);
                    }
                };
                script.onerror = (error) => {
                    clearTimeout(timeoutId);
                    console.error('加载Supabase客户端失败，尝试备用CDN');
                    
                    // 尝试备用CDN
                    const backupScript = document.createElement('script');
                    backupScript.src = 'https://unpkg.com/@supabase/supabase-js@2';
                    
                    backupScript.onload = () => {
                        console.log('从备用CDN加载Supabase客户端成功');
                        try {
                            // 创建Supabase客户端实例
                            if (typeof supabase === 'undefined') {
                                console.error('备用CDN: Supabase库加载成功但全局变量不可用');
                                reject(new Error('备用CDN: Supabase库加载成功但全局变量不可用'));
                                return;
                            }
                            
                            supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);
                            // 将客户端保存到全局变量
                            window.supabaseClient = supabaseClient;
                            resolve(true);
                        } catch (backupInitError) {
                            console.error('初始化备用Supabase客户端失败:', backupInitError);
                            reject(backupInitError);
                        }
                    };
                    
                    backupScript.onerror = (backupError) => {
                        console.error('备用CDN加载失败:', backupError);
                        reject(new Error('所有Supabase CDN加载尝试均失败'));
                    };
                    
                    document.head.appendChild(backupScript);
                };
                document.head.appendChild(script);
            } catch (error) {
                console.error('加载Supabase客户端脚本失败:', error);
                reject(error);
            }
        }).catch(error => {
            console.error('Supabase客户端加载过程中发生错误:', error);
            return false;
        });
    }
    
    /**
     * 获取Supabase客户端实例
     * @returns {Object|null} Supabase客户端实例
     */
    function getSupabaseClient() {
        return supabaseClient;
    }
    
    /**
     * 检查数据库连接状态
     * @returns {boolean} 是否已连接
     */
    function isConnectedToDatabase() {
        return isConnected;
    }
    
    /**
     * 执行数据库查询
     * @param {string} table - 表名
     * @param {string} query - 查询类型 (select, insert, update, delete)
     * @param {Object} params - 查询参数
     * @returns {Promise<Object>} 查询结果
     */
    async function executeQuery(table, query, params = {}) {
        if (!supabaseClient) {
            return { error: { message: '数据库未连接' } };
        }
        
        try {
            let result;
            
            switch (query) {
                case 'select':
                    result = await supabaseClient
                        .from(table)
                        .select(params.columns || '*');
                    
                    // 添加过滤条件（如果有）
                    if (params.filters && params.filters.length > 0) {
                        params.filters.forEach(filter => {
                            result = result.eq(filter.column, filter.value);
                        });
                    }
                    
                    // 添加排序
                    result = result.order(params.orderBy || 'created_at', { ascending: params.ascending || false });
                    break;
                    
                case 'insert':
                    result = await supabaseClient
                        .from(table)
                        .insert(params.data)
                        .select();
                    break;
                    
                case 'update':
                    result = await supabaseClient
                        .from(table)
                        .update(params.data)
                        .eq('id', params.id)
                        .select();
                    break;
                    
                case 'delete':
                    result = await supabaseClient
                        .from(table)
                        .delete()
                        .eq('id', params.id);
                    break;
                    
                default:
                    return { error: { message: '不支持的查询类型' } };
            }
            
            return result;
        } catch (error) {
            console.error(`执行${query}查询失败:`, error);
            return { error };
        }
    }
    
    /**
     * 获取数据库连接错误信息
     * @returns {string|null} 错误信息
     */
    function getConnectionError() {
        return connectionError || localStorage.getItem(DB_ERROR_MESSAGE_KEY) || null;
    }
    
    /**
     * 重置数据库连接
     * @returns {Promise<boolean>} 重置是否成功
     */
    async function resetConnection() {
        console.log('重置数据库连接...');
        // 清除缓存状态
        localStorage.removeItem(DB_CONNECTION_STATE_KEY);
        localStorage.removeItem(DB_LAST_CONNECTED_KEY);
        localStorage.removeItem(DB_ERROR_MESSAGE_KEY);
        
        // 重置连接状态
        isConnected = false;
        connectionError = null;
        supabaseClient = null;
        
        // 重新初始化连接
        return await initDatabase();
    }
    
    // 返回公共API
    return {
        initDatabase,
        getSupabaseClient,
        isConnectedToDatabase,
        executeQuery,
        getConnectionError,
        resetConnection
    };
})();

// 自动初始化数据库连接
document.addEventListener('DOMContentLoaded', function() {
    // 检查是否已经有缓存的连接状态
    const cachedState = localStorage.getItem(DB_CONNECTION_STATE_KEY);
    
    if (cachedState === 'true') {
        console.log('使用缓存的数据库连接状态初始化');
        isConnected = true;
    }
    
    // 无论如何都尝试连接数据库，以确保数据是最新的
    DBConnector.initDatabase().then(connected => {
        console.log('数据库连接状态:', connected ? '已连接' : '未连接');
        if (!connected) {
            const errorMsg = DBConnector.getConnectionError();
            console.warn('数据库连接失败原因:', errorMsg || '未知错误');
            
            // 如果页面上有连接状态显示元素，可以更新它
            const dbStatusElement = document.getElementById('dbConnectionStatus');
            if (dbStatusElement) {
                dbStatusElement.textContent = '数据库连接失败: ' + (errorMsg || '未知错误');
                dbStatusElement.style.color = 'red';
            }
            
            // 尝试第二次连接
            setTimeout(() => {
                console.log('尝试第二次连接数据库...');
                DBConnector.initDatabase().then(retryConnected => {
                    console.log('第二次连接尝试结果:', retryConnected ? '成功' : '失败');
                    if (retryConnected && dbStatusElement) {
                        dbStatusElement.textContent = '数据库已连接';
                        dbStatusElement.style.color = 'green';
                    }
                });
            }, 3000); // 3秒后重试
        }
    }).catch(error => {
        console.error('数据库初始化过程中发生错误:', error);
    });
});