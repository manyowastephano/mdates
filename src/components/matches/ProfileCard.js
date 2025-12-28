import React, { useState, useEffect } from 'react';
import { 
  FaChevronLeft, 
  FaChevronRight, 
  FaFacebookMessenger, 
  FaHeart, 
  FaMapMarkedAlt, 
  FaTimes,
  FaInfoCircle
} from 'react-icons/fa';

const ProfileCard = ({ 
  profile, 
  onLike, 
  onPass, 
  onInfo, 
  onMessage,
  onProfileClick,
  currentIndex,
  totalProfiles 
}) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [swipe, setSwipe] = useState({ x: 0, y: 0, isSwiping: false });
  const [touchStart, setTouchStart] = useState(null);

  // Dynamic profile images handling
  const getProfileImages = () => {
    // Check for photos array
    if (profile.photos && Array.isArray(profile.photos) && profile.photos.length > 0) {
      return profile.photos.map(photo => photo.url || photo);
    }
    
    // Check for profile picture
    if (profile.profile_picture) {
      return [profile.profile_picture];
    }
    
    // Check for images array
    if (profile.images && Array.isArray(profile.images)) {
      return profile.images;
    }
    
    // Fallback gradients based on gender or random
    const gradients = [
      "linear-gradient(135deg, #003A8F, #60a5fa)",
      "linear-gradient(135deg, #8b5cf6, #ec4899)",
      "linear-gradient(135deg, #10b981, #06b6d4)",
      "linear-gradient(135deg, #f59e0b, #ef4444)"
    ];
    
    // Pick gradient based on user ID for consistency
    const gradientIndex = profile.id ? profile.id % gradients.length : 0;
    return [gradients[gradientIndex]];
  };

  const getProfilePrompts = () => {
    if (profile.bio || profile.about_me) {
      return [profile.bio || profile.about_me];
    }
    
    // Check for prompts array
    if (profile.prompts && Array.isArray(profile.prompts)) {
      return profile.prompts;
    }
    
    return ["This user hasn't added a bio yet."];
  };

  const getProfileInterests = () => {
    if (profile.interests && Array.isArray(profile.interests)) {
      return profile.interests;
    }
    
    if (profile.interests && typeof profile.interests === 'string') {
      return profile.interests.split(',').map(i => i.trim());
    }
    
    return [];
  };

  const getProfileTags = () => {
    // Try to get tags from various possible fields
    const tags = [];
    
    if (profile.relationship_type) {
      tags.push(profile.relationship_type);
    }
    
    if (profile.looking_for) {
      tags.push(`Looking for: ${profile.looking_for}`);
    }
    
    if (profile.gender) {
      tags.push(profile.gender);
    }
    
    // Add some from interests
    const interests = getProfileInterests();
    if (interests.length > 0) {
      tags.push(...interests.slice(0, 3)); // Limit to 3 interests as tags
    }
    
    return tags;
  };

  const images = getProfileImages();
  const prompts = getProfilePrompts();
  const interests = getProfileInterests();
  const tags = getProfileTags();
  
  const profileName = profile.first_name || profile.name || 'User';
  const profileAge = profile.age || '';
  const profileJob = profile.occupation || profile.job_title || profile.profession || 'Not specified';
  const profileDistance = profile.distance ? `${Math.round(profile.distance)} km away` : 'Nearby';
  const profileLocation = profile.location || profile.city || 'Location not specified';

  useEffect(() => {
    setCurrentImageIndex(0);
  }, [profile.id]);

  // Touch and swipe handlers
  const handleTouchStart = (e) => {
    setTouchStart({
      x: e.touches[0].clientX,
      y: e.touches[0].clientY
    });
    setSwipe({ x: 0, y: 0, isSwiping: true });
  };

  const handleTouchMove = (e) => {
    if (!touchStart) return;
    
    const touchX = e.touches[0].clientX;
    const touchY = e.touches[0].clientY;
    
    const deltaX = touchX - touchStart.x;
    const deltaY = touchY - touchStart.y;
    
    setSwipe({ x: deltaX, y: deltaY, isSwiping: true });
  };

  const handleTouchEnd = () => {
    if (!touchStart) return;
    
    const swipeThreshold = 100;
    
    if (Math.abs(swipe.x) > swipeThreshold) {
      if (swipe.x > 0) {
        onLike();
      } else {
        onPass();
      }
    }
    
    setSwipe({ x: 0, y: 0, isSwiping: false });
    setTouchStart(null);
  };

  const handleMouseDown = (e) => {
    setTouchStart({
      x: e.clientX,
      y: e.clientY
    });
    setSwipe({ x: 0, y: 0, isSwiping: true });
  };

  const handleMouseMove = (e) => {
    if (!touchStart || !swipe.isSwiping) return;
    
    const deltaX = e.clientX - touchStart.x;
    const deltaY = e.clientY - touchStart.y;
    
    setSwipe({ x: deltaX, y: deltaY, isSwiping: true });
  };

  const handleMouseUp = () => {
    if (!touchStart) return;
    
    const swipeThreshold = 100;
    
    if (Math.abs(swipe.x) > swipeThreshold) {
      if (swipe.x > 0) {
        onLike();
      } else {
        onPass();
      }
    }
    
    setSwipe({ x: 0, y: 0, isSwiping: false });
    setTouchStart(null);
  };

  const nextImage = (e) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = (e) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const cardStyle = {
    transform: `translate(${swipe.x}px, ${swipe.y}px) rotate(${swipe.x * 0.1}deg)`,
    opacity: swipe.isSwiping ? 0.9 : 1,
    transition: swipe.isSwiping ? 'none' : 'transform 0.3s ease'
  };

  const getImageStyle = () => {
    const image = images[currentImageIndex];
    
    // Check if it's a gradient
    if (image.startsWith('linear-gradient')) {
      return { background: image };
    }
    
    // Assume it's an image URL
    return { 
      backgroundImage: `url(${image})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat'
    };
  };

  return (
    <div className="profile-card-container">
      <div 
        className="profile-card"
        style={cardStyle}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div className="profile-images">
          <div 
            className="main-profile-image"
            style={getImageStyle()}
            onClick={() => onProfileClick(profile)}
          >
            <div className="image-overlay">
              <h2>{profileName}{profileAge && `, ${profileAge}`}</h2>
              <div className="image-indicators">
                {images.map((_, index) => (
                  <span
                    key={index}
                    className={`indicator ${index === currentImageIndex ? 'active' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentImageIndex(index);
                    }}
                  />
                ))}
              </div>
            </div>
            
            {images.length > 1 && (
              <>
                <button 
                  className="image-nav prev-image"
                  onClick={prevImage}
                >
                  <FaChevronLeft style={{ width: '16px'}} />
                </button>
                
                <button 
                  className="image-nav next-image"
                  onClick={nextImage}
                >
                  <FaChevronRight style={{ width: '16px'}} />
                </button>
              </>
            )}
          </div>
        </div>

        <div className="profile-details">
          <div className="profile-header">
            <div className="profile-main-info">
              <h3>{profileName}{profileAge && `, ${profileAge}`}</h3>
              <div className="profile-job">{profileJob}</div>
              <div className="profile-location">{profileLocation}</div>
            </div>
            <div className="profile-distance">
              <FaMapMarkedAlt style={{ width: '16px', marginRight: '5px' }} /> 
              {profileDistance}
            </div>
          </div>

          {tags.length > 0 && (
            <div className="tags">
              {tags.slice(0, 5).map((tag, index) => (
                <span key={index} className="tag">{tag}</span>
              ))}
            </div>
          )}

          {interests.length > 0 && (
            <div className="interests">
              <div className="interests-label">Interests:</div>
              <div className="interests-list">
                {interests.slice(0, 5).map((interest, index) => (
                  <span key={index} className="interest">{interest}</span>
                ))}
              </div>
            </div>
          )}

          <div className="prompts">
            <h4>About Me</h4>
            <div className="prompt-text">
              {prompts[0].length > 150 ? `${prompts[0].substring(0, 150)}...` : prompts[0]}
            </div>
          </div>

          <div className="profile-actions">
            <button className="btn btn-pass" onClick={onPass} title="Not interested">
              <FaTimes style={{ width: '20px'}} />
              <span className="btn-label">Pass</span>
            </button>
            
            <button className="btn btn-info" onClick={onInfo} title="More info">
              <FaInfoCircle style={{ width: '20px'}} />
              <span className="btn-label">Info</span>
            </button>
            
            <button className="btn btn-message" onClick={onMessage} title="Send message">
              <FaFacebookMessenger style={{ width: '20px'}} />
              <span className="btn-label">Message</span>
            </button>
            
            <button className="btn btn-like" onClick={onLike} title="I'm interested">
              <FaHeart style={{ width: '20px'}} />
              <span className="btn-label">Like</span>
            </button>
          </div>
        </div>
      </div>

      {swipe.isSwiping && (
        <div 
          className="swipe-feedback"
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 100,
            fontSize: '24px',
            fontWeight: 'bold',
            color: swipe.x > 0 ? '#10b981' : '#ef4444',
            opacity: Math.min(Math.abs(swipe.x) / 100, 1)
          }}
        >
          {swipe.x > 0 ? 'LIKE' : 'PASS'}
        </div>
      )}

      <div className="swipe-hint">
        <div className="hint-pass">
          <FaTimes style={{ width: '14px', marginRight: '8px' }} />
          <span>Swipe left to pass</span>
        </div>
        <div className="hint-like">
          <FaHeart style={{ width: '14px', marginRight: '8px' }} />
          <span>Swipe right to like</span>
        </div>
      </div>

      {currentIndex !== undefined && totalProfiles !== undefined && (
        <div className="profile-counter">
          <div className="counter-text">
            Profile {currentIndex + 1} of {totalProfiles}
          </div>
          <div className="progress-bar">
            <div 
              className="progress-fill"
              style={{ width: `${((currentIndex + 1) / totalProfiles) * 100}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileCard;