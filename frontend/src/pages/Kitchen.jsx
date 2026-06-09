import { useState, useEffect } from 'react';
import { api } from '../api';

const STATUS_FLOW = ['new', 'preparing', 'ready', 'served'];

export default function Kitchen() {
  const [orders, setOrders] = useState([]);

  const load = async () => {
    const data = await api.getOrders('?kitchen=true');
    setOrders(data.filter((o) => o.status !== 'served'));
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, []);

  const advanceStatus = async (order) => {
    const idx = STATUS_FLOW.indexOf(order.status);
    const next = STATUS_FLOW[Math.min(idx + 1, STATUS_FLOW.length - 1)];
    await api.updateOrderStatus(order.id, next);
    load();
  };

  return (
    <div className="kitchen-page">
      <h2>Kitchen Display</h2>
      <p className="subtitle">Auto-refreshes every 5 seconds</p>
      <div className="kitchen-grid">
        {orders.length === 0 && <p className="empty-state">No active kitchen orders</p>}
        {orders.map((order) => (
          <div key={order.id} className={`kitchen-card status-${order.status}`}>
            <div className="kitchen-card-header">
              <h3>Order #{order.id}</h3>
              {order.table_number && <span className="table-tag">{order.table_number}</span>}
              <span className={`status-badge status-${order.status}`}>{order.status}</span>
            </div>
            <ul className="kitchen-items">
              {order.items?.map((item) => (
                <li key={item.id}>
                  <strong>{item.quantity}× {item.item_name}</strong>
                  {item.notes && <em className="kitchen-note">{item.notes}</em>}
                </li>
              ))}
            </ul>
            <button className="btn btn-primary btn-block" onClick={() => advanceStatus(order)}>
              Mark as {STATUS_FLOW[STATUS_FLOW.indexOf(order.status) + 1] || 'served'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
