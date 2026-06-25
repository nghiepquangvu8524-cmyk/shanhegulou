// theme.js - 统一主题管理

// ===== 主题管理 =====
function getTheme() {
    return localStorage.getItem('theme') || 'light';
}

function setTheme(theme) {
    localStorage.setItem('theme', theme);
    applyTheme(theme);
}

function applyTheme(theme) {
    if (theme === 'dark') {
        document.body.classList.add('dark-theme');
    } else {
        document.body.classList.remove('dark-theme');
    }
    updateThemeIcons(theme);
}

function toggleTheme() {
    var current = getTheme();
    var next = current === 'dark' ? 'light' : 'dark';
    setTheme(next);
    return next;
}

function updateThemeIcons(theme) {
    var buttons = document.querySelectorAll('.theme-toggle');
    var toggles = document.querySelectorAll('.toggle-switch');
    
    buttons.forEach(function(btn) {
        var icon = btn.querySelector('i');
        if (icon) {
            icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
        }
    });
    
    toggles.forEach(function(toggle) {
        if (theme === 'dark') {
            toggle.classList.add('active');
        } else {
            toggle.classList.remove('active');
        }
    });
}

function initTheme() {
    var theme = getTheme();
    applyTheme(theme);
}

// ===== 页面切换动画 =====
function navigateTo(url) {
    var main = document.querySelector('main') || 
               document.querySelector('.hero-section') || 
               document.querySelector('.page-content') ||
               document.querySelector('.ai-page') ||
               document.querySelector('.review-page') ||
               document.querySelector('.nav-page-wrap') ||
               document.querySelector('.profile-page');
    
    if (main) {
        main.classList.add('page-transition-out');
        setTimeout(function() {
            window.location.href = url;
        }, 300);
    } else {
        window.location.href = url;
    }
}

// ===== 自动初始化 =====
document.addEventListener('DOMContentLoaded', function() {
    initTheme();
});

// 暴露全局
window.getTheme = getTheme;
window.setTheme = setTheme;
window.applyTheme = applyTheme;
window.toggleTheme = toggleTheme;
window.initTheme = initTheme;
window.navigateTo = navigateTo;
window.updateThemeIcons = updateThemeIcons;