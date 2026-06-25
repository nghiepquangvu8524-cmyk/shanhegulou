const express = require('express');
const router = express.Router();
const { dbAll, dbGet } = require('../config/database');

// 获取所有建筑
router.get('/', async (req, res) => {
  try {
    const buildings = await dbAll('SELECT * FROM buildings ORDER BY id');
    res.json({ success: true, data: buildings });
  } catch (error) {
    console.error('获取建筑列表错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 获取单个建筑
router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const building = await dbGet('SELECT * FROM buildings WHERE id = ?', [id]);
    if (!building) {
      return res.status(404).json({ success: false, message: '建筑不存在' });
    }
    res.json({ success: true, data: building });
  } catch (error) {
    console.error('获取建筑详情错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 获取建筑详情（含评价）
router.get('/:id/detail', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const building = await dbGet('SELECT * FROM buildings WHERE id = ?', [id]);
    if (!building) {
      return res.status(404).json({ success: false, message: '建筑不存在' });
    }
    const reviews = await dbAll('SELECT * FROM reviews WHERE building_id = ? ORDER BY created_at DESC', [id]);
    res.json({ success: true, data: { ...building, reviews } });
  } catch (error) {
    console.error('获取建筑详情及评价错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 搜索建筑
router.get('/search', async (req, res) => {
  try {
    const { keyword } = req.query;
    if (!keyword || keyword.trim() === '') {
      return res.json({ success: true, data: [] });
    }
    const searchTerm = `%${keyword.trim()}%`;
    const buildings = await dbAll(
      `SELECT * FROM buildings 
       WHERE name LIKE ? OR dynasty LIKE ? OR author LIKE ? OR poem LIKE ? OR description LIKE ?
       ORDER BY id`,
      [searchTerm, searchTerm, searchTerm, searchTerm, searchTerm]
    );
    res.json({ success: true, data: buildings });
  } catch (error) {
    console.error('搜索建筑错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 按朝代查询
router.get('/dynasty/:dynasty', async (req, res) => {
  try {
    const { dynasty } = req.params;
    const buildings = await dbAll('SELECT * FROM buildings WHERE dynasty = ? ORDER BY id', [dynasty]);
    res.json({ success: true, data: buildings });
  } catch (error) {
    console.error('按朝代查询建筑错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

module.exports = router;