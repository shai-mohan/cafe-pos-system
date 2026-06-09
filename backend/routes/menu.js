const express = require('express');
const pool = require('../db/connection');
const { auth, managerOnly } = require('../middleware/auth');
const { getRecommendations } = require('../utils/recommendations');

const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const [items] = await pool.query('SELECT * FROM menu_items ORDER BY category, name');
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/categories', auth, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT DISTINCT category FROM menu_items ORDER BY category');
    res.json(rows.map((r) => r.category));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', auth, managerOnly, async (req, res) => {
  try {
    const { name, price, category, description, available = true } = req.body;
    const [result] = await pool.query(
      'INSERT INTO menu_items (name, price, category, description, available) VALUES (?, ?, ?, ?, ?)',
      [name, price, category, description || null, available]
    );
    const [rows] = await pool.query('SELECT * FROM menu_items WHERE id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', auth, managerOnly, async (req, res) => {
  try {
    const { name, price, category, description, available } = req.body;
    await pool.query(
      'UPDATE menu_items SET name=?, price=?, category=?, description=?, available=? WHERE id=?',
      [name, price, category, description, available, req.params.id]
    );
    const [rows] = await pool.query('SELECT * FROM menu_items WHERE id = ?', [req.params.id]);
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/:id/availability', auth, managerOnly, async (req, res) => {
  try {
    const { available } = req.body;
    await pool.query('UPDATE menu_items SET available = ? WHERE id = ?', [available, req.params.id]);
    const [rows] = await pool.query('SELECT * FROM menu_items WHERE id = ?', [req.params.id]);
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/recommendations', auth, async (req, res) => {
  try {
    const { cartItemNames = [] } = req.body;
    const [items] = await pool.query('SELECT * FROM menu_items WHERE available = TRUE');
    const recommendations = getRecommendations(cartItemNames, items);
    res.json(recommendations);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
