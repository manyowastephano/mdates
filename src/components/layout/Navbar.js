import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaSearch, FaCog, FaSignOutAlt, FaBell, FaTimes, FaChevronDown, FaUserCircle, FaQuestionCircle, FaMoon, FaGlobe } from 'react-icons/fa';
import { API_ENDPOINTS, fetchJSON, fetchWithAuth } from '../../config/api';
import { useAuth } from '../../context/AuthContext';
import UserAvatar from '../common/UserAvatar';
import Notifications from './Notifications';
import './styles/Navbar.css';

const Navbar = ({ onSettingsClick }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchActive, setSearchActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const dropdownRef = useRef(null);
  const searchRef = useRef(null);
  const { user: currentAuthUser, token, logout } = useAuth();

  // Get user data from API or context
  useEffect(() => {
    const fetchUserData = async () => {
      if (!token) return;
      
      try {
        const data = await fetchJSON(
          API_ENDPOINTS.PROFILE,
          {},
          token
        );
        
        setUserData({
          id: data.id,
          name: data.first_name || data.name || 'User',
          email: data.email || '',
          avatarColor: data.profile_color || 'linear-gradient(135deg, #003A8F, #3b82f6)',
          initials: (data.first_name || data.name || 'U').charAt(0),
          profilePicture: data.profile_picture,
          isOnline: true
        });
      } catch (error) {
        console.error('Error fetching user data:', error);
        // Fallback to context user
        if (currentAuthUser) {
          setUserData({
            name: currentAuthUser.name || currentAuthUser.first_name || 'You',
            email: currentAuthUser.email || '',
            avatarColor: 'linear-gradient(135deg, #003A8F, #3b82f6)',
            initials: (currentAuthUser.name || currentAuthUser.first_name || 'Y').charAt(0),
            isOnline: true
          });
        }
      }
    };

    if (token) {
      fetchUserData();
    } else if (currentAuthUser) {
      // Use context user if available
      setUserData({
        name: currentAuthUser.name || currentAuthUser.first_name || 'You',
        email: currentAuthUser.email || '',
        avatarColor: 'linear-gradient(135deg, #003A8F, #3b82f6)',
        initials: (currentAuthUser.name || currentAuthUser.first_name || 'Y').charAt(0),
        isOnline: true
      });
    }
  }, [token, currentAuthUser]);

  // Fetch unread notifications count
  const fetchUnreadCount = useCallback(async () => {
    if (!token) return;
    
    try {
      const data = await fetchJSON(
        `${API_ENDPOINTS.CHAT_CONVERSATIONS}?unread_only=true`,
        {},
        token
      );
      
      const totalUnread = Array.isArray(data) 
        ? data.reduce((sum, conv) => sum + (conv.unread_count || 0), 0)
        : 0;
      setUnreadCount(totalUnread);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      fetchUnreadCount();
      
      // Poll for new notifications every 30 seconds
      const intervalId = setInterval(fetchUnreadCount, 30000);
      
      return () => clearInterval(intervalId);
    }
  }, [fetchUnreadCount, token]);
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target) && searchActive && window.innerWidth < 768) {
        setSearchActive(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [searchActive]);

  const isDashboardPage = location.pathname === '/' || location.pathname === '/dashboard';

  const handleProfileClick = () => {
    navigate('/profile');
    setShowDropdown(false);
  };

  const handleSettingsNavClick = () => {
    if (onSettingsClick) {
      onSettingsClick();
    } else {
      navigate('/settings');
    }
    setShowDropdown(false);
  };

  const handleHelpClick = () => {
    navigate('/help');
    setShowDropdown(false);
  };

  const handleThemeToggle = () => {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', newTheme);
    setShowDropdown(false);
  };

  const handleLogoutClick = async () => {
    if (!token) {
      logout();
      return;
    }
    
    try {
      await fetchWithAuth(
        API_ENDPOINTS.LOGOUT,
        { method: 'POST' },
        token
      );
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      logout();
      navigate('/login');
    }
  };

  const handleNotificationsClick = () => {
    setShowNotifications(true);
    // Reset unread count when opening notifications
    setUnreadCount(0);
  };

  const closeNotifications = () => {
    setShowNotifications(false);
    // Refresh unread count
    if (token) {
      fetchUnreadCount();
    }
  };

  const handleSearchClick = () => {
    if (searchActive && searchQuery.trim()) {
      handleSearchSubmit();
    } else {
      setSearchActive(!searchActive);
    }
    
    if (!searchActive) {
      setTimeout(() => {
        document.getElementById('navbar-search-input')?.focus();
      }, 100);
    } else {
      if (!isDashboardPage) {
        setSearchQuery('');
      }
    }
  };

  const handleSearchSubmit = async (e) => {
    if (e) e.preventDefault();
    
    if (!token) {
      alert('Please login to search');
      navigate('/login');
      return;
    }
    
    if (searchQuery.trim()) {
      setLoading(true);
      try {
        // Search API call using fetchJSON
        const results = await fetchJSON(
          `${API_ENDPOINTS.USERS}?search=${encodeURIComponent(searchQuery)}`,
          {},
          token
        );
        
        navigate('/search', { state: { results, query: searchQuery } });
      } catch (error) {
        console.error('Search error:', error);
        navigate('/search', { state: { results: [], query: searchQuery } });
      } finally {
        setLoading(false);
        
        if (window.innerWidth < 768) {
          setSearchActive(false);
        }
      }
    }
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  useEffect(() => {
    if (isDashboardPage) {
      const params = new URLSearchParams(location.search);
      const query = params.get('q') || '';
      setSearchQuery(query);
    }
  }, [location.search, isDashboardPage]);
  useEffect(() => {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    document.documentElement.setAttribute('data-theme', currentTheme);
  }, []);

  return (
    <div className="top-nav">
      <div className="app-logo" onClick={() => navigate('/')}>
        <div className="logo-icon">M</div>
        <h1>Mdates</h1>
      </div>
      
      <div className="nav-actions">
        {/* Search Container */}
        <div className="search-container" ref={searchRef}>
          <form onSubmit={handleSearchSubmit}>
            <input
              id="navbar-search-input"
              type="text"
              className={`search-input ${searchActive ? 'active' : ''}`}
              placeholder="Search users..."
              value={searchQuery}
              onChange={handleSearchChange}
              disabled={loading}
            />
          </form>
          
          <button 
            className={`nav-action-btn ${searchActive ? 'active' : ''} ${loading ? 'loading' : ''}`}
            onClick={handleSearchClick}
            type="button"
            aria-label={searchActive ? "Close search" : "Search"}
            disabled={loading}
          >
            {loading ? (
              <div className="search-spinner"></div>
            ) : searchActive ? (
              <FaTimes />
            ) : (
              <FaSearch />
            )}
          </button>
        </div>

        {/* Notifications Icon */}
        <button 
          className="nav-action-btn"
          onClick={handleNotificationsClick}
          type="button"
          aria-label="Notifications"
        >
          <FaBell />
          {unreadCount > 0 && (
            <span className="notification-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
          )}
        </button>

        {/* User Avatar with Dropdown */}
        <div 
          className="navbar-avatar-dropdown-container"
          ref={dropdownRef}
          onMouseEnter={() => setShowDropdown(true)}
          onMouseLeave={() => setShowDropdown(false)}
        >
          <div className="navbar-avatar-wrapper">
            <UserAvatar
              user={userData || {
                name: 'You',
                avatarColor: 'linear-gradient(135deg, #003A8F, #3b82f6)',
                initials: 'Y'
              }}
              size={36}
            />
            <FaChevronDown 
              className="dropdown-arrow"
              style={{
                transform: showDropdown ? 'rotate(180deg)' : 'rotate(0deg)',
              }}
            />
          </div>
          
          {/* Dropdown Menu */}
          {showDropdown && (
            <div 
              className="navbar-user-dropdown"
              onMouseEnter={() => setShowDropdown(true)}
              onMouseLeave={() => setShowDropdown(false)}
            >
              {/* User Info Section */}
              <div className="dropdown-user-info">
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <UserAvatar
                    user={userData || {
                      name: 'You',
                      avatarColor: 'linear-gradient(135deg, #003A8F, #3b82f6)',
                      initials: 'Y'
                    }}
                    size={44}
                  />
                  <div>
                    <h4 style={{ margin: '0 0 4px 0', fontSize: '15px', fontWeight: '600', color: 'var(--text-primary)' }}>
                      {userData?.name || 'You'}
                    </h4>
                    <p style={{ margin: '0', fontSize: '12px', color: 'var(--text-secondary)' }}>
                      {userData?.email || 'View your profile'}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Menu Items */}
              <div className="dropdown-menu-items">
                <div 
                  className="dropdown-menu-item"
                  onClick={handleProfileClick}
                >
                  <FaUserCircle className="dropdown-icon" style={{ color: 'var(--mubas-blue)' }} />
                  <span>My Profile</span>
                </div>
                
                <div 
                  className="dropdown-menu-item"
                  onClick={handleSettingsNavClick}
                >
                  <FaCog className="dropdown-icon" />
                  <span>Settings</span>
                </div>
                
                <div 
                  className="dropdown-menu-item"
                  onClick={handleThemeToggle}
                >
                  <FaMoon className="dropdown-icon" />
                  <span>Dark Mode</span>
                  <div className="toggle-switch-small">
                    <input 
                      type="checkbox" 
                      id="dark-mode-toggle" 
                      checked={document.documentElement.getAttribute('data-theme') === 'dark'}
                      readOnly
                    />
                    <span className="toggle-slider-small"></span>
                  </div>
                </div>
                
                <div 
                  className="dropdown-menu-item"
                  onClick={handleHelpClick}
                >
                  <FaQuestionCircle className="dropdown-icon" />
                  <span>Help & Support</span>
                </div>
                
                <div 
                  className="dropdown-menu-item"
                  onClick={() => {
                    // Language selector
                    console.log('Language selector');
                    setShowDropdown(false);
                  }}
                >
                  <FaGlobe className="dropdown-icon" />
                  <span>Language</span>
                  <span style={{ marginLeft: 'auto', fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '500' }}>
                    EN
                  </span>
                </div>
              </div>
              
              {/* Logout Section */}
              <div 
                className="dropdown-menu-item logout-item"
                onClick={handleLogoutClick}
              >
                <FaSignOutAlt className="dropdown-icon" />
                <span>Logout</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Notifications Panel Overlay and Component */}
      {showNotifications && (
        <>
          <div 
            className="notifications-overlay"
            onClick={closeNotifications}
          />
          <Notifications onClose={closeNotifications} />
        </>
      )}
    </div>
  );
};

export default Navbar;