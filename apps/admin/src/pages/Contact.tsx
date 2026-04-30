import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import './Contact.css';

const Contact: React.FC = () => {
  return (
    <div className="contact-page">
      <Header />
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
          <form onSubmit={(e) => e.preventDefault()}>
            <input type="text" placeholder="Your Name" required />
            <input type="email" placeholder="Your Email" required />
            <textarea placeholder="Your Message" rows={6} required></textarea>
            <button type="submit" className="btn-primary">SEND MESSAGE</button>
          </form>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Contact;
