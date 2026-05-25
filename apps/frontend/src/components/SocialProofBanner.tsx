import React from 'react';
import { Package, Star, Truck, Users } from 'lucide-react';
import './SocialProofBanner.css';

const SocialProofBanner: React.FC = () => {
  const stats = [
    { icon: <Package size={28} />, value: '30+', label: 'Premium Fragrances' },
    { icon: <Star size={28} />, value: '4.8★', label: 'Average Rating' },
    { icon: <Truck size={28} />, value: 'COD', label: 'Available' },
    { icon: <Users size={28} />, value: '1000+', label: 'Happy Customers' },
  ];

  return (
    <section className="social-proof-banner">
      <div className="container">
        <div className="stats-grid">
          {stats.map((stat, index) => (
            <div key={index} className="stat-item">
              <div className="stat-icon">{stat.icon}</div>
              <div className="stat-value">{stat.value}</div>
              <div className="stat-label">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SocialProofBanner;
