require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件 - 完全禁用 helmet 的 CSP
app.use(
    helmet({
        contentSecurityPolicy: false,
        crossOriginEmbedderPolicy: false,
        crossOriginOpenerPolicy: false,
        crossOriginResourcePolicy: false,
    })
);

// CORS 配置 - 允许所有来源（Railway 上需要）
app.use(cors({
    origin: '*',
    credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 限流
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    message: { success: false, message: '请求过于频繁，请稍后再试' }
});
app.use('/api', limiter);

// ===== API路由 =====
app.use('/api/auth', require('./routes/auth'));
app.use('/api/buildings', require('./routes/buildings'));
app.use('/api/reviews', require('./routes/reviews'));

// 健康检查
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ===== 静态文件服务（前端） =====
// 注意：Railway 上，前端文件在 ../frontend 目录
app.use(express.static(path.join(__dirname, '../frontend')));

// ===== 所有非API请求返回前端页面 =====
app.get('*', (req, res) => {
    if (req.path.startsWith('/api')) {
        return res.status(404).json({ success: false, message: '接口不存在' });
    }
    // 如果是 /scene/ 开头的图片请求，已经在静态文件中处理了
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