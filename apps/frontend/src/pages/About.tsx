import React from 'react';
import './PolicyPages.css';

const About: React.FC = () => {
  return (
    <div className="policy-page">
      <div className="container">
        <h1>About LUMEN</h1>
        <p className="last-updated">India's Finest Designer-Inspired Perfumes</p>
        
        <section>
          <h2>Our Story</h2>
          <p>
            LUMEN was born from a simple belief — that everyone deserves to smell extraordinary, 
            regardless of budget. Founded in Surat, India, we set out to democratize luxury 
            fragrances by creating premium-quality recreations of the world's most iconic scents.
          </p>
        </section>

        <section>
          <h2>Our Process</h2>
          <p>
            Our master perfumers study the composition of designer fragrances and recreate them 
            using the finest raw materials sourced globally. Each formulation contains 50% fragrance 
            oil concentration — significantly higher than typical alternatives — ensuring 8-12 hours 
            of lasting power.
          </p>
        </section>

        <section>
          <h2>Our Promise</h2>
          <p>
            Every LUMEN perfume is cruelty-free, carefully crafted, and rigorously tested. 
            We stand behind our products with a 7-day return policy and 24/7 customer support. 
            Your satisfaction is our fragrance.
          </p>
        </section>

        <section>
          <h2>Visit Us</h2>
          <p>
            401, Business Hub, Near Gaurav Path Road, Pal, Surat – 395009<br />
            Email: support@lumen.in<br />
            Helpline: 1800 889 1071 (24x7)
          </p>
        </section>
      </div>
    </div>
  );
};

export default About;
