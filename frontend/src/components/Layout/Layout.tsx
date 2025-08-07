import React from 'react';
import Header from './Header';
import Footer from './Footer';
import NotificationContainer from '../UI/NotificationContainer';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <Header />
      <main className="pt-16">
        {children}
      </main>
      <Footer />
      <NotificationContainer />
    </div>
  );
};

export default Layout;