import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { API_ENDPOINTS, fetchJSON } from '../../config/api';
import { useAuth } from '../../context/AuthContext';
import './styles/BottomNav.css';

const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activePage, setActivePage] = useState('dashboard');
  const [visible, setVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [touchStartY, setTouchStartY] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [pendingMatches, setPendingMatches] = useState(0);
  const [loading, setLoading] = useState(false);
  const { token, user } = useAuth();
  
  const bottomNavRef = useRef(null);
  const intervalRef = useRef(null);
  const isMounted = useRef(true);

  const navItems = useMemo(() => [
    {
      id: 'dashboard',
      label: 'Discover',
      icon: '🏠',
      path: '/',
      showBadge: false
    },
    {
      id: 'matches',
      label: 'Matches',
      icon: '❤️',
      path: '/matches',
      showBadge: pendingMatches > 0,
      badgeCount: pendingMatches
    },
    {
      id: 'messages',
      label: 'Messages',
      icon: '💬',
      path: '/messages',
      showBadge: unreadMessages > 0,
      badgeCount: unreadMessages
    }
  ], [unreadMessages, pendingMatches]);

  const fetchUnreadMessages = useCallback(async () => {
    if (!token || !isMounted.current) return;
    
    try {
      const data = await fetchJSON(
        API_ENDPOINTS.CHAT_CONVERSATIONS,
        {},
        token
      );
      
      if (isMounted.current) {
        const totalUnread = Array.isArray(data) 
          ? data.reduce((sum, conv) => sum + (conv.unread_count || 0), 0)
          : 0;
        setUnreadMessages(totalUnread);
      }
    } catch (error) {
      console.error('Error fetching unread messages:', error);
    }
  }, [token]);

  const fetchPendingMatches = useCallback(async () => {
    if (!token || !isMounted.current) return;
    
    try {
      const data = await fetchJSON(
        API_ENDPOINTS.MATCHES,
        {},
        token
      );
      
      if (isMounted.current) {
        const pending = Array.isArray(data)
          ? data.filter(match => !match.viewed || match.is_new).length
          : 0;
        setPendingMatches(pending);
      }
    } catch (error) {
      console.error('Error fetching pending matches:', error);
    }
  }, [token]);

  const fetchCounts = useCallback(async () => {
    if (!token || !user) return;
    
    setLoading(true);
    try {
      await Promise.all([
        fetchUnreadMessages(),
        fetchPendingMatches()
      ]);
    } catch (error) {
      console.error('Error fetching counts:', error);
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  }, [token, user, fetchUnreadMessages, fetchPendingMatches]);

  useEffect(() => {
    isMounted.current = true;
    
    return () => {
      isMounted.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const currentPath = location.pathname;
    
    const activeNav = navItems.find(item => 
      item.path === currentPath || 
      (item.path !== '/' && currentPath.startsWith(item.path))
    );
    
    if (activeNav && isMounted.current) {
      setActivePage(activeNav.id);
    } else {
      setActivePage('dashboard');
    }
  }, [location.pathname, navItems]);

  useEffect(() => {
    if (!token) return;
    
    fetchCounts();
    
    intervalRef.current = setInterval(fetchCounts, 60000);
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [token, fetchCounts]);

  const handleScroll = useCallback(() => {
    const currentScrollY = window.scrollY;
    
    if (currentScrollY < lastScrollY && currentScrollY > 50) {
      setVisible(true);
    } else if (currentScrollY > lastScrollY + 50 && currentScrollY > 200) {
      setVisible(false);
    }
    
    setLastScrollY(currentScrollY);
  }, [lastScrollY]);

  const handleTouchStart = useCallback((e) => {
    setTouchStartY(e.touches[0].clientY);
  }, []);

  const handleTouchMove = useCallback((e) => {
    if (!touchStartY) return;
    
    const touchEndY = e.touches[0].clientY;
    const diff = touchStartY - touchEndY;
    
    if (diff < -30) {
      setVisible(true);
    } else if (diff > 30 && window.scrollY > 100) {
      setVisible(false);
    }
  }, [touchStartY]);

  const handleMouseMove = useCallback((e) => {
    if (window.innerHeight - e.clientY < 80) {
      setVisible(true);
    }
  }, []);

  useEffect(() => {
    const handleScrollThrottled = () => {
      if (!isMounted.current) return;
      requestAnimationFrame(handleScroll);
    };

    window.addEventListener('scroll', handleScrollThrottled, { passive: true });
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScrollThrottled);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [handleScroll, handleTouchStart, handleTouchMove, handleMouseMove]);

  const handleNavClick = useCallback(async (item) => {
    if (loading) return;
    
    navigate(item.path);
    setActivePage(item.id);
    
    if (item.id === 'messages' || item.id === 'matches') {
      await fetchCounts();
    }
  }, [navigate, loading, fetchCounts]);

  return (
    <div 
      ref={bottomNavRef}
      className={`bottom-nav ${visible ? 'visible' : 'hidden'}`}
      role="navigation"
      aria-label="Bottom navigation"
    >
      {navItems.map((item) => (
        <button
          key={item.id}
          className={`nav-item ${activePage === item.id ? 'active' : ''}`}
          onClick={() => handleNavClick(item)}
          data-page={item.id}
          aria-label={item.label}
          aria-current={activePage === item.id ? 'page' : undefined}
          type="button"
          disabled={loading}
        >
          <div className="nav-icon-container">
            <span className="nav-icon" role="img" aria-label={item.label}>
              {item.icon}
            </span>
            
            {item.showBadge && item.badgeCount > 0 && (
              <div 
                className="nav-badge"
                aria-label={`${item.badgeCount} notifications`}
              >
                {item.badgeCount > 9 ? '9+' : item.badgeCount}
              </div>
            )}
          </div>
          <span className="nav-label">{item.label}</span>
          
          {activePage === item.id && (
            <div className="active-indicator" aria-hidden="true" />
          )}
          
          {loading && activePage === item.id && (
            <div className="nav-loading-indicator" aria-label="Loading" />
          )}
        </button>
      ))}
    </div>
  );
};

export default BottomNav;