require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件 - 完全禁用 helmet 的 CSP（内容安全策略）
app.use(
    helmet({
        contentSecurityPolicy: false,  // 禁用 CSP
        crossOriginEmbedderPolicy: false,
        crossOriginOpenerPolicy: false,
        crossOriginResourcePolicy: false,
    })
);
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 限流
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    message: { success: false, message: '请求过于频繁，请稍后再试' }
});
app.use('/api', limiter);

// ===== API路由（必须在静态文件之前） =====
app.use('/api/auth', require('./routes/auth'));
app.use('/api/buildings', require('./routes/buildings'));
app.use('/api/reviews', require('./routes/reviews'));

// 健康检查
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ===== 静态文件服务 =====
app.use(express.static(path.join(__dirname, '../frontend')));

// ===== 所有非API请求返回前端页面 =====
app.get('*', (req, res) => {
    if (req.path.startsWith('/api')) {
        return res.status(404).json({ success: false, message: '接口不存在' });
    }
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// 错误处理
app.use((err, req, res, next) => {
    console.error('服务器错误:', err);
    res.status(500).json({ success: false, message: '服务器内部错误' });
});

app.listen(PORT, () => {
    console.log(`🚀 服务器运行在 http://localhost:${PORT}`);
    console.log(`📄 前端页面: http://localhost:${PORT}`);
    console.log(`📡 API地址: http://localhost:${PORT}/api/health`);
});