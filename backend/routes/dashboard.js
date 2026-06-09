const express = require('express');
const pool = require('../db/connection');
const { auth, managerOnly } = require('../middleware/auth');

const router = express.Router();

router.get('/summary', auth, managerOnly, async (req, res) => {
  try {
    const [sales] = await pool.query(`
      SELECT COALESCE(SUM(total), 0) as total_sales,
             COUNT(*) as order_count,
             COALESCE(AVG(total), 0) as avg_order
      FROM orders
      WHERE status = 'paid' AND DATE(created_at) = CURDATE()
    `);

    const [popular] = await pool.query(`
      SELECT mi.name, SUM(oi.quantity) as total_qty
      FROM order_items oi
      JOIN menu_items mi ON mi.id = oi.menu_item_id
      JOIN orders o ON o.id = oi.order_id
      WHERE o.status = 'paid' AND DATE(o.created_at) = CURDATE()
      GROUP BY mi.id, mi.name
      ORDER BY total_qty DESC
      LIMIT 5
    `);

    const [statusBreakdown] = await pool.query(`
      SELECT status, COUNT(*) as count
      FROM orders
      WHERE DATE(created_at) = CURDATE() AND status != 'cancelled'
      GROUP BY status
    `);

    res.json({
      total_sales: parseFloat(sales[0].total_sales),
      order_count: sales[0].order_count,
      avg_order: Math.round(parseFloat(sales[0].avg_order) * 100) / 100,
      popular_items: popular,
      status_breakdown: statusBreakdown,
      ai_insight: generateInsight(sales[0], popular),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

function generateInsight(sales, popular) {
  const insights = [];
  if (popular.length > 0) {
    insights.push(`${popular[0].name} is today's top seller with ${popular[0].total_qty} orders.`);
  }
  if (parseFloat(sales.avg_order) < 10) {
    insights.push('Average order value is low — consider upselling desserts and beverages.');
  } else if (parseFloat(sales.avg_order) > 15) {
    insights.push('Strong average order value — customers are ordering well!');
  }
  if (sales.order_count < 5) {
    insights.push('Slow day so far — promote combo deals to boost sales.');
  }
  return insights.length ? insights.join(' ') : 'Keep up the great work!';
}

module.exports = router;
