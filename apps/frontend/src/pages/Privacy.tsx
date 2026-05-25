import React from 'react';
import './PolicyPages.css';

const Privacy: React.FC = () => {
  return (
    <div className="policy-page">
      <div className="container">
        <h1>Privacy Policy</h1>
        <p className="last-updated">Last updated: January 2026</p>
        
        <section>
          <h2>1. Information We Collect</h2>
          <p>We collect information you provide directly to us, such as when you create an account, place an order, or contact us. This may include your name, email address, phone number, shipping address, and payment information.</p>
        </section>

        <section>
          <h2>2. How We Use Your Information</h2>
          <p>We use the information we collect to process your orders, manage your account, send you order updates, respond to your inquiries, and improve our services. We may also send you promotional emails if you have opted in.</p>
        </section>

        <section>
          <h2>3. Information Sharing</h2>
          <p>We do not sell, trade, or rent your personal information to third parties. We may share your information with trusted service providers who assist us in operating our website, processing payments, and delivering orders.</p>
        </section>

        <section>
          <h2>4. Data Security</h2>
          <p>We implement appropriate security measures to protect your personal information. All payment transactions are processed through secure, PCI-compliant payment gateways (Razorpay). We do not store your credit card details on our servers.</p>
        </section>

        <section>
          <h2>5. Cookies</h2>
          <p>Our website uses cookies to enhance your browsing experience, analyze site traffic, and understand where our visitors are coming from. You can choose to disable cookies through your browser settings.</p>
        </section>

        <section>
          <h2>6. Your Rights</h2>
          <p>You have the right to access, update, or delete your personal information at any time by logging into your account or contacting us at support@lumen.in.</p>
        </section>

        <section>
          <h2>7. Changes to This Policy</h2>
          <p>We may update this privacy policy from time to time. Any changes will be posted on this page with an updated revision date.</p>
        </section>

        <section>
          <h2>8. Contact</h2>
          <p>For any questions regarding this privacy policy, please contact us at support@lumen.in.</p>
        </section>
      </div>
    </div>
  );
};

export default Privacy;
