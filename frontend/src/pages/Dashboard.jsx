import { useState, useEffect } from 'react';
import { api } from '../api';

export default function Dashboard() {
  const [data, setData] = useState(null);

  useEffect(() => {
    api.getDashboard().then(setData).catch(console.error);
  }, []);

  if (!data) return <div className="loading">Loading dashboard...</div>;

  return (
    <div className="dashboard-page">
      <h2>Today's Dashboard</h2>

      <div className="metrics-grid">
        <div className="metric-card">
          <span className="metric-label">Total Sales</span>
          <span className="metric-value">${data.total_sales.toFixed(2)}</span>
        </div>
        <div className="metric-card">
          <span className="metric-label">Orders</span>
          <span className="metric-value">{data.order_count}</span>
        </div>
        <div className="metric-card">
          <span className="metric-label">Avg Order</span>
          <span className="metric-value">${data.avg_order.toFixed(2)}</span>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="card">
          <h3>Popular Items</h3>
          {data.popular_items.length === 0 ? (
            <p className="empty-state">No sales yet today</p>
          ) : (
            <ol className="popular-list">
              {data.popular_items.map((item, i) => (
                <li key={item.name}>
                  <span className="rank">#{i + 1}</span>
                  <span>{item.name}</span>
                  <span className="qty">{item.total_qty} sold</span>
                </li>
              ))}
            </ol>
          )}
        </div>

        <div className="card ai-insight-card">
          <h3>✨ AI Insights</h3>
          <p>{data.ai_insight}</p>
        </div>

        <div className="card">
          <h3>Order Status Breakdown</h3>
          {data.status_breakdown.length === 0 ? (
            <p className="empty-state">No orders today</p>
          ) : (
            <ul className="status-list">
              {data.status_breakdown.map((s) => (
                <li key={s.status}>
                  <span className={`status-badge status-${s.status}`}>{s.status}</span>
                  <span>{s.count}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
