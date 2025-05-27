// 留言板功能脚本 - AEGot 我的世界服务器

// 留言数据存储
let messages = [];
const messagesPerPage = 5;
let currentPage = 1;
let filteredMessages = [];
let currentFilter = 'all';
let currentSearch = '';
let isLoadingMessages = false; // 标记是否正在加载留言

// 初始化留言API连接
function initMessageAPI() {
    return new Promise(async (resolve, reject) => {
        try {
            console.log('正在连接留言API...');
            
            // 首先检查数据库连接
            if (typeof MessageAPI.initMessageAPI === 'function') {
                const dbConnected = await MessageAPI.initMessageAPI();
                console.log('数据库连接状态:', dbConnected ? '已连接' : '未连接');
            }
            
            // 尝试从服务器获取留言
            loadMessagesFromAPI().then(() => {
                console.log('留言API连接成功');
                resolve(true);
            }).catch(error => {
                console.error('留言API连接失败:', error);
                resolve(false);
            });
        } catch (error) {
            console.error('初始化留言API失败:', error);
            resolve(false);
        }
    });
}

// 从API加载留言
async function loadMessagesFromAPI() {
    return new Promise(async (resolve, reject) => {
        try {
            if (isLoadingMessages) {
                resolve();
                return;
            }
            
            isLoadingMessages = true;
            
            // 显示加载指示器
            const container = document.getElementById('messageContainer');
            container.innerHTML = '<div class="loading-messages">正在加载留言...</div>';
            
            // 显示数据源信息
            const dbStatusElement = document.getElementById('dbConnectionStatus');
            if (dbStatusElement && dbStatusElement.style.display === 'none') {
                const useMockData = localStorage.getItem('useMockData') === 'true';
                if (useMockData) {
                    dbStatusElement.textContent = '使用模拟数据模式';
                    dbStatusElement.style.color = '#FF6B6B';
                    dbStatusElement.style.display = 'block';
                    
                    // 5秒后隐藏
                    setTimeout(function() {
                        dbStatusElement.style.display = 'none';
                    }, 5000);
                    
                    // 检查是否需要显示重试按钮
                    checkShowRetryButton();
                }
            }
            
            // 从API获取留言
            const data = await MessageAPI.fetchMessages();
            
            // 更新留言数组
            messages = data;
            
            // 按日期排序，最新的在前面
            messages.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            
            isLoadingMessages = false;
            resolve();
        } catch (error) {
            console.error('从API加载留言失败:', error);
            isLoadingMessages = false;
            reject(error);
        }
    });
}

// 脏话过滤词库
const badWords = [
    // 中文脏话
    '傻逼', '操', '草', '艹', '妈的', '滚蛋', '去死', '日你', 
    '垃圾', '废物', '白痴', '笨蛋', '蠢货', '混蛋', '王八蛋', '贱人',
    '婊子', '妓女', '狗娘', '狗屎', '畜生', '猪头', '猪脑', '猪狗', '牛逼',
    '牛B', '煞笔', '神经病', '神经', '吃屎', '屎', '尿', '屁', '鸡巴', '阴道',
    '阴茎', '睾丸', '肛门', '性交', '强奸', '卖淫', '嫖娼', '嫖', '娼', '妈逼',
    '你妈', '尼玛', '泥马', '逼', '比', '吊', '屌', '叼', '操你', '日你',
    
    // 英文脏话
    'sb', 'nmsl', 'cnm', 'fuck', 'shit', 'damn', 'bitch', 'asshole',
    'bastard', 'cunt', 'dick', 'pussy', 'cock', 'slut', 'whore', 'jerk',
    'idiot', 'stupid', 'dumb', 'retard', 'moron', 'ass', 'wtf', 'stfu',
    'fk', 'f**k', 'f*ck', 's**t', 's*it', 'b*tch', 'b**ch', 'a**hole',
    'a*shole', 'bullshit', 'bs', 'motherfucker', 'mf', 'mtf', 'milf',
    'wanker', 'sucker', 'turd', 'piss', 'cum', 'porn', 'xxx'
];

// 脏话替换字符
const censorChar = '*';

// 脏话变形检测正则表达式
const badWordsRegexPatterns = [
    /[fF]+[uU]+[cC]+[kK]+/g,
    /[sS]+[hH]+[iI]+[tT]+/g,
    /[bB]+[iI]+[tT]+[cC]+[hH]+/g,
    /[aA]+[sS]+[sS]+[hH]+[oO]+[lL]+[eE]+/g,
    /[cC]+[uU]+[nN]+[tT]+/g,
    /[dD]+[iI]+[cC]+[kK]+/g,
    /[pP]+[uU]+[sS]+[sS]+[yY]+/g,
    /[cC]+[oO]+[cC]+[kK]+/g,
    /[sS]+[lL]+[uU]+[tT]+/g,
    /[wW]+[hH]+[oO]+[rR]+[eE]+/g,
    /傻[\s\*\+\-\_]*[逼比笔币]/g,
    /[操草艹][\s\*\+\-\_]*你/g,
    /[日入][\s\*\+\-\_]*你/g,
    /[妈马][\s\*\+\-\_]*的/g,
    /[牛牪][\s\*\+\-\_]*[逼比笔币]/g,
    /[沙傻煞][\s\*\+\-\_]*[逼比笔币]/g
];

// 初始化留言板
async function initMessageBoard() {
    // 初始化留言API
    await initMessageAPI();
    
    // 初始化头像选择器
    initAvatarSelector();
    
    // 初始化表情选择器
    initEmojiPicker();
    
    // 初始化搜索和筛选功能
    initSearchAndFilter();
    
    // 显示留言
    applyFiltersAndDisplay();
    
    // 设置定时刷新留言 (每60秒刷新一次)
    setInterval(async () => {
        await loadMessagesFromAPI();
        applyFiltersAndDisplay();
    }, 60000);
}

// 初始化头像选择器
function initAvatarSelector() {
    const avatarOptions = document.querySelectorAll('.avatar-option');
    
    avatarOptions.forEach(option => {
        option.addEventListener('click', function() {
            // 移除之前的选中状态
            avatarOptions.forEach(opt => opt.classList.remove('selected'));
            
            // 添加新的选中状态
            this.classList.add('selected');
            
            // 更新隐藏输入框的值
            document.getElementById('selectedAvatar').value = this.dataset.avatar;
        });
    });
    
    // 默认选中第一个头像
    avatarOptions[0].classList.add('selected');
}

// 初始化表情选择器
function initEmojiPicker() {
    const emojiButtons = document.querySelectorAll('.emoji-btn');
    const messageTextarea = document.getElementById('message');
    
    // 添加字符计数器
    const charCountContainer = document.createElement('div');
    charCountContainer.className = 'char-count';
    charCountContainer.style.textAlign = 'right';
    charCountContainer.style.marginTop = '5px';
    charCountContainer.style.fontSize = '0.8rem';
    charCountContainer.style.color = '#64748b';
    messageTextarea.parentNode.insertBefore(charCountContainer, messageTextarea.nextSibling);
    
    // 初始化字符计数
    updateCharCount(messageTextarea, charCountContainer);
    
    // 监听输入事件，更新字符计数
    messageTextarea.addEventListener('input', function() {
        updateCharCount(this, charCountContainer);
    });
    
    emojiButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            // 获取当前光标位置
            const cursorPos = messageTextarea.selectionStart;
            
            // 在光标位置插入表情
            const emoji = this.dataset.emoji;
            
            // 检查添加表情后是否超过50字符
            if (messageTextarea.value.length + emoji.length > 50) {
                showFormFeedback('添加表情后将超过50字限制', 'error');
                return;
            }
            const textBefore = messageTextarea.value.substring(0, cursorPos);
            const textAfter = messageTextarea.value.substring(cursorPos);
            
            messageTextarea.value = textBefore + emoji + textAfter;
            
            // 更新光标位置
            messageTextarea.focus();
            messageTextarea.selectionStart = cursorPos + emoji.length;
            messageTextarea.selectionEnd = cursorPos + emoji.length;
            
            // 更新字符计数
            updateCharCount(messageTextarea, messageTextarea.nextElementSibling);
        });
    });
}

// 初始化搜索和筛选功能
function initSearchAndFilter() {
    // 搜索功能
    document.getElementById('searchBtn').addEventListener('click', function() {
        currentSearch = document.getElementById('searchInput').value.trim().toLowerCase();
        currentPage = 1;
        applyFiltersAndDisplay();
    });
    
    // 回车触发搜索
    document.getElementById('searchInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            currentSearch = this.value.trim().toLowerCase();
            currentPage = 1;
            applyFiltersAndDisplay();
        }
    });
    
    // 类别筛选
    document.getElementById('filterCategory').addEventListener('change', function() {
        currentFilter = this.value;
        currentPage = 1;
        applyFiltersAndDisplay();
    });
}

