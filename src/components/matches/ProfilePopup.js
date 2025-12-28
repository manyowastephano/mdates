import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const ProfilePopup = ({ user, onClose, onLike, onPass }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const navigate = useNavigate();
  const getUserImages = () => {
    if (user.images && user.images.length > 0) {
      return user.images;
    }
    
    if (user.profile_image) {
      return [user.profile_image];
    }
    return [
      { id: 1, color: "linear-gradient(135deg, #003A8F, #60a5fa)" }
    ];
  };

  const getUserTags = () => {
    return user.tags || user.interests || ["Looking for connection"];
  };

  const userImages = getUserImages();
  const userTags = getUserTags();
  const userName = user.name || user.full_name || 'User';
  const userAge = user.age || '';
  const userJob = user.occupation || user.job || 'Not specified';
  const userDistance = user.distance ? `${user.distance} km away` : 'Nearby';
  const userBio = user.bio || "No bio available";

  const handleSwipeLeft = () => {
    onPass();
  };

  const handleSwipeRight = () => {
    onLike();
  };

  const handleMessageClick = () => {
    onClose();
    
    // Navigate to chat with this user
    const conversationId = user.id || `new-${Date.now()}`;
    navigate(`/messages/${conversationId}`);
  };

  const handleInfoClick = () => {
    alert(`More info about ${userName}:\n\nAge: ${userAge}\nOccupation: ${userJob}\nBio: ${userBio}\nDistance: ${userDistance}`);
  };

  const getImageStyle = (image) => {
    if (typeof image === 'object' && image.color) {
      return { background: image.color };
    }
    
    if (typeof image === 'string' && image.startsWith('linear-gradient')) {
      return { background: image };
    }
    
    // Assume it's an image URL
    return { 
      backgroundImage: `url(${image})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center'
    };
  };

  return (
    <div className="profile-popup-overlay">
      <div className="profile-popup">
        <div className="popup-header">
          <button className="close-btn" onClick={onClose}>×</button>
          <h2>{userName}'s Profile</h2>
        </div>

        <div className="profile-images">
          <div 
            className="main-profile-image"
            style={getImageStyle(userImages[currentImageIndex])}
          >
            <h2>{userName}{userAge && `, ${userAge}`}</h2>
            <div className="image-indicators">
              {userImages.map((_, index) => (
                <span 
                  key={index}
                  className={`indicator ${index === currentImageIndex ? 'active' : ''}`}
                  onClick={() => setCurrentImageIndex(index)}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="profile-details">
          <div className="profile-meta">
            <span className="job">{userJob}</span>
            <span className="distance">{userDistance}</span>
          </div>

          {userTags.length > 0 && (
            <div className="tags">
              {userTags.map((tag, index) => (
                <span key={index} className="tag">{tag}</span>
              ))}
            </div>
          )}

          <div className="prompt">
            <strong>What matters most to me right now:</strong><br />
            {userBio}
          </div>

          <div className="profile-actions">
            <button 
              className="btn btn-pass" 
              onClick={handleSwipeLeft}
              title="Pass"
            >
              ✕
            </button>
            <button 
              className="btn btn-message" 
              onClick={handleMessageClick}
              title={`Message ${userName}`}
            >
              💬
            </button>
            <button 
              className="btn btn-like" 
              onClick={handleSwipeRight}
              title="Like"
            >
              ❤
            </button>
          </div>
          
          <div className="additional-actions">
            <button 
              className="info-btn" 
              onClick={handleInfoClick}
              title="More info"
            >
              <i className="fas fa-info-circle"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePopup;