
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { API_ENDPOINTS, fetchJSON } from '../../config/api';
import Loading from '../common/Loading';
import { FaCheckDouble, FaSearch, FaPlus, FaEllipsisV } from 'react-icons/fa';

const Messages = () => {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [showSearchInput, setShowSearchInput] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const searchInputRef = useRef(null);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    // Redirect if not authenticated
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    loadConversations();
    
    // Set up polling for new messages (every 30 seconds in production)
    const pollInterval = setInterval(() => {
      loadConversations(false); // Silent refresh
    }, 30000);
    
    return () => clearInterval(pollInterval);
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (showSearchInput && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [showSearchInput]);

  const loadConversations = async (showLoading = true) => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    try {
      if (showLoading) setLoading(true);
      setError(null);
      
      const data = await fetchJSON(API_ENDPOINTS.CHAT_CONVERSATIONS, {
        method: 'GET',
      });
      
      // Map backend data to frontend structure
      const mappedConversations = data.map(conv => ({
        id: conv.id,
        userId: conv.other_user?.id || conv.participant_id,
        name: conv.other_user?.name || conv.participant_name || 'User',
        lastMessage: conv.last_message?.content || 'No messages yet',
        time: formatTime(conv.last_message?.timestamp || conv.updated_at),
        unread: conv.unread_count || 0,
        is_online: conv.other_user?.is_online || false,
        is_match: conv.is_match || false,
        last_seen: conv.other_user?.last_seen,
        profile_picture: conv.other_user?.profile_picture || null,
        conversation: conv
      }));

      setConversations(mappedConversations);
      
      // Calculate total unread count
      const totalUnread = mappedConversations.reduce((sum, conv) => sum + conv.unread, 0);
      setUnreadCount(totalUnread);
      
    } catch (error) {
      console.error('Error loading conversations:', error);
      if (error.message === 'SESSION_EXPIRED') {
        setError('Your session has expired. Please log in again.');
      } else {
        setError('Failed to load conversations. Please try again.');
      }
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return 'Just now';
    
    const now = new Date();
    const messageTime = new Date(timestamp);
    const diffHours = Math.floor((now - messageTime) / (1000 * 60 * 60));
    
    if (diffHours < 24) {
      return messageTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffHours < 48) {
      return 'Yesterday';
    } else {
      return messageTime.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const formatLastActive = (timestamp) => {
    if (!timestamp) return 'Recently';
    
    const now = new Date();
    const lastActive = new Date(timestamp);
    const diffMinutes = Math.floor((now - lastActive) / (1000 * 60));
    
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h ago`;
    return `${Math.floor(diffMinutes / 1440)}d ago`;
  };

  const handleConversationClick = (conversation) => {
    navigate(`/messages/${conversation.id}`);
  };

  const handleNewMessage = () => {
    navigate('/dashboard', { 
      state: { startNewChat: true } 
    });
  };

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
  };

  const markAllAsRead = async () => {
    try {
      await fetchJSON(API_ENDPOINTS.CHAT_MARK_ALL_READ, {
        method: 'POST',
      });

      // Update local state
      setConversations(prev => 
        prev.map(conv => ({ ...conv, unread: 0 }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
      alert('Failed to mark all as read. Please try again.');
    }
  };

  const toggleSearchInput = () => {
    setShowSearchInput(!showSearchInput);
    if (!showSearchInput) {
      setSearchQuery('');
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setShowSearchInput(false);
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Escape') {
      handleClearSearch();
    }
  };

  const handleConversationAction = async (conversation, action) => {
    switch (action) {
      case 'mark_read':
        try {
          await fetchJSON(API_ENDPOINTS.CHAT_MARK_READ(conversation.id), {
            method: 'POST',
          });
          
          setConversations(prev => 
            prev.map(conv => 
              conv.id === conversation.id ? { ...conv, unread: 0 } : conv
            )
          );
          setUnreadCount(prev => Math.max(0, prev - conversation.unread));
        } catch (error) {
          console.error('Error marking as read:', error);
        }
        break;
        
      case 'delete':
        if (window.confirm('Delete this conversation? This action cannot be undone.')) {
          try {
            await fetchJSON(API_ENDPOINTS.CHAT_CONVERSATION(conversation.id), {
              method: 'DELETE',
            });
            
            setConversations(prev => 
              prev.filter(conv => conv.id !== conversation.id)
            );
            setUnreadCount(prev => Math.max(0, prev - conversation.unread));
          } catch (error) {
            console.error('Error deleting conversation:', error);
            alert('Failed to delete conversation.');
          }
        }
        break;
        
      case 'clear':
        if (window.confirm('Clear all messages in this conversation?')) {
          try {
            await fetchJSON(API_ENDPOINTS.CHAT_CLEAR(conversation.id), {
              method: 'POST',
            });
            
            // Update conversation to show no messages
            setConversations(prev => 
              prev.map(conv => 
                conv.id === conversation.id ? { ...conv, lastMessage: 'No messages yet' } : conv
              )
            );
          } catch (error) {
            console.error('Error clearing chat:', error);
            alert('Failed to clear chat.');
          }
        }
        break;
        
      default:
        break;
    }
  };

  const filteredConversations = conversations.filter(conv => {
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (!conv.name.toLowerCase().includes(query) && 
          !conv.lastMessage.toLowerCase().includes(query)) {
        return false;
      }
    }

    // Apply filter
    switch (filter) {
      case 'unread':
        return conv.unread > 0;
      case 'matches':
        return conv.is_match;
      case 'online':
        return conv.is_online;
      default:
        return true;
    }
  });

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  if (loading) {
    return (
      <div className="messages-page">
        <Loading message="Loading your conversations..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="messages-page">
        <div className="messages-error">
          <h2>Error</h2>
          <p>{error}</p>
          <button 
            className="auth-button"
            onClick={() => loadConversations()}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="messages-page">
      <div className="messages-header">
        <div className="header-left">
          <h1>Messages</h1>
          {unreadCount > 0 && (
            <span className="unread-count-badge">
              {unreadCount} new
            </span>
          )}
        </div>
        
        <div className="header-actions">
          <button 
            className="action-btn search-btn"
            onClick={toggleSearchInput}
            title="Search conversations"
          >
            <FaSearch style={{ width: '20px' }} />
          </button>
          <button 
            className="action-btn mark-read"
            onClick={markAllAsRead}
            title="Mark all as read"
            disabled={unreadCount === 0}
          >
            <FaCheckDouble style={{ width: '20px' }} />
          </button>
        </div>
      </div>

      {showSearchInput && (
        <div className="search-container">
          <div className="input-with-icon">
            <FaSearch className="input-icon" style={{ width: '20px' }} />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search conversations..."
              className="form-input"
              value={searchQuery}
              onChange={handleSearch}
              onKeyDown={handleSearchKeyDown}
              style={{ paddingLeft: '46px' }}
            />
            <button 
              className="clear-search-btn"
              onClick={handleClearSearch}
              title="Clear search"
            >
              ×
            </button>
          </div>
        </div>
      )}

      <div className="messages-filters">
        <button
          className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
          onClick={() => handleFilterChange('all')}
        >
          All
        </button>
        <button
          className={`filter-btn ${filter === 'unread' ? 'active' : ''}`}
          onClick={() => handleFilterChange('unread')}
        >
          Unread {unreadCount > 0 && `(${unreadCount})`}
        </button>
        <button
          className={`filter-btn ${filter === 'matches' ? 'active' : ''}`}
          onClick={() => handleFilterChange('matches')}
        >
          Matches
        </button>
        <button
          className={`filter-btn ${filter === 'online' ? 'active' : ''}`}
          onClick={() => handleFilterChange('online')}
        >
          Online
        </button>
      </div>

      {filteredConversations.length === 0 ? (
        <div className="empty-conversations">
          <div className="empty-icon">💬</div>
          <h3>No conversations found</h3>
          <p>
            {searchQuery 
              ? 'Try a different search term'
              : filter !== 'all'
              ? 'No conversations match your filter'
              : conversations.length === 0
              ? "You don't have any conversations yet. Connect with people to start chatting!"
              : 'No conversations match your current search and filter'}
          </p>
          {!searchQuery && filter === 'all' && conversations.length === 0 && (
            <button
              className="auth-button"
              onClick={handleNewMessage}
            >
              <FaPlus style={{ width: '20px', marginRight: '8px' }} /> Start New Conversation
            </button>
          )}
        </div>
      ) : (
        <div className="conversations-list">
          {filteredConversations.map((conversation) => (
            <div
              key={conversation.id}
              className={`conversation-item ${conversation.unread > 0 ? 'unread' : ''}`}
              onClick={() => handleConversationClick(conversation)}
            >
              <div className="conversation-avatar-container">
                <div className="conversation-avatar">
                  {conversation.profile_picture ? (
                    <img 
                      src={conversation.profile_picture} 
                      alt={conversation.name}
                      className="avatar-image"
                    />
                  ) : (
                    getInitials(conversation.name)
                  )}
                  
                  {conversation.is_online && (
                    <div className="online-status"></div>
                  )}
                </div>
                
                {conversation.is_match && (
                  <div className="match-badge" title="It's a match!">
                    ❤️
                  </div>
                )}
              </div>

              <div className="conversation-info">
                <div className="conversation-header">
                  <h4>{conversation.name}</h4>
                  <span className="conversation-time">
                    {conversation.time}
                  </span>
                </div>
                
                <div className="conversation-preview">
                  <p className="last-message">
                    {conversation.lastMessage}
                  </p>
                  
                  {conversation.unread > 0 && (
                    <span className="unread-count">
                      {conversation.unread}
                    </span>
                  )}
                </div>
                
                <div className="conversation-meta">
                  <span className={`status-indicator ${conversation.is_online ? 'online' : 'offline'}`}>
                    {conversation.is_online ? 'Online' : `Last seen ${formatLastActive(conversation.last_seen)}`}
                  </span>
                </div>
              </div>

              <button 
                className="conversation-menu"
                onClick={(e) => {
                  e.stopPropagation();
                  const action = prompt(`Options for ${conversation.name}:\n\n1. Mark as read\n2. Delete conversation\n3. Clear chat\n\nEnter option number:`);
                  if (action) {
                    const actions = ['mark_read', 'delete', 'clear'];
                    const selectedAction = actions[parseInt(action) - 1];
                    if (selectedAction) {
                      handleConversationAction(conversation, selectedAction);
                    }
                  }
                }}
              >
                <FaEllipsisV style={{ width: '20px' }} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="messages-footer">
        <div className="footer-info">
          <i className="fas fa-lock"></i>
          <span>Your messages are private and secure</span>
        </div>
        <div className="footer-tips">
          <i className="fas fa-lightbulb"></i>
          <span>Tip: Be respectful and genuine in your conversations</span>
        </div>
      </div>
    </div>
  );
};

export default Messages;