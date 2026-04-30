import React from 'react';
import { MessageCircle } from 'lucide-react';
import './WhatsAppWidget.css';

const WhatsAppWidget: React.FC = () => {
  return (
    <a href="https://wa.me/917567583505" className="whatsapp-widget" target="_blank" rel="noopener noreferrer">
      <MessageCircle size={32} />
    </a>
  );
};

export default WhatsAppWidget;
