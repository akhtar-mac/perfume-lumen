import React from 'react';
import './PolicyPages.css';

const Refund: React.FC = () => {
  return (
    <div className="policy-page">
      <div className="container">
        <h1>Exchange & Refund Policy</h1>
        <p className="last-updated">Last updated: January 2026</p>
        
        <section>
          <h2>1. Return Window</h2>
          <p>We offer a 7-day return policy from the date of delivery. To be eligible for a return, the product must be unused, in its original packaging, and in the same condition as received.</p>
        </section>

        <section>
          <h2>2. Non-Returnable Items</h2>
          <p>Due to hygiene reasons, opened or used perfume bottles cannot be returned. Only sealed, unopened products are eligible for returns.</p>
        </section>

        <section>
          <h2>3. Damaged or Defective Products</h2>
          <p>If you receive a damaged or defective product, please contact us within 48 hours of delivery with photos of the damaged item. We will arrange a replacement or full refund at no additional cost.</p>
        </section>

        <section>
          <h2>4. How to Initiate a Return</h2>
          <p>Email us at support@lumen.in with your order number and reason for return. Our team will provide you with a return shipping label and instructions. Please do not send products back without contacting us first.</p>
        </section>

        <section>
          <h2>5. Refund Processing</h2>
          <p>Once we receive and inspect the returned item, we will notify you of the approval or rejection of your refund. Approved refunds will be processed within 5-7 business days to your original payment method.</p>
        </section>

        <section>
          <h2>6. Exchange Policy</h2>
          <p>If you'd like a different product instead of a refund, please mention this in your return request. We'll ship the replacement once we receive the returned item.</p>
        </section>

        <section>
          <h2>7. COD Refunds</h2>
          <p>For COD orders, refunds will be processed via bank transfer or UPI. You will need to provide your bank account details or UPI ID for the refund.</p>
        </section>

        <section>
          <h2>8. Contact</h2>
          <p>For any questions regarding returns or refunds, please contact us at support@lumen.in or call 1800 889 1071 (24x7).</p>
        </section>
      </div>
    </div>
  );
};

export default Refund;
