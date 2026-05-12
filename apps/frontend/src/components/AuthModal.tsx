import React, { useState, useEffect } from 'react';
import { X, Loader } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useNavigate } from 'react-router-dom';
import { RecaptchaVerifier, signInWithPhoneNumber, type ConfirmationResult } from 'firebase/auth';
import { auth } from '../lib/firebase';
import './AuthModal.css';

declare global {
  interface Window {
    recaptchaVerifier: any;
  }
}

interface AuthModalProps {
  onClose: () => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ onClose }) => {
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']); // Firebase uses 6-digit OTPs
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [timer, setTimer] = useState(0);
  const [isShaking, setIsShaking] = useState(false);
  const [otpState, setOtpState] = useState<'idle' | 'success' | 'error'>('idle');
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  
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
      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
      });
    }
  }, []);

  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!phone || phone.length !== 10) {
      setErrorMsg('Please enter a valid 10-digit phone number');
      return;
    }
    
    setIsLoading(true);
    setErrorMsg('');

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

    if (!confirmationResult) {
      setErrorMsg('Session expired. Please try again.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');

    try {
      await confirmationResult.confirm(token);
      setOtpState('success');
      
      setTimeout(() => {
        setIsLoading(false);
        const currentProfile = useAuthStore.getState().profile;
        // If profile does not exist or missing basic data, navigate to setup
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
              <h2>Login or Sign Up</h2>
              <p>Please enter your mobile number to proceed</p>
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

            <button type="submit" className="btn-primary tm-btn" disabled={isLoading || phone.length !== 10}>
              {isLoading ? <Loader className="spin" size={20} /> : 'CONTINUE'}
            </button>
            <p className="terms-text" style={{ fontSize: '0.7rem', color: '#888', marginTop: '10px' }}>
              This site is protected by reCAPTCHA and the Google <a href="https://policies.google.com/privacy" target="_blank" rel="noreferrer" style={{color: '#0369a1', textDecoration: 'none'}}>Privacy Policy</a> and <a href="https://policies.google.com/terms" target="_blank" rel="noreferrer" style={{color: '#0369a1', textDecoration: 'none'}}>Terms of Service</a> apply.
            </p>
            <div id="recaptcha-container"></div>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="wizard-form slide-in text-center">
            <div className="tm-header">
              <h2>Verify OTP</h2>
              <p>Sent to <strong>+91 {phone}</strong> <span className="edit-link" onClick={() => setStep('phone')}>Edit</span></p>
            </div>

            {errorMsg && <div className="error-text">{errorMsg}</div>}

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
              {isLoading ? <Loader className="spin" size={20} /> : (otpState === 'success' ? 'VERIFIED' : 'VERIFY')}
            </button>
            <p className="terms-text">Secure login powered by Firebase</p>
            <div id="recaptcha-container"></div>
          </form>
        )}
      </div>
    </div>
  );
};

export default AuthModal;
