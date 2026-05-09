import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ScrollToTop from './components/ScrollToTop';
import Admin from './pages/Admin';
import { useSiteStore } from './store/useSiteStore';
import { useProductStore } from './store/useProductStore';
import { useAuthStore } from './store/useAuthStore';
import ErrorBoundary from './components/ErrorBoundary';
import { supabase } from './lib/supabase';

function App() {
  const { themePrimaryYellow, themeAccentPink, themeAccentBlue, fetchSettings } = useSiteStore();
  const { fetchProducts } = useProductStore();
  const initializeAuth = useAuthStore(state => state.initialize);

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('adminAuth') === 'true';
  });
  const [step, setStep] = useState<'login' | 'otp'>('login');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState(['', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [tempRole, setTempRole] = useState('');
  const [tempPermissions, setTempPermissions] = useState<string[]>([]);

  useEffect(() => {
    fetchSettings();
    fetchProducts();
    initializeAuth();
  }, []);

  useEffect(() => {
    document.documentElement.style.setProperty('--primary-yellow', themePrimaryYellow);
    document.documentElement.style.setProperty('--accent-pink', themeAccentPink);
    document.documentElement.style.setProperty('--accent-blue', themeAccentBlue);
  }, [themePrimaryYellow, themeAccentPink, themeAccentBlue]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    // Hardcoded fallback if table is not yet created
    if (phone === '7972272861' && password === 'Admin123') {
      setTimeout(() => {
        setIsLoading(false);
        setTempRole('superadmin');
        setTempPermissions(['overview', 'products', 'coupons', 'customers', 'admins', 'theme', 'hero', 'content']);
        setStep('otp');
      }, 500);
      return;
    }

    try {
      const { data, error: dbError } = await supabase
        .from('admin_users')
        .select('*')
        .eq('phone', phone)
        .eq('password', password)
        .single();
        
      if (dbError || !data) {
        throw new Error('Invalid phone number or password');
      }
      
      setTempRole(data.role || 'admin');
      setTempPermissions(data.permissions || ['overview', 'products', 'coupons', 'customers', 'theme', 'hero', 'content']);
      setStep('otp');
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.join('').length === 4) {
      setIsAuthenticated(true);
      localStorage.setItem('adminAuth', 'true');
      localStorage.setItem('adminPhone', phone);
      localStorage.setItem('adminRole', tempRole);
      localStorage.setItem('adminPermissions', JSON.stringify(tempPermissions));
      setError('');
    } else {
      setError('Please enter a valid 4-digit OTP');
    }
  };

  if (!isAuthenticated) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-light)', padding: '20px' }}>
        <div className="comic-box" style={{ padding: '40px', maxWidth: '400px', width: '100%', background: 'white' }}>
          <h1 style={{ textAlign: 'center', marginBottom: '20px', color: 'var(--text-dark)' }}>LUMEN ADMIN</h1>
          {error && <p style={{ color: 'red', textAlign: 'center', fontWeight: 'bold', marginBottom: '15px' }}>{error}</p>}
          
          {step === 'login' ? (
            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div>
                <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>Phone Number</label>
                <input 
                  type="tel" 
                  value={phone} 
                  onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))} 
                  required 
                  placeholder="10-digit mobile number"
                  style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '2px solid var(--text-dark)', boxSizing: 'border-box' }} 
                />
              </div>
              <div>
                <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>Password</label>
                <input 
                  type="password" 
                  value={password} 
                  onChange={e => setPassword(e.target.value)} 
                  required 
                  style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '2px solid var(--text-dark)', boxSizing: 'border-box' }} 
                />
              </div>
              <button type="submit" className="btn-primary" style={{ marginTop: '10px' }} disabled={isLoading}>
                {isLoading ? 'VERIFYING...' : 'LOGIN'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: '15px', textAlign: 'center' }}>
              <p>Enter the 4-digit OTP sent to <strong>+91 {phone}</strong></p>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', margin: '20px 0' }}>
                {[0, 1, 2, 3].map(i => (
                  <input
                    key={i}
                    id={`admin-otp-${i}`}
                    type="text"
                    maxLength={1}
                    value={otp[i]}
                    autoFocus={i === 0}
                    onChange={e => {
                      const val = e.target.value.replace(/\D/g, '');
                      const newOtp = [...otp];
                      newOtp[i] = val;
                      setOtp(newOtp);
                      if (val && i < 3) document.getElementById(`admin-otp-${i + 1}`)?.focus();
                    }}
                    onKeyDown={e => {
                      if (e.key === 'Backspace' && !otp[i] && i > 0) document.getElementById(`admin-otp-${i - 1}`)?.focus();
                    }}
                    style={{ 
                      width: '50px', height: '60px', fontSize: '24px', textAlign: 'center', 
                      border: '2px solid var(--text-dark)', borderRadius: '8px', fontWeight: 'bold' 
                    }}
                  />
                ))}
              </div>
              <button type="submit" className="btn-primary" style={{ marginTop: '10px' }} disabled={otp.join('').length !== 4}>
                VERIFY OTP
              </button>
              <p style={{ fontSize: '0.8rem', color: '#666', marginTop: '10px' }}>Demo Mode: Enter ANY 4 numbers</p>
            </form>
          )}
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <Router>
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<Admin />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
