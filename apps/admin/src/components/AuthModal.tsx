import React, { useState } from 'react';
import { X, Mail, Lock, Loader } from 'lucide-react';
import { supabase } from '../lib/supabase';
import './AuthModal.css';

interface AuthModalProps {
  onClose: () => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ onClose }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');

    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setErrorMsg(error.message);
      else onClose();
    } else {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) setErrorMsg(error.message);
      else {
        // Automatically close on successful signup (Supabase logs them in usually)
        onClose();
      }
    }
    setIsLoading(false);
  };

  return (
    <div className="auth-overlay">
      <div className="auth-modal slide-in">
        <button className="close-auth" onClick={onClose}><X size={24} /></button>
        
        <h2>{isLogin ? 'WELCOME BACK! 👋' : 'JOIN THE CLUB 🚀'}</h2>
        <p>{isLogin ? 'Sign in to access your orders and wishlist.' : 'Create an account to track orders and more.'}</p>
        
        {errorMsg && <div className="auth-error">{errorMsg}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="input-group">
            <Mail size={20} className="input-icon" />
            <input 
              type="email" 
              placeholder="Email Address" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          
          <div className="input-group">
            <Lock size={20} className="input-icon" />
            <input 
              type="password" 
              placeholder="Password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>

          <button type="submit" className="btn-primary" disabled={isLoading}>
            {isLoading ? <><Loader className="spin" size={20} style={{ marginRight: '10px' }} /> PROCESSING...</> : (isLogin ? 'SIGN IN' : 'CREATE ACCOUNT')}
          </button>
        </form>

        <div className="auth-switch">
          <p>
            {isLogin ? "Don't have an account?" : "Already have an account?"}
            <button type="button" className="text-btn" onClick={() => setIsLogin(!isLogin)}>
              {isLogin ? 'Sign up here' : 'Log in here'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
