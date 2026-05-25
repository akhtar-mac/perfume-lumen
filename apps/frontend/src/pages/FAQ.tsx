import React from 'react';
import './PolicyPages.css';

const FAQ: React.FC = () => {
  const faqs = [
    { q: 'Are LUMEN perfumes original designer fragrances?', a: 'LUMEN perfumes are designer-inspired recreations. We use high-quality ingredients to create fragrances that capture the essence of popular designer scents at an accessible price point.' },
    { q: 'How long does the fragrance last?', a: 'Our perfumes contain 50% fragrance oil concentration, providing longevity of 8-12 hours depending on skin type, weather, and application.' },
    { q: 'Do you offer Cash on Delivery (COD)?', a: 'Yes! We offer COD for all orders within India. You can pay in cash or via UPI at the time of delivery.' },
    { q: 'What is your return policy?', a: 'We offer a 7-day return policy for sealed, unopened products. Damaged or defective items can be returned within 48 hours of delivery.' },
    { q: 'How long does delivery take?', a: 'Standard delivery takes 3-7 business days depending on your location. Metro cities typically receive orders within 3-4 days.' },
    { q: 'Is free shipping available?', a: 'Yes! Free shipping is available on all orders over ₹1000. For orders below ₹1000, a flat shipping fee of ₹49 applies.' },
    { q: 'Are the products tested on animals?', a: 'No, LUMEN perfumes are cruelty-free. We do not test our products on animals.' },
    { q: 'How should I store my perfume?', a: 'Store your perfume in a cool, dry place away from direct sunlight. Keep the cap tightly closed to preserve the fragrance.' },
    { q: 'Can I cancel my order?', a: 'Orders can be cancelled within 1 hour of placement. After that, please contact our support team and we\'ll do our best to help.' },
    { q: 'Do you ship internationally?', a: 'Currently, we only ship within India. International shipping options are coming soon!' },
  ];

  return (
    <div className="policy-page">
      <div className="container">
        <h1>Frequently Asked Questions</h1>
        <p className="last-updated">Last updated: January 2026</p>
        
        <section>
          <h2>General Questions</h2>
          <div className="faq-list">
            {faqs.map((faq, index) => (
              <div key={index} className="faq-item">
                <h3>{faq.q}</h3>
                <p>{faq.a}</p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2>Still Have Questions?</h2>
          <p>If you couldn't find the answer you were looking for, please contact us at support@lumen.in or call 1800 889 1071 (24x7). We're always happy to help!</p>
        </section>
      </div>
    </div>
  );
};

export default FAQ;
