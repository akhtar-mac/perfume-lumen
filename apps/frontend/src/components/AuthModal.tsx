import React, { useState, useEffect } from 'react';
import { X, Loader, Phone, ShieldCheck, ArrowLeft } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useNavigate } from 'react-router-dom';
import { RecaptchaVerifier, signInWithPhoneNumber, type ConfirmationResult } from 'firebase/auth';
import { auth } from '../lib/firebase';
import './AuthModal.css';

declare global {
  interface Window {
    recaptchaVerifier: any;
    confirmationResult: any;
  }
}

interface AuthModalProps {
  onClose: () => void;
}

const DEFAULT_PHONE = '7972272861';
const DEFAULT_OTP = '000000';

const AuthModal: React.FC<AuthModalProps> = ({ onClose }) => {
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState(DEFAULT_PHONE);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [timer, setTimer] = useState(0);
  const [isShaking, setIsShaking] = useState(false);
  const [otpState, setOtpState] = useState<'idle' | 'success' | 'error'>('idle');
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [isDefaultUser, setIsDefaultUser] = useState(true);
  
  const navigate = useNavigate();

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (timer > 0 && otpState !== 'success') {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer, otpState]);

  useEffect(() => {
    if (!window.recaptchaVerifier) {
      try {
        window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
          size: 'invisible',
        });
      } catch (e) {
        console.warn('Recaptcha init error:', e);
      }
    }
  }, []);

  // Check if using default phone
  useEffect(() => {
    setIsDefaultUser(phone === DEFAULT_PHONE);
  }, [phone]);

  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!phone || phone.length !== 10) {
      setErrorMsg('Please enter a valid 10-digit phone number');
      return;
    }
    
    setIsLoading(true);
    setErrorMsg('');

    // For default user, skip Firebase and go straight to OTP
    if (phone === DEFAULT_PHONE) {
      setTimeout(() => {
        setIsLoading(false);
        setStep('otp');
        setTimer(30);
        setErrorMsg('');
      }, 800);
      return;
    }

    try {
      const formattedPhone = `+91${phone}`;
      const appVerifier = window.recaptchaVerifier;
      const result = await signInWithPhoneNumber(auth, formattedPhone, appVerifier);
      setConfirmationResult(result);
      
      setIsLoading(false);
      setStep('otp');
      setTimer(30);
    } catch (error: any) {
      console.error(error);
      setIsLoading(false);
      setErrorMsg(error.message || 'Failed to send OTP. Please try again.');
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = otp.join('');
    
    if (token.length < 6) {
      setOtpState('error');
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 600);
      return;
    }

    setIsLoading(true);
    setErrorMsg('');

    // For default user, accept 000000 as valid OTP
    if (phone === DEFAULT_PHONE && token === DEFAULT_OTP) {
      setOtpState('success');
      setTimeout(() => {
        setIsLoading(false);
        // Create a mock user session for default user
        onClose();
        navigate('/profile');
      }, 1000);
      return;
    }

    // For default user with wrong OTP
    if (phone === DEFAULT_PHONE && token !== DEFAULT_OTP) {
      setIsLoading(false);
      setOtpState('error');
      setErrorMsg(`Hint: Use ${DEFAULT_OTP} as OTP for testing`);
      return;
    }

    if (!confirmationResult) {
      setErrorMsg('Session expired. Please try again.');
      setIsLoading(false);
      return;
    }

    try {
      await confirmationResult.confirm(token);
      setOtpState('success');
      
      setTimeout(() => {
        setIsLoading(false);
        const currentProfile = useAuthStore.getState().profile;
        if (!currentProfile || !currentProfile.full_name || currentProfile.addresses?.length === 0) {
          onClose();
          navigate('/profile-setup');
        } else {
          onClose();
        }
      }, 1000);
      
    } catch (error: any) {
      setIsLoading(false);
      setOtpState('error');
      setErrorMsg(error.message || 'Invalid OTP');
    }
  };

  return (
    <div className="auth-overlay">
      <div className="auth-modal tm-style slide-in">
        <button className="close-wizard" onClick={onClose}><X size={20} strokeWidth={3} /></button>
        
        {step === 'phone' ? (
          <form onSubmit={handleSendOtp} className="wizard-form slide-in">
            <div className="tm-header">
              <div className="auth-logo">
                <ShieldCheck size={48} color="var(--accent-pink)" />
              </div>
              <h2>Welcome to LUMEN</h2>
              <p>Enter your mobile number to login or sign up</p>
            </div>
            
            {errorMsg && <div className="error-text">{errorMsg}</div>}

            <div className="floating-input-group">
              <span className="country-code">+91</span>
              <input 
                type="tel" 
                id="auth-phone" 
                className="floating-input with-prefix"
                value={phone}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                  setPhone(val);
                }}
                required 
                autoFocus 
                placeholder=" "
              />
              <label htmlFor="auth-phone" className="floating-label">Mobile Number</label>
            </div>

            {/* Quick fill for default user */}
            <div className="quick-fill-section">
              <p className="quick-fill-hint">Quick access:</p>
              <button type="button" className="quick-fill-btn" onClick={() => { setPhone(DEFAULT_PHONE); }}>
                <Phone size={16} />
                Use {DEFAULT_PHONE}
              </button>
            </div>

            <button type="submit" className="btn-primary tm-btn" disabled={isLoading || phone.length !== 10}>
              {isLoading ? <Loader className="spin" size={20} /> : 'SEND OTP'}
            </button>
            
            <p className="terms-text">
              By continuing, you agree to our <a href="/terms" onClick={e => e.stopPropagation()}>Terms</a> & <a href="/privacy" onClick={e => e.stopPropagation()}>Privacy Policy</a>
            </p>
            <div id="recaptcha-container"></div>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="wizard-form slide-in text-center">
            <button type="button" className="back-btn" onClick={() => setStep('phone')}>
              <ArrowLeft size={18} /> Change Number
            </button>
            
            <div className="tm-header">
              <div className="auth-logo">
                <ShieldCheck size={48} color="var(--accent-pink)" />
              </div>
              <h2>Verify OTP</h2>
              <p>Code sent to <strong>+91 {phone}</strong></p>
            </div>

            {errorMsg && <div className="error-text">{errorMsg}</div>}

            {/* Hint for default user */}
            {isDefaultUser && otpState !== 'success' && (
              <div className="otp-hint">
                💡 Test OTP: <strong>{DEFAULT_OTP}</strong>
              </div>
            )}

            <div className={`otp-container ${isShaking ? 'otp-shake' : ''}`}>
              {[0, 1, 2, 3, 4, 5].map(i => (
                <input
                  key={i} id={`auth-otp-${i}`} type="text" inputMode="numeric" maxLength={1}
                  className={`otp-box ${otpState}`} value={otp[i] || ''} autoFocus={i === 0}
                  onChange={e => {
                    setOtpState('idle');
                    const val = e.target.value.replace(/\D/g, '');
                    const arr = [...otp];
                    arr[i] = val;
                    setOtp(arr);
                    if (val && i < 5) document.getElementById(`auth-otp-${i + 1}`)?.focus();
                  }}
                  onKeyDown={e => {
                    if (e.key === 'Backspace' && !otp[i] && i > 0) document.getElementById(`auth-otp-${i - 1}`)?.focus();
                  }}
                />
              ))}
            </div>

            <div className="timer-text">
              {timer > 0 ? (
                <span>Resend OTP in <strong>00:{timer.toString().padStart(2, '0')}</strong></span>
              ) : (
                <button type="button" className="resend-btn" onClick={handleSendOtp}>Resend OTP</button>
              )}
            </div>

            <button type="submit" className="btn-primary tm-btn" disabled={isLoading || otp.join('').length !== 6 || otpState === 'success'}>
              {isLoading ? <Loader className="spin" size={20} /> : (otpState === 'success' ? '✓ VERIFIED' : 'VERIFY & CONTINUE')}
            </button>
            
            <div id="recaptcha-container"></div>
          </form>
        )}
      </div>
    </div>
  );
};

export default AuthModal;
