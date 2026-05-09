import React, { useState, useEffect } from 'react';
import { Moon, Sun, Power } from 'lucide-react';
import './Header.css';

const Header: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isDark, setIsDark] = useState(() => localStorage.getItem('adminTheme') === 'dark');

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('adminTheme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('adminTheme', 'light');
    }
  }, [isDark]);

  const handleLogout = () => {
    localStorage.removeItem('adminAuth');
    window.location.reload();
  };

  return (
    <header className={`header ${isScrolled ? 'scrolled' : ''}`}>
      <div className="container header-container" style={{ justifyContent: 'space-between' }}>
        
        <div className="logo">LUMEN ADMIN</div>

        <div className="header-actions" style={{ display: 'flex', gap: '15px' }}>
          <button className="icon-btn" onClick={() => setIsDark(!isDark)} title="Toggle Dark Mode">
            {isDark ? <Sun size={22} /> : <Moon size={22} />}
          </button>
          
          <button className="icon-btn" onClick={handleLogout} title="Logout" style={{ color: '#ef4444' }}>
            <Power size={22} />
          </button>
        </div>

      </div>
    </header>
  );
};

export default Header;
