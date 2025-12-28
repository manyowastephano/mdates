import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_ENDPOINTS, fetchJSON } from '../../config/api';
import { useAuth } from '../../context/AuthContext';
const MatchNotification = ({ 
  show = false, 
  onClose, 
  matchData = null,
  autoClose = true,
  autoCloseDelay = 3000
}) => {
  const [isVisible, setIsVisible] = useState(show);
  const [isAnimating, setIsAnimating] = useState(false);
  const navigate = useNavigate();
  const { token } = useAuth();
  useEffect(() => {
    if (show) {
      setIsAnimating(true);
      setTimeout(() => setIsVisible(true), 10);
      if (autoClose) {
        setTimeout(() => {
          handleClose();
        }, autoCloseDelay);
      }
    } else {
      handleClose();
    }
  }, [show, autoClose, autoCloseDelay]);

  const handleClose = () => {
    setIsAnimating(false);
    setTimeout(() => {
      setIsVisible(false);
      if (onClose) onClose();
    }, 300);
  };

  const handleNotificationClick = async () => {
    if (matchData && matchData.user2 && matchData.user2.id) {
      try {
        const data = await fetchJSON(
          API_ENDPOINTS.CHAT_EXISTS(matchData.user2.id),
          {},
          token
        );
        if (data.conversation_id) {
          navigate(`/messages/${data.conversation_id}`);
        } else {
          // Create new conversation
          navigate(`/messages/new/${matchData.user2.id}`);
        }
      } catch (error) {
        console.error('Error navigating to chat:', error);
        navigate('/matches');
      }
    } else {
      navigate('/matches');
    }
    handleClose();
  };

  const handleSendMessage = async (e) => {
    e.stopPropagation();
    if (matchData && matchData.user2 && matchData.user2.id) {
      try {
        const data = await fetchJSON(
          API_ENDPOINTS.CHAT_MESSAGES,
          {
            method: 'POST',
            body: JSON.stringify({
              recipient_id: matchData.user2.id,
              message: "Hi! We matched! 😊"
            })
          },
          token
        );
        
        if (data.conversation_id) {
          navigate(`/messages/${data.conversation_id}`);
        } else {
          navigate(`/messages/new/${matchData.user2.id}`);
        }
      } catch (error) {
        console.error('Error sending message:', error);
        navigate(`/messages/new/${matchData.user2.id}`);
      }
    }
    handleClose();
  };
  const handleViewProfile = (e) => {
    e.stopPropagation();
    
    if (matchData && matchData.user2 && matchData.user2.id) {
      navigate(`/profile/${matchData.user2.id}`);
    } else {
      navigate('/matches');
    }
    handleClose();
  };

  if (!isVisible || !matchData) return null;
  
  const user1 = matchData.user1 || {
    name: 'You',
    avatarColor: 'linear-gradient(135deg, #003A8F, #3b82f6)',
    initials: 'Y'
  };

  const user2 = matchData.user2 || {
    name: 'Match',
    avatarColor: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
    initials: 'M'
  };

  const message = matchData.message || `You and ${user2.name} have matched!`;

  return (
    <div 
      className={`match-notification ${isAnimating ? 'show' : 'hide'}`}
      onClick={handleNotificationClick}
      style={{
        position: 'fixed',
        top: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'white',
        borderRadius: 'var(--radius-md)',
        boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
        padding: '16px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: '15px',
        zIndex: 1000,
        width: '90%',
        maxWidth: '350px',
        borderLeft: '5px solid var(--mubas-blue)',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        opacity: isAnimating ? 1 : 0,
        transform: `translateX(-50%) translateY(${isAnimating ? '0' : '-20px'})`
      }}
    >
      <div className="match-avatars" style={{ position: 'relative' }}>
        <div 
          className="avatar"
          style={{
            width: '50px',
            height: '50px',
            borderRadius: '50%',
            background: user1.avatarColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: 600,
            fontSize: '18px'
          }}
        >
          {user1.initials}
        </div>
        <div 
          className="avatar"
          style={{
            width: '50px',
            height: '50px',
            borderRadius: '50%',
            background: user2.avatarColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: 600,
            fontSize: '18px',
            marginLeft: '-15px'
          }}
        >
          {user2.initials}
        </div>
        
        <div 
          className="heart-icon"
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            color: 'var(--error)',
            fontSize: '20px',
            background: 'white',
            borderRadius: '50%',
            width: '30px',
            height: '30px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
          }}
        >
          ❤️
        </div>
      </div>
      
      <div className="match-text" style={{ flex: 1 }}>
        <h4 style={{ 
          fontSize: '16px', 
          marginBottom: '4px', 
          color: 'var(--mubas-blue)' 
        }}>
          It's a match!
        </h4>
        <p style={{ 
          fontSize: '13px', 
          color: 'var(--text-secondary)',
          marginBottom: '8px'
        }}>
          {message}
        </p>
        
        <div className="match-actions" style={{
          display: 'flex',
          gap: '8px',
          fontSize: '12px'
        }}>
          <button
            onClick={handleSendMessage}
            style={{
              background: 'var(--mubas-blue)',
              color: 'white',
              border: 'none',
              padding: '4px 8px',
              borderRadius: '12px',
              fontSize: '11px',
              cursor: 'pointer',
              fontWeight: 600
            }}
          >
            Send Hi 👋
          </button>
          <button
            onClick={handleViewProfile}
            style={{
              background: 'transparent',
              color: 'var(--mubas-blue)',
              border: '1px solid var(--mubas-blue)',
              padding: '4px 8px',
              borderRadius: '12px',
              fontSize: '11px',
              cursor: 'pointer',
              fontWeight: 600
            }}
          >
            View Profile
          </button>
        </div>
      </div>
      
      <button 
        className="close-notification"
        onClick={(e) => {
          e.stopPropagation();
          handleClose();
        }}
        style={{
          position: 'absolute',
          top: '8px',
          right: '8px',
          background: 'none',
          border: 'none',
          fontSize: '18px',
          color: 'var(--text-secondary)',
          cursor: 'pointer',
          padding: '4px',
          borderRadius: '50%',
          width: '24px',
          height: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        ×
      </button>
    </div>
  );
};

export const withMatchNotification = (Component) => {
  return function WithMatchNotification(props) {
    const [showNotification, setShowNotification] = useState(false);
    const [matchData, setMatchData] = useState(null);
    const showMatchNotification = (data) => {
      setMatchData(data);
      setShowNotification(true);
    };
    return (
      <>
        <Component 
          {...props} 
          showMatchNotification={showMatchNotification}
        />
        <MatchNotification 
          show={showNotification}
          onClose={() => setShowNotification(false)}
          matchData={matchData}
        />
      </>
    );
  };
};

export const useMatchNotification = () => {
  const [showNotification, setShowNotification] = useState(false);
  const [matchData, setMatchData] = useState(null);
  const showMatchNotification = (data) => {
    setMatchData(data);
    setShowNotification(true);
  };
  const hideMatchNotification = () => {
    setShowNotification(false);
    setMatchData(null);
  };
  const MatchNotificationComponent = () => (
    <MatchNotification
      show={showNotification}
      onClose={hideMatchNotification}
      matchData={matchData}
    />
  );
  return {
    showMatchNotification,
    hideMatchNotification,
    MatchNotificationComponent
  };
};
export default MatchNotification;