const express = require('express');
const pool = require('../db/connection');
const { auth } = require('../middleware/auth');

const router = express.Router();

router.post('/', auth, async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const { order_id, amount, method, status = 'completed' } = req.body;

    const [orders] = await conn.query('SELECT * FROM orders WHERE id = ?', [order_id]);
    if (!orders.length) return res.status(404).json({ error: 'Order not found' });

    const [existingPayments] = await conn.query(
      "SELECT COALESCE(SUM(amount), 0) as paid FROM payments WHERE order_id = ? AND status = 'completed'",
      [order_id]
    );
    const paidSoFar = parseFloat(existingPayments[0].paid);
    const orderTotal = parseFloat(orders[0].total);
    const payAmount = parseFloat(amount);

    if (paidSoFar + payAmount > orderTotal + 0.01) {
      return res.status(400).json({ error: 'Payment exceeds order total' });
    }

    const [result] = await conn.query(
      'INSERT INTO payments (order_id, amount, method, status) VALUES (?, ?, ?, ?)',
      [order_id, payAmount, method, status]
    );

    if (status === 'completed' && paidSoFar + payAmount >= orderTotal - 0.01) {
      await conn.query("UPDATE orders SET status = 'paid' WHERE id = ?", [order_id]);
      if (orders[0].table_id) {
        const [active] = await conn.query(
          "SELECT COUNT(*) as c FROM orders WHERE table_id = ? AND status NOT IN ('paid', 'cancelled')",
          [orders[0].table_id]
        );
        if (active[0].c === 0) {
          await conn.query("UPDATE tables SET status = 'available' WHERE id = ?", [orders[0].table_id]);
        }
      }
    } else if (status === 'completed') {
      await conn.query("UPDATE orders SET status = 'awaiting_payment' WHERE id = ?", [order_id]);
    }

    await conn.commit();

    const [payments] = await pool.query('SELECT * FROM payments WHERE order_id = ?', [order_id]);
    res.status(201).json({ payment_id: result.insertId, payments });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ error: err.message });
  } finally {
    conn.release();
  }
});

router.post('/split', auth, async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const { order_id, splits } = req.body;

    if (!splits?.length) return res.status(400).json({ error: 'Splits required' });

    const results = [];
    for (const split of splits) {
      const [result] = await conn.query(
        'INSERT INTO payments (order_id, amount, method, status) VALUES (?, ?, ?, ?)',
        [order_id, split.amount, split.method, split.status || 'completed']
      );
      results.push(result.insertId);
    }

    const [orders] = await conn.query('SELECT total, table_id FROM orders WHERE id = ?', [order_id]);
    await conn.query("UPDATE orders SET status = 'paid' WHERE id = ?", [order_id]);

    if (orders[0]?.table_id) {
      const [active] = await conn.query(
        "SELECT COUNT(*) as c FROM orders WHERE table_id = ? AND status NOT IN ('paid', 'cancelled')",
        [orders[0].table_id]
      );
      if (active[0].c === 0) {
        await conn.query("UPDATE tables SET status = 'available' WHERE id = ?", [orders[0].table_id]);
      }
    }

    await conn.commit();
    const [payments] = await pool.query('SELECT * FROM payments WHERE order_id = ?', [order_id]);
    res.json({ payments });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ error: err.message });
  } finally {
    conn.release();
  }
});

router.get('/receipt/:orderId', auth, async (req, res) => {
  try {
    const [orders] = await pool.query(
      `SELECT o.*, u.name as staff_name, t.table_number
       FROM orders o JOIN users u ON u.id = o.staff_id
       LEFT JOIN tables t ON t.id = o.table_id WHERE o.id = ?`,
      [req.params.orderId]
    );
    if (!orders.length) return res.status(404).json({ error: 'Order not found' });

    const [items] = await pool.query(
      `SELECT oi.*, mi.name as item_name FROM order_items oi
       JOIN menu_items mi ON mi.id = oi.menu_item_id WHERE oi.order_id = ?`,
      [req.params.orderId]
    );
    const [payments] = await pool.query('SELECT * FROM payments WHERE order_id = ?', [req.params.orderId]);

    res.json({ order: orders[0], items, payments });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
