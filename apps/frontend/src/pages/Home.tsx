import React from 'react';
import Hero from '../components/Hero';
import SocialProofBanner from '../components/SocialProofBanner';
import ProductGrid from '../components/ProductGrid';
import BrandStory from '../components/BrandStory';
import TrustBadges from '../components/TrustBadges';
import ReelsSection from '../components/ReelsSection';
import Newsletter from '../components/Newsletter';

const Home: React.FC = () => {
  return (
    <div className="home-page">
      <main>
        <Hero />
        <SocialProofBanner />
        <ProductGrid />
        <ReelsSection />
        <BrandStory />
        <TrustBadges />
        <Newsletter />
      </main>
    </div>
  );
};

export default Home;