// 应用筛选并显示留言
function applyFiltersAndDisplay() {
    // 应用筛选
    filteredMessages = messages.filter(msg => {
        // 类别筛选
        const categoryMatch = currentFilter === 'all' || msg.category === currentFilter;
        
        // 搜索筛选
        const searchMatch = currentSearch === '' || 
            msg.content.toLowerCase().includes(currentSearch) || 
            msg.name.toLowerCase().includes(currentSearch);
        
        return categoryMatch && searchMatch;
    });
    
    // 显示筛选后的留言
    displayFilteredMessages();
    setupPagination();
}

// 显示筛选后的留言
function displayFilteredMessages() {
    const container = document.getElementById('messageContainer');
    const startIndex = (currentPage - 1) * messagesPerPage;
    const endIndex = startIndex + messagesPerPage;
    const pageMessages = filteredMessages.slice(startIndex, endIndex);
    
    if (filteredMessages.length === 0) {
        container.innerHTML = '<div class="no-messages">没有找到符合条件的留言</div>';
        return;
    }
    
    let html = '';
    
    pageMessages.forEach(msg => {
        if (msg.approved) {
            const date = new Date(msg.created_at).toLocaleString('zh-CN', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            });
            
            // 获取留言类别的中文名称
            const categoryText = getCategoryText(msg.category);
            
            html += `
                <div class="message-item" data-id="${msg.id}">
                    <div class="message-header">
                        <div class="message-author-info">
                            <img src="./images/${msg.avatar ? msg.avatar : 'p1'}.png" alt="头像" class="message-avatar">
                            <span class="message-author">${escapeHTML(msg.name)}</span>
                        </div>
                        <div class="message-meta">
                            <span class="message-category">${categoryText}</span>
                            <span class="message-date">${date}</span>
                        </div>
                    </div>
                    <div class="message-content">${escapeHTML(msg.content)}</div>
                    <div class="message-actions">
                        <button class="like-btn" onclick="likeMessage(${msg.id})">
                            <span class="like-icon">👍</span>
                            <span class="like-count">${msg.likes || 0}</span>
                        </button>
                        <button class="reply-btn" onclick="showReplyForm(${msg.id})">回复</button>
                    </div>
                    <div class="message-replies" id="replies-${msg.id}">
                        ${renderReplies(msg.replies || [])}
                    </div>
                    <div class="reply-form-container" id="reply-form-${msg.id}" style="display: none;">
                        <textarea class="reply-input" id="reply-input-${msg.id}" placeholder="写下你的回复..."></textarea>
                        <button class="reply-submit" onclick="submitReply(${msg.id})">提交回复</button>
                    </div>
                </div>
            `;
        }
    });
    
    container.innerHTML = html;
}

// 获取留言类别的中文名称
function getCategoryText(category) {
    const categoryMap = {
        'general': '综合讨论',
        'suggestion': '建议反馈',
        'question': '问题求助',
        'sharing': '经验分享',
        'recruitment': '招募玩家'
    };
    return categoryMap[category] || '综合讨论';
}

// 渲染回复列表
function renderReplies(replies) {
    if (!replies || replies.length === 0) return '';
    
    let html = '<div class="replies-list">';
    replies.forEach(reply => {
        html += `
            <div class="reply-item">
                <div class="reply-header">
                    <span class="reply-author">${escapeHTML(reply.name)}</span>
                    <span class="reply-date">${new Date(reply.created_at).toLocaleString('zh-CN', {month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'})}</span>
                </div>
                <div class="reply-content">${escapeHTML(reply.content)}</div>
            </div>
        `;
    });
    html += '</div>';
    return html;
}

// 设置分页
function setupPagination() {
    const pagination = document.getElementById('pagination');
    const totalPages = Math.ceil(filteredMessages.length / messagesPerPage);
    
    if (totalPages <= 1) {
        pagination.innerHTML = '';
        return;
    }
    
    let html = '';
    
    // 上一页按钮
    html += `<button class="pagination-btn" ${currentPage === 1 ? 'disabled' : ''} onclick="changePage(${currentPage - 1})">上一页</button>`;
    
    // 页码按钮
    for (let i = 1; i <= totalPages; i++) {
        html += `<button class="pagination-btn ${currentPage === i ? 'active' : ''}" onclick="changePage(${i})">${i}</button>`;
    }
    
    // 下一页按钮
    html += `<button class="pagination-btn" ${currentPage === totalPages ? 'disabled' : ''} onclick="changePage(${currentPage + 1})">下一页</button>`;
    
    pagination.innerHTML = html;
}

