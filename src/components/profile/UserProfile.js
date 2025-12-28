// UserProfile.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import UserAvatar from '../common/UserAvatar';
import Loading from '../common/Loading';
import './styles/Profile.css';

const UserProfile = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Sample users data
  const sampleUsers = {
    '123': {
      id: 123,
      name: "Maria",
      age: 26,
      job: "Marketing Manager",
      education: "Business Administration, NYU",
      location: "New York, NY",
      bio: "Love hiking, coffee, and good conversations. Looking for meaningful connections.",
      color: "linear-gradient(135deg, #003A8F, #a78bfa)",
      initials: "M",
      gender: "Female",
      relationshipGoal: "Long-term relationship",
      personality: "Extrovert",
      interests: ["Hiking", "Coffee", "Travel", "Photography", "Yoga", "Reading"],
      photos: [
        { id: 1, color: "linear-gradient(135deg, #003A8F, #60a5fa)", isPrimary: true },
        { id: 2, color: "linear-gradient(135deg, #8b5cf6, #ec4899)", isPrimary: false }
      ],
      memberSince: "January 2024"
    },
    '456': {
      id: 456,
      name: "Daniel",
      age: 31,
      job: "Software Engineer",
      education: "Computer Science, MIT",
      location: "San Francisco, CA",
      bio: "Tech enthusiast who loves hiking and coffee. Always up for an adventure!",
      color: "linear-gradient(135deg, #10b981, #3b82f6)",
      initials: "D",
      gender: "Male",
      relationshipGoal: "Long-term relationship",
      personality: "Ambivert",
      interests: ["Technology", "Hiking", "Coffee", "Music", "Gaming", "Travel"],
      photos: [
        { id: 1, color: "linear-gradient(135deg, #10b981, #3b82f6)", isPrimary: true },
        { id: 2, color: "linear-gradient(135deg, #f59e0b, #ef4444)", isPrimary: false }
      ],
      memberSince: "February 2024"
    }
  };

  useEffect(() => {
    loadUserProfile();
  }, [userId, location.state]);

  const loadUserProfile = async () => {
    setLoading(true);
    try {
      // Check if user data was passed in state
      if (location.state?.user) {
        console.log("Using user from location state:", location.state.user);
        setUser(location.state.user);
      } else if (sampleUsers[userId]) {
        // Try to get from sample data
        console.log("Found sample user for ID:", userId);
        setUser(sampleUsers[userId]);
      } else {
        // Create default user
        console.log("Creating default user for ID:", userId);
        const defaultUser = {
          id: userId,
          name: `User ${userId}`,
          age: 25,
          job: "Professional",
          location: "Unknown",
          bio: "This user hasn't added a bio yet.",
          color: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
          initials: "U",
          gender: "Unknown",
          relationshipGoal: "Not specified",
          personality: "Unknown",
          interests: [],
          photos: [
            { id: 1, color: "linear-gradient(135deg, #3b82f6, #8b5cf6)", isPrimary: true }
          ],
          memberSince: "Recently"
        };
        setUser(defaultUser);
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartConversation = () => {
    if (user) {
      navigate('/chat/new', {
        state: { user }
      });
    }
  };

  const handleBackClick = () => {
    navigate(-1); // Go back to previous page
  };

  if (loading) {
    return (
      <div className="profile-page">
        <Loading message="Loading profile..." />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="profile-page">
        <div className="profile-error">
          <h2>Profile not found</h2>
          <p>The user profile could not be loaded.</p>
          <button className="back-btn" onClick={handleBackClick}>
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page user-profile">
      <div className="profile-header">
        <button className="back-btn" onClick={handleBackClick}>
          ← Back
        </button>
        
        <div className="header-left">
          <div className="profile-avatar-large">
            <UserAvatar
              user={user}
              size={80}
            />
          </div>
          
          <div className="profile-info">
            <h1>{user.name}, {user.age}</h1>
            <p>{user.job} · {user.location}</p>
            <p className="member-since">Member since {user.memberSince}</p>
          </div>
        </div>
        
        <div className="header-actions">
          <button
            className="btn btn-primary"
            onClick={handleStartConversation}
          >
            <i className="fas fa-comment"></i> Start Chat
          </button>
          
          <button
            className="btn btn-secondary"
            onClick={() => alert('Match functionality would be implemented here')}
          >
            <i className="fas fa-heart"></i> Like
          </button>
        </div>
      </div>

      <div className="profile-tabs">
        <div className="tabs-navigation">
          <button className="tab-btn active">
            <i className="fas fa-user"></i> Profile
          </button>
        </div>
        
        <div className="tabs-content">
          <div className="profile-tab-content">
            <div className="profile-bio-section">
              <h3>About Me</h3>
              <p className="bio-text">{user.bio}</p>
            </div>

            <div className="profile-details-section">
              <h3>Details</h3>
              <div className="details-grid">
                <div className="detail-item">
                  <span className="detail-label">Age</span>
                  <span className="detail-value">{user.age}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Gender</span>
                  <span className="detail-value">{user.gender}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Location</span>
                  <span className="detail-value">{user.location}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Job</span>
                  <span className="detail-value">{user.job}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Education</span>
                  <span className="detail-value">{user.education || "Not specified"}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Relationship Goal</span>
                  <span className="detail-value">{user.relationshipGoal}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Personality</span>
                  <span className="detail-value">{user.personality}</span>
                </div>
              </div>
            </div>

            {user.interests && user.interests.length > 0 && (
              <div className="profile-interests-section">
                <h3>Interests</h3>
                <div className="interests-grid">
                  {user.interests.map((interest, index) => (
                    <div key={index} className="interest-item">
                      {interest}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {user.photos && user.photos.length > 0 && (
              <div className="profile-photos-section">
                <h3>Photos</h3>
                <div className="photos-grid">
                  {user.photos.map((photo, index) => (
                    <div key={photo.id} className="photo-item">
                      <div 
                        className="photo-preview"
                        style={{ background: photo.color }}
                      >
                        {photo.isPrimary && (
                          <div className="primary-badge">
                            <i className="fas fa-star"></i> Primary
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;