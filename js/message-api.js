// message-api.js - AEGot 我的世界服务器留言板API接口

// 使用Supabase作为后端数据库
const MessageAPI = (function() {
    // 表名配置
    const MESSAGES_TABLE = 'messages';
    const REPLIES_TABLE = 'replies';
    const LIKES_TABLE = 'likes';
    
    // 模拟数据模式（当数据库连接失败时使用）
    let useMockData = false;
    let mockMessages = [];
    
    // 初始化API
    async function initMessageAPI() {
        try {
            console.log('初始化留言API...');
            
            // 检查是否有DBConnector
            if (typeof DBConnector === 'undefined') {
                console.error('DBConnector未定义，将使用模拟数据');
                useMockData = true;
                localStorage.setItem('useMockData', 'true');
                localStorage.setItem('dbErrorReason', 'DBConnector未定义');
                initMockData();
                return false;
            }
            
            // 尝试获取数据库连接状态
            let isConnected = DBConnector.isConnectedToDatabase();
            
            // 如果未连接，尝试初始化连接
            if (!isConnected) {
                console.log('尝试连接到数据库...');
                const connected = await DBConnector.initDatabase();
                
                if (!connected) {
                    // 获取详细的错误信息
                    const errorMsg = DBConnector.getConnectionError ? DBConnector.getConnectionError() : '未知错误';
                    console.error('数据库连接失败，将使用模拟数据。错误原因:', errorMsg);
                    useMockData = true;
                    localStorage.setItem('useMockData', 'true');
                    localStorage.setItem('dbErrorReason', errorMsg || '数据库连接失败');
                    initMockData();
                    
                    // 显示连接错误信息到页面
                    const dbStatusElement = document.getElementById('dbConnectionStatus');
                    if (dbStatusElement) {
                        dbStatusElement.textContent = '数据库连接失败: ' + errorMsg;
                        dbStatusElement.style.color = 'red';
                        dbStatusElement.style.display = 'block';
                    }
                    
                    return false;
                }
                
                isConnected = true;
            }
            
            // 数据库连接成功
            console.log('数据库连接成功');
            useMockData = false;
            localStorage.setItem('useMockData', 'false');
            localStorage.removeItem('dbErrorReason');
            
            // 更新UI显示连接成功
            const dbStatusElement = document.getElementById('dbConnectionStatus');
            if (dbStatusElement) {
                dbStatusElement.textContent = '数据库已连接';
                dbStatusElement.style.color = 'green';
                dbStatusElement.style.display = 'block';
                
                // 3秒后隐藏状态信息
                setTimeout(() => {
                    dbStatusElement.style.display = 'none';
                }, 3000);
            }
            
            // 验证数据库表结构
            await validateDatabaseStructure();
            
            return true;
        } catch (error) {
            console.error('初始化留言API失败:', error);
            useMockData = true;
            localStorage.setItem('useMockData', 'true');
            localStorage.setItem('dbErrorReason', error.message || '初始化API时发生未知错误');
            initMockData();
            return false;
        }
    }
    
    // 初始化模拟数据
    function initMockData() {
        console.log('初始化模拟数据...');
        mockMessages = [
            {
                id: 1,
                name: '测试用户1',
                email: 'test1@example.com',
                avatar: 'p1',
                category: 'general',
                content: '这是一条测试留言，欢迎来到AEGot服务器！😊',
                created_at: new Date(Date.now() - 86400000).toISOString(),
                approved: true,
                likes: 5,
                replies: [
                    {
                        id: 101,
                        name: '管理员',
                        content: '谢谢支持！',
                        created_at: new Date(Date.now() - 43200000).toISOString()
                    }
                ]
            },
            {
                id: 2,
                name: '测试用户2',
                email: 'test2@example.com',
                avatar: 'p3',
                category: 'suggestion',
                content: '建议增加更多的生存玩法，比如空岛生存！🏝️',
                created_at: new Date(Date.now() - 172800000).toISOString(),
                approved: true,
                likes: 3,
                replies: []
            },
            {
                id: 3,
                name: '测试用户3',
                email: 'test3@example.com',
                avatar: 'p5',
                category: 'question',
                content: '请问服务器什么时候开放白名单申请？🤔',
                created_at: new Date(Date.now() - 259200000).toISOString(),
                approved: true,
                likes: 2,
                replies: [
                    {
                        id: 102,
                        name: '管理员',
                        content: '预计下周开放，请关注公告！',
                        created_at: new Date(Date.now() - 216000000).toISOString()
                    }
                ]
            }
        ];
    }
    
    // 验证并确保数据库表结构正确
    async function validateDatabaseStructure() {
        try {
            if (useMockData) return;
            
            const supabase = DBConnector.getSupabaseClient();
            if (!supabase) return;
            
            console.log('验证数据库表结构...');
            
            // 检查likes字段是否存在
            try {
                const { error } = await supabase.rpc('execute_sql', {
                    sql_query: `ALTER TABLE ${MESSAGES_TABLE} ADD COLUMN IF NOT EXISTS likes INTEGER DEFAULT 0`
                });
                
                if (error) {
                    console.warn('无法验证likes字段:', error.message);
                }
            } catch (e) {
                console.warn('验证likes字段时出错:', e);
            }
            
            console.log('数据库表结构验证完成');
        } catch (error) {
            console.error('验证数据库结构失败:', error);
        }
    }
    
    // 获取所有留言
    async function fetchMessages() {
        // 确保数据库连接状态一致
        const storedMockState = localStorage.getItem('useMockData');
        
        // 如果localStorage显示应该使用数据库，但当前状态是模拟数据，尝试重新连接
        if (storedMockState === 'false' && useMockData && typeof DBConnector !== 'undefined') {
            console.log('检测到数据库连接状态不一致，尝试重新连接...');
            await initMessageAPI();
        }
        
        if (useMockData) {
            console.log('使用模拟数据');
            return mockMessages;
        }
        
        console.log('从数据库获取留言数据...');
        try {
            // 使用DBConnector获取所有已批准的留言
            const { data: messages, error: messagesError } = await DBConnector.executeQuery(
                MESSAGES_TABLE,
                'select',
                {
                    columns: '*',
                    filters: [{ column: 'approved', value: true }],
                    orderBy: 'created_at',
                    ascending: false
                }
            );
                
            if (messagesError) {
                console.error('获取留言失败:', messagesError);
                return [];
            }
            
            // 获取所有回复
            const { data: replies, error: repliesError } = await DBConnector.executeQuery(
                REPLIES_TABLE,
                'select',
                {
                    columns: '*',
                    orderBy: 'created_at',
                    ascending: true
                }
            );
                
            if (repliesError) {
                console.error('获取回复失败:', repliesError);
                // 返回没有回复的留言
                return messages.map(msg => ({ ...msg, replies: [] }));
            }
            
            // 将回复关联到对应的留言
            const messagesWithReplies = messages.map(message => {
                const messageReplies = replies.filter(reply => reply.message_id === message.id);
                return { ...message, replies: messageReplies };
            });
            
            return messagesWithReplies;
        } catch (error) {
            console.error('获取留言数据失败:', error);
            return [];
        }
    }
    
    // 发布新留言
    async function postMessage(message) {
        // 再次检查连接状态，确保使用正确的数据源
        const storedMockState = localStorage.getItem('useMockData');
        if (storedMockState === 'false' && useMockData && typeof DBConnector !== 'undefined') {
            console.log('发布留言前检测到数据库连接状态不一致，尝试重新连接...');
            await initMessageAPI();
        }
        
        if (useMockData) {
            console.log('使用模拟数据模式发布留言');
            message.id = Date.now();
            message.created_at = new Date().toISOString();
            message.approved = true;
            message.likes = 0;
            message.replies = [];
            mockMessages.unshift(message);
            return { success: true, message: '留言发布成功' };
        }
        
        try {
            // 准备留言数据
            const messageData = {
                name: message.name,
                email: message.email || null,
                avatar: message.avatar || 'p1',
                category: message.category || 'general',
                content: message.content,
                created_at: new Date().toISOString(),
                approved: true // 默认自动批准
            };
            
            // 获取Supabase客户端
            const supabase = DBConnector.getSupabaseClient();
            if (!supabase) {
                return { success: false, message: '数据库未连接' };
            }
            
            // 使用Supabase官方插入语法
            const { data, error } = await supabase
                .from(MESSAGES_TABLE)
                .insert([messageData])
                .select();
                
            if (error) {
                console.error('发布留言失败:', error);
                
                // 检查是否是likes字段不存在的错误
                if (error.message && error.message.includes('column "likes" does not exist')) {
                    console.warn('likes字段不存在，尝试添加该字段并重新发布留言');
                    
                    try {
                        // 尝试执行SQL添加字段
                        const { error: alterError } = await supabase.rpc('execute_sql', {
                            sql_query: `ALTER TABLE ${MESSAGES_TABLE} ADD COLUMN IF NOT EXISTS likes INTEGER DEFAULT 0`
                        });
                        
                        if (alterError) {
                            console.error('添加likes字段失败:', alterError);
                            return { success: false, message: '发布留言失败: 无法添加必要的数据库字段' };
                        }
                        
                        console.log('成功添加likes字段，重新尝试发布留言');
                        
                        // 重新尝试插入留言
                        const { data: retryData, error: retryError } = await supabase
                            .from(MESSAGES_TABLE)
                            .insert([messageData])
                            .select();
                        
                        if (retryError) {
                            console.error('重新发布留言失败:', retryError);
                            return { success: false, message: '发布留言失败: ' + retryError.message };
                        }
                        
                        return { 
                            success: true, 
                            message: '留言发布成功（已修复数据库结构）',
                            data: retryData[0]
                        };
                    } catch (sqlError) {
                        console.error('执行SQL添加字段失败:', sqlError);
                        return { success: false, message: '发布留言失败: 数据库结构更新错误' };
                    }
                } else {
                    return { success: false, message: '发布留言失败: ' + error.message };
                }
            }
            
            return { 
                success: true, 
                message: '留言发布成功',
                data: data[0]
            };
        } catch (error) {
            console.error('发布留言操作失败:', error);
            return { success: false, message: '发布留言失败: ' + error.message };
        }
    }
    
    // 回复留言
    async function replyToMessage(messageId, reply) {
        // 再次检查连接状态，确保使用正确的数据源
        const storedMockState = localStorage.getItem('useMockData');
        if (storedMockState === 'false' && useMockData && typeof DBConnector !== 'undefined') {
            console.log('回复留言前检测到数据库连接状态不一致，尝试重新连接...');
            await initMessageAPI();
        }
        
        if (useMockData) {
            console.log('使用模拟数据模式回复留言');
            const messageIndex = mockMessages.findIndex(msg => msg.id === messageId);
            if (messageIndex === -1) {
                return { success: false, message: '留言不存在' };
            }
            
            if (!mockMessages[messageIndex].replies) {
                mockMessages[messageIndex].replies = [];
            }
            
            reply.id = Date.now();
            reply.created_at = new Date().toISOString();
            mockMessages[messageIndex].replies.push(reply);
            return { success: true, message: '回复发布成功' };
        }
        
        try {
            // 准备回复数据
            const replyData = {
                message_id: messageId,
                name: reply.name,
                content: reply.content,
                created_at: new Date().toISOString()
            };
            
            // 获取Supabase客户端
            const supabase = DBConnector.getSupabaseClient();
            if (!supabase) {
                return { success: false, message: '数据库未连接' };
            }
            
            // 使用Supabase官方插入语法
            const { data, error } = await supabase
                .from(REPLIES_TABLE)
                .insert([replyData])
                .select();
                
            if (error) {
                console.error('发布回复失败:', error);
                return { success: false, message: '发布回复失败: ' + error.message };
            }
            
            return { 
                success: true, 
                message: '回复发布成功',
                data: data[0]
            };
        } catch (error) {
            console.error('发布回复操作失败:', error);
            return { success: false, message: '发布回复失败: ' + error.message };
        }
    }
    
    // 点赞留言
    async function likeMessage(messageId) {
        // 再次检查连接状态，确保使用正确的数据源
        const storedMockState = localStorage.getItem('useMockData');
        if (storedMockState === 'false' && useMockData && typeof DBConnector !== 'undefined') {
            console.log('点赞留言前检测到数据库连接状态不一致，尝试重新连接...');
            await initMessageAPI();
        }
        
        if (useMockData) {
            console.log('使用模拟数据模式点赞留言');
            const messageIndex = mockMessages.findIndex(msg => msg.id === messageId);
            if (messageIndex === -1) {
                return { success: false, message: '留言不存在' };
            }
            
            if (!mockMessages[messageIndex].likes) {
                mockMessages[messageIndex].likes = 0;
            }
            
            mockMessages[messageIndex].likes++;
            return { success: true, message: '点赞成功' };
        }
        
        try {
            // 获取Supabase客户端
            const supabase = DBConnector.getSupabaseClient();
            if (!supabase) {
                return { success: false, message: '数据库未连接' };
            }
            
            // 生成客户端ID（在实际应用中应该使用用户ID或IP地址）
            const clientId = Math.random().toString(36).substring(2, 15);
            
            // 记录点赞 - 使用Supabase官方推荐的插入语法
            const likeData = {
                message_id: messageId,
                client_id: clientId,
                created_at: new Date().toISOString()
            };
            
            // 使用Supabase官方推荐的插入语法
            const { data, error: likeError } = await supabase
                .from(LIKES_TABLE)
                .insert([likeData])
                .select();
                
            if (likeError) {
                // 如果是唯一约束错误（用户已经点过赞），我们可以忽略这个错误
                if (likeError.code === '23505') { // PostgreSQL唯一约束违反错误码
                    console.log('用户已经点过赞');
                    // 即使用户已经点过赞，我们仍然继续执行，更新点赞计数
                } else if (likeError.message && likeError.message.includes('does not exist')) {
                    // 如果表不存在，尝试创建表
                    console.warn('likes表不存在，可能需要初始化数据库');
                    // 继续执行，尝试更新留言的点赞数
                } else {
                    console.error('记录点赞失败:', likeError);
                    return { success: false, message: '点赞失败: ' + likeError.message };
                }
            }
            
            // 获取当前留言的点赞数 - 使用Supabase官方推荐的查询语法
            const { data: messageData, error: getError } = await supabase
                .from(MESSAGES_TABLE)
                .select('id,likes')
                .eq('id', messageId)
                .single();
            
            if (getError) {
                // 如果是字段不存在的错误，我们尝试创建该字段
                if (getError.message && getError.message.includes('column "likes" does not exist')) {
                    console.warn('likes字段不存在，尝试使用ALTER TABLE添加该字段');
                    try {
                        // 尝试执行SQL添加字段
                        const { error: alterError } = await supabase.rpc('execute_sql', {
                            sql_query: `ALTER TABLE ${MESSAGES_TABLE} ADD COLUMN IF NOT EXISTS likes INTEGER DEFAULT 0`
                        });
                        
                        if (alterError) {
                            console.error('添加likes字段失败:', alterError);
                            // 即使添加字段失败，我们仍然尝试更新点赞数
                            console.warn('尝试直接更新点赞数...');
                        }
                        
                        // 直接使用默认值0作为当前点赞数 - 使用Supabase官方推荐的更新语法
                        const { data: updatedMessage, error: updateError } = await supabase
                            .from(MESSAGES_TABLE)
                            .update({ likes: 1 }) // 从0开始，点赞后为1
                            .eq('id', messageId)
                            .select();
                            
                        if (updateError) {
                            console.error('更新点赞计数失败:', updateError);
                            return { success: false, message: '点赞失败: ' + updateError.message };
                        }
                        
                        return { success: true, message: '点赞成功' };
                    } catch (sqlError) {
                        console.error('执行SQL添加字段失败:', sqlError);
                        return { success: false, message: '点赞失败: 数据库结构更新错误' };
                    }
                } else {
                    console.error('获取留言点赞数失败:', getError);
                    return { success: false, message: '点赞失败: 无法获取留言信息' };
                }
            }
            
            // 更新点赞计数 - 使用Supabase官方推荐的更新语法
            // 确保即使likes字段为null也能正确处理
            const currentLikes = messageData && typeof messageData.likes === 'number' ? messageData.likes : 0;
            const { data: updatedMessage, error: updateError } = await supabase
                .from(MESSAGES_TABLE)
                .update({ likes: currentLikes + 1 })
                .eq('id', messageId)
                .select();
                
            if (updateError) {
                // 检查是否是字段不存在的错误
                if (updateError.message && updateError.message.includes('column "likes" does not exist')) {
                    console.warn('更新时发现likes字段不存在，尝试使用ALTER TABLE添加该字段');
                    try {
                        // 尝试执行SQL添加字段
                        const { error: alterError } = await supabase.rpc('execute_sql', {
                            sql_query: `ALTER TABLE ${MESSAGES_TABLE} ADD COLUMN IF NOT EXISTS likes INTEGER DEFAULT 0`
                        });
                        
                        if (alterError) {
                            console.error('添加likes字段失败:', alterError);
                            return { success: false, message: '点赞失败: 无法添加必要的数据库字段' };
                        }
                        
                        // 再次尝试更新
                        const { data: retryData, error: retryError } = await supabase
                            .from(MESSAGES_TABLE)
                            .update({ likes: 1 }) // 首次点赞设为1
                            .eq('id', messageId)
                            .select();
                            
                        if (retryError) {
                            console.error('重试更新点赞计数失败:', retryError);
                            return { success: false, message: '点赞失败: ' + retryError.message };
                        }
                        
                        return { success: true, message: '点赞成功（已添加点赞功能）' };
                    } catch (sqlError) {
                        console.error('执行SQL添加字段失败:', sqlError);
                        return { success: false, message: '点赞失败: 数据库操作错误' };
                    }
                } else {
                    console.error('更新点赞计数失败:', updateError);
                    return { success: false, message: '点赞失败: ' + updateError.message };
                }
            }
            
            return { success: true, message: '点赞成功' };
        } catch (error) {
            console.error('点赞操作失败:', error);
            return { success: false, message: '点赞失败: ' + error.message };
        }
    }
    
    // 自动初始化API
    document.addEventListener('DOMContentLoaded', function() {
        console.log('留言API自动初始化...');
        // 延迟一点执行，确保DBConnector已经初始化
        setTimeout(() => {
            initMessageAPI().then(connected => {
                console.log('留言API初始化状态:', connected ? '已连接数据库' : '使用模拟数据');
            });
        }, 500);
    });
    
    // 定期检查数据库连接状态
    setInterval(async function() {
        // 只有当前是模拟数据模式，但localStorage显示应该使用数据库时才尝试重连
        const storedMockState = localStorage.getItem('useMockData');
        if (storedMockState === 'false' && useMockData && typeof DBConnector !== 'undefined') {
            console.log('定期检查: 尝试恢复数据库连接...');
            await initMessageAPI();
        }
    }, 60000); // 每分钟检查一次
    
    // 返回公共API
    return {
        initMessageAPI,
        fetchMessages,
        postMessage,
        replyToMessage,
        likeMessage
    };
})();