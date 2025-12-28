
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { FaVideo, FaPhoneAlt, FaPaperPlane, FaCamera, FaEllipsisV, FaCheckDouble, FaCheck, FaChevronLeft, FaSpinner } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { API_ENDPOINTS, fetchJSON, fetchFormData } from '../../config/api';
import Loading from '../common/Loading';

const Chat = () => {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const messagesEndRef = useRef(null);
  const { user: currentUser, isAuthenticated } = useAuth();
  
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [conversationUser, setConversationUser] = useState(null);
  const [conversation, setConversation] = useState(null);
  const [error, setError] = useState(null);

  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  useEffect(() => {
    // Redirect if not authenticated
    if (!isAuthenticated) {
      navigate('/login', { state: { from: location.pathname } });
      return;
    }

    if (conversationId) {
      loadConversation();
    }
    
    // Cleanup function
    return () => {
      // Mark as read when leaving
      if (conversationId && conversationId !== 'new') {
        markConversationAsRead(conversationId);
      }
    };
  }, [conversationId, isAuthenticated, navigate, location.pathname]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const loadConversation = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Check if starting a new conversation
      if (conversationId === 'new') {
        if (location.state?.user) {
          const userData = location.state.user;
          
          // Check if conversation already exists with this user
          const existingConv = await checkExistingConversation(userData.id);
          
          if (existingConv) {
            navigate(`/messages/${existingConv.id}`);
            return;
          }
          
          setConversationUser(userData);
          setMessages([]);
          setConversation(null);
        } else {
          navigate('/messages');
          return;
        }
      } else {
        // Fetch existing conversation
        await Promise.all([
          fetchConversation(),
          fetchMessages()
        ]);
      }
    } catch (error) {
      console.error('Error loading conversation:', error);
      setError('Failed to load conversation. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchConversation = async () => {
    try {
      const data = await fetchJSON(API_ENDPOINTS.CHAT_CONVERSATION(conversationId), {
        method: 'GET',
      });
      
      setConversation(data);
      
      // Extract the other user from participants
      const otherUser = data.participants?.find(p => p.id !== currentUser.id);
      if (otherUser) {
        setConversationUser(otherUser);
      }
    } catch (error) {
      console.error('Error fetching conversation:', error);
      throw error;
    }
  };

  const fetchMessages = async () => {
    try {
      const messagesData = await fetchJSON(API_ENDPOINTS.CHAT_CONVERSATION_MESSAGES(conversationId), {
        method: 'GET',
      });

      setMessages(messagesData.map(mapMessageData));
    } catch (error) {
      console.error('Error fetching messages:', error);
      throw error;
    }
  };

  const checkExistingConversation = async (userId) => {
    try {
      const data = await fetchJSON(API_ENDPOINTS.CHAT_EXISTS(userId), {
        method: 'GET',
      });
      
      return data.conversation_id ? { id: data.conversation_id } : null;
    } catch (error) {
      console.error('Error checking existing conversation:', error);
      return null;
    }
  };

  const mapMessageData = (message) => ({
    id: message.id,
    text: message.content,
    time: new Date(message.timestamp || message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    sender: message.sender_id === currentUser.id ? 'me' : 'them',
    read: message.read || false,
    type: message.type || 'text',
    attachment: message.attachment_url || null
  });

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim()) return;
    
    setSending(true);
    setError(null);
    
    try {
      let targetConversationId = conversationId;
      
      // If this is a new conversation, create it first
      if (conversationId === 'new' && conversationUser) {
        const newConversation = await fetchJSON(API_ENDPOINTS.CHAT_CONVERSATIONS, {
          method: 'POST',
          body: JSON.stringify({
            participant_id: conversationUser.id
          })
        });
        
        targetConversationId = newConversation.id;
        navigate(`/messages/${targetConversationId}`, { replace: true });
        setConversation(newConversation);
      }
      
      // Send the message
      const messageData = {
        content: newMessage.trim(),
        conversation_id: targetConversationId
      };
      
      const sentMessage = await fetchJSON(API_ENDPOINTS.CHAT_MESSAGES, {
        method: 'POST',
        body: JSON.stringify(messageData)
      });
      
      const mappedMessage = mapMessageData(sentMessage);
      
      // Add message to local state
      setMessages(prev => [...prev, mappedMessage]);
      setNewMessage('');
      
    } catch (error) {
      console.error('Error sending message:', error);
      setError('Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const markConversationAsRead = async (convId) => {
    try {
      await fetchJSON(API_ENDPOINTS.CHAT_MARK_READ(convId), {
        method: 'POST',
      });
    } catch (error) {
      console.error('Error marking conversation as read:', error);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  const handleBackClick = () => {
    navigate('/messages');
  };

  const handleCall = async () => {
    if (conversationUser && window.confirm(`Call ${conversationUser.name}?`)) {
      try {
        await fetchJSON(API_ENDPOINTS.CALLS_START, {
          method: 'POST',
          body: JSON.stringify({
            user_id: conversationUser.id,
            type: 'audio',
            conversation_id: conversationId
          })
        });
        
        alert(`Calling ${conversationUser.name}...`);
      } catch (error) {
        console.error('Error starting call:', error);
        alert('Failed to start call. Please try again.');
      }
    }
  };

  const handleVideoCall = async () => {
    if (conversationUser && window.confirm(`Start video call with ${conversationUser.name}?`)) {
      try {
        await fetchJSON(API_ENDPOINTS.CALLS_START, {
          method: 'POST',
          body: JSON.stringify({
            user_id: conversationUser.id,
            type: 'video',
            conversation_id: conversationId
          })
        });
        
        alert(`Starting video call with ${conversationUser.name}...`);
      } catch (error) {
        console.error('Error starting video call:', error);
        alert('Failed to start video call. Please try again.');
      }
    }
  };

  const handleProfileClick = () => {
    if (conversationUser) {
      navigate(`/profile/${conversationUser.id}`);
    }
  };

  const handleAttachmentClick = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*,video/*,audio/*';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        alert('File size must be less than 10MB');
        return;
      }
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('conversation_id', conversationId);
      
      try {
        const attachment = await fetchFormData(API_ENDPOINTS.CHAT_UPLOAD, formData, {
          method: 'POST',
        });
        
        // Create message with attachment
        const messageData = {
          content: file.type.startsWith('image/') ? 'Sent an image' : 'Sent a file',
          conversation_id: conversationId,
          type: 'attachment',
          attachment_url: attachment.url
        };
        
        const sentMessage = await fetchJSON(API_ENDPOINTS.CHAT_MESSAGES, {
          method: 'POST',
          body: JSON.stringify(messageData)
        });
        
        setMessages(prev => [...prev, mapMessageData(sentMessage)]);
      } catch (error) {
        console.error('Error uploading attachment:', error);
        alert('Failed to upload attachment.');
      }
    };
    input.click();
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  const handleClearChat = async () => {
    if (window.confirm('Clear all messages in this conversation?')) {
      try {
        await fetchJSON(API_ENDPOINTS.CHAT_CLEAR(conversationId), {
          method: 'POST',
        });
        
        setMessages([]);
        alert('Chat cleared successfully!');
      } catch (error) {
        console.error('Error clearing chat:', error);
        alert('Failed to clear chat.');
      }
    }
  };

  const handleDeleteConversation = async () => {
    if (window.confirm('Delete this conversation? This action cannot be undone.')) {
      try {
        await fetchJSON(API_ENDPOINTS.CHAT_CONVERSATION(conversationId), {
          method: 'DELETE',
        });
        
        alert('Conversation deleted.');
        navigate('/messages');
      } catch (error) {
        console.error('Error deleting conversation:', error);
        alert('Failed to delete conversation.');
      }
    }
  };

  if (loading) {
    return (
      <div className="chat-page">
        <Loading message="Loading conversation..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="chat-page">
        <div className="chat-error">
          <h2>Error</h2>
          <p>{error}</p>
          <button className="back-btn" onClick={handleBackClick}>
            <FaChevronLeft style={{ width: '20px' }} /> Back to Messages
          </button>
        </div>
      </div>
    );
  }

  if (!conversationUser && conversationId !== 'new') {
    return (
      <div className="chat-page">
        <div className="chat-error">
          <h2>Conversation not found</h2>
          <p>The conversation you're looking for doesn't exist or you don't have permission to view it.</p>
          <button className="back-btn" onClick={handleBackClick}>
            <FaChevronLeft style={{ width: '20px' }} /> Back to Messages
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-page">
      <div className="chat-header">
        <button className="back-btn" onClick={handleBackClick}>
          <FaChevronLeft style={{ width: '20px' }} />
        </button>
        
        <div 
          className="chat-user-info"
          onClick={handleProfileClick}
          style={{ cursor: 'pointer' }}
        >
          <div className="chat-avatar">
            {conversationUser?.profile_picture ? (
              <img 
                src={conversationUser.profile_picture} 
                alt={conversationUser.name}
                className="avatar-image"
              />
            ) : (
              getInitials(conversationUser?.name || 'User')
            )}
            {conversationUser?.is_online && <div className="online-indicator"></div>}
          </div>
          
          <div className="chat-user-details">
            <h3>{conversationUser?.name || 'User'}, {conversationUser?.age || ''}</h3>
            <div className="user-status">
              <span className={`status ${conversationUser?.is_online ? 'online' : 'offline'}`}>
                {conversationUser?.is_online ? 'Online' : `Last seen ${conversationUser?.last_seen || 'recently'}`}
              </span>
            </div>
          </div>
        </div>
        
        <div className="chat-actions">
          <button className="action-btn" onClick={handleCall} title="Audio call" disabled={!conversationUser}>
            <FaPhoneAlt style={{ width: '20px' }} />
          </button>
          
          <button className="action-btn" onClick={handleVideoCall} title="Video call" disabled={!conversationUser}>
            <FaVideo style={{ width: '20px' }} />
          </button>
          
          <div className="dropdown">
            <button className="action-btn" title="More options">
              <FaEllipsisV style={{ width: '20px' }} />
            </button>
            <div className="dropdown-content">
              <button onClick={handleClearChat}>Clear Chat</button>
              <button onClick={handleDeleteConversation}>Delete Conversation</button>
            </div>
          </div>
        </div>
      </div>

      <div className="chat-container">
        {conversation?.is_match && (
          <div className="match-banner">
            <div className="match-icon">❤️</div>
            <div className="match-text">
              <strong>It's a match!</strong>
              <span>You both liked each other</span>
            </div>
          </div>
        )}
        
        <div className="chat-date">
          <span className="date-label">
            {conversation?.created_at ? 
              new Date(conversation.created_at).toLocaleDateString() : 
              'Today'}
          </span>
        </div>
        
        <div className="chat-messages">
          {messages.length === 0 ? (
            <div className="no-messages">
              <div className="no-messages-icon">💬</div>
              <h3>No messages yet</h3>
              <p>Start the conversation by sending a message!</p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`message ${message.sender === 'me' ? 'sent' : 'received'}`}
              >
                {message.sender === 'them' && (
                  <div 
                    className="message-avatar"
                    onClick={handleProfileClick}
                  >
                    {conversationUser?.profile_picture ? (
                      <img 
                        src={conversationUser.profile_picture} 
                        alt={conversationUser.name}
                        className="avatar-image"
                      />
                    ) : (
                      getInitials(conversationUser?.name || 'User')
                    )}
                  </div>
                )}
                
                <div className="message-content-wrapper">
                  {message.attachment && (
                    <div className="message-attachment">
                      <img 
                        src={message.attachment} 
                        alt="Attachment" 
                        className="attachment-image"
                        onClick={() => window.open(message.attachment, '_blank')}
                      />
                    </div>
                  )}
                  
                  <div className="message-content">
                    {message.text}
                  </div>
                  
                  <div className="message-meta">
                    <span className="message-time">
                      {message.time}
                    </span>
                    
                    {message.sender === 'me' && (
                      <span className="message-status">
                        {message.read ? (
                          <FaCheckDouble style={{ width: '20px' }} />
                        ) : (
                          <FaCheck style={{ width: '20px' }} />
                        )}
                      </span>
                    )}
                  </div>
                </div>
                
                {message.sender === 'me' && (
                  <div className="message-avatar">
                    {currentUser?.profile_picture ? (
                      <img 
                        src={currentUser.profile_picture} 
                        alt={currentUser.name}
                        className="avatar-image"
                      />
                    ) : (
                      getInitials(currentUser?.name || 'You')
                    )}
                  </div>
                )}
              </div>
            ))
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </div>

      <form className="chat-input-area" onSubmit={handleSendMessage}>
        <div className="input-actions">
          <button 
            type="button" 
            className="action-btn" 
            onClick={handleAttachmentClick}
            title="Add attachment"
            disabled={sending || !conversationId}
          >
            <FaCamera style={{ width: '20px' }} />
          </button>
        </div>
        
        <div className="message-input-container">
          <textarea
            className="message-input"
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            rows="1"
            disabled={sending}
          />
        </div>
        
        <button
          type="submit"
          className="send-btn"
          disabled={!newMessage.trim() || sending || !conversationId}
        >
          {sending ? (
            <FaSpinner className="spinner" />
          ) : (
            <FaPaperPlane style={{ width: '20px' }} />
          )}
        </button>
      </form>
    </div>
  );
};

export default Chat;