import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';

export default function Payments() {
  const [orders, setOrders] = useState([]);
  const navigate = useNavigate();

  const load = async () => {
    const data = await api.getOrders();
    setOrders(data.filter((order) => ['served', 'awaiting_payment'].includes(order.status)));
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="payments-page">
      <h2>Payments</h2>
      <p className="subtitle">Open an order here to collect payment and free the table.</p>

      <div className="payments-list">
        {orders.length === 0 && <p className="empty-state">No orders waiting for payment</p>}
        {orders.map((order) => (
          <div key={order.id} className={`payment-queue-item status-${order.status}`}>
            <div>
              <h3>Order #{order.id}</h3>
              <p>
                {order.table_number ? `Table ${order.table_number}` : order.order_type} · {order.status}
              </p>
              <p>Total: ${parseFloat(order.total).toFixed(2)}</p>
            </div>
            <button className="btn btn-primary" onClick={() => navigate(`/payment/${order.id}`)}>
              Take Payment
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}