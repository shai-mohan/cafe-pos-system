const express = require('express');
const pool = require('../db/connection');
const { auth } = require('../middleware/auth');
const { calcTotals } = require('../utils/orderCalc');

const router = express.Router();

async function getOrderWithItems(orderId) {
  const [orders] = await pool.query(
    `SELECT o.*, u.name as staff_name, t.table_number
     FROM orders o
     JOIN users u ON u.id = o.staff_id
     LEFT JOIN tables t ON t.id = o.table_id
     WHERE o.id = ?`,
    [orderId]
  );
  if (!orders.length) return null;
  const [items] = await pool.query(
    `SELECT oi.*, mi.name as item_name, mi.available
     FROM order_items oi
     JOIN menu_items mi ON mi.id = oi.menu_item_id
     WHERE oi.order_id = ?`,
    [orderId]
  );
  const [payments] = await pool.query('SELECT * FROM payments WHERE order_id = ?', [orderId]);
  const paid = payments.filter((p) => p.status === 'completed').reduce((s, p) => s + parseFloat(p.amount), 0);
  return { ...orders[0], items, payments, amount_paid: paid, balance: parseFloat(orders[0].total) - paid };
}

async function recalcOrder(orderId) {
  const [items] = await pool.query('SELECT unit_price, quantity FROM order_items WHERE order_id = ?', [orderId]);
  const { subtotal, tax, total } = calcTotals(items);
  await pool.query('UPDATE orders SET subtotal=?, tax=?, total=? WHERE id=?', [subtotal, tax, total, orderId]);
}

router.get('/', auth, async (req, res) => {
  try {
    const { status, kitchen } = req.query;
    let sql = `
      SELECT o.*, u.name as staff_name, t.table_number
      FROM orders o
      JOIN users u ON u.id = o.staff_id
      LEFT JOIN tables t ON t.id = o.table_id
      WHERE o.status != 'cancelled'
    `;
    const params = [];
    if (kitchen === 'true') {
      sql += " AND o.status IN ('new', 'preparing', 'ready')";
    } else if (status) {
      sql += ' AND o.status = ?';
      params.push(status);
    }
    sql += ' ORDER BY o.created_at DESC';
    const [orders] = await pool.query(sql, params);

    const result = [];
    for (const order of orders) {
      const [items] = await pool.query(
        `SELECT oi.*, mi.name as item_name FROM order_items oi
         JOIN menu_items mi ON mi.id = oi.menu_item_id WHERE oi.order_id = ?`,
        [order.id]
      );
      result.push({ ...order, items });
    }
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const order = await getOrderWithItems(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', auth, async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const { order_type = 'walk-in', table_id, notes } = req.body;

    const [result] = await conn.query(
      'INSERT INTO orders (order_type, table_id, staff_id, status, notes) VALUES (?, ?, ?, ?, ?)',
      [order_type, table_id || null, req.user.id, 'new', notes || null]
    );

    if (table_id) {
      await conn.query("UPDATE tables SET status = 'occupied' WHERE id = ?", [table_id]);
    }

    await conn.commit();
    const order = await getOrderWithItems(result.insertId);
    res.status(201).json(order);
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ error: err.message });
  } finally {
    conn.release();
  }
});

