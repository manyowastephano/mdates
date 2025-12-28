import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import UserAvatar from '../common/UserAvatar';
import Loading from '../common/Loading';
import { API_ENDPOINTS, fetchJSON, fetchFormData } from '../../config/api';
import { useAuth } from '../../context/AuthContext';
import './styles/Profile.css';

const Profile = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [stats, setStats] = useState({
    matches: 0,
    likes: 0,
    compatibility: 0,
    visitors: 0
  });
  const [photos, setPhotos] = useState([]);
  const [interests, setInterests] = useState([]);
  const navigate = useNavigate();
  const { user: currentUser, isAuthenticated, updateUser } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    loadUserProfile();
    loadUserStats();
    loadUserPhotos();
  }, [isAuthenticated, navigate]);

  const loadUserProfile = async () => {
    setLoading(true);
    try {
      const data = await fetchJSON(API_ENDPOINTS.PROFILE, {
        method: 'GET',
      });
      
      // Map backend data to frontend structure
      const mappedUser = {
        id: data.id,
        name: data.first_name || data.username || data.name || 'User',
        age: data.age || 25,
        job: data.occupation || data.job || 'Not specified',
        education: data.education || '',
        location: data.location || 'Unknown',
        bio: data.bio || 'Looking for meaningful connections',
        image: data.profile_picture || null,
        avatarColor: data.avatar_color || 'linear-gradient(135deg, #003A8F, #3b82f6)',
        initials: getInitials(data.first_name || data.username || 'User'),
        gender: data.gender || 'Not specified',
        relationshipGoal: data.relationship_goal || 'Long-term relationship',
        personality: data.personality || 'Ambivert',
        preferences: {
          ageRange: {
            min: data.preferences?.age_min || 24,
            max: data.preferences?.age_max || 35
          },
          distance: data.preferences?.max_distance || 30,
          lookingFor: data.preferences?.looking_for || [],
          discoverable: data.preferences?.discoverable || true,
          notifications: data.preferences?.notifications || true
        },
        verification: {
          email: data.email_verified || false,
          phone: data.phone_verified || false,
          photo: data.photo_verified || false,
          education: data.education_verified || false
        },
        memberSince: new Date(data.date_joined || data.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
      };

      setUser(mappedUser);
      
      // Set interests from backend
      if (data.interests) {
        setInterests(Array.isArray(data.interests) ? data.interests : []);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      if (error.message === 'SESSION_EXPIRED') {
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const loadUserStats = async () => {
    try {
      const data = await fetchJSON(API_ENDPOINTS.USER_STATS, {
        method: 'GET',
      });

      setStats({
        matches: data.matches || 0,
        likes: data.likes || 0,
        compatibility: data.compatibility || 0,
        visitors: data.visitors || 0
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const loadUserPhotos = async () => {
    try {
      const data = await fetchJSON(API_ENDPOINTS.USER_PHOTOS, {
        method: 'GET',
      });

      const mappedPhotos = data.map(photo => ({
        id: photo.id,
        url: photo.image_url,
        color: getRandomColor(),
        isPrimary: photo.is_primary || false
      }));
      setPhotos(mappedPhotos);
    } catch (error) {
      console.error('Error loading photos:', error);
    }
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  const getRandomColor = () => {
    const colors = ['#003A8F', '#a78bfa', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#ef4444', '#06b6d4'];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  const handleEditProfile = () => {
    setEditMode(true);
  };

  const handleSaveProfile = async (updatedData) => {
    try {
      // Prepare data for backend
      const backendData = {
        first_name: updatedData.name.split(' ')[0],
        last_name: updatedData.name.split(' ').slice(1).join(' ') || '',
        age: updatedData.age,
        occupation: updatedData.job,
        education: updatedData.education,
        location: updatedData.location,
        bio: updatedData.bio,
        gender: updatedData.gender,
        relationship_goal: updatedData.relationshipGoal,
        personality: updatedData.personality,
        interests: interests
      };

      const data = await fetchJSON(API_ENDPOINTS.PROFILE, {
        method: 'PUT',
        body: JSON.stringify(backendData)
      });

      setUser(updatedData);
      setEditMode(false);
      
      // Update AuthContext user
      updateUser(backendData);
      
      alert('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile. Please try again.');
    }
  };

  const handleAddPhoto = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        alert('File size must be less than 10MB');
        return;
      }
      
      const formData = new FormData();
      formData.append('image', file);
      formData.append('is_primary', false);

      try {
        const newPhoto = await fetchFormData(API_ENDPOINTS.UPLOAD_PHOTO, formData, {
          method: 'POST',
        });
        
        setPhotos(prev => [...prev, {
          id: newPhoto.id,
          url: newPhoto.image_url,
          color: getRandomColor(),
          isPrimary: false
        }]);
        alert('Photo uploaded successfully!');
      } catch (error) {
        console.error('Error uploading photo:', error);
        alert('Failed to upload photo');
      }
    };
    input.click();
  };

  const handleSetPrimaryPhoto = async (photoId) => {
    try {
      await fetchJSON(`${API_ENDPOINTS.USER_PHOTOS}${photoId}/set_primary/`, {
        method: 'PATCH',
      });

      setPhotos(prev => prev.map(photo => ({
        ...photo,
        isPrimary: photo.id === photoId
      })));
      alert('Primary photo updated!');
    } catch (error) {
      console.error('Error setting primary photo:', error);
      alert('Failed to set primary photo');
    }
  };

  const handleRemovePhoto = async (photoId) => {
    if (photos.length <= 1) {
      alert('You must have at least one photo');
      return;
    }

    try {
      await fetchJSON(`${API_ENDPOINTS.USER_PHOTOS}${photoId}/`, {
        method: 'DELETE',
      });

      setPhotos(prev => {
        const updatedPhotos = prev.filter(photo => photo.id !== photoId);
        const hasPrimary = updatedPhotos.some(photo => photo.isPrimary);
        if (!hasPrimary && updatedPhotos.length > 0) {
          updatedPhotos[0].isPrimary = true;
        }
        return updatedPhotos;
      });
      alert('Photo removed successfully!');
    } catch (error) {
      console.error('Error removing photo:', error);
      alert('Failed to remove photo');
    }
  };

  const handleAddInterest = async () => {
    const interest = prompt('Add a new interest:');
    if (interest && interest.trim()) {
      if (!interests.includes(interest.trim())) {
        const newInterests = [...interests, interest.trim()];
        setInterests(newInterests);
        
        // Update backend
        try {
          await fetchJSON(API_ENDPOINTS.USER_INTERESTS, {
            method: 'POST',
            body: JSON.stringify({ interest: interest.trim() })
          });
        } catch (error) {
          console.error('Error adding interest:', error);
          // Revert if failed
          setInterests(interests);
          alert('Failed to add interest. Please try again.');
        }
      }
    }
  };

  const handleRemoveInterest = async (interestToRemove) => {
    const newInterests = interests.filter(interest => interest !== interestToRemove);
    setInterests(newInterests);
    
    // Update backend
    try {
      await fetchJSON(`${API_ENDPOINTS.USER_INTERESTS}${encodeURIComponent(interestToRemove)}/`, {
        method: 'DELETE',
      });
    } catch (error) {
      console.error('Error removing interest:', error);
      // Revert if failed
      setInterests(interests);
      alert('Failed to remove interest. Please try again.');
    }
  };

  const renderProfileTab = () => (
    <div className="profile-tab-content">
      <div className="profile-bio-section">
        <h3>About Me</h3>
        {editMode ? (
          <textarea
            className="form-textarea"
            value={user.bio}
            onChange={(e) => setUser({ ...user, bio: e.target.value })}
            rows={4}
          />
        ) : (
          <p className="bio-text">{user.bio}</p>
        )}
      </div>

      <div className="profile-details-section">
        <h3>Details</h3>
        <div className="details-grid">
          <div className="detail-item">
            <span className="detail-label">Age</span>
            {editMode ? (
              <input
                type="number"
                className="form-input"
                value={user.age}
                onChange={(e) => setUser({ ...user, age: parseInt(e.target.value) || user.age })}
              />
            ) : (
              <span className="detail-value">{user.age}</span>
            )}
          </div>
          <div className="detail-item">
            <span className="detail-label">Gender</span>
            {editMode ? (
              <select
                className="form-input"
                value={user.gender}
                onChange={(e) => setUser({ ...user, gender: e.target.value })}
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
                <option value="Prefer not to say">Prefer not to say</option>
              </select>
            ) : (
              <span className="detail-value">{user.gender}</span>
            )}
          </div>
          <div className="detail-item">
            <span className="detail-label">Location</span>
            {editMode ? (
              <input
                type="text"
                className="form-input"
                value={user.location}
                onChange={(e) => setUser({ ...user, location: e.target.value })}
              />
            ) : (
              <span className="detail-value">{user.location}</span>
            )}
          </div>
          <div className="detail-item">
            <span className="detail-label">Job</span>
            {editMode ? (
              <input
                type="text"
                className="form-input"
                value={user.job}
                onChange={(e) => setUser({ ...user, job: e.target.value })}
              />
            ) : (
              <span className="detail-value">{user.job}</span>
            )}
          </div>
          <div className="detail-item">
            <span className="detail-label">Education</span>
            {editMode ? (
              <input
                type="text"
                className="form-input"
                value={user.education}
                onChange={(e) => setUser({ ...user, education: e.target.value })}
              />
            ) : (
              <span className="detail-value">{user.education}</span>
            )}
          </div>
          <div className="detail-item">
            <span className="detail-label">Relationship Goal</span>
            {editMode ? (
              <select
                className="form-input"
                value={user.relationshipGoal}
                onChange={(e) => setUser({ ...user, relationshipGoal: e.target.value })}
              >
                <option value="Long-term relationship">Long-term relationship</option>
                <option value="Casual dating">Casual dating</option>
                <option value="New friends">New friends</option>
                <option value="Marriage">Marriage</option>
              </select>
            ) : (
              <span className="detail-value">{user.relationshipGoal}</span>
            )}
          </div>
          <div className="detail-item">
            <span className="detail-label">Personality</span>
            {editMode ? (
              <select
                className="form-input"
                value={user.personality}
                onChange={(e) => setUser({ ...user, personality: e.target.value })}
              >
                <option value="Introvert">Introvert</option>
                <option value="Extrovert">Extrovert</option>
                <option value="Ambivert">Ambivert</option>
              </select>
            ) : (
              <span className="detail-value">{user.personality}</span>
            )}
          </div>
          <div className="detail-item">
            <span className="detail-label">Member Since</span>
            <span className="detail-value">{user.memberSince}</span>
          </div>
        </div>
      </div>

      <div className="profile-interests-section">
        <h3>My Interests</h3>
        <div className="interests-grid">
          {interests.map((interest, index) => (
            <div key={index} className="interest-item">
              {interest}
              {editMode && (
                <button
                  className="remove-interest"
                  onClick={() => handleRemoveInterest(interest)}
                >
                  ×
                </button>
              )}
            </div>
          ))}
          {editMode && (
            <button
              className="add-interest-btn"
              onClick={handleAddInterest}
            >
              <i className="fas fa-plus"></i> Add Interest
            </button>
          )}
        </div>
      </div>
    </div>
  );

  const renderPhotosTab = () => (
    <div className="photos-tab-content">
      <div className="photos-grid">
        {photos.map((photo) => (
          <div key={photo.id} className="photo-item">
            <div 
              className="photo-preview"
              style={{ 
                background: photo.url 
                  ? `url(${photo.url}) center/cover no-repeat` 
                  : photo.color 
              }}
            >
              {photo.isPrimary && (
                <div className="primary-badge">
                  <i className="fas fa-star"></i> Primary
                </div>
              )}
              
              <div className="photo-actions">
                <button
                  className="photo-action-btn"
                  onClick={() => handleSetPrimaryPhoto(photo.id)}
                  disabled={photo.isPrimary}
                  title="Set as primary"
                >
                  <i className="fas fa-star"></i>
                </button>
                <button
                  className="photo-action-btn"
                  onClick={() => handleRemovePhoto(photo.id)}
                  title="Remove photo"
                >
                  <i className="fas fa-trash"></i>
                </button>
              </div>
            </div>
          </div>
        ))}
        
        {photos.length < 6 && (
          <div className="photo-item add-photo" onClick={handleAddPhoto}>
            <div className="add-photo-content">
              <i className="fas fa-plus"></i>
              <span>Add Photo</span>
            </div>
          </div>
        )}
      </div>
      
      <div className="photos-info">
        <p><i className="fas fa-info-circle"></i> You can upload up to 6 photos. Add more photos to increase your matches!</p>
      </div>
    </div>
  );

  const renderPreferencesTab = () => (
    <div className="preferences-tab-content">
      <div className="preferences-section">
        <h3>Discovery Preferences</h3>
        
        <div className="preference-item">
          <label>Age Range</label>
          <div className="age-range-display">
            <span>{user.preferences.ageRange.min} - {user.preferences.ageRange.max} years</span>
          </div>
        </div>
        
        <div className="preference-item">
          <label>Maximum Distance</label>
          <div className="distance-display">
            <span>Within {user.preferences.distance} km</span>
          </div>
        </div>
        
        <div className="preference-item">
          <label>Looking For</label>
          <div className="looking-for-display">
            {user.preferences.lookingFor.map((gender, index) => (
              <span key={index} className="gender-tag">{gender}</span>
            ))}
          </div>
        </div>
        
        <div className="preference-item">
          <label>
            <input
              type="checkbox"
              checked={user.preferences.discoverable}
              onChange={(e) => setUser({
                ...user,
                preferences: { ...user.preferences, discoverable: e.target.checked }
              })}
            />
            Make my profile discoverable
          </label>
        </div>
        
        <div className="preference-item">
          <label>
            <input
              type="checkbox"
              checked={user.preferences.notifications}
              onChange={(e) => setUser({
                ...user,
                preferences: { ...user.preferences, notifications: e.target.checked }
              })}
            />
            Receive match notifications
          </label>
        </div>
      </div>
      
      <div className="privacy-section">
        <h3>Privacy Settings</h3>
        <p className="privacy-note">Privacy settings are managed in the Settings page.</p>
        <button
          className="btn btn-secondary"
          onClick={() => navigate('/settings')}
        >
          <i className="fas fa-cog"></i> Go to Settings
        </button>
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return renderProfileTab();
      case 'photos':
        return renderPhotosTab();
      case 'preferences':
        return renderPreferencesTab();
      default:
        return renderProfileTab();
    }
  };

  if (loading || !user) {
    return <Loading message="Loading your profile..." />;
  }

  return (
    <div className="profile-page">
      <div className="profile-header">
        <div className="header-left">
          <div className="profile-avatar-large">
            <UserAvatar
              user={user}
              size={80}
            />
            <button 
              className="avatar-edit-btn"
              onClick={handleAddPhoto}
              title="Change photo"
            >
              <i className="fas fa-camera"></i>
            </button>
          </div>
          
          <div className="profile-info">
            <h1>{user.name}, {user.age}</h1>
            <p>{user.job} · {user.location}</p>
            
            <div className="profile-stats">
              <div className="stat">
                <div className="stat-value">{stats.matches}</div>
                <div className="stat-label">Matches</div>
              </div>
              <div className="stat">
                <div className="stat-value">{stats.likes}</div>
                <div className="stat-label">Likes</div>
              </div>
              <div className="stat">
                <div className="stat-value">{stats.compatibility}%</div>
                <div className="stat-label">Compatibility</div>
              </div>
              <div className="stat">
                <div className="stat-value">{stats.visitors}</div>
                <div className="stat-label">Visitors</div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="header-actions">
          {editMode ? (
            <div className="edit-actions">
              <button
                className="btn btn-secondary"
                onClick={() => setEditMode(false)}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={() => handleSaveProfile(user)}
              >
                Save Changes
              </button>
            </div>
          ) : (
            <button
              className="btn btn-primary"
              onClick={handleEditProfile}
            >
              <i className="fas fa-edit"></i> Edit Profile
            </button>
          )}
          
          <button
            className="btn btn-secondary"
            onClick={() => navigate('/settings')}
          >
            <i className="fas fa-cog"></i> Settings
          </button>
        </div>
      </div>

      <div className="profile-tabs">
        <div className="tabs-navigation">
          <button
            className={`tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            <i className="fas fa-user"></i> Profile
          </button>
          <button
            className={`tab-btn ${activeTab === 'photos' ? 'active' : ''}`}
            onClick={() => setActiveTab('photos')}
          >
            <i className="fas fa-images"></i> Photos ({photos.length}/6)
          </button>
          <button
            className={`tab-btn ${activeTab === 'preferences' ? 'active' : ''}`}
            onClick={() => setActiveTab('preferences')}
          >
            <i className="fas fa-sliders-h"></i> Preferences
          </button>
        </div>
        
        <div className="tabs-content">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
};

export default Profile;