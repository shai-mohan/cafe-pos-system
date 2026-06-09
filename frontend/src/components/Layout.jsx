import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Layout() {
  const { user, logout, isManager } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="app-layout">
      <header className="top-bar">
        <div className="brand">
          <span className="brand-icon">☕</span>
          <span>Cafe POS</span>
        </div>
        <nav className="main-nav">
          <NavLink to="/pos">Orders</NavLink>
          <NavLink to="/tables">Tables</NavLink>
          <NavLink to="/kitchen">Kitchen</NavLink>
          <NavLink to="/payments">Payments</NavLink>
          {isManager && <NavLink to="/menu">Menu</NavLink>}
          {isManager && <NavLink to="/dashboard">Dashboard</NavLink>}
        </nav>
        <div className="user-bar">
          <span className="user-name">{user?.name}</span>
          <span className="user-role">{user?.role}</span>
          <button className="btn btn-ghost btn-sm" onClick={handleLogout}>Logout</button>
        </div>
      </header>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