router.post('/:id/items', auth, async (req, res) => {
  try {
    const { menu_item_id, quantity = 1, notes } = req.body;
    const [menuItems] = await pool.query('SELECT * FROM menu_items WHERE id = ?', [menu_item_id]);
    if (!menuItems.length) return res.status(404).json({ error: 'Menu item not found' });
    if (!menuItems[0].available) return res.status(400).json({ error: 'Item is out of stock' });

    const [orders] = await pool.query('SELECT status FROM orders WHERE id = ?', [req.params.id]);
    if (!orders.length) return res.status(404).json({ error: 'Order not found' });
    if (orders[0].status === 'paid' || orders[0].status === 'cancelled') {
      return res.status(400).json({ error: 'Cannot modify this order' });
    }

    const [existing] = await pool.query(
      'SELECT * FROM order_items WHERE order_id = ? AND menu_item_id = ? AND notes <=> ?',
      [req.params.id, menu_item_id, notes || null]
    );

    if (existing.length) {
      await pool.query('UPDATE order_items SET quantity = quantity + ? WHERE id = ?', [quantity, existing[0].id]);
    } else {
      await pool.query(
        'INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, notes) VALUES (?, ?, ?, ?, ?)',
        [req.params.id, menu_item_id, quantity, menuItems[0].price, notes || null]
      );
    }

    if (['new', 'preparing'].includes(orders[0].status)) {
      await pool.query("UPDATE orders SET status = 'preparing' WHERE id = ?", [req.params.id]);
    }

    await recalcOrder(req.params.id);
    const order = await getOrderWithItems(req.params.id);
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id/items/:itemId', auth, async (req, res) => {
  try {
    const { quantity, notes } = req.body;
    if (quantity <= 0) {
      await pool.query('DELETE FROM order_items WHERE id = ? AND order_id = ?', [req.params.itemId, req.params.id]);
    } else {
      await pool.query(
        'UPDATE order_items SET quantity = ?, notes = ? WHERE id = ? AND order_id = ?',
        [quantity, notes, req.params.itemId, req.params.id]
      );
    }
    await recalcOrder(req.params.id);
    const order = await getOrderWithItems(req.params.id);
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id/items/:itemId', auth, async (req, res) => {
  try {
    await pool.query('DELETE FROM order_items WHERE id = ? AND order_id = ?', [req.params.itemId, req.params.id]);
    await recalcOrder(req.params.id);
    const order = await getOrderWithItems(req.params.id);
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/:id/status', auth, async (req, res) => {
  try {
    const { status } = req.body;
    await pool.query('UPDATE orders SET status = ? WHERE id = ?', [status, req.params.id]);

    if (status === 'awaiting_payment' || status === 'served') {
      const [orders] = await pool.query('SELECT table_id FROM orders WHERE id = ?', [req.params.id]);
      if (orders[0]?.table_id) {
        await pool.query("UPDATE tables SET status = 'awaiting_payment' WHERE id = ?", [orders[0].table_id]);
      }
    }

    const order = await getOrderWithItems(req.params.id);
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/cancel', auth, async (req, res) => {
  try {
    await pool.query("UPDATE orders SET status = 'cancelled' WHERE id = ?", [req.params.id]);
    const [orders] = await pool.query('SELECT table_id FROM orders WHERE id = ?', [req.params.id]);
    if (orders[0]?.table_id) {
      const [active] = await pool.query(
        "SELECT COUNT(*) as c FROM orders WHERE table_id = ? AND status NOT IN ('paid', 'cancelled')",
        [orders[0].table_id]
      );
      if (active[0].c === 0) {
        await pool.query("UPDATE tables SET status = 'available' WHERE id = ?", [orders[0].table_id]);
      }
    }
    const order = await getOrderWithItems(req.params.id);
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/merge', auth, async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const { orderIds, targetTableId } = req.body;
    if (!orderIds?.length || orderIds.length < 2) {
      return res.status(400).json({ error: 'Need at least 2 orders to merge' });
    }

    const primaryId = orderIds[0];
    for (let i = 1; i < orderIds.length; i++) {
      await conn.query('UPDATE order_items SET order_id = ? WHERE order_id = ?', [primaryId, orderIds[i]]);
      await conn.query("UPDATE orders SET status = 'cancelled' WHERE id = ?", [orderIds[i]]);
    }

    if (targetTableId) {
      await conn.query('UPDATE orders SET table_id = ? WHERE id = ?', [targetTableId, primaryId]);
    }

    await conn.commit();
    await recalcOrder(primaryId);
    const order = await getOrderWithItems(primaryId);
    res.json(order);
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ error: err.message });
  } finally {
    conn.release();
  }
});

module.exports = router;
