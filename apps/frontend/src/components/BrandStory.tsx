import React from 'react';
import './BrandStory.css';

const BrandStory: React.FC = () => {
  return (
    <section className="brand-story">
      <div className="container">
        <div className="brand-story-grid">
          <div className="brand-story-image">
            <img src="/hero.png" alt="LUMEN Perfumes - Crafted in India" />
          </div>
          <div className="brand-story-content">
            <h2>INDIA'S FINEST <span className="highlight">DESIGNER RECREATIONS</span></h2>
            <p>
              At LUMEN, we believe luxury shouldn't come with a hefty price tag. Our master perfumers 
              meticulously study the world's most iconic fragrances and recreate them with the finest 
              ingredients, delivering 50% fragrance oil concentration for long-lasting performance.
            </p>
            <p>
              Every bottle is a testament to our commitment to quality, authenticity, and accessibility. 
              From bold masculine statements to delicate floral bouquets — we have a scent for every soul.
            </p>
            <div className="brand-features">
              <div className="feature">
                <span className="feature-icon">🌿</span>
                <span>Premium Ingredients</span>
              </div>
              <div className="feature">
                <span className="feature-icon">⏳</span>
                <span>Long Lasting (8-12 hrs)</span>
              </div>
              <div className="feature">
                <span className="feature-icon">🇮🇳</span>
                <span>Made in India</span>
              </div>
              <div className="feature">
                <span className="feature-icon">💯</span>
                <span>100% Authentic</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default BrandStory;
