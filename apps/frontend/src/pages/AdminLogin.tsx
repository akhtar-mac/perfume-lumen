import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import AdminDashboard from './AdminDashboard';
import { Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import './AdminLogin.css';

const ADMIN_PASSWORD = 'admin1234';
const ADMIN_SESSION_KEY = 'lumen_admin_session';

const AdminLogin: React.FC = () => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Check if already logged in
    const session = sessionStorage.getItem(ADMIN_SESSION_KEY);
    if (session === 'authenticated') {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Simulate a small delay
    setTimeout(() => {
      if (password === ADMIN_PASSWORD) {
        sessionStorage.setItem(ADMIN_SESSION_KEY, 'authenticated');
        setIsAuthenticated(true);
      } else {
        setError('Invalid password. Access denied.');
      }
      setIsLoading(false);
    }, 500);
  };

  if (isAuthenticated) {
    return <AdminDashboard />;
  }

  return (
    <div className="admin-login-page">
      <div className="admin-login-container">
        <div className="admin-login-box">
          <div className="admin-login-header">
            <div className="admin-lock-icon">
              <Lock size={32} />
            </div>
            <h1>LUMEN Admin</h1>
            <p>Enter password to access the dashboard</p>
          </div>

          <form onSubmit={handleLogin} className="admin-login-form">
            {error && (
              <div className="admin-error">
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            <div className="password-input-group">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Admin Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoFocus
                className="admin-password-input"
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <button type="submit" className="admin-login-btn" disabled={isLoading || !password}>
              {isLoading ? 'Verifying...' : 'ACCESS DASHBOARD'}
            </button>
          </form>

          <div className="admin-login-footer">
            <p>© {new Date().getFullYear()} LUMEN Perfumes</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
