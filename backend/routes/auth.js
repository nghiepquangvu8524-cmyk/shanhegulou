const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { dbGet, dbRun } = require('../config/database');
const authMiddleware = require('../middleware/auth');

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 6);
}

// 注册
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: '请填写完整信息' });
    }
    if (name.length < 2) {
      return res.status(400).json({ success: false, message: '昵称至少2个字符' });
    }
    if (!email.includes('@')) {
      return res.status(400).json({ success: false, message: '请输入有效的邮箱地址' });
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, message: '密码至少6位' });
    }

    const existing = await dbGet('SELECT * FROM users WHERE email = ?', [email]);
    if (existing) {
      return res.status(400).json({ success: false, message: '该邮箱已被注册' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = generateId();
    const avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=b8956a&color=fff`;
    const joinDate = new Date().toISOString();

    await dbRun(
      'INSERT INTO users (id, name, email, password, avatar, join_date, favorites) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [userId, name.trim(), email.trim(), hashedPassword, avatar, joinDate, '[]']
    );

    const user = await dbGet('SELECT id, name, email, avatar, join_date FROM users WHERE id = ?', [userId]);
    
    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE }
    );

    res.status(201).json({
      success: true,
      message: '注册成功',
      token,
      user: { id: user.id, name: user.name, email: user.email, avatar: user.avatar }
    });
  } catch (error) {
    console.error('注册错误:', error);
    res.status(500).json({ success: false, message: '服务器错误，请稍后重试' });
  }
});

// 登录
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: '请填写完整信息' });
    }

    const user = await dbGet('SELECT * FROM users WHERE email = ?', [email]);
    if (!user) {
      return res.status(401).json({ success: false, message: '邮箱或密码错误' });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ success: false, message: '邮箱或密码错误' });
    }

    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE }
    );

    res.json({
      success: true,
      message: '登录成功',
      token,
      user: { id: user.id, name: user.name, email: user.email, avatar: user.avatar }
    });
  } catch (error) {
    console.error('登录错误:', error);
    res.status(500).json({ success: false, message: '服务器错误，请稍后重试' });
  }
});

// 获取用户资料
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const user = await dbGet('SELECT id, name, email, avatar, join_date, favorites FROM users WHERE id = ?', [req.userId]);
    if (!user) {
      return res.status(404).json({ success: false, message: '用户不存在' });
    }
    res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        joinDate: user.join_date,
        favorites: JSON.parse(user.favorites || '[]')
      }
    });
  } catch (error) {
    console.error('获取用户资料错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 更新用户资料
router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const { name, email, avatar } = req.body;

    if (name && name.length < 2) {
      return res.status(400).json({ success: false, message: '昵称至少2个字符' });
    }
    if (email && !email.includes('@')) {
      return res.status(400).json({ success: false, message: '请输入有效的邮箱地址' });
    }

    if (email) {
      const existing = await dbGet('SELECT * FROM users WHERE email = ? AND id != ?', [email, req.userId]);
      if (existing) {
        return res.status(400).json({ success: false, message: '该邮箱已被其他用户使用' });
      }
    }

    const updates = [];
    const values = [];
    if (name) { updates.push('name = ?'); values.push(name.trim()); }
    if (email) { updates.push('email = ?'); values.push(email.trim()); }
    if (avatar) { updates.push('avatar = ?'); values.push(avatar); }

    if (updates.length === 0) {
      return res.status(400).json({ success: false, message: '没有需要更新的内容' });
    }

    values.push(req.userId);
    await dbRun(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, values);

    const user = await dbGet('SELECT id, name, email, avatar, join_date, favorites FROM users WHERE id = ?', [req.userId]);
    res.json({
      success: true,
      message: '资料更新成功',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        joinDate: user.join_date,
        favorites: JSON.parse(user.favorites || '[]')
      }
    });
  } catch (error) {
    console.error('更新用户资料错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 修改密码
router.put('/password', authMiddleware, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ success: false, message: '请填写完整信息' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: '新密码至少6位' });
    }

    const user = await dbGet('SELECT * FROM users WHERE id = ?', [req.userId]);
    if (!user) {
      return res.status(404).json({ success: false, message: '用户不存在' });
    }

    const isValid = await bcrypt.compare(oldPassword, user.password);
    if (!isValid) {
      return res.status(401).json({ success: false, message: '原密码错误' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await dbRun('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, req.userId]);

    res.json({ success: true, message: '密码修改成功' });
  } catch (error) {
    console.error('修改密码错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 注销账号
router.delete('/account', authMiddleware, async (req, res) => {
  try {
    const { password } = req.body;
    if (!password) {
      return res.status(400).json({ success: false, message: '请输入密码确认' });
    }

    const user = await dbGet('SELECT * FROM users WHERE id = ?', [req.userId]);
    if (!user) {
      return res.status(404).json({ success: false, message: '用户不存在' });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ success: false, message: '密码错误' });
    }

    await dbRun('DELETE FROM users WHERE id = ?', [req.userId]);
    await dbRun('DELETE FROM reviews WHERE user_id = ?', [req.userId]);

    res.json({ success: true, message: '账号已注销' });
  } catch (error) {
    console.error('注销账号错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

module.exports = router;