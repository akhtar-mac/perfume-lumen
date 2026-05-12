import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ScrollToTop from './components/ScrollToTop';
import Admin from './pages/Admin';
import { useSiteStore } from './store/useSiteStore';
import { useProductStore } from './store/useProductStore';
import { useAuthStore } from './store/useAuthStore';
import ErrorBoundary from './components/ErrorBoundary';
import { supabase } from './lib/supabase';
import { RecaptchaVerifier, signInWithPhoneNumber, type ConfirmationResult } from 'firebase/auth';
import { auth } from './lib/firebase';

// Extend Window for recaptcha
declare global {
  interface Window {
    adminRecaptchaVerifier?: RecaptchaVerifier;
  }
}

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
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [tempRole, setTempRole] = useState('');
  const [tempPermissions, setTempPermissions] = useState<string[]>([]);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);

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

    let role = '';
    let permissions: string[] = [];

    // Hardcoded superadmin fallback
    if (phone === '7972272861' && password === 'Admin@1999') {
      role = 'superadmin';
      permissions = ['overview', 'products', 'coupons', 'customers', 'admins', 'theme', 'hero', 'content'];
    } else {
      // Check database for other admins
      try {
        const { data, error: dbError } = await supabase
          .from('admin_users')
          .select('*')
          .eq('phone', phone)
          .eq('password', password)
          .single();

        if (dbError || !data) {
          setError('Invalid phone number or password');
          setIsLoading(false);
          return;
        }

        role = data.role || 'admin';
        permissions = data.permissions || ['overview', 'products', 'coupons', 'customers', 'theme', 'hero', 'content'];
      } catch {
        setError('Login failed. Please try again.');
        setIsLoading(false);
        return;
      }
    }

    // Credentials verified, now send real OTP
    try {
      if (!window.adminRecaptchaVerifier) {
        window.adminRecaptchaVerifier = new RecaptchaVerifier(auth, 'admin-recaptcha', { size: 'invisible' });
      }
      const result = await signInWithPhoneNumber(auth, `+91${phone}`, window.adminRecaptchaVerifier);
      setConfirmationResult(result);
      setTempRole(role);
      setTempPermissions(permissions);
      setStep('otp');
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpString = otp.join('');
    if (otpString.length !== 6) {
      setError('Please enter the 6-digit OTP');
      return;
    }

    if (!confirmationResult) {
      setError('Session expired. Please go back and try again.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await confirmationResult.confirm(otpString);
      setIsAuthenticated(true);
      localStorage.setItem('adminAuth', 'true');
      localStorage.setItem('adminPhone', phone);
      localStorage.setItem('adminRole', tempRole);
      localStorage.setItem('adminPermissions', JSON.stringify(tempPermissions));
    } catch (err: any) {
      setError('Invalid OTP. Please check your SMS and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-light)', padding: '20px' }}>
        <div className="comic-box" style={{ padding: '40px', maxWidth: '400px', width: '100%', background: 'white' }}>
          <h1 style={{ textAlign: 'center', marginBottom: '8px', color: 'var(--text-dark)' }}>LUMEN ADMIN</h1>
          <p style={{ textAlign: 'center', color: '#666', marginBottom: '24px', fontSize: '0.9rem' }}>
            {step === 'login' ? 'Enter your credentials to continue' : `OTP sent to +91 ${phone}`}
          </p>

          {error && <p style={{ color: 'red', textAlign: 'center', fontWeight: 'bold', marginBottom: '15px', fontSize: '0.85rem' }}>{error}</p>}

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
                {isLoading ? 'SENDING OTP...' : 'LOGIN'}
              </button>
              <p style={{ fontSize: '0.65rem', color: '#aaa', textAlign: 'center' }}>
                Protected by reCAPTCHA — <a href="https://policies.google.com/privacy" target="_blank" rel="noreferrer" style={{ color: '#0369a1' }}>Privacy</a> & <a href="https://policies.google.com/terms" target="_blank" rel="noreferrer" style={{ color: '#0369a1' }}>Terms</a>
              </p>
              <div id="admin-recaptcha"></div>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: '15px', textAlign: 'center' }}>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', margin: '10px 0' }}>
                {[0, 1, 2, 3, 4, 5].map(i => (
                  <input
                    key={i}
                    id={`admin-otp-${i}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={otp[i]}
                    autoFocus={i === 0}
                    onChange={e => {
                      const val = e.target.value.replace(/\D/g, '');
                      const newOtp = [...otp];
                      newOtp[i] = val;
                      setOtp(newOtp);
                      if (val && i < 5) document.getElementById(`admin-otp-${i + 1}`)?.focus();
                    }}
                    onKeyDown={e => {
                      if (e.key === 'Backspace' && !otp[i] && i > 0) document.getElementById(`admin-otp-${i - 1}`)?.focus();
                    }}
                    style={{
                      width: '44px', height: '54px', fontSize: '22px', textAlign: 'center',
                      border: '2px solid var(--text-dark)', borderRadius: '8px', fontWeight: 'bold'
                    }}
                  />
                ))}
              </div>
              <button type="submit" className="btn-primary" style={{ marginTop: '10px' }} disabled={otp.join('').length !== 6 || isLoading}>
                {isLoading ? 'VERIFYING...' : 'VERIFY OTP'}
              </button>
              <button type="button" style={{ background: 'none', border: 'none', color: '#0369a1', cursor: 'pointer', fontSize: '0.85rem' }} onClick={() => { setStep('login'); setOtp(['', '', '', '', '', '']); setError(''); }}>
                ← Change number / Go back
              </button>
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
