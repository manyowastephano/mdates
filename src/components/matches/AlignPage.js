import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ProfileCard from './ProfileCard';
import Loading from '../common/Loading';
import { API_ENDPOINTS, fetchJSON } from '../../config/api';
import { useAuth } from '../../context/AuthContext';
import { 
  FaChevronCircleLeft, 
  FaChevronCircleRight, 
  FaList, 
  FaMapMarkedAlt, 
  FaRedo, 
  FaSpinner, 
  FaSync, 
  FaThLarge 
} from 'react-icons/fa';

const AlignPage = () => {
  const [profiles, setProfiles] = useState([]);
  const [currentProfileIndex, setCurrentProfileIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [hasMoreProfiles, setHasMoreProfiles] = useState(true);
  const [matchNotification, setMatchNotification] = useState(null);
  const [viewMode, setViewMode] = useState('swipe');
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { user, userId, isAuthenticated } = useAuth();

  useEffect(() => {
    // Check authentication
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    loadProfiles();
  }, [isAuthenticated, navigate]);

  const loadProfiles = async () => {
    setLoading(true);
    setError(null);
    try {
      // Using USERS endpoint for discover
      const data = await fetchJSON(API_ENDPOINTS.USERS, {
        method: 'GET',
      });
      
      // Filter out current user using context userId
      const filteredProfiles = Array.isArray(data) 
        ? data.filter(profile => {
            // Check various possible ID fields
            const profileId = profile.id || profile.user_id || profile._id;
            const currentUserId = userId || user?.id || user?.user_id || user?._id;
            return profileId?.toString() !== currentUserId?.toString();
          })
        : [];
      
      setProfiles(filteredProfiles);
      setHasMoreProfiles(false); // Assuming single page for now
      setCurrentProfileIndex(0);
      
      if (filteredProfiles.length === 0) {
        setError('No profiles found. Try adjusting your preferences or check back later.');
      }
    } catch (error) {
      console.error('Error loading profiles:', error);
      if (error.message === 'SESSION_EXPIRED') {
        navigate('/login');
      } else {
        setError('Failed to load profiles. Please check your connection and try again.');
      }
      setProfiles([]);
    } finally {
      setLoading(false);
    }
  };

  const loadMoreProfiles = async () => {
    if (!hasMoreProfiles || loading) return;
    
    setLoading(true);
    try {
      const data = await fetchJSON(`${API_ENDPOINTS.USERS}?page=${currentPage + 1}`, {
        method: 'GET',
      });
      
      if (Array.isArray(data)) {
        // Filter out current user using context userId
        const currentUserId = userId || user?.id || user?.user_id || user?._id;
        const moreProfiles = data.filter(profile => {
          const profileId = profile.id || profile.user_id || profile._id;
          return profileId?.toString() !== currentUserId?.toString();
        });
        
        setProfiles(prev => [...prev, ...moreProfiles]);
        setCurrentPage(prev => prev + 1);
        
        if (moreProfiles.length === 0) {
          setHasMoreProfiles(false);
        }
      }
    } catch (error) {
      console.error('Error loading more profiles:', error);
      setError('Failed to load more profiles.');
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    const currentProfile = profiles[currentProfileIndex];
    if (!currentProfile) return;
    
    try {
      // Using LIKES endpoint to send like
      const result = await fetchJSON(API_ENDPOINTS.LIKES, {
        method: 'POST',
        body: JSON.stringify({
          target_user_id: currentProfile.id || currentProfile.user_id || currentProfile._id,
          action: 'like'
        })
      });
      
      // Check if it's a match
      if (result.is_match || result.match_created) {
        setMatchNotification({
          user1: { 
            name: "You", 
            color: "linear-gradient(135deg, #003A8F, #3b82f6)", 
            initials: "Y" 
          },
          user2: { 
            name: currentProfile.first_name || currentProfile.name || 'User', 
            color: currentProfile.profile_picture ? 'transparent' : "linear-gradient(135deg, #8b5cf6, #ec4899)", 
            initials: (currentProfile.first_name || currentProfile.name || 'U').charAt(0) 
          },
          message: `You and ${currentProfile.first_name || currentProfile.name} have matched!`
        });
        
        setTimeout(() => {
          setMatchNotification(null);
        }, 3000);
      }
    } catch (error) {
      console.error('Error sending like:', error);
      alert('Failed to send like. Please try again.');
    }
    
    // Move to next profile
    nextProfile();
  };

  const handlePass = async () => {
    const currentProfile = profiles[currentProfileIndex];
    if (!currentProfile) return;
    
    try {
      // Using DISLIKES endpoint to send pass
      await fetchJSON(API_ENDPOINTS.DISLIKES, {
        method: 'POST',
        body: JSON.stringify({
          target_user_id: currentProfile.id || currentProfile.user_id || currentProfile._id,
          action: 'dislike'
        })
      });
    } catch (error) {
      console.error('Error sending pass:', error);
      // Don't alert for passes to avoid interrupting flow
    }
    
    nextProfile();
  };

  const handleInfo = () => {
    const currentProfile = profiles[currentProfileIndex];
    if (!currentProfile) return;
    
    const userInfo = `
More about ${currentProfile.first_name || currentProfile.name || 'User'}:

Age: ${currentProfile.age || 'Not specified'}
Gender: ${currentProfile.gender || 'Not specified'}
Location: ${currentProfile.location || currentProfile.city || 'Not specified'}
Bio: ${currentProfile.bio || currentProfile.about_me || 'No bio available'}

Looking for: ${currentProfile.looking_for || 'Not specified'}
Relationship Type: ${currentProfile.relationship_type || 'Not specified'}

${currentProfile.interests ? `Interests: ${Array.isArray(currentProfile.interests) ? currentProfile.interests.join(', ') : currentProfile.interests}` : ''}
    `.trim();
    
    alert(userInfo);
  };

  const handleMessage = async () => {
    const currentProfile = profiles[currentProfileIndex];
    if (!currentProfile) return;
    
    const profileId = currentProfile.id || currentProfile.user_id || currentProfile._id;
    
    if (!profileId) {
      alert('Cannot message this user at the moment.');
      return;
    }
    
    try {
      // Check if chat exists with this user
      const data = await fetchJSON(API_ENDPOINTS.CHAT_EXISTS(profileId), {
        method: 'GET',
      });
      
      if (data.conversation_id) {
        navigate(`/messages/${data.conversation_id}`);
      } else {
        // Create new conversation
        navigate(`/messages/new`, { state: { user: currentProfile } });
      }
    } catch (error) {
      console.error('Error checking chat existence:', error);
      navigate('/messages');
    }
  };

  const nextProfile = () => {
    if (currentProfileIndex < profiles.length - 1) {
      setCurrentProfileIndex(prev => prev + 1);
    } else if (hasMoreProfiles) {
      loadMoreProfiles();
    } else {
      // No more profiles
      setCurrentProfileIndex(profiles.length);
    }
  };

  const previousProfile = () => {
    if (currentProfileIndex > 0) {
      setCurrentProfileIndex(prev => prev - 1);
    }
  };

  const resetProfiles = () => {
    setCurrentPage(1);
    loadProfiles();
  };

  const goToProfile = (profile) => {
    const profileId = profile.id || profile.user_id || profile._id;
    if (profileId) {
      navigate(`/profile/${profileId}`);
    } else {
      alert('Cannot view profile details at the moment.');
    }
  };

  const getDistanceText = (profile) => {
    if (!profile.distance) return 'Nearby';
    if (profile.distance < 1) return '< 1 km away';
    return `${Math.round(profile.distance)} km away`;
  };

  const currentProfile = profiles[currentProfileIndex];

  if (loading && profiles.length === 0) {
    return (
      <div className="align-page">
        <Loading message="Finding your perfect matches..." />
      </div>
    );
  }

  return (
    <div className="align-page">
      <div className="page-header">
        <div className="header-content">
          <h1>Find Your Match</h1>
          <p>Intent-based matching · Quality over quantity</p>
        </div>
        
        <div className="view-toggle">
          <button
            className={`view-btn ${viewMode === 'swipe' ? 'active' : ''}`}
            onClick={() => setViewMode('swipe')}
            title="Swipe view"
          >
            <FaThLarge style={{ width: '20px'}} />
          </button>
          <button
            className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
            onClick={() => setViewMode('grid')}
            title="Grid view"
          >
            <FaList style={{ width: '20px'}} />
          </button>
        </div>
      </div>

      {error && (
        <div className="error-message">
          <p>{error}</p>
          <button onClick={loadProfiles} className="retry-btn">
            <FaSync /> Retry
          </button>
        </div>
      )}

      {matchNotification && (
        <div className="match-notification">
          <div className="match-avatars">
            <div 
              className="avatar"
              style={{ background: matchNotification.user1.color }}
            >
              {matchNotification.user1.initials}
            </div>
            <div 
              className="avatar"
              style={{ background: matchNotification.user2.color }}
            >
              {matchNotification.user2.initials}
            </div>
          </div>
          <div className="match-text">
            <h4>It's a match!</h4>
            <p>{matchNotification.message}</p>
          </div>
          <button 
            className="close-notification"
            onClick={() => setMatchNotification(null)}
          >
            ×
          </button>
        </div>
      )}

      {viewMode === 'swipe' ? (
        <div className="swipe-container">
          {currentProfile ? (
            <ProfileCard
              profile={currentProfile}
              onLike={handleLike}
              onPass={handlePass}
              onInfo={handleInfo}
              onMessage={handleMessage}
              onProfileClick={goToProfile}
              currentIndex={currentProfileIndex}
              totalProfiles={profiles.length}
            />
          ) : (
            <div className="no-more-profiles">
              <div className="empty-state">
                <div className="empty-icon">💝</div>
                <h2>You've seen everyone!</h2>
                <p>Check back later for new matches in your area.</p>
                <div className="empty-actions">
                  <button
                    className="auth-button secondary"
                    onClick={resetProfiles}
                  >
                    <FaRedo style={{ width: '20px'}} />Reset & Review
                  </button>
                  <button
                    className="auth-button"
                    onClick={loadMoreProfiles}
                    disabled={!hasMoreProfiles || loading}
                  >
                    {loading ? (
                      <>
                        <FaSpinner style={{ width: '20px'}} /> Loading...
                      </>
                    ) : (
                      <>
                        <FaSync style={{ width: '20px'}} />  Load More
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="navigation-controls">
            <button
              className="nav-btn prev-btn"
              onClick={previousProfile}
              disabled={currentProfileIndex === 0}
            >
              <FaChevronCircleLeft style={{ width: '20px'}} />  Previous
            </button>
            
            <div className="profile-counter">
              <span className="current">{currentProfileIndex + 1}</span>
              <span className="separator">/</span>
              <span className="total">{profiles.length}</span>
            </div>
            
            <button
              className="nav-btn next-btn"
              onClick={nextProfile}
              disabled={!currentProfile}
            >
              Next 
              <FaChevronCircleRight /> 
            </button>
          </div>
        </div>
      ) : (
        <div className="grid-view">
          <div className="profiles-grid">
            {profiles.map((profile, index) => {
              const profileId = profile.id || profile.user_id || profile._id;
              return (
                <div
                  key={profileId || index}
                  className="profile-grid-item"
                  onClick={() => {
                    setCurrentProfileIndex(index);
                    setViewMode('swipe');
                  }}
                >
                  <div 
                    className="grid-avatar"
                    style={{ 
                      background: profile.profile_picture 
                        ? `url(${profile.profile_picture}) center/cover no-repeat`
                        : "linear-gradient(135deg, #8b5cf6, #ec4899)"
                    }}
                  >
                    <span className="grid-name">
                      {profile.first_name || profile.name || 'User'}, {profile.age || ''}
                    </span>
                  </div>
                  <div className="grid-info">
                    <h4>{profile.first_name || profile.name || 'User'}, {profile.age || ''}</h4>
                    <p>{profile.occupation || profile.job_title || 'Not specified'}</p>
                    <div className="grid-distance">
                      <FaMapMarkedAlt style={{ width: '20px'}} /> 
                      {getDistanceText(profile)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default AlignPage;