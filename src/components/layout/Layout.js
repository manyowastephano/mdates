import React from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import BottomNav from './BottomNav';

const Layout = ({ children }) => {
  const navigate = useNavigate();

  const handleSettingsClick = () => {
    navigate('/settings');
  };

  return (
    <div className="app-container">
      <Navbar onSettingsClick={handleSettingsClick} />
      <main className="main-content">
        {children}
      </main>
      <BottomNav />
    </div>
  );
};

export default Layout;