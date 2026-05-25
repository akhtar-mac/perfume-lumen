import React, { useState } from 'react';
import { Send } from 'lucide-react';
import './Newsletter.css';

const Newsletter: React.FC = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      // TODO: Connect to backend/email service
      console.log('Newsletter signup:', email);
      setSubmitted(true);
      setEmail('');
      setTimeout(() => setSubmitted(false), 3000);
    }
  };

  return (
    <section className="newsletter-section">
      <div className="container">
        <div className="newsletter-content">
          <h2>JOIN THE <span className="highlight">LUMEN CLUB</span></h2>
          <p>Subscribe for exclusive offers, new launch alerts, and 10% off your first order.</p>
          <form onSubmit={handleSubmit} className="newsletter-form">
            <input
              type="email"
              placeholder="Enter your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <button type="submit" className="btn-primary">
              <Send size={18} />
              SUBSCRIBE
            </button>
          </form>
          {submitted && <p className="success-msg">🎉 Welcome to the LUMEN Club! Check your inbox.</p>}
        </div>
      </div>
    </section>
  );
};

export default Newsletter;
