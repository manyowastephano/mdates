import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './styles/UserCard.css'

const UserCard = ({ 
  user, 
  onClick, 
  onLike, 
  onPass, 
  onMessage, 
  onViewProfile, 
  showDistance = true, 
  showStatus = true,
  isLiked = false,
  isMatch = false 
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const navigate = useNavigate();
  const defaultUser = {
    id: 0,
    name: 'User',
    age: 25,
    job: 'Not specified',
    bio: 'Looking for connections',
    distance: 'Nearby',
    status: 'offline',
    initials: 'U',
    isMatch: false,
    interests: [],
    lastActive: 'Recently'
  };

  const userData = { ...defaultUser, ...user, isMatch };
  const handleClick = (e) => {
    e.stopPropagation();
    if (onClick) {
      onClick(userData);
    } else {
      navigate(`/user/${userData.id}`);
    }
  };
  const formatDistance = (distance) => {
    if (!distance) return '';
    if (typeof distance === 'number') {
      return distance < 1 ? 
        `${Math.round(distance * 1000)} m away` : 
        `${distance.toFixed(1)} km away`;
    }
    return distance;
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'online': return 'Online now';
      case 'offline': return 'Offline';
      case 'recently': return 'Recently active';
      default: return status;
    }
  };

  const getLastActiveTime = () => {
    if (userData.lastActive) {
      return userData.lastActive;
    }
    
    if (userData.lastActiveTimestamp) {
      const now = new Date();
      const lastActive = new Date(userData.lastActiveTimestamp);
      const diffHours = Math.floor((now - lastActive) / (1000 * 60 * 60));
      
      if (diffHours < 1) {
        const diffMinutes = Math.floor((now - lastActive) / (1000 * 60));
        return `${diffMinutes}m ago`;
      } else if (diffHours < 24) {
        return `${diffHours}h ago`;
      } else {
        const diffDays = Math.floor(diffHours / 24);
        return `${diffDays}d ago`;
      }
    }
    
    return 'Recently';
  };

  const handleQuickLike = (e) => {
    e.stopPropagation();
    if (onLike) {
      onLike(userData.id);
    }
  };

  const handleQuickChat = (e) => {
    e.stopPropagation();
    if (onMessage) {
      onMessage(userData);
    }
  };

  return (
    <div 
      className="user-card"
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
        boxShadow: isHovered ? '0 6px 12px rgba(0,0,0,0.08)' : 'none',
        borderColor: isHovered ? 'rgba(0, 58, 143, 0.1)' : 'transparent'
      }}
      data-id={userData.id}
    >
      <div className="avatar-container">
        <div 
          className="avatar"
          style={{ 
            background: userData.color,
            position: 'relative'
          }}
        >
          {userData.image ? (
            <img 
              src={userData.image} 
              alt={userData.name}
              style={{
                width: '100%',
                height: '100%',
                borderRadius: '50%',
                objectFit: 'cover'
              }}
            />
          ) : (
            userData.initials
          )}
          
          {showStatus && (
            <div 
              className={`status ${userData.status === 'online' ? 'online' : 'offline'}`}
              title={getStatusText(userData.status)}
            />
          )}
          
          {userData.isMatch && (
            <div 
              className="match-badge"
              style={{
                position: 'absolute',
                top: '-4px',
                right: '-4px',
                backgroundColor: '#FF4081',
                color: 'white',
                fontSize: '10px',
                fontWeight: 'bold',
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '2px solid white',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
              }}
              title="You have matched with this person"
            >
              ❤️
            </div>
          )}
          
          {isLiked && !userData.isMatch && (
            <div 
              className="liked-badge"
              style={{
                position: 'absolute',
                top: '-4px',
                right: '-4px',
                backgroundColor: '#4CAF50',
                color: 'white',
                fontSize: '10px',
                fontWeight: 'bold',
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '2px solid white',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
              }}
              title="You liked this person"
            >
              ✓
            </div>
          )}
        </div>
      </div>
      
      <div className="user-info">
        <div className="user-main-info">
          <h3>
            {userData.name}, {userData.age}
            {userData.verified && (
              <span className="verified-badge" title="Verified">✓</span>
            )}
          </h3>
          
          <div className="user-job">
            <span>{userData.job}</span>
            {userData.interests && userData.interests.length > 0 && (
              <span className="interest-dot">·</span>
            )}
            {userData.interests && userData.interests.slice(0, 2).map((interest, index) => (
              <span key={index} className="interest-tag">{interest}</span>
            ))}
          </div>
          
          <div className="user-bio">
            {userData.bio || 'Looking for meaningful connections'}
          </div>
          <div className="user-meta">
            {userData.status === 'offline' && (
              <span className="last-active">
                Active {getLastActiveTime()}
              </span>
            )}
            {userData.compatibility && (
              <span className="compatibility">
                {userData.compatibility}% match
              </span>
            )}
          </div>
        </div>
      </div>
      
      {showDistance && userData.distance && (
        <div className="distance">
          {formatDistance(userData.distance)}
        </div>
      )}
      
      {/* Quick actions on hover */}
      {isHovered && (
        <div 
          className="quick-actions"
          style={{
            position: 'absolute',
            right: '10px',
            top: '10px',
            display: 'flex',
            gap: '8px',
            zIndex: 2
          }}
        >
          <button
            className="quick-like"
            onClick={handleQuickLike}
            style={{
              background: isLiked ? 'rgba(76, 175, 80, 0.2)' : 'rgba(0, 58, 143, 0.1)',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: isLiked ? '#4CAF50' : 'var(--mubas-blue)',
              cursor: 'pointer',
              fontSize: '16px'
            }}
            title={isLiked ? "Already liked" : "Like"}
          >
            {isLiked ? '❤️' : '🤍'}
          </button>
          
          <button
            className="quick-chat"
            onClick={handleQuickChat}
            style={{
              background: 'rgba(0, 58, 143, 0.1)',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--mubas-blue)',
              cursor: 'pointer',
              fontSize: '16px'
            }}
            title="Send message"
          >
            💬
          </button>
        </div>
      )}
    </div>
  );
};
UserCard.defaultProps = {
  user: {},
  onClick: null,
  onLike: null,
  onPass: null,
  onMessage: null,
  onViewProfile: null,
  showDistance: true,
  showStatus: true,
  isLiked: false,
  isMatch: false
};
export default UserCard;