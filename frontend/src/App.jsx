import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import POS from './pages/POS';
import Kitchen from './pages/Kitchen';
import Tables from './pages/Tables';
import MenuManage from './pages/MenuManage';
import Dashboard from './pages/Dashboard';
import Payment from './pages/Payment';
import Receipt from './pages/Receipt';

function PrivateRoute({ children, managerOnly = false }) {
  const { user, isManager } = useAuth();
  if (!user) return <Navigate to="/login" />;
  if (managerOnly && !isManager) return <Navigate to="/pos" />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
        <Route index element={<Navigate to="/pos" />} />
        <Route path="pos" element={<POS />} />
        <Route path="kitchen" element={<Kitchen />} />
        <Route path="tables" element={<Tables />} />
        <Route path="payment/:orderId" element={<Payment />} />
        <Route path="receipt/:orderId" element={<Receipt />} />
        <Route path="menu" element={<PrivateRoute managerOnly><MenuManage /></PrivateRoute>} />
        <Route path="dashboard" element={<PrivateRoute managerOnly><Dashboard /></PrivateRoute>} />
      </Route>
    </Routes>
  );
}
