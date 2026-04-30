import React from 'react';
import Header from '../components/Header';
import AnnouncementBar from '../components/AnnouncementBar';
import Hero from '../components/Hero';
import ProductGrid from '../components/ProductGrid';
import Footer from '../components/Footer';
import WhatsAppWidget from '../components/WhatsAppWidget';
import PopupModal from '../components/PopupModal';

const Home: React.FC = () => {
  return (
    <div className="home-page">
      <AnnouncementBar />
      <Header />
      <main>
        <Hero />
        <ProductGrid />
      </main>
      <Footer />
      <WhatsAppWidget />
      <PopupModal />
    </div>
  );
};

export default Home;
