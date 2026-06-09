import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';

export default function POS() {
  const [menu, setMenu] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState('All');
  const [order, setOrder] = useState(null);
  const [tables, setTables] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [orderType, setOrderType] = useState('walk-in');
  const [selectedTable, setSelectedTable] = useState('');
  const [itemNotes, setItemNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const loadData = useCallback(async () => {
    const [menuData, catData, tableData] = await Promise.all([
      api.getMenu(), api.getCategories(), api.getTables(),
    ]);
    setMenu(menuData);
    setCategories(['All', ...catData]);
    setTables(tableData);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    if (!order?.items?.length) { setRecommendations([]); return; }
    const names = order.items.map((i) => i.item_name);
    api.getRecommendations(names).then(setRecommendations).catch(() => {});
  }, [order?.items]);

  const startOrder = async () => {
    setLoading(true);
    try {
      const data = await api.createOrder({
        order_type: orderType,
        table_id: orderType === 'table' ? parseInt(selectedTable) : null,
      });
      setOrder(data);
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const addItem = async (menuItem) => {
    if (!order) { alert('Start an order first'); return; }
    if (!menuItem.available) { alert('Item is out of stock'); return; }
    try {
      const updated = await api.addOrderItem(order.id, {
        menu_item_id: menuItem.id,
        quantity: 1,
        notes: itemNotes || null,
      });
      setOrder(updated);
      setItemNotes('');
    } catch (err) {
      alert(err.message);
    }
  };

  const updateQty = async (itemId, qty) => {
    try {
      const updated = await api.updateOrderItem(order.id, itemId, { quantity: qty });
      setOrder(updated);
    } catch (err) {
      alert(err.message);
    }
  };

  const removeItem = async (itemId) => {
    try {
      const updated = await api.removeOrderItem(order.id, itemId);
      setOrder(updated);
    } catch (err) {
      alert(err.message);
    }
  };

  const sendToKitchen = async () => {
    try {
      const updated = await api.updateOrderStatus(order.id, 'preparing');
      setOrder(updated);
      alert('Order sent to kitchen!');
    } catch (err) {
      alert(err.message);
    }
  };

  const filtered = activeCategory === 'All'
    ? menu
    : menu.filter((m) => m.category === activeCategory);

  if (!order) {
    return (
      <div className="pos-page">
        <h2>New Order</h2>
        <div className="order-type-selector">
          {['walk-in', 'table', 'takeaway'].map((t) => (
            <button
              key={t}
              className={`btn ${orderType === t ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setOrderType(t)}
            >
              {t === 'walk-in' ? 'Walk-in' : t === 'table' ? 'Table' : 'Takeaway'}
            </button>
          ))}
        </div>
        {orderType === 'table' && (
          <div className="table-select">
            <label>Select Table</label>
            <select value={selectedTable} onChange={(e) => setSelectedTable(e.target.value)}>
              <option value="">Choose table...</option>
              {tables.filter((t) => t.status === 'available').map((t) => (
                <option key={t.id} value={t.id}>{t.table_number}</option>
              ))}
            </select>
          </div>
        )}
        <button
          className="btn btn-primary btn-lg"
          onClick={startOrder}
          disabled={loading || (orderType === 'table' && !selectedTable)}
        >
          Start Order
        </button>
      </div>
    );
  }

  return (
    <div className="pos-page">
      <div className="pos-grid">
        <div className="menu-panel">
          <div className="category-tabs">
            {categories.map((cat) => (
              <button
                key={cat}
                className={`cat-tab ${activeCategory === cat ? 'active' : ''}`}
                onClick={() => setActiveCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
          <div className="menu-grid">
            {filtered.map((item) => (
              <button
                key={item.id}
                className={`menu-item-btn ${!item.available ? 'unavailable' : ''}`}
                onClick={() => addItem(item)}
                disabled={!item.available}
              >
                <span className="item-name">{item.name}</span>
                <span className="item-price">${parseFloat(item.price).toFixed(2)}</span>
                {!item.available && <span className="oos-badge">Out of Stock</span>}
              </button>
            ))}
          </div>
        </div>

        <div className="cart-panel">
          <div className="cart-header">
            <h3>Order #{order.id}</h3>
            <span className={`status-badge status-${order.status}`}>{order.status}</span>
          </div>
          {order.table_number && <p className="table-info">Table: {order.table_number}</p>}

          <div className="notes-input">
            <input
              placeholder="Special instructions (e.g. less sugar)"
              value={itemNotes}
              onChange={(e) => setItemNotes(e.target.value)}
            />
          </div>

          <div className="cart-items">
            {order.items?.length === 0 && <p className="empty-cart">No items yet</p>}
            {order.items?.map((item) => (
              <div key={item.id} className="cart-item">
                <div className="cart-item-info">
                  <strong>{item.item_name}</strong>
                  {item.notes && <span className="item-note">{item.notes}</span>}
                  <span className="item-line-price">${(item.unit_price * item.quantity).toFixed(2)}</span>
                </div>
                <div className="cart-item-actions">
                  <button className="qty-btn" onClick={() => updateQty(item.id, item.quantity - 1)}>−</button>
                  <span>{item.quantity}</span>
                  <button className="qty-btn" onClick={() => updateQty(item.id, item.quantity + 1)}>+</button>
                  <button className="btn-remove" onClick={() => removeItem(item.id)}>✕</button>
                </div>
              </div>
            ))}
          </div>

          {recommendations.length > 0 && (
            <div className="ai-suggestions">
              <h4>✨ AI Suggestions</h4>
              <div className="suggestion-chips">
                {recommendations.map((r) => (
                  <button key={r.id} className="suggestion-chip" onClick={() => addItem(r)}>
                    + {r.name} (${parseFloat(r.price).toFixed(2)})
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="cart-totals">
            <div className="total-row"><span>Subtotal</span><span>${parseFloat(order.subtotal || 0).toFixed(2)}</span></div>
            <div className="total-row"><span>Tax (10%)</span><span>${parseFloat(order.tax || 0).toFixed(2)}</span></div>
            <div className="total-row total-final"><span>Total</span><span>${parseFloat(order.total || 0).toFixed(2)}</span></div>
          </div>

          <div className="cart-actions">
            <button className="btn btn-secondary" onClick={sendToKitchen} disabled={!order.items?.length}>
              Send to Kitchen
            </button>
            <button
              className="btn btn-primary"
              onClick={() => navigate(`/payment/${order.id}`)}
              disabled={!order.items?.length}
            >
              Pay
            </button>
            <button className="btn btn-danger btn-sm" onClick={async () => {
              if (confirm('Cancel this order?')) {
                await api.cancelOrder(order.id);
                setOrder(null);
              }
            }}>
              Cancel Order
            </button>
            <button className="btn btn-ghost btn-sm" onClick={() => setOrder(null)}>
              New Order
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
