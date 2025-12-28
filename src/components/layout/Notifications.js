import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_ENDPOINTS, fetchJSON } from '../../config/api';
import { useAuth } from '../../context/AuthContext';
import './styles/Notifications.css';

const Notifications = ({ onClose }) => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const { token, isAuthenticated } = useAuth();

  // Fetch notifications from API
  const fetchNotifications = useCallback(async (pageNum = 1, reset = false) => {
    if (!isAuthenticated) {
      setError('Authentication required');
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const data = await fetchJSON(
        `${API_ENDPOINTS.CHAT_CONVERSATIONS}?notifications=true&page=${pageNum}`,
        {},
        token
      );
      
      const notificationList = data.results || data.notifications || data;
      const hasNext = data.next ? true : false;
      
      if (reset) {
        setNotifications(notificationList);
      } else {
        setNotifications(prev => [...prev, ...notificationList]);
      }
      
      setHasMore(hasNext);
      setPage(pageNum);
    } catch (err) {
      console.error('Error loading notifications:', err);
      setError('Failed to load notifications. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [token, isAuthenticated]);

  // Load notifications on mount
  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications(1, true);
      
      // Poll for new notifications every 30 seconds
      const intervalId = setInterval(() => {
        fetchNotifications(1, true);
      }, 30000);
      
      return () => clearInterval(intervalId);
    } else {
      setLoading(false);
      setError('Please login to view notifications');
    }
  }, [fetchNotifications, isAuthenticated])
  const loadMore = () => {
    if (hasMore && !loading && isAuthenticated) {
      fetchNotifications(page + 1, false);
    }
  };

  const handleNotificationClick = async (notification) => {
    if (!isAuthenticated) {
      alert('Please login to view notifications');
      navigate('/login');
      return;
    }
    
    try {
      // Mark notification as read
      await fetchJSON(
        `${API_ENDPOINTS.CHAT_MARK_READ(notification.conversation_id || notification.id)}`,
        { method: 'POST' },
        token
      );

      // Update local state
      setNotifications(prev =>
        prev.map(n =>
          n.id === notification.id ? { ...n, unread: false, read: true } : n
        )
      );

      // Handle navigation
      switch (notification.type) {
        case 'match':
          if (notification.conversation_id) {
            navigate(`/chat/${notification.conversation_id}`);
          } else if (notification.sender_id) {
            navigate(`/profile/${notification.sender_id}`);
          }
          break;

        case 'message':
          if (notification.conversation_id) {
            navigate(`/chat/${notification.conversation_id}`);
          }
          break;

        case 'like':
        case 'view':
          if (notification.sender_id) {
            navigate(`/profile/${notification.sender_id}`);
          }
          break;

        case 'system':
          if (notification.action_url) {
            navigate(notification.action_url);
          }
          break;

        default:
          console.log('Unknown notification type:', notification.type);
      }

      if (onClose) onClose();
    } catch (error) {
      console.error('Error handling notification click:', error);
    }
  };

  const markAllAsRead = async () => {
    if (!isAuthenticated) {
      alert('Please login to mark notifications as read');
      return;
    }
    
    try {
      await fetchJSON(
        API_ENDPOINTS.CHAT_MARK_ALL_READ,
        { method: 'POST' },
        token
      );

      setNotifications(prev =>
        prev.map(n => ({ ...n, unread: false, read: true }))
      );
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const clearAll = async () => {
    if (!isAuthenticated) {
      alert('Please login to clear notifications');
      return;
    }
    
    if (window.confirm('Are you sure you want to clear all notifications?')) {
      try {
        await Promise.all(
          notifications.map(notification =>
            fetchJSON(
              API_ENDPOINTS.CHAT_CLEAR(notification.conversation_id || notification.id),
              { method: 'POST' },
              token
            )
          )
        );

        setNotifications([]);
      } catch (error) {
        console.error('Error clearing notifications:', error);
      }
    }
  };

  const deleteNotification = async (notificationId, e) => {
    if (!isAuthenticated) {
      alert('Please login to delete notifications');
      return;
    }
    
    e.stopPropagation();

    try {
      await fetchJSON(
        `${API_ENDPOINTS.REPORTS}/${notificationId}/`,
        { method: 'DELETE' },
        token
      );

      setNotifications(prev => prev.filter(n => n.id !== notificationId));
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  // Filter notifications
  const filteredNotifications = filter === 'all' 
    ? notifications 
    : notifications.filter(n => n.type === filter || (filter === 'unread' && n.unread));

  const unreadCount = notifications.filter(n => n.unread).length;

  const filters = [
    { key: 'all', label: 'All', count: notifications.length },
    { key: 'unread', label: 'Unread', count: unreadCount },
    { key: 'match', label: 'Matches', count: notifications.filter(n => n.type === 'match').length },
    { key: 'message', label: 'Messages', count: notifications.filter(n => n.type === 'message').length },
    { key: 'like', label: 'Likes', count: notifications.filter(n => n.type === 'like').length }
  ];

  if (loading && notifications.length === 0) {
    return (
      <div className="notifications-container">
        <div className="loading-notifications">
          <div className="spinner"></div>
          <p>Loading notifications...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="notifications-container">
        <div className="error-notifications">
          <div className="error-icon">⚠️</div>
          <h3>Error Loading Notifications</h3>
          <p>{error}</p>
          {error === 'Please login to view notifications' && (
            <button onClick={() => navigate('/login')} className="retry-btn">
              Go to Login
            </button>
          )}
          {error !== 'Please login to view notifications' && (
            <button onClick={() => fetchNotifications(1, true)} className="retry-btn">
              Try Again
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="notifications-container">
      <div className="notifications-header">
        <div className="header-content">
          <h1>Notifications</h1>
          {unreadCount > 0 && (
            <span className="unread-count-badge">{unreadCount}</span>
          )}
        </div>
        
        <div className="header-actions">
          <button 
            className="action-btn mark-all-read"
            onClick={markAllAsRead}
            disabled={unreadCount === 0 || loading || !isAuthenticated}
          >
            <i className="fas fa-check-double"></i> Mark all as read
          </button>
          
          <button 
            className="action-btn clear-all"
            onClick={clearAll}
            disabled={notifications.length === 0 || loading || !isAuthenticated}
          >
            <i className="fas fa-trash"></i> Clear all
          </button>
        </div>
      </div>

      <div className="notifications-filters">
        <div className="filters-scroll">
          {filters.map(filterItem => (
            <button
              key={filterItem.key}
              className={`filter-btn ${filter === filterItem.key ? 'active' : ''}`}
              onClick={() => setFilter(filterItem.key)}
              disabled={loading || !isAuthenticated}
            >
              {filterItem.label}
              {filterItem.count > 0 && (
                <span className="filter-count">{filterItem.count > 99 ? '99+' : filterItem.count}</span>
              )}
            </button>
          ))}
        </div>
        
        <button 
          className="filter-settings-btn" 
          title="Notification settings"
          onClick={() => {
            navigate('/settings/notifications');
            if (onClose) onClose();
          }}
        >
          <i className="fas fa-cog"></i>
        </button>
      </div>

      <div className="notifications-list">
        {filteredNotifications.length === 0 ? (
          <div className="empty-notifications">
            <div className="empty-icon">
              <i className="fas fa-bell-slash"></i>
            </div>
            <h3>No notifications</h3>
            <p>When you have notifications, they'll appear here.</p>
            {!isAuthenticated && (
              <button className="view-all-btn" onClick={() => navigate('/login')}>
                Login to view notifications
              </button>
            )}
            {isAuthenticated && (
              <button className="view-all-btn" onClick={() => setFilter('all')}>
                View all notifications
              </button>
            )}
          </div>
        ) : (
          <>
            {filteredNotifications.map(notification => (
              <div 
                key={notification.id}
                className={`notification-item ${notification.unread ? 'unread' : ''}`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="notification-content">
                  <div className="notification-icon-container">
                    {notification.sender_avatar ? (
                      <img 
                        src={notification.sender_avatar} 
                        alt={notification.sender_name}
                        className="notification-avatar-img"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.parentElement.innerHTML = `
                            <div class="notification-avatar" style="background: ${notification.sender_color || 'linear-gradient(135deg, #8b5cf6, #ec4899)'}">
                              ${(notification.sender_name || 'U').charAt(0)}
                            </div>
                          `;
                        }}
                      />
                    ) : (
                      <div 
                        className="notification-avatar"
                        style={{ 
                          background: notification.sender_color || 'linear-gradient(135deg, #8b5cf6, #ec4899)' 
                        }}
                      >
                        {(notification.sender_name || 'U').charAt(0)}
                      </div>
                    )}
                  </div>

                  <div className="notification-text">
                    <div className="notification-header">
                      <h4 className="notification-title">{notification.title || 'Notification'}</h4>
                      <span className="notification-time">
                        {new Date(notification.created_at || notification.timestamp).toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </span>
                    </div>
                    
                    <p className="notification-message">{notification.message || notification.body}</p>
                    
                    {notification.sender_name && (
                      <div className="user-info">
                        <span className="user-name">{notification.sender_name}</span>
                        {notification.type === 'message' && (
                          <span className="online-status">{notification.online ? 'Online' : 'Offline'}</span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="notification-actions">
                    {notification.unread && <div className="unread-indicator"></div>}
                    
                    <button 
                      className="delete-btn"
                      onClick={(e) => deleteNotification(notification.id, e)}
                      title="Delete notification"
                      disabled={!isAuthenticated}
                    >
                      <i className="fas fa-times"></i>
                    </button>
                  </div>
                </div>

                {(notification.type === 'match' || notification.type === 'message') && notification.sender_id && (
                  <div className="notification-action-buttons">
                    <button 
                      className="action-button primary"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/chat/${notification.conversation_id || `new/${notification.sender_id}`}`);
                        if (onClose) onClose();
                      }}
                      disabled={!isAuthenticated}
                    >
                      {notification.type === 'match' ? 'Say Hi!' : 'Reply'}
                    </button>
                    <button 
                      className="action-button secondary"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/profile/${notification.sender_id}`);
                        if (onClose) onClose();
                      }}
                      disabled={!isAuthenticated}
                    >
                      View Profile
                    </button>
                  </div>
                )}
              </div>
            ))}
            
            {hasMore && (
              <div className="load-more-container">
                <button 
                  onClick={loadMore}
                  disabled={loading || !isAuthenticated}
                  className="load-more-btn"
                >
                  {loading ? 'Loading...' : 'Load More Notifications'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Notifications;