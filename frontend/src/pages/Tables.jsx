import { useState, useEffect } from 'react';
import { api } from '../api';

export default function Tables() {
  const [tables, setTables] = useState([]);
  const [orders, setOrders] = useState([]);
  const [mergeSelection, setMergeSelection] = useState([]);
  const [transferFrom, setTransferFrom] = useState(null);

  const load = async () => {
    const [t, o] = await Promise.all([api.getTables(), api.getOrders()]);
    setTables(t);
    setOrders(o.filter((ord) => ord.status !== 'paid' && ord.status !== 'cancelled'));
  };

  useEffect(() => { load(); }, []);

  const statusColor = { available: 'green', occupied: 'orange', awaiting_payment: 'red' };

  const handleTransfer = async (targetId) => {
    if (!transferFrom) return;
    await api.transferTable(transferFrom, targetId);
    setTransferFrom(null);
    load();
  };

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
          <div
            key={t.id}
            className={`table-card status-${t.status}`}
            onClick={() => transferFrom && t.status === 'available' && handleTransfer(t.id)}
          >
            <h3>{t.table_number}</h3>
            <span className={`table-status ${statusColor[t.status]}`}>
              {t.status.replace('_', ' ')}
            </span>
            {t.active_order_id && <span className="order-ref">Order #{t.active_order_id}</span>}
            <div className="table-actions">
              <button
                className="btn btn-sm btn-outline"
                onClick={(e) => { e.stopPropagation(); setTransferFrom(t.id); }}
              >
                Transfer From
              </button>
            </div>
          </div>
        ))}
      </div>

      {transferFrom && (
        <div className="alert alert-info">
          Select an available table to transfer orders from table #{transferFrom}
          <button className="btn btn-sm" onClick={() => setTransferFrom(null)}>Cancel</button>
        </div>
      )}

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
