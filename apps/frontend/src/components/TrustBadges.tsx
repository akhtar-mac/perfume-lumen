import React from 'react';
import { Shield, Truck, RefreshCw, CreditCard, Award, Headphones } from 'lucide-react';
import './TrustBadges.css';

const TrustBadges: React.FC = () => {
  const badges = [
    { icon: <Truck size={32} />, title: 'Free Shipping', desc: 'On orders over ₹1000' },
    { icon: <Shield size={32} />, title: '100% Genuine', desc: 'Authentic fragrances' },
    { icon: <RefreshCw size={32} />, title: 'Easy Returns', desc: '7-day return policy' },
    { icon: <CreditCard size={32} />, title: 'COD Available', desc: 'Pay on delivery' },
    { icon: <Award size={32} />, title: 'Premium Quality', desc: '50% fragrance oil' },
    { icon: <Headphones size={32} />, title: '24/7 Support', desc: 'Always here to help' },
  ];

  return (
    <section className="trust-badges">
      <div className="container">
        <div className="badges-grid">
          {badges.map((badge, index) => (
            <div key={index} className="badge-item">
              <div className="badge-icon">{badge.icon}</div>
              <h4>{badge.title}</h4>
              <p>{badge.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TrustBadges;
