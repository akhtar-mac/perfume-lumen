import React from 'react';
import './Footer.css';

const Footer: React.FC = () => {
  return (
    <footer className="footer">
      <div className="container footer-container">
        <div className="footer-brand">
          <div className="footer-logo">LUMEN.</div>
          <p>India's finest designer inspired perfumes.</p>
        </div>
        
        <div className="footer-col">
          <h4>OUR POLICIES</h4>
          <ul>
            <li><a href="#">Terms & Conditions</a></li>
            <li><a href="#">Privacy Policy</a></li>
            <li><a href="#">Exchange & Refund Policy</a></li>
            <li><a href="#">FAQs</a></li>
          </ul>
        </div>
        
        <div className="footer-col">
          <h4>QUICK LINKS</h4>
          <ul>
            <li><a href="#">Blogs</a></li>
            <li><a href="#">Contact Us</a></li>
            <li><a href="#">About Us</a></li>
            <li><a href="/admin">Admin Panel</a></li>
          </ul>
        </div>
        
        <div className="footer-col">
          <h4>CONTACT</h4>
          <p>Email: support@lumen.in</p>
          <p>Helpline: 1800 889 1071 (24x7)</p>
        </div>
      </div>
      <div className="footer-bottom">
        <p>&copy; {new Date().getFullYear()} LUMEN All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;
