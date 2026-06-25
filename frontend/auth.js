// auth.js - 认证管理

// ===== 用户管理 =====
function getCurrentUser() {
    try {
        var data = localStorage.getItem('currentUser');
        return data ? JSON.parse(data) : null;
    } catch {
        return null;
    }
}

function setCurrentUser(user) {
    if (user) {
        localStorage.setItem('currentUser', JSON.stringify(user));
    } else {
        localStorage.removeItem('currentUser');
    }
}

function getToken() {
    return localStorage.getItem('token');
}

function setToken(token) {
    if (token) {
        localStorage.setItem('token', token);
    } else {
        localStorage.removeItem('token');
    }
}

function logout() {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('token');
    if (typeof updateNavUserStatus === 'function') {
        updateNavUserStatus();
    }
}

function getUserById(id) {
    var users = getUsers();
    for (var i = 0; i < users.length; i++) {
        if (users[i].id === id) return users[i];
    }
    return null;
}

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

// ===== API调用 - 使用相对路径 =====
// Railway 上使用相对路径，自动适配
var API_BASE = '/api';

async function registerUser(name, email, password) {
    try {
        var response = await fetch(API_BASE + '/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: name.trim(), email: email.trim(), password: password })
        });
        var data = await response.json();
        if (data.success) {
            setToken(data.token);
            setCurrentUser(data.user);
            return { success: true, user: data.user };
        } else {
            return { success: false, error: data.message || '注册失败' };
        }
    } catch (err) {
        console.error('注册错误:', err);
        return { success: false, error: '网络错误，请稍后重试' };
    }
}

async function loginUser(email, password) {
    try {
        var response = await fetch(API_BASE + '/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: email.trim(), password: password })
        });
        var data = await response.json();
        if (data.success) {
            setToken(data.token);
            setCurrentUser(data.user);
            return { success: true, user: data.user };
        } else {
            return { success: false, error: data.message || '登录失败' };
        }
    } catch (err) {
        console.error('登录错误:', err);
        return { success: false, error: '网络错误，请稍后重试' };
    }
}

async function fetchUserProfile() {
    var token = getToken();
    if (!token) return null;
    try {
        var response = await fetch(API_BASE + '/auth/profile', {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        var data = await response.json();
        if (data.success) {
            setCurrentUser(data.user);
            return data.user;
        }
        return null;
    } catch {
        return null;
    }
}

async function updateUserProfile(userId, updates) {
    var token = getToken();
    if (!token) return { success: false, error: '未登录' };
    try {
        var response = await fetch(API_BASE + '/auth/profile', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token
            },
            body: JSON.stringify(updates)
        });
        var data = await response.json();
        if (data.success) {
            setCurrentUser(data.user);
            return { success: true, user: data.user };
        }
        return { success: false, error: data.message || '更新失败' };
    } catch {
        return { success: false, error: '网络错误' };
    }
}

async function changePassword(userId, oldPassword, newPassword) {
    var token = getToken();
    if (!token) return { success: false, error: '未登录' };
    try {
        var response = await fetch(API_BASE + '/auth/password', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token
            },
            body: JSON.stringify({ oldPassword: oldPassword, newPassword: newPassword })
        });
        var data = await response.json();
        return { success: data.success, error: data.message };
    } catch {
        return { success: false, error: '网络错误' };
    }
}

async function deleteAccount(password) {
    var token = getToken();
    if (!token) return { success: false, error: '未登录' };
    try {
        var response = await fetch(API_BASE + '/auth/account', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token
            },
            body: JSON.stringify({ password: password })
        });
        var data = await response.json();
        if (data.success) {
            logout();
        }
        return { success: data.success, message: data.message };
    } catch {
        return { success: false, message: '网络错误' };
    }
}

// ===== 初始化本地Demo用户 =====
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

initDemoUsers();

// 暴露全局
window.API_BASE = API_BASE;
window.getCurrentUser = getCurrentUser;
window.setCurrentUser = setCurrentUser;
window.getToken = getToken;
window.setToken = setToken;
window.logout = logout;
window.getUserById = getUserById;
window.getUsers = getUsers;
window.saveUsers = saveUsers;
window.registerUser = registerUser;
window.loginUser = loginUser;
window.fetchUserProfile = fetchUserProfile;
window.updateUserProfile = updateUserProfile;
window.changePassword = changePassword;
window.deleteAccount = deleteAccount;
window.initDemoUsers = initDemoUsers;