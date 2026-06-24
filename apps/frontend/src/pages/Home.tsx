import React from 'react';
import { Helmet } from 'react-helmet-async';
import Hero from '../components/Hero';
import ProductGrid from '../components/ProductGrid';

const Home: React.FC = () => {
  return (
    <div className="home-page">
      <Helmet>
        <title>LUMEN Parfum | Travel-Inspired Fragrances</title>
        <meta name="description" content="Discover LUMEN's collection of travel-inspired Eau de Parfum. Fragrances born from real experiences — shop online across India." />
        <meta property="og:title" content="LUMEN Parfum | Travel-Inspired Fragrances" />
        <meta property="og:description" content="Discover LUMEN's collection of travel-inspired Eau de Parfum." />
        <meta property="og:type" content="website" />
      </Helmet>
      <main>
        <Hero />
        <ProductGrid />
      </main>
    </div>
  );
};

export default Home;
