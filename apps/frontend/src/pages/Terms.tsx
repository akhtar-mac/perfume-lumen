import React from 'react';
import './PolicyPages.css';

const Terms: React.FC = () => {
  return (
    <div className="policy-page">
      <div className="container">
        <h1>Terms & Conditions</h1>
        <p className="last-updated">Last updated: January 2026</p>
        
        <section>
          <h2>1. Acceptance of Terms</h2>
          <p>By accessing and using LUMEN Perfumes ("the Website"), you accept and agree to be bound by the terms and provisions of this agreement. If you do not agree to abide by the above, please do not use this service.</p>
        </section>

        <section>
          <h2>2. Products & Descriptions</h2>
          <p>LUMEN offers designer-inspired fragrances. Our products are inspired by popular designer scents but are not affiliated with, endorsed by, or manufactured by the original designer brands. All product names, trademarks, and brand names are the property of their respective owners.</p>
        </section>

        <section>
          <h2>3. Pricing & Payment</h2>
          <p>All prices are in Indian Rupees (₹) and are inclusive of applicable taxes unless stated otherwise. We reserve the right to modify prices at any time without prior notice. Payment can be made via Razorpay (credit/debit cards, UPI, net banking) or Cash on Delivery (COD).</p>
        </section>

        <section>
          <h2>4. Shipping & Delivery</h2>
          <p>Free shipping is available on orders over ₹1000. Standard delivery takes 3-7 business days. Express delivery options may be available at checkout. Delivery timelines are estimates and may vary based on location.</p>
        </section>

        <section>
          <h2>5. User Accounts</h2>
          <p>You are responsible for maintaining the confidentiality of your account credentials. You agree to accept responsibility for all activities that occur under your account. We reserve the right to terminate accounts that violate our terms.</p>
        </section>

        <section>
          <h2>6. Intellectual Property</h2>
          <p>All content on this website, including text, graphics, logos, images, and software, is the property of LUMEN Perfumes and is protected by applicable intellectual property laws.</p>
        </section>

        <section>
          <h2>7. Limitation of Liability</h2>
          <p>LUMEN Perfumes shall not be liable for any direct, indirect, incidental, special, or consequential damages arising from the use of our products or services.</p>
        </section>

        <section>
          <h2>8. Contact</h2>
          <p>For any questions regarding these terms, please contact us at support@lumen.in or call 1800 889 1071 (24x7).</p>
        </section>
      </div>
    </div>
  );
};

export default Terms;
