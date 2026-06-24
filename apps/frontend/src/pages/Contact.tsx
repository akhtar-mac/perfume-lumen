import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import './Contact.css';

const Contact: React.FC = () => {
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus('sending');
    const form = e.currentTarget;
    const formData = new FormData(form);
    const name = String(formData.get('name') || '');
    const email = String(formData.get('email') || '');
    const message = String(formData.get('message') || '');

    const { error } = await supabase.from('contact_messages').insert({
      name,
      email,
      message,
      created_at: new Date().toISOString(),
    });

    if (error) {
      console.error(error);
      setStatus('error');
    } else {
      setStatus('sent');
      form.reset();
    }
  };

  return (
    <div className="contact-page">
      <div className="container contact-container">
        <div className="contact-info">
          <h1>GET IN TOUCH</h1>
          <p>Have questions about our fragrances? We're here to help.</p>
          <div className="info-block">
            <h3>Email Support</h3>
            <p>support@lumen.in</p>
          </div>
          <div className="info-block">
            <h3>Helpline (24x7)</h3>
            <p>1800 889 1071</p>
          </div>
          <div className="info-block">
            <h3>Office Address</h3>
            <p>401, Business Hub, Near Gaurav Path Road, Pal, Surat – 395009</p>
          </div>
        </div>
        <div className="contact-form">
          <form onSubmit={handleSubmit}>
            <input type="text" name="name" placeholder="Your Name" required />
            <input type="email" name="email" placeholder="Your Email" required />
            <textarea name="message" placeholder="Your Message" rows={6} required></textarea>
            <button type="submit" className="btn-primary" disabled={status === 'sending'}>
              {status === 'sending' ? 'SENDING...' : 'SEND MESSAGE'}
            </button>
            {status === 'sent' && (
              <p style={{ color: '#10b981', fontWeight: 'bold', marginTop: '10px' }}>
                Message sent! We'll reply within 24 hours.
              </p>
            )}
            {status === 'error' && (
              <p style={{ color: '#ef4444', fontWeight: 'bold', marginTop: '10px' }}>
                Something went wrong. Please try again.
              </p>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default Contact;