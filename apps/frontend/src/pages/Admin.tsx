import React, { useState, useEffect } from 'react';
import AdminDashboard from './AdminDashboard';
import AdminLogin from './AdminLogin';

const Admin: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const session = sessionStorage.getItem('lumen_admin_session');
    setIsAuthenticated(session === 'authenticated');
  }, []);

  if (isAuthenticated === null) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Loading...</div>;
  }

  return isAuthenticated ? <AdminDashboard /> : <AdminLogin />;
};

export default Admin;
