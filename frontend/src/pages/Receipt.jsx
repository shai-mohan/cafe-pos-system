import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api';

export default function Receipt() {
  const { orderId } = useParams();
  const [data, setData] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    api.getReceipt(orderId).then(setData);
  }, [orderId]);

  if (!data) return <div className="loading">Loading receipt...</div>;

  const { order, items, payments } = data;

  return (
    <div className="receipt-page">
      <div className="receipt-card" id="receipt">
        <div className="receipt-header">
          <h2>☕ Cafe POS</h2>
          <p>123 Main Street</p>
          <p>Tel: (555) 123-4567</p>
        </div>
        <hr />
        <div className="receipt-meta">
          <p><strong>Order #:</strong> {order.id}</p>
          <p><strong>Date:</strong> {new Date(order.created_at).toLocaleString()}</p>
          <p><strong>Staff:</strong> {order.staff_name}</p>
          {order.table_number && <p><strong>Table:</strong> {order.table_number}</p>}
          <p><strong>Type:</strong> {order.order_type}</p>
        </div>
        <hr />
        <table className="receipt-items">
          <thead>
            <tr><th>Item</th><th>Qty</th><th>Price</th></tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td>
                  {item.item_name}
                  {item.notes && (
                    <>
                      <br />
                      <em>{item.notes}</em>
                    </>
                  )}
                </td>
                <td>{item.quantity}</td>
                <td>${(item.unit_price * item.quantity).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <hr />
        <div className="receipt-totals">
          <div><span>Subtotal</span><span>${parseFloat(order.subtotal).toFixed(2)}</span></div>
          <div><span>Tax (10%)</span><span>${parseFloat(order.tax).toFixed(2)}</span></div>
          <div className="total-final"><span>Total</span><span>${parseFloat(order.total).toFixed(2)}</span></div>
        </div>
        <hr />
        <div className="receipt-payments">
          <p><strong>Payments:</strong></p>
          {payments.map((p) => (
            <div key={p.id}>
              {p.method.toUpperCase()}: ${parseFloat(p.amount).toFixed(2)} ({p.status})
            </div>
          ))}
        </div>
        <hr />
        <p className="receipt-thanks">Thank you for your visit!</p>
      </div>
      <div className="receipt-actions">
        <button className="btn btn-primary" onClick={() => window.print()}>Print Receipt</button>
        <button className="btn btn-outline" onClick={() => navigate('/pos')}>New Order</button>
      </div>
    </div>
  );
}
