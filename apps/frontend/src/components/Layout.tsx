import React from 'react';
import { useLocation } from 'react-router-dom';
import AnnouncementBar from './AnnouncementBar';
import Header from './Header';
import Footer from './Footer';
import WhatsAppWidget from './WhatsAppWidget';
import PopupModal from './PopupModal';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const isHomePage = location.pathname === '/';

  return (
    <div className="app-layout">
      <AnnouncementBar />
      <Header isHomePage={isHomePage} />
      <main style={{ paddingTop: isHomePage ? 0 : '120px' }}>
        {children}
      </main>
      <Footer />
      <WhatsAppWidget />
      <PopupModal />
    </div>
  );
};

export default Layout;
