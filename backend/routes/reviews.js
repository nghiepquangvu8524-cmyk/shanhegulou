const express = require('express');
const router = express.Router();
const { dbAll, dbGet, dbRun } = require('../config/database');
const authMiddleware = require('../middleware/auth');

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 6);
}

// 获取所有评价
router.get('/', async (req, res) => {
  try {
    const reviews = await dbAll('SELECT * FROM reviews ORDER BY created_at DESC');
    res.json({ success: true, data: reviews });
  } catch (error) {
    console.error('获取评价列表错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 获取评价统计
router.get('/stats', async (req, res) => {
  try {
    const total = await dbGet('SELECT COUNT(*) as count FROM reviews');
    const totalLikes = await dbGet('SELECT SUM(LENGTH(likes) - LENGTH(REPLACE(likes, ",", "")) + 1) as total FROM reviews');
    const users = await dbGet('SELECT COUNT(DISTINCT user_id) as count FROM reviews');
    res.json({
      success: true,
      data: {
        totalReviews: total?.count || 0,
        totalLikes: totalLikes?.total || 0,
        totalUsers: users?.count || 0
      }
    });
  } catch (error) {
    console.error('获取评价统计错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 获取建筑的评价
router.get('/building/:buildingId', async (req, res) => {
  try {
    const buildingId = parseInt(req.params.buildingId);
    const reviews = await dbAll('SELECT * FROM reviews WHERE building_id = ? ORDER BY created_at DESC', [buildingId]);
    res.json({ success: true, data: reviews });
  } catch (error) {
    console.error('获取建筑评价错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 获取用户的评价
router.get('/user/:userId?', authMiddleware, async (req, res) => {
  try {
    const userId = req.params.userId || req.userId;
    const reviews = await dbAll('SELECT * FROM reviews WHERE user_id = ? ORDER BY created_at DESC', [userId]);
    res.json({ success: true, data: reviews });
  } catch (error) {
    console.error('获取用户评价错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 创建评价
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { buildingId, rating, content } = req.body;
    const userId = req.userId;

    if (!buildingId || !rating || !content) {
      return res.status(400).json({ success: false, message: '请填写完整信息' });
    }

    const building = await dbGet('SELECT * FROM buildings WHERE id = ?', [parseInt(buildingId)]);
    if (!building) {
      return res.status(404).json({ success: false, message: '建筑不存在' });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: '评分必须在1-5之间' });
    }

    if (content.length < 5) {
      return res.status(400).json({ success: false, message: '评价内容至少5个字' });
    }

    const reviewId = generateId();
    await dbRun(
      `INSERT INTO reviews (id, user_id, building_id, building_name, dynasty, author, rating, content, likes, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [reviewId, userId, parseInt(buildingId), building.name, building.dynasty, building.author, rating, content, '[]', new Date().toISOString()]
    );

    const review = await dbGet('SELECT * FROM reviews WHERE id = ?', [reviewId]);
    res.status(201).json({ success: true, message: '评价发布成功', data: review });
  } catch (error) {
    console.error('创建评价错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 更新评价
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const reviewId = req.params.id;
    const { rating, content } = req.body;

    const review = await dbGet('SELECT * FROM reviews WHERE id = ?', [reviewId]);
    if (!review) {
      return res.status(404).json({ success: false, message: '评价不存在' });
    }

    if (review.user_id !== req.userId) {
      return res.status(403).json({ success: false, message: '无权修改此评价' });
    }

    const updates = [];
    const values = [];
    if (rating !== undefined) {
      if (rating < 1 || rating > 5) {
        return res.status(400).json({ success: false, message: '评分必须在1-5之间' });
      }
      updates.push('rating = ?');
      values.push(rating);
    }
    if (content !== undefined) {
      if (content.length < 5) {
        return res.status(400).json({ success: false, message: '评价内容至少5个字' });
      }
      updates.push('content = ?');
      values.push(content);
    }

    if (updates.length === 0) {
      return res.status(400).json({ success: false, message: '没有需要更新的内容' });
    }

    values.push(reviewId);
    await dbRun(`UPDATE reviews SET ${updates.join(', ')} WHERE id = ?`, values);

    const updated = await dbGet('SELECT * FROM reviews WHERE id = ?', [reviewId]);
    res.json({ success: true, message: '评价更新成功', data: updated });
  } catch (error) {
    console.error('更新评价错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 删除评价
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const reviewId = req.params.id;
    const review = await dbGet('SELECT * FROM reviews WHERE id = ?', [reviewId]);
    if (!review) {
      return res.status(404).json({ success: false, message: '评价不存在' });
    }

    if (review.user_id !== req.userId) {
      return res.status(403).json({ success: false, message: '无权删除此评价' });
    }

    await dbRun('DELETE FROM reviews WHERE id = ?', [reviewId]);
    res.json({ success: true, message: '评价删除成功' });
  } catch (error) {
    console.error('删除评价错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 点赞/取消点赞
router.post('/:id/like', authMiddleware, async (req, res) => {
  try {
    const reviewId = req.params.id;
    const userId = req.userId;

    const review = await dbGet('SELECT * FROM reviews WHERE id = ?', [reviewId]);
    if (!review) {
      return res.status(404).json({ success: false, message: '评价不存在' });
    }

    let likes = JSON.parse(review.likes || '[]');
    const idx = likes.indexOf(userId);
    if (idx > -1) {
      likes.splice(idx, 1);
    } else {
      likes.push(userId);
    }

    await dbRun('UPDATE reviews SET likes = ? WHERE id = ?', [JSON.stringify(likes), reviewId]);
    const updated = await dbGet('SELECT * FROM reviews WHERE id = ?', [reviewId]);
    res.json({ success: true, message: '操作成功', data: updated });
  } catch (error) {
    console.error('点赞操作错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

module.exports = router;