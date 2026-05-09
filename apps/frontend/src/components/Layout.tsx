import React from 'react';
import { useLocation } from 'react-router-dom';
import AnnouncementBar from './AnnouncementBar';
import Header from './Header';
import Footer from './Footer';
import WhatsAppWidget from './WhatsAppWidget';
import PopupModal from './PopupModal';
import CartDrawer from './CartDrawer';

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
      <main style={{ paddingTop: isHomePage ? 0 : '180px' }}>
        {children}
      </main>
      <Footer />
      <WhatsAppWidget />
      <PopupModal />
      <CartDrawer />
    </div>
  );
};

export default Layout;
