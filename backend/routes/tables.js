const express = require('express');
const pool = require('../db/connection');
const { auth } = require('../middleware/auth');

const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const [tables] = await pool.query(`
      SELECT t.*, o.id as active_order_id, o.status as order_status
      FROM tables t
      LEFT JOIN orders o ON o.table_id = t.id AND o.status NOT IN ('paid', 'cancelled')
      ORDER BY t.table_number
    `);
    res.json(tables);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/:id/status', auth, async (req, res) => {
  try {
    const { status } = req.body;
    await pool.query('UPDATE tables SET status = ? WHERE id = ?', [status, req.params.id]);
    const [rows] = await pool.query('SELECT * FROM tables WHERE id = ?', [req.params.id]);
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/:id/transfer', auth, async (req, res) => {
  try {
    const { targetTableId } = req.body;
    const fromId = req.params.id;

    const [orders] = await pool.query(
      "SELECT id FROM orders WHERE table_id = ? AND status NOT IN ('paid', 'cancelled')",
      [fromId]
    );

    for (const order of orders) {
      await pool.query('UPDATE orders SET table_id = ? WHERE id = ?', [targetTableId, order.id]);
    }

    await pool.query("UPDATE tables SET status = 'available' WHERE id = ?", [fromId]);
    await pool.query("UPDATE tables SET status = 'occupied' WHERE id = ?", [targetTableId]);

    res.json({ message: 'Table transferred', ordersMoved: orders.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
