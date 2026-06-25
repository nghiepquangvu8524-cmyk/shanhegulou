// data.js - 数据管理（使用后端API）

var API_BASE = '/api';

// ===== 建筑数据（本地缓存） =====
var BUILDINGS = [];

// ===== 从后端获取建筑数据 =====
async function fetchBuildings() {
    try {
        var response = await fetch(API_BASE + '/buildings');
        var data = await response.json();
        if (data.success) {
            BUILDINGS = data.data;
            return data.data;
        }
        return [];
    } catch (err) {
        console.error('获取建筑数据失败:', err);
        return [];
    }
}

function getBuildingById(id) {
    var found = BUILDINGS.find(function(b) { return b.id == id; });
    if (found) return found;
    return fetchBuildingFromAPI(id);
}

async function fetchBuildingFromAPI(id) {
    try {
        var response = await fetch(API_BASE + '/buildings/' + id);
        var data = await response.json();
        if (data.success) return data.data;
        return null;
    } catch {
        return null;
    }
}

async function getBuildingDetail(id) {
    try {
        var response = await fetch(API_BASE + '/buildings/' + id + '/detail');
        var data = await response.json();
        if (data.success) return data.data;
        return null;
    } catch {
        return null;
    }
}

async function searchBuildings(keyword) {
    try {
        var response = await fetch(API_BASE + '/buildings/search?keyword=' + encodeURIComponent(keyword));
        var data = await response.json();
        if (data.success) return data.data;
        return [];
    } catch {
        return [];
    }
}

// ===== 评价API =====
async function getReviews() {
    try {
        var response = await fetch(API_BASE + '/reviews');
        var data = await response.json();
        if (data.success) return data.data;
        return [];
    } catch {
        return [];
    }
}

async function getReviewsByBuilding(buildingId) {
    try {
        var response = await fetch(API_BASE + '/reviews/building/' + buildingId);
        var data = await response.json();
        if (data.success) return data.data;
        return [];
    } catch {
        return [];
    }
}

async function getReviewsByUser(userId) {
    try {
        var token = getToken();
        var url = userId ? '/reviews/user/' + userId : '/reviews/user';
        var response = await fetch(API_BASE + url, {
            headers: token ? { 'Authorization': 'Bearer ' + token } : {}
        });
        var data = await response.json();
        if (data.success) return data.data;
        return [];
    } catch {
        return [];
    }
}

async function addReview(reviewData) {
    var token = getToken();
    if (!token) throw new Error('请先登录');
    
    var response = await fetch(API_BASE + '/reviews', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify({
            buildingId: reviewData.buildingId,
            rating: reviewData.rating,
            content: reviewData.content
        })
    });
    var data = await response.json();
    if (!data.success) throw new Error(data.message || '发布失败');
    return data.data;
}

async function toggleLike(reviewId, userId) {
    var token = getToken();
    if (!token) throw new Error('请先登录');
    
    var response = await fetch(API_BASE + '/reviews/' + reviewId + '/like', {
        method: 'POST',
        headers: {
            'Authorization': 'Bearer ' + token
        }
    });
    var data = await response.json();
    if (!data.success) throw new Error(data.message || '操作失败');
    return data.data;
}

async function deleteReviewApi(reviewId) {
    var token = getToken();
    if (!token) throw new Error('请先登录');
    
    var response = await fetch(API_BASE + '/reviews/' + reviewId, {
        method: 'DELETE',
        headers: {
            'Authorization': 'Bearer ' + token
        }
    });
    var data = await response.json();
    if (!data.success) throw new Error(data.message || '删除失败');
    return data;
}

async function getReviewStats() {
    try {
        var response = await fetch(API_BASE + '/reviews/stats');
        var data = await response.json();
        if (data.success) return data.data;
        return { totalReviews: 0, totalLikes: 0, totalUsers: 0 };
    } catch {
        return { totalReviews: 0, totalLikes: 0, totalUsers: 0 };
    }
}

// ===== 兼容旧代码 =====
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 6);
}

function saveReviews(reviews) {
    try {
        localStorage.setItem('reviews_cache', JSON.stringify(reviews));
    } catch(e) {}
}

// ===== 初始化 =====
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', function() {
        fetchBuildings().then(function(data) {
            if (data && data.length > 0) {
                BUILDINGS = data;
            }
        });
    });
}

// 暴露全局
window.BUILDINGS = BUILDINGS;
window.API_BASE = API_BASE;
window.fetchBuildings = fetchBuildings;
window.getBuildingById = getBuildingById;
window.getBuildingDetail = getBuildingDetail;
window.searchBuildings = searchBuildings;
window.getReviews = getReviews;
window.getReviewsByBuilding = getReviewsByBuilding;
window.getReviewsByUser = getReviewsByUser;
window.addReview = addReview;
window.toggleLike = toggleLike;
window.deleteReviewApi = deleteReviewApi;
window.getReviewStats = getReviewStats;
window.generateId = generateId;
window.saveReviews = saveReviews;