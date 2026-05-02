import React from 'react';
import Hero from '../components/Hero';
import ProductGrid from '../components/ProductGrid';

const Home: React.FC = () => {
  return (
    <div className="home-page">
      <main>
        <Hero />
        <ProductGrid />
      </main>
    </div>
  );
};

export default Home;
