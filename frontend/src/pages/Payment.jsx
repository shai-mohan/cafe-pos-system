import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api';

const METHODS = [
  { id: 'cash', label: 'Cash', icon: '💵' },
  { id: 'card', label: 'Card', icon: '💳' },
  { id: 'qr', label: 'QR Pay', icon: '📱' },
  { id: 'ewallet', label: 'E-Wallet', icon: '👛' },
];

export default function Payment() {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [method, setMethod] = useState('cash');
  const [amount, setAmount] = useState('');
  const [splitMode, setSplitMode] = useState(false);
  const [splits, setSplits] = useState([{ amount: '', method: 'cash' }, { amount: '', method: 'card' }]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    api.getOrder(orderId).then((o) => {
      setOrder(o);
      const balance = parseFloat(o.total) - (o.amount_paid || 0);
      setAmount(balance.toFixed(2));
    });
  }, [orderId]);

  const balance = order ? parseFloat(order.total) - (order.amount_paid || 0) : 0;

  const handlePay = async () => {
    setLoading(true);
    try {
      await api.createPayment({
        order_id: parseInt(orderId),
        amount: parseFloat(amount),
        method,
        status: 'completed',
      });
      navigate(`/receipt/${orderId}`);
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFailedRetry = async () => {
    setMethod('cash');
    alert('Payment failed. Try another method.');
  };

  const handleSplit = async () => {
    const total = splits.reduce((s, sp) => s + parseFloat(sp.amount || 0), 0);
    if (Math.abs(total - parseFloat(order.total)) > 0.01) {
      alert(`Split total ($${total.toFixed(2)}) must equal order total ($${order.total})`);
      return;
    }
    setLoading(true);
    try {
      await api.splitPayment({
        order_id: parseInt(orderId),
        splits: splits.map((s) => ({ amount: parseFloat(s.amount), method: s.method, status: 'completed' })),
      });
      navigate(`/receipt/${orderId}`);
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const splitEqually = () => {
    const half = (parseFloat(order.total) / 2).toFixed(2);
    setSplits([
      { amount: half, method: 'cash' },
      { amount: (parseFloat(order.total) - parseFloat(half)).toFixed(2), method: 'card' },
    ]);
  };

  if (!order) return <div className="loading">Loading...</div>;

  return (
    <div className="payment-page">
      <h2>Payment — Order #{order.id}</h2>

      <div className="payment-grid">
        <div className="card payment-summary">
          <h3>Order Summary</h3>
          {order.items?.map((item) => (
            <div key={item.id} className="payment-line">
              <span>{item.quantity}× {item.item_name}</span>
              <span>${(item.unit_price * item.quantity).toFixed(2)}</span>
            </div>
          ))}
          <div className="payment-totals">
            <div><span>Subtotal</span><span>${parseFloat(order.subtotal).toFixed(2)}</span></div>
            <div><span>Tax</span><span>${parseFloat(order.tax).toFixed(2)}</span></div>
            <div className="total-final"><span>Total</span><span>${parseFloat(order.total).toFixed(2)}</span></div>
            {order.amount_paid > 0 && (
              <>
                <div><span>Paid</span><span>${order.amount_paid.toFixed(2)}</span></div>
                <div className="total-final"><span>Balance</span><span>${balance.toFixed(2)}</span></div>
              </>
            )}
          </div>
        </div>

        <div className="card payment-form">
          <div className="payment-tabs">
            <button className={`btn ${!splitMode ? 'btn-primary' : 'btn-outline'}`} onClick={() => setSplitMode(false)}>Full / Partial</button>
            <button className={`btn ${splitMode ? 'btn-primary' : 'btn-outline'}`} onClick={() => setSplitMode(true)}>Split Bill</button>
          </div>

          {!splitMode ? (
            <>
              <h3>Payment Method</h3>
              <div className="method-grid">
                {METHODS.map((m) => (
                  <button
                    key={m.id}
                    className={`method-btn ${method === m.id ? 'active' : ''}`}
                    onClick={() => setMethod(m.id)}
                  >
                    <span>{m.icon}</span>
                    <span>{m.label}</span>
                  </button>
                ))}
              </div>
              <div className="form-group">
                <label>Amount</label>
                <input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} />
              </div>
              <div className="payment-actions">
                <button className="btn btn-primary btn-lg" onClick={handlePay} disabled={loading}>
                  {loading ? 'Processing...' : `Pay $${parseFloat(amount || 0).toFixed(2)}`}
                </button>
                <button className="btn btn-danger btn-sm" onClick={handleFailedRetry}>Simulate Failed Payment</button>
              </div>
            </>
          ) : (
            <>
              <h3>Split Bill</h3>
              <button className="btn btn-outline btn-sm" onClick={splitEqually}>Split Equally (2)</button>
              {splits.map((s, i) => (
                <div key={i} className="split-row">
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Amount"
                    value={s.amount}
                    onChange={(e) => {
                      const updated = [...splits];
                      updated[i].amount = e.target.value;
                      setSplits(updated);
                    }}
                  />
                  <select
                    value={s.method}
                    onChange={(e) => {
                      const updated = [...splits];
                      updated[i].method = e.target.value;
                      setSplits(updated);
                    }}
                  >
                    {METHODS.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
                  </select>
                </div>
              ))}
              <button className="btn btn-ghost btn-sm" onClick={() => setSplits([...splits, { amount: '', method: 'cash' }])}>
                + Add Split
              </button>
              <button className="btn btn-primary btn-lg" onClick={handleSplit} disabled={loading}>
                Complete Split Payment
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