// 切换页面
function changePage(page) {
    currentPage = page;
    displayFilteredMessages();
    setupPagination();
    window.scrollTo(0, document.querySelector('.message-list').offsetTop - 100);
}

// 点赞功能实现
async function likeMessage(id) {
    // 查找留言
    const messageIndex = messages.findIndex(msg => msg.id === id);
    if (messageIndex === -1) return;
    
    // 禁用点赞按钮，防止重复点击
    const likeButton = document.querySelector(`.message-item[data-id="${id}"] .like-btn`);
    if (likeButton) {
        likeButton.disabled = true;
    }
    
    try {
        // 发送点赞请求到API
        const result = await MessageAPI.likeMessage(id);
        
        if (result.success) {
            // 增加点赞数
            if (!messages[messageIndex].likes) {
                messages[messageIndex].likes = 0;
            }
            messages[messageIndex].likes++;
            
            // 更新显示
            const likeCountElement = document.querySelector(`.message-item[data-id="${id}"] .like-count`);
            if (likeCountElement) {
                likeCountElement.textContent = messages[messageIndex].likes;
            }
            
            // 添加点赞动画效果
            if (likeButton) {
                likeButton.classList.add('liked');
                setTimeout(() => {
                    likeButton.classList.remove('liked');
                }, 1000);
            }
        } else {
            console.error('点赞失败:', result.message);
        }
    } catch (error) {
        console.error('点赞操作失败:', error);
    } finally {
        // 重新启用点赞按钮
        if (likeButton) {
            likeButton.disabled = false;
        }
    }
}

// 显示回复表单
function showReplyForm(id) {
    const replyForm = document.getElementById(`reply-form-${id}`);
    if (replyForm) {
        // 切换显示/隐藏状态
        if (replyForm.style.display === 'none' || replyForm.style.display === '') {
            replyForm.style.display = 'block';
            // 聚焦到回复输入框
            document.getElementById(`reply-input-${id}`).focus();
        } else {
            replyForm.style.display = 'none';
        }
    }
}

// 提交回复
async function submitReply(id) {
    // 获取回复内容
    const replyInput = document.getElementById(`reply-input-${id}`);
    const replyContent = replyInput.value.trim();
    
    // 验证回复内容
    if (!replyContent) {
        alert('请输入回复内容');
        return;
    }
    
    // 检查并处理脏话
    let processedContent = replyContent;
    if (containsBadWords(replyContent)) {
        processedContent = censorBadWords(replyContent);
        alert('您的回复中包含不适当的词语，已自动替换为星号');
    }
    
    // 查找留言
    const messageIndex = messages.findIndex(msg => msg.id === id);
    if (messageIndex === -1) return;
    
    // 禁用回复按钮，防止重复提交
    const replyButton = document.querySelector(`#reply-form-${id} .reply-submit`);
    if (replyButton) {
        replyButton.disabled = true;
        replyButton.textContent = '提交中...';
    }
    
    // 创建回复对象
    const reply = {
        id: Date.now(),
        name: document.getElementById('name').value || '匿名用户',
        content: processedContent,
        created_at: new Date().toISOString()
    };
    
    try {
        // 发送回复到API
        const result = await MessageAPI.replyToMessage(id, reply);
        
        if (result.success) {
            // 添加回复
            if (!messages[messageIndex].replies) {
                messages[messageIndex].replies = [];
            }
            messages[messageIndex].replies.push(reply);
            
            // 更新显示
            const repliesContainer = document.getElementById(`replies-${id}`);
            if (repliesContainer) {
                repliesContainer.innerHTML = renderReplies(messages[messageIndex].replies);
            }
            
            // 清空并隐藏回复表单
            replyInput.value = '';
            document.getElementById(`reply-form-${id}`).style.display = 'none';
        } else {
            console.error('回复提交失败:', result.message);
            alert('回复提交失败，请稍后重试');
        }
    } catch (error) {
        console.error('回复操作失败:', error);
        alert('网络错误，请稍后重试');
    } finally {
        // 重新启用回复按钮
        if (replyButton) {
            replyButton.disabled = false;
            replyButton.textContent = '提交回复';
        }
    }
}

