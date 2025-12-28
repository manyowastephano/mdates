import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_ENDPOINTS, fetchJSON, fetchWithAuth } from '../../config/api';
import { useAuth } from '../../context/AuthContext';
const UserAvatar = ({
  user = null,
  userId = null,
  size = 40,
  showName = false,
  showDropdown = false,
  onMouseEnter,
  onMouseLeave,
  onSettingsClick,
  onLogoutClick,
  onClick,
  className = '',
  showStatus = true,
  clickable = true
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [userData, setUserData] = useState(user);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const { user: currentAuthUser, token, logout } = useAuth();
  useEffect(() => {
    const fetchUserData = async () => {
      if (userId && !user) {
        if (!token) {
          setError('Authentication required');
          setLoading(false);
          return;
        }
        setLoading(true);
        try {
          const data = await fetchJSON(
            API_ENDPOINTS.USER_PROFILE(userId),
            {},
            token
          );
          
          setUserData({
            id: data.id,
            name: data.first_name || data.name || 'User',
            email: data.email || '',
            image: data.profile_picture || data.avatar_url,
            initials: (data.first_name || data.name || 'U').charAt(0).toUpperCase(),
            avatarColor: data.avatar_color || 'linear-gradient(135deg, #003A8F, #3b82f6)',
            isOnline: data.is_online || false
          });
        } catch (err) {
          console.error('Error fetching user data:', err);
          setError('Error loading user');
        } finally {
          setLoading(false);
        }
      }
    };
    
    if (token) {
      fetchUserData();
    }
  }, [userId, user, token]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  const getCurrentUser = () => {
    if (!userData && !userId) {
      if (currentAuthUser) {
        return {
          id: currentAuthUser.id,
          name: currentAuthUser.name || currentAuthUser.first_name || 'You',
          email: currentAuthUser.email || '',
          initials: (currentAuthUser.name || currentAuthUser.first_name || 'Y').charAt(0).toUpperCase(),
          avatarColor: 'linear-gradient(135deg, #003A8F, #3b82f6)',
          isOnline: currentAuthUser.is_online || false,
          image: currentAuthUser.profile_picture || currentAuthUser.avatar_url
        };
      }
      return {
        name: 'You',
        initials: 'Y',
        avatarColor: 'linear-gradient(135deg, #003A8F, #3b82f6)'
      };
    }
    return userData || {
      name: 'User',
      initials: 'U',
      avatarColor: 'linear-gradient(135deg, #8b5cf6, #ec4899)'
    };
  };
  const currentUser = getCurrentUser();
  const handleAvatarClick = (e) => {
    if (onClick) {
      onClick(e);
      return;
    }
    if (showDropdown) {
      setIsDropdownOpen(!isDropdownOpen);
    } else if (clickable) {
      if (currentUser.id) {
        navigate(`/profile/${currentUser.id}`);
      } else {
        navigate('/profile');
      }
    }
  };
  const handleSettings = () => {
    setIsDropdownOpen(false);
    if (onSettingsClick) {
      onSettingsClick();
    } else {
      navigate('/settings');
    }
  };

  const handleLogout = async () => {
    setIsDropdownOpen(false);
    
    if (onLogoutClick) {
      onLogoutClick();
    } else {
      try {
        if (token) {
          await fetchWithAuth(
            API_ENDPOINTS.LOGOUT,
            { method: 'POST' },
            token
          );
        }
      } catch (error) {
        console.error('Logout error:', error);
      } finally {
        logout();
        navigate('/login');
      }
    }
  };
  const getAvatarStyle = () => {
    const baseStyle = {
      width: `${size}px`,
      height: `${size}px`,
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'white',
      fontWeight: 600,
      fontSize: `${Math.max(size * 0.4, 14)}px`,
      cursor: clickable ? 'pointer' : 'default',
      transition: 'all 0.3s ease',
      position: 'relative',
      flexShrink: 0
    };

    if (currentUser.image) {
      return {
        ...baseStyle,
        backgroundImage: `url(${currentUser.image})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      };
    }

    return {
      ...baseStyle,
      background: currentUser.avatarColor
    };
  };
  const renderDropdown = () => {
    if (!isDropdownOpen || loading) return null;

    return (
      <div 
        className="avatar-dropdown"
        ref={dropdownRef}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        style={{
          position: 'absolute',
          top: '100%',
          right: 0,
          background: 'white',
          borderRadius: 'var(--radius-sm)',
          boxShadow: 'var(--shadow-light)',
          border: '1px solid #e5e7eb',
          zIndex: 1000,
          minWidth: '200px',
          marginTop: '8px',
          overflow: 'hidden'
        }}
      >
        <div 
          className="dropdown-user-info"
          style={{
            padding: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            background: 'linear-gradient(135deg, #f8fafc, #f1f5f9)',
            borderBottom: '1px solid #e5e7eb'
          }}
          onClick={() => {
            navigate(`/profile/${currentUser.id || ''}`);
            setIsDropdownOpen(false);
          }}
        >
          <div className="dropdown-avatar" style={getAvatarStyle()}>
            {!currentUser.image && currentUser.initials}
          </div>
          <div className="dropdown-user-details" style={{ flex: 1 }}>
            <div 
              className="dropdown-user-name"
              style={{
                fontSize: '14px',
                fontWeight: 600,
                color: 'var(--text-primary)',
                marginBottom: '2px'
              }}
            >
              {currentUser.name}
            </div>
            <div 
              className="dropdown-user-email"
              style={{
                fontSize: '12px',
                color: 'var(--text-secondary)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
            >
              {currentUser.email || 'View profile'}
            </div>
          </div>
        </div>
        <div className="dropdown-divider" style={{ height: '1px', background: '#e5e7eb' }}></div> 
        {/* Menu Items */}
        <div 
          className="dropdown-item" 
          onClick={() => {
            navigate(`/profile/${currentUser.id || ''}`);
            setIsDropdownOpen(false);
          }}
          style={{
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            cursor: 'pointer',
            fontSize: '14px',
            color: 'var(--text-primary)',
            transition: 'background-color 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          <i className="fas fa-user" style={{ width: '16px', color: 'var(--mubas-blue)' }}></i>
          <span>My Profile</span>
        </div>
        
        <div 
          className="dropdown-item" 
          onClick={handleSettings}
          style={{
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            cursor: 'pointer',
            fontSize: '14px',
            color: 'var(--text-primary)',
            transition: 'background-color 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          <i className="fas fa-cog" style={{ width: '16px', color: 'var(--text-secondary)' }}></i>
          <span>Settings</span>
        </div>
        
        <div 
          className="dropdown-item" 
          onClick={() => {
            navigate('/help');
            setIsDropdownOpen(false);
          }}
          style={{
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            cursor: 'pointer',
            fontSize: '14px',
            color: 'var(--text-primary)',
            transition: 'background-color 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          <i className="fas fa-question-circle" style={{ width: '16px', color: 'var(--text-secondary)' }}></i>
          <span>Help & Support</span>
        </div>
        
        <div className="dropdown-divider" style={{ height: '1px', background: '#e5e7eb' }}></div>
        
        {/* Logout */}
        <div 
          className="dropdown-item logout" 
          onClick={handleLogout}
          style={{
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            cursor: 'pointer',
            fontSize: '14px',
            color: '#ef4444',
            transition: 'background-color 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fef2f2'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          <i className="fas fa-sign-out-alt" style={{ width: '16px' }}></i>
          <span>Logout</span>
        </div>
      </div>
    );
  };
  if (loading && !userData) {
    return (
      <div 
        className={`user-avatar-container ${className}`}
        style={{ position: 'relative' }}
      >
        <div 
          className="user-avatar"
          style={{
            width: `${size}px`,
            height: `${size}px`,
            borderRadius: '50%',
            background: '#e5e7eb',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'default'
          }}
        >
          <div className="loading-spinner" style={{
            width: '16px',
            height: '16px',
            border: '2px solid #cbd5e1',
            borderTopColor: '#3b82f6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}></div>
        </div>
      </div>
    );
  }
  if (error && !userData) {
    return (
      <div 
        className={`user-avatar-container ${className}`}
        style={{ position: 'relative' }}
      >
        <div 
          className="user-avatar"
          style={{
            width: `${size}px`,
            height: `${size}px`,
            borderRadius: '50%',
            background: '#fee2e2',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#dc2626',
            fontWeight: 600,
            fontSize: `${Math.max(size * 0.4, 14)}px`,
            cursor: 'default'
          }}
        >
          !
        </div>
      </div>
    );
  }
  return (
    <div 
      className={`user-avatar-container ${className}`}
      style={{ position: 'relative', display: 'inline-block' }}
    >
      <div 
        className="user-avatar"
        style={getAvatarStyle()}
        onClick={handleAvatarClick}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      >
        {!currentUser.image && currentUser.initials}
        
        {/* Online status indicator */}
        {showStatus && currentUser.isOnline && (
          <div 
            className="online-status-indicator"
            style={{
              position: 'absolute',
              bottom: '2px',
              right: '2px',
              width: `${Math.max(size * 0.2, 10)}px`,
              height: `${Math.max(size * 0.2, 10)}px`,
              borderRadius: '50%',
              backgroundColor: '#10b981',
              border: '2px solid white'
            }}
          />
        )}
      </div>
      
      {showName && (
        <div className="user-name" style={{ 
          marginTop: '4px', 
          fontSize: '14px', 
          fontWeight: 500,
          textAlign: 'center',
          color: 'var(--text-primary)',
          maxWidth: `${size}px`,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}>
          {currentUser.name}
        </div>
      )}
      
      {showDropdown && renderDropdown()}
      
      <style jsx>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};
export default UserAvatar;