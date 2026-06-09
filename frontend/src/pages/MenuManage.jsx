import { useState, useEffect } from 'react';
import { api } from '../api';

export default function MenuManage() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ name: '', price: '', category: 'Coffee', description: '' });
  const [editing, setEditing] = useState(null);

  const load = () => api.getMenu().then(setItems);
  useEffect(() => { load(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = { ...form, price: parseFloat(form.price), available: true };
    if (editing) {
      await api.updateMenuItem(editing, { ...data, available: items.find((i) => i.id === editing)?.available });
    } else {
      await api.createMenuItem(data);
    }
    setForm({ name: '', price: '', category: 'Coffee', description: '' });
    setEditing(null);
    load();
  };

  const toggleStock = async (id, current) => {
    await api.toggleAvailability(id, !current);
    load();
  };

  const startEdit = (item) => {
    setEditing(item.id);
    setForm({ name: item.name, price: item.price, category: item.category, description: item.description || '' });
  };

  const categories = ['Coffee', 'Tea', 'Main Course', 'Desserts', 'Beverages'];

  return (
    <div className="menu-manage-page">
      <h2>Menu Management</h2>

      <form className="menu-form card" onSubmit={handleSubmit}>
        <h3>{editing ? 'Edit Item' : 'Add New Item'}</h3>
        <div className="form-row">
          <div className="form-group">
            <label>Name</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div className="form-group">
            <label>Price ($)</label>
            <input type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required />
          </div>
          <div className="form-group">
            <label>Category</label>
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              {categories.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
        </div>
        <div className="form-group">
          <label>Description</label>
          <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </div>
        <div className="form-actions">
          <button type="submit" className="btn btn-primary">{editing ? 'Update' : 'Add Item'}</button>
          {editing && <button type="button" className="btn btn-ghost" onClick={() => { setEditing(null); setForm({ name: '', price: '', category: 'Coffee', description: '' }); }}>Cancel</button>}
        </div>
      </form>

      <div className="menu-table card">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Category</th>
              <th>Price</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className={!item.available ? 'row-unavailable' : ''}>
                <td>{item.name}</td>
                <td>{item.category}</td>
                <td>${parseFloat(item.price).toFixed(2)}</td>
                <td>
                  <span className={`stock-badge ${item.available ? 'in-stock' : 'out-stock'}`}>
                    {item.available ? 'Available' : 'Out of Stock'}
                  </span>
                </td>
                <td>
                  <button className="btn btn-sm btn-outline" onClick={() => startEdit(item)}>Edit</button>
                  <button className="btn btn-sm" onClick={() => toggleStock(item.id, item.available)}>
                    {item.available ? 'Mark Out' : 'Mark In'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