// 检查是否包含脏话
function containsBadWords(text) {
    const lowerText = text.toLowerCase();
    return badWords.some(word => lowerText.includes(word)) || badWordsRegexPatterns.some(pattern => pattern.test(text));
}

// 替换文本中的脏话为星号
function censorBadWords(text) {
    let censoredText = text;
    
    // 替换词库中的脏话
    badWords.forEach(word => {
        if (censoredText.toLowerCase().includes(word)) {
            const regex = new RegExp(word, 'gi');
            censoredText = censoredText.replace(regex, censorChar.repeat(word.length));
        }
    });
    
    // 替换正则匹配的变形脏话
    badWordsRegexPatterns.forEach(pattern => {
        censoredText = censoredText.replace(pattern, match => censorChar.repeat(match.length));
    });
    
    return censoredText;
}

// 提交留言表单
document.getElementById('messageForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    // 获取表单数据
    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const avatar = document.getElementById('selectedAvatar').value;
    const category = document.getElementById('category').value;
    const content = document.getElementById('message').value.trim();
    
    // 验证表单
    if (!name || !content) {
        showFormFeedback('请填写昵称和留言内容', 'error');
        return;
    }
    
    // 验证留言长度不超过50字
    if (content.length > 50) {
        showFormFeedback('留言内容不能超过50字', 'error');
        return;
    }
    
    // 检查并处理脏话
    let processedContent = content;
    if (containsBadWords(content)) {
        processedContent = censorBadWords(content);
        showFormFeedback('您的留言中包含不适当的词语，已自动替换为星号', 'warning');
    }
    
    // 禁用提交按钮，防止重复提交
    const submitButton = document.querySelector('#messageForm button[type="submit"]');
    if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = '提交中...';
    }
    
    // 创建留言对象
    const message = {
        id: Date.now(),
        name: name,
        email: email,
        avatar: avatar,
        category: category,
        content: processedContent,
        created_at: new Date().toISOString(),
        approved: true, // 默认审核通过
        likes: 0,
        replies: []
    };
    
    try {
        // 发送留言到API
        const result = await saveMessageToAPI(message);
        
        if (result) {
            // 添加到留言数组
            messages.unshift(message); // 新留言放在最前面
            
            // 重置表单
            document.getElementById('messageForm').reset();
            document.querySelectorAll('.avatar-option').forEach(opt => opt.classList.remove('selected'));
            document.querySelectorAll('.avatar-option')[0].classList.add('selected');
            document.getElementById('selectedAvatar').value = 'default';
            
            // 显示成功消息
            showFormFeedback('留言提交成功！', 'success');
            
            // 更新留言显示
            currentFilter = 'all';
            currentSearch = '';
            currentPage = 1;
            document.getElementById('filterCategory').value = 'all';
            document.getElementById('searchInput').value = '';
            applyFiltersAndDisplay();
        }
    } catch (error) {
        console.error('提交留言失败:', error);
        showFormFeedback('网络错误，请稍后重试', 'error');
    } finally {
        // 重新启用提交按钮
        if (submitButton) {
            submitButton.disabled = false;
            submitButton.textContent = '提交留言';
        }
    }
});

// 显示表单反馈
function showFormFeedback(message, type) {
    const feedbackElement = document.getElementById('formFeedback');
    feedbackElement.textContent = message;
    feedbackElement.className = 'form-feedback';
    feedbackElement.classList.add(type);
    feedbackElement.style.display = 'block';
    
    // 5秒后自动隐藏
    setTimeout(() => {
        feedbackElement.style.display = 'none';
    }, 5000);
}

// 更新字符计数
function updateCharCount(textarea, countElement) {
    const maxLength = 50;
    const currentLength = textarea.value.length;
    const remainingChars = maxLength - currentLength;
    
    countElement.textContent = `${currentLength}/${maxLength} 字符 (还剩 ${remainingChars} 字)`;
    
    // 根据剩余字符数量改变颜色
    if (remainingChars <= 0) {
        countElement.style.color = '#EF4444'; // 红色
    } else if (remainingChars <= 10) {
        countElement.style.color = '#F59E0B'; // 黄色
    } else {
        countElement.style.color = '#64748b'; // 默认灰色
    }
}

