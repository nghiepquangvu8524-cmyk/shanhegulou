// auth.js - 认证管理

function getUsers() {
    try {
        var data = localStorage.getItem('users');
        return data ? JSON.parse(data) : [];
    } catch {
        return [];
    }
}

function saveUsers(users) {
    localStorage.setItem('users', JSON.stringify(users));
}

function getCurrentUser() {
    try {
        var data = localStorage.getItem('currentUser');
        return data ? JSON.parse(data) : null;
    } catch {
        return null;
    }
}

function setCurrentUser(user) {
    localStorage.setItem('currentUser', JSON.stringify(user));
}

function logout() {
    localStorage.removeItem('currentUser');
}

function getUserById(id) {
    var users = getUsers();
    for (var i = 0; i < users.length; i++) {
        if (users[i].id === id) return users[i];
    }
    return null;
}

function registerUser(name, email, password) {
    var users = getUsers();
    for (var i = 0; i < users.length; i++) {
        if (users[i].email === email) {
            return { success: false, error: '该邮箱已被注册' };
        }
    }
    var newUser = {
        id: generateId(),
        name: name.trim(),
        email: email.trim(),
        password: password,
        avatar: 'https://ui-avatars.com/api/?name=' + encodeURIComponent(name.trim()) + '&background=b8956a&color=fff',
        joinDate: new Date().toISOString(),
        favorites: []
    };
    users.push(newUser);
    saveUsers(users);
    setCurrentUser({ id: newUser.id, name: newUser.name, email: newUser.email });
    return { success: true, user: newUser };
}

function loginUser(email, password) {
    var users = getUsers();
    for (var i = 0; i < users.length; i++) {
        if (users[i].email === email) {
            if (users[i].password === password) {
                setCurrentUser({ id: users[i].id, name: users[i].name, email: users[i].email });
                return { success: true, user: users[i] };
            } else {
                return { success: false, error: '密码错误' };
            }
        }
    }
    return { success: false, error: '该邮箱尚未注册' };
}

// ===== 新增：更新用户资料 =====
function updateUserProfile(userId, updates) {
    var users = getUsers();
    var userIndex = -1;
    for (var i = 0; i < users.length; i++) {
        if (users[i].id === userId) {
            userIndex = i;
            break;
        }
    }
    if (userIndex === -1) {
        return { success: false, error: '用户不存在' };
    }

    // 检查邮箱是否已被其他用户占用
    if (updates.email) {
        for (var j = 0; j < users.length; j++) {
            if (users[j].id !== userId && users[j].email === updates.email) {
                return { success: false, error: '该邮箱已被其他用户使用' };
            }
        }
    }

    // 更新用户信息
    for (var key in updates) {
        if (updates.hasOwnProperty(key)) {
            users[userIndex][key] = updates[key];
        }
    }

    saveUsers(users);

    // 更新当前登录会话
    var currentUser = getCurrentUser();
    if (currentUser && currentUser.id === userId) {
        setCurrentUser({
            id: users[userIndex].id,
            name: users[userIndex].name,
            email: users[userIndex].email
        });
    }

    return { success: true, user: users[userIndex] };
}

// ===== 新增：修改密码 =====
function changePassword(userId, oldPassword, newPassword) {
    var users = getUsers();
    var userIndex = -1;
    for (var i = 0; i < users.length; i++) {
        if (users[i].id === userId) {
            userIndex = i;
            break;
        }
    }
    if (userIndex === -1) {
        return { success: false, error: '用户不存在' };
    }

    if (users[userIndex].password !== oldPassword) {
        return { success: false, error: '原密码错误' };
    }

    if (newPassword.length < 6) {
        return { success: false, error: '新密码至少6位' };
    }

    users[userIndex].password = newPassword;
    saveUsers(users);
    return { success: true };
}

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 6);
}

// ===== 初始化示例用户 =====
function initDemoUsers() {
    var users = getUsers();
    if (users.length === 0) {
        var demo = [
            {
                id: 'demo1',
                name: '诗仙李白',
                email: 'libai@example.com',
                password: 'libai123',
                avatar: 'https://ui-avatars.com/api/?name=李白&background=b8956a&color=fff',
                joinDate: new Date().toISOString(),
                favorites: []
            },
            {
                id: 'demo2',
                name: '建筑学者',
                email: 'scholar@example.com',
                password: 'scholar123',
                avatar: 'https://ui-avatars.com/api/?name=建筑学者&background=b8956a&color=fff',
                joinDate: new Date().toISOString(),
                favorites: []
            }
        ];
        saveUsers(demo);
    }
}

// ===== 初始化 =====
function initAuth() {
    initDemoUsers();
    initDemoReviews();
}

initAuth();

// 暴露全局
window.getUsers = getUsers;
window.saveUsers = saveUsers;
window.getCurrentUser = getCurrentUser;
window.setCurrentUser = setCurrentUser;
window.logout = logout;
window.getUserById = getUserById;
window.registerUser = registerUser;
window.loginUser = loginUser;
window.updateUserProfile = updateUserProfile;
window.changePassword = changePassword;
window.generateId = generateId;
window.initDemoUsers = initDemoUsers;