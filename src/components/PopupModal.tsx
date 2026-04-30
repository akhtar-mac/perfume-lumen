import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import './PopupModal.css';

const PopupModal: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (localStorage.getItem('discount_used') === 'true') return;
    
    const timer = setTimeout(() => {
      setIsOpen(true);
    }, 5000); // Popup after 5 seconds
    return () => clearTimeout(timer);
  }, []);

  if (!isOpen) return null;

  return (
    <div className="popup-overlay">
      <div className="popup-content">
        <button className="popup-close" onClick={() => setIsOpen(false)}>
          <X size={24} />
        </button>
        <div className="popup-inner">
          <h2>UNLOCK 10% OFF</h2>
          <p>Join our WhatsApp list for exclusive drops and VIP access.</p>
          <button className="btn-primary" onClick={() => setIsOpen(false)}>GET MY DISCOUNT</button>
        </div>
      </div>
    </div>
  );
};

export default PopupModal;