// 保存留言到数据库
async function saveMessageToAPI(message) {
    try {
        // 发送留言到API
        const result = await MessageAPI.postMessage(message);
        
        if (result.success) {
            console.log('留言保存成功');
            return true;
        } else {
            console.error('保存留言失败:', result.message);
            showFormFeedback(result.message || '保存留言失败，请稍后重试', 'error');
            return false;
        }
    } catch (error) {
        console.error('API操作异常:', error);
        showFormFeedback('网络错误，请稍后重试', 'error');
        return false;
    }
}

// HTML转义函数，防止XSS攻击
function escapeHTML(str) {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// 移动端菜单切换
document.querySelector('.mobile-menu-btn')?.addEventListener('click', function() {
    document.querySelector('.nav-links').classList.toggle('active');
});

// 页面加载完成后初始化留言板
document.addEventListener('DOMContentLoaded', function() {
    // 显示数据库连接状态元素
    const dbStatusElement = document.getElementById('dbConnectionStatus');
    if (dbStatusElement) {
        dbStatusElement.textContent = '正在连接数据库...';
        dbStatusElement.style.color = '#4D77FF';
        dbStatusElement.style.display = 'block';
    }
    
    // 检查是否需要显示重试按钮
    setTimeout(checkShowRetryButton, 2000); // 延迟2秒检查，确保数据库连接状态已更新
    
    // 初始化重试连接按钮
    const retryButton = document.getElementById('retryDbConnection');
    const retryContainer = document.getElementById('dbRetryContainer');
    
    if (retryButton) {
        retryButton.addEventListener('click', async function() {
            // 显示连接中状态
            if (dbStatusElement) {
                dbStatusElement.textContent = '正在重新连接数据库...';
                dbStatusElement.style.color = '#4D77FF';
                dbStatusElement.style.display = 'block';
            }
            
            // 隐藏重试按钮
            if (retryContainer) {
                retryContainer.style.display = 'none';
            }
            
            try {
                // 重置数据库连接
                if (typeof DBConnector !== 'undefined' && DBConnector.resetConnection) {
                    const connected = await DBConnector.resetConnection();
                    
                    if (connected) {
                        // 连接成功，重新初始化留言API
                        await MessageAPI.initMessageAPI();
                        
                        // 更新UI
                        if (dbStatusElement) {
                            dbStatusElement.textContent = '数据库连接成功！';
                            dbStatusElement.style.color = 'green';
                            
                            // 3秒后隐藏
                            setTimeout(function() {
                                dbStatusElement.style.display = 'none';
                            }, 3000);
                        }
                        
                        // 重新加载留言
                        loadMessages();
                    } else {
                        // 连接失败
                        const errorMsg = DBConnector.getConnectionError ? DBConnector.getConnectionError() : '未知错误';
                        if (dbStatusElement) {
                            dbStatusElement.textContent = '数据库连接失败: ' + errorMsg;
                            dbStatusElement.style.color = 'red';
                        }
                        
                        // 显示重试按钮
                        if (retryContainer) {
                            retryContainer.style.display = 'block';
                        }
                    }
                } else {
                    throw new Error('DBConnector未定义或不支持重置连接');
                }
            } catch (error) {
                console.error('重试连接数据库失败:', error);
                
                // 更新UI显示错误
                if (dbStatusElement) {
                    dbStatusElement.textContent = '重试连接失败: ' + (error.message || '未知错误');
                    dbStatusElement.style.color = 'red';
                }
                
                // 显示重试按钮
                if (retryContainer) {
                    retryContainer.style.display = 'block';
                }
            }
        });
    }
    
    initMessageBoard();
});

// 检查是否需要显示重试按钮
function checkShowRetryButton() {
    const useMockData = localStorage.getItem('useMockData') === 'true';
    const dbErrorReason = localStorage.getItem('dbErrorReason');
    const retryContainer = document.getElementById('dbRetryContainer');
    const dbStatusElement = document.getElementById('dbConnectionStatus');
    
    if (useMockData && dbErrorReason && retryContainer) {
        retryContainer.style.display = 'block';
        
        // 同时显示错误原因
        if (dbStatusElement && dbStatusElement.textContent !== '正在连接数据库...') {
            dbStatusElement.textContent = '数据库连接失败: ' + dbErrorReason;
            dbStatusElement.style.color = 'red';
            dbStatusElement.style.display = 'block';
        }
    } else if (retryContainer) {
        retryContainer.style.display = 'none';
    }
}

// 初始化留言板 - 已由DOMContentLoaded事件处理，此处保留为兼容性考虑
// window.onload = function() {
//    initMessageBoard();
// };