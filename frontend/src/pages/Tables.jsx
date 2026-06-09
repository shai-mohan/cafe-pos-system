import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';

export default function Tables() {
  const [tables, setTables] = useState([]);
  const [orders, setOrders] = useState([]);
  const [mergeSelection, setMergeSelection] = useState([]);
  const navigate = useNavigate();

  const load = async () => {
    const [t, o] = await Promise.all([api.getTables(), api.getOrders()]);
    setTables(t);
    setOrders(o.filter((ord) => ord.status !== 'paid' && ord.status !== 'cancelled'));
  };

  useEffect(() => { load(); }, []);

  const statusColor = { available: 'green', occupied: 'orange', awaiting_payment: 'red' };

  const toggleMerge = (orderId) => {
    setMergeSelection((prev) =>
      prev.includes(orderId) ? prev.filter((id) => id !== orderId) : [...prev, orderId]
    );
  };

  const handleMerge = async () => {
    if (mergeSelection.length < 2) { alert('Select at least 2 orders'); return; }
    const order = await api.mergeOrders(mergeSelection, null);
    alert(`Merged into Order #${order.id}`);
    setMergeSelection([]);
    load();
  };

  return (
    <div className="tables-page">
      <h2>Table Management</h2>

      <div className="tables-grid">
        {tables.map((t) => (
          <div key={t.id} className={`table-card status-${t.status}`}>
            <h3>{t.table_number}</h3>
            <span className={`table-status ${statusColor[t.status]}`}>
              {t.status.replace('_', ' ')}
            </span>
            {t.active_order_id && <span className="order-ref">Order #{t.active_order_id}</span>}
            {t.order_status === 'awaiting_payment' && t.active_order_id && (
              <button
                className="btn btn-primary btn-sm table-action-btn"
                onClick={() => navigate(`/payment/${t.active_order_id}`)}
              >
                Take Payment
              </button>
            )}
            <div className="table-actions">
              {t.status === 'occupied' && <span className="table-note">Occupied</span>}
              {t.status === 'awaiting_payment' && <span className="table-note">Ready for payment</span>}
              {t.status === 'available' && <span className="table-note">Available</span>}
            </div>
          </div>
        ))}
      </div>

      <div className="merge-section">
        <h3>Merge Orders</h3>
        <div className="merge-list">
          {orders.map((o) => (
            <label key={o.id} className="merge-item">
              <input
                type="checkbox"
                checked={mergeSelection.includes(o.id)}
                onChange={() => toggleMerge(o.id)}
              />
              Order #{o.id} — {o.table_number || o.order_type} — ${parseFloat(o.total).toFixed(2)}
            </label>
          ))}
        </div>
        {mergeSelection.length >= 2 && (
          <button className="btn btn-primary" onClick={handleMerge}>Merge Selected</button>
        )}
      </div>
    </div>
  );
}
