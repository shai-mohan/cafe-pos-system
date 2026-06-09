const API = '/api';

function getToken() {
  return localStorage.getItem('token');
}

async function request(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export const api = {
  login: (email, password) => request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  register: (data) => request('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  getMenu: () => request('/menu'),
  getCategories: () => request('/menu/categories'),
  createMenuItem: (data) => request('/menu', { method: 'POST', body: JSON.stringify(data) }),
  updateMenuItem: (id, data) => request(`/menu/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  toggleAvailability: (id, available) => request(`/menu/${id}/availability`, { method: 'PATCH', body: JSON.stringify({ available }) }),
  getRecommendations: (cartItemNames) => request('/menu/recommendations', { method: 'POST', body: JSON.stringify({ cartItemNames }) }),
  getTables: () => request('/tables'),
  transferTable: (fromId, targetTableId) => request(`/tables/${fromId}/transfer`, { method: 'PATCH', body: JSON.stringify({ targetTableId }) }),
  getOrders: (params = '') => request(`/orders${params}`),
  getOrder: (id) => request(`/orders/${id}`),
  createOrder: (data) => request('/orders', { method: 'POST', body: JSON.stringify(data) }),
  addOrderItem: (orderId, data) => request(`/orders/${orderId}/items`, { method: 'POST', body: JSON.stringify(data) }),
  updateOrderItem: (orderId, itemId, data) => request(`/orders/${orderId}/items/${itemId}`, { method: 'PUT', body: JSON.stringify(data) }),
  removeOrderItem: (orderId, itemId) => request(`/orders/${orderId}/items/${itemId}`, { method: 'DELETE' }),
  updateOrderStatus: (orderId, status) => request(`/orders/${orderId}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  cancelOrder: (orderId) => request(`/orders/${orderId}/cancel`, { method: 'POST' }),
  mergeOrders: (orderIds, targetTableId) => request('/orders/merge', { method: 'POST', body: JSON.stringify({ orderIds, targetTableId }) }),
  createPayment: (data) => request('/payments', { method: 'POST', body: JSON.stringify(data) }),
  splitPayment: (data) => request('/payments/split', { method: 'POST', body: JSON.stringify(data) }),
  getReceipt: (orderId) => request(`/payments/receipt/${orderId}`),
  getDashboard: () => request('/dashboard/summary'),
};
