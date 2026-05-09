import React, { useState, useEffect } from 'react';
import { X, LogIn } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import AuthModal from './AuthModal';
import './PopupModal.css';

const PopupModal: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const user = useAuthStore(state => state.user);

  useEffect(() => {
    // Don't show if user is already logged in
    if (user) {
      setIsOpen(false);
      return;
    }

    if (localStorage.getItem('popup_dismissed') === 'true') return;
    
    const timer = setTimeout(() => {
      if (!useAuthStore.getState().user) {
        setIsOpen(true);
      }
    }, 5000); 
    return () => clearTimeout(timer);
  }, [user]);

  if (!isOpen || user) return null;

  return (
    <>
      <div className="popup-overlay">
        <div className="popup-content">
          <button className="popup-close" onClick={() => { setIsOpen(false); localStorage.setItem('popup_dismissed', 'true'); }}>
            <X size={24} />
          </button>
          <div className="popup-inner">
            <div className="popup-badge">EXCLUSIVE OFFER</div>
            <h2>LOGIN TO UNLOCK 10% OFF</h2>
            <p>Get an instant <strong>10% discount</strong> on your first order when you sign in!</p>
            <button className="btn-primary" onClick={() => setShowAuth(true)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', width: '100%' }}>
              <LogIn size={20} /> LOGIN TO UNLOCK
            </button>
            <p className="popup-note" style={{ marginTop: '15px', fontSize: '0.85rem', color: '#666' }}>No password required. Fast & Secure OTP Login.</p>
          </div>
        </div>
      </div>
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </>
  );
};

export default PopupModal;
