import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_ENDPOINTS, fetchFormData } from '../../config/api';
import { useAuth } from '../../context/AuthContext';
import {
  FaCamera,
  FaBriefcase,
  FaGraduationCap,
  FaMapMarkerAlt,
  FaArrowRight,
  FaArrowLeft,
  FaCheck,
  FaSpinner,
  FaHeart,
  FaRocket
} from 'react-icons/fa';
import './styles/Profile.css'
const ProfileSetup = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [basicInfo, setBasicInfo] = useState({
    bio: '',
    occupation: '',
    education: '',
    location: '',
    avatar: null,
    avatarPreview: null
  });
  
  const [interests, setInterests] = useState([]);
  const [newInterest, setNewInterest] = useState('');
  const [personality, setPersonality] = useState('');
  const [relationshipGoals, setRelationshipGoals] = useState([]);
  
  const [preferences, setPreferences] = useState({
    ageRange: { min: 25, max: 40 },
    maxDistance: 30,
    lookingFor: ['men', 'women'],
    notifications: true,
    discoverable: true
  });
  
  const navigate = useNavigate();
  const { updateUser, token } = useAuth(); // Get token from context

  const progressPercentage = ((currentStep - 1) / 2) * 100;
  const stepConfig = {
    1: {
      title: 'Tell Us About Yourself',
      description: "Let's start with the basics to create your profile"
    },
    2: {
      title: 'Your Interests & Goals',
      description: 'What are you passionate about and what are you looking for?'
    },
    3: {
      title: 'Your Preferences',
      description: 'Set your preferences for potential matches'
    }
  };
  const handleAvatarUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.match('image.*')) {
      setError('Please select an image file (JPG, PNG, etc.)');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size should be less than 5MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      setBasicInfo({
        ...basicInfo,
        avatar: file,
        avatarPreview: e.target.result
      });
      setError(''); 
    };
    reader.onerror = () => {
      setError('Failed to read image file');
    };
    reader.readAsDataURL(file);
  };

  const handleBioChange = (e) => {
    setBasicInfo({
      ...basicInfo,
      bio: e.target.value
    });
  };

  const handleInterestInput = (e) => {
    setNewInterest(e.target.value);
  };

  const handleInterestKeyDown = (e) => {
    if (e.key === 'Enter' && newInterest.trim()) {
      e.preventDefault();
      const trimmedInterest = newInterest.trim().toLowerCase();
      if (!interests.includes(trimmedInterest) && interests.length < 20) {
        setInterests([...interests, trimmedInterest]);
        setNewInterest('');
      }
    }
  };

  const removeInterest = (interestToRemove) => {
    setInterests(interests.filter(interest => interest !== interestToRemove));
  };

  const toggleRelationshipGoal = (goal) => {
    if (relationshipGoals.includes(goal)) {
      setRelationshipGoals(relationshipGoals.filter(g => g !== goal));
    } else {
      setRelationshipGoals([...relationshipGoals, goal]);
    }
  };

  const handlePreferenceChange = (key, value) => {
    setPreferences({
      ...preferences,
      [key]: value
    });
  };

  const handleLookingForChange = (value) => {
    const current = [...preferences.lookingFor];
    if (current.includes(value)) {
      handlePreferenceChange('lookingFor', current.filter(item => item !== value));
    } else {
      handlePreferenceChange('lookingFor', [...current, value]);
    }
  };
  const nextStep = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };
  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };
  const skipProfileSetup = () => {
    navigate('/');
  };

  const completeProfile = async () => {
    if (!token) {
      setError('Authentication required. Please log in again.');
      return;
    }
    if (!basicInfo.bio.trim()) {
      setError('Please add a bio about yourself');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const formData = new FormData();
      // Basic info
      formData.append('bio', basicInfo.bio.trim());
      if (basicInfo.occupation) formData.append('occupation', basicInfo.occupation.trim());
      if (basicInfo.education) formData.append('education', basicInfo.education.trim());
      if (basicInfo.location) formData.append('location', basicInfo.location.trim());
      if (basicInfo.avatar) {
        formData.append('avatar', basicInfo.avatar);
      }
      // Interests & personality
      if (interests.length > 0) {
        formData.append('interests', JSON.stringify(interests));
      }
      if (personality) {
        formData.append('personality', personality);
      }
      if (relationshipGoals.length > 0) {
        formData.append('relationship_goals', JSON.stringify(relationshipGoals));
      }
      // Preferences
      formData.append('age_min', preferences.ageRange.min.toString());
      formData.append('age_max', preferences.ageRange.max.toString());
      formData.append('max_distance', preferences.maxDistance.toString());
      if (preferences.lookingFor.length > 0) {
        formData.append('looking_for', JSON.stringify(preferences.lookingFor));
      }
      formData.append('notifications', preferences.notifications.toString());
      formData.append('discoverable', preferences.discoverable.toString());
      formData.append('profile_complete', 'true'); // Mark profile as complete
      // Use fetchFormData from api.js
      const data = await fetchFormData(
        API_ENDPOINTS.PROFILE,
        formData,
        { method: 'POST' },
        token
      )
      // Update user in context with the response
      updateUser(data.user || data);
      setCurrentStep(4);
      
    } catch (error) {
      console.error('Profile setup error:', error);
      setError(error.message || 'Failed to save profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const startExploring = () => {
    navigate('/');
  };

  const renderStep1 = () => (
    <div className="form-step active">
      {error && (
        <div className="form-error" style={{ marginBottom: '20px' }}>
          {error}
        </div>
      )}
      
      <div className="form-group">
        <label className="form-label">Profile Photo</label>
        <div className="avatar-upload">
          <div className="avatar-preview" id="avatarPreview">
            {basicInfo.avatarPreview ? (
              <img src={basicInfo.avatarPreview} alt="Profile preview" id="avatarImage" />
            ) : (
              <span id="avatarInitials">Y</span>
            )}
          </div>
          <input
            type="file"
            id="avatarUpload"
            className="hidden-file-input"
            accept="image/*"
            onChange={handleAvatarUpload}
          />
          <button
            type="button"
            className="avatar-upload-button"
            id="avatarUploadButton"
            onClick={() => document.getElementById('avatarUpload').click()}
            disabled={loading}
          >
            <FaCamera />
            {basicInfo.avatarPreview ? 'Change Photo' : 'Upload Photo'}
          </button>
        </div>
        <div className="form-hint">Upload a clear photo of yourself for better matches (Max 5MB)</div>
      </div>
      
      <div className="form-group">
        <label className="form-label" htmlFor="profileBio">Bio *</label>
        <textarea
          id="profileBio"
          name="bio"
          className="form-textarea"
          placeholder="Tell others about yourself, your interests, and what you're looking for..."
          maxLength="500"
          value={basicInfo.bio}
          onChange={handleBioChange}
          disabled={loading}
          required
        />
        <div className="form-hint" id="bioCharCount">
          {basicInfo.bio.length}/500 characters
        </div>
      </div>
      <div className="form-group">
        <label className="form-label" htmlFor="profileOccupation">Occupation</label>
        <div className="input-with-icon">
          <FaBriefcase className="input-icon" />
          <input
            type="text"
            id="profileOccupation"
            name="occupation"
            className="form-input"
            placeholder="What do you do?"
            value={basicInfo.occupation}
            onChange={(e) => setBasicInfo({...basicInfo, occupation: e.target.value})}
            disabled={loading}
          />
        </div>
      </div>
      <div className="form-group">
        <label className="form-label" htmlFor="profileEducation">Education</label>
        <div className="input-with-icon">
          <FaGraduationCap className="input-icon" />
          <input
            type="text"
            id="profileEducation"
            name="education"
            className="form-input"
            placeholder="Your educational background"
            value={basicInfo.education}
            onChange={(e) => setBasicInfo({...basicInfo, education: e.target.value})}
            disabled={loading}
          />
        </div>
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="profileLocation">Location</label>
        <div className="input-with-icon">
          <FaMapMarkerAlt className="input-icon" />
          <input
            type="text"
            id="profileLocation"
            name="location"
            className="form-input"
            placeholder="City, Country"
            value={basicInfo.location}
            onChange={(e) => setBasicInfo({...basicInfo, location: e.target.value})}
            disabled={loading}
          />
        </div>
      </div>

      <div className="form-actions">
        <button
          type="button"
          className="auth-button secondary"
          id="skipProfileButton"
          onClick={skipProfileSetup}
          disabled={loading}
        >
          Skip for now
        </button>
        <button
          type="button"
          className="auth-button"
          id="nextStep1Button"
          onClick={nextStep}
          disabled={loading || !basicInfo.bio.trim()}
        >
          Continue <FaArrowRight />
        </button>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="form-step">
      {error && (
        <div className="form-error" style={{ marginBottom: '20px' }}>
          {error}
        </div>
      )}
      
      <div className="form-group">
        <label className="form-label">Your Interests</label>
        <div className="form-hint">Add interests that describe you (e.g., hiking, photography, cooking)</div>
        <div className="tags-input-container" id="interestsContainer">
          {interests.map((interest, index) => (
            <span key={index} className="tag">
              {interest}
              <button
                type="button"
                className="tag-remove"
                onClick={() => removeInterest(interest)}
                disabled={loading}
              >
                &times;
              </button>
            </span>
          ))}
          <input
            type="text"
            className="tags-input"
            id="interestsInput"
            name="interest"
            placeholder="Type an interest and press Enter"
            value={newInterest}
            onChange={handleInterestInput}
            onKeyDown={handleInterestKeyDown}
            disabled={loading || interests.length >= 20}
          />
        </div>
        <div className="checkbox-group">
          {['hiking', 'photography', 'cooking', 'reading', 'travel', 'music', 'fitness', 'art'].map((interest) => (
            <label key={interest} className="checkbox-label">
              <input
                type="checkbox"
                className="checkbox-input"
                value={interest}
                checked={interests.includes(interest)}
                onChange={(e) => {
                  if (e.target.checked && interests.length < 20) {
                    setInterests([...interests, interest]);
                  } else if (!e.target.checked) {
                    removeInterest(interest);
                  }
                }}
                disabled={loading}
              />
              <span>{interest.charAt(0).toUpperCase() + interest.slice(1)}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Personality Type</label>
        <div className="checkbox-group">
          {['introvert', 'extrovert', 'ambivert'].map((type) => (
            <label key={type} className="checkbox-label">
              <input
                type="radio"
                name="personality"
                className="checkbox-input"
                value={type}
                checked={personality === type}
                onChange={(e) => setPersonality(e.target.value)}
                disabled={loading}
              />
              <span>{type.charAt(0).toUpperCase() + type.slice(1)}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Relationship Goals</label>
        <div className="checkbox-group">
          {['long-term', 'casual', 'friendship', 'marriage'].map((goal) => (
            <label key={goal} className="checkbox-label">
              <input
                type="checkbox"
                className="checkbox-input"
                value={goal}
                checked={relationshipGoals.includes(goal)}
                onChange={() => toggleRelationshipGoal(goal)}
                disabled={loading}
              />
              <span>
                {goal === 'long-term' ? 'Long-term relationship' :
                 goal === 'friendship' ? 'New friends' :
                 goal.charAt(0).toUpperCase() + goal.slice(1)}
              </span>
            </label>
          ))}
        </div>
      </div>

      <div className="form-actions">
        <button
          type="button"
          className="auth-button secondary"
          id="backStep2Button"
          onClick={prevStep}
          disabled={loading}
        >
          <FaArrowLeft /> Back
        </button>
        <button
          type="button"
          className="auth-button"
          id="nextStep2Button"
          onClick={nextStep}
          disabled={loading}
        >
          Continue <FaArrowRight />
        </button>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="form-step">
      {error && (
        <div className="form-error" style={{ marginBottom: '20px' }}>
          {error}
        </div>
      )}
      
      <div className="form-group">
        <label className="form-label">Age Range of Potential Matches</label>
        <div className="range-container">
          <input
            type="range"
            min="18"
            max="60"
            value={preferences.ageRange.min}
            className="range-slider"
            id="ageRangeMin"
            onChange={(e) => handlePreferenceChange('ageRange', {
              ...preferences.ageRange,
              min: parseInt(e.target.value)
            })}
            disabled={loading}
          />
          <input
            type="range"
            min="18"
            max="60"
            value={preferences.ageRange.max}
            className="range-slider"
            id="ageRangeMax"
            onChange={(e) => handlePreferenceChange('ageRange', {
              ...preferences.ageRange,
              max: parseInt(e.target.value)
            })}
            disabled={loading}
          />
          <div className="range-values">
            <span id="ageMinValue">{preferences.ageRange.min}</span>
            <span id="ageMaxValue">{preferences.ageRange.max}</span>
          </div>
        </div>
      </div>
      <div className="form-group">
        <label className="form-label">Maximum Distance (km)</label>
        <div className="range-container">
          <input
            type="range"
            min="5"
            max="100"
            step="5"
            value={preferences.maxDistance}
            className="range-slider"
            id="distanceRange"
            onChange={(e) => handlePreferenceChange('maxDistance', parseInt(e.target.value))}
            disabled={loading}
          />
          <div className="range-values">
            <span>5 km</span>
            <span id="distanceValue">{preferences.maxDistance} km</span>
            <span>100 km</span>
          </div>
        </div>
      </div>
      <div className="form-group">
        <label className="form-label">Looking For</label>
        <div className="checkbox-group">
          {['men', 'women', 'non-binary'].map((gender) => (
            <label key={gender} className="checkbox-label">
              <input
                type="checkbox"
                className="checkbox-input"
                value={gender}
                checked={preferences.lookingFor.includes(gender)}
                onChange={() => handleLookingForChange(gender)}
                disabled={loading}
              />
              <span>
                {gender === 'non-binary' ? 'Non-binary' :
                 gender === 'men' ? 'Men' : 'Women'}
              </span>
            </label>
          ))}
        </div>
      </div>
      <div className="form-group">
        <label className="checkbox-label">
          <input
            type="checkbox"
            className="checkbox-input"
            id="profileNotifications"
            checked={preferences.notifications}
            onChange={(e) => handlePreferenceChange('notifications', e.target.checked)}
            disabled={loading}
          />
          <span>Send me match notifications</span>
        </label>
      </div>
      <div className="form-group">
        <label className="checkbox-label">
          <input
            type="checkbox"
            className="checkbox-input"
            id="profileDiscoverable"
            checked={preferences.discoverable}
            onChange={(e) => handlePreferenceChange('discoverable', e.target.checked)}
            disabled={loading}
          />
          <span>Make my profile discoverable</span>
        </label>
      </div>
      <div className="form-actions">
        <button
          type="button"
          className="auth-button secondary"
          id="backStep3Button"
          onClick={prevStep}
          disabled={loading}
        >
          <FaArrowLeft /> Back
        </button>
        <button
          type="button"
          className="auth-button"
          id="completeProfileButton"
          onClick={completeProfile}
          disabled={loading}
        >
          {loading ? (
            <FaSpinner className="fa-spin" />
          ) : (
            <FaCheck />
          )}
          {loading ? 'Saving...' : 'Complete Profile'}
        </button>
      </div>
    </div>
  );

  const renderWelcomeScreen = () => (
    <div className="welcome-screen" id="welcomeScreen">
      <div className="welcome-icon">
        <FaHeart />
      </div>
      <h1>Welcome to Mdates!</h1>
      <p>Your profile is complete and you're ready to start your journey to find meaningful connections.</p>
      <button
        className="auth-button"
        id="startExploringButton"
        onClick={startExploring}
      >
        <FaRocket /> Start Exploring
      </button>
    </div>
  );

  return (
    <div className="app-container">
      {currentStep === 4 ? (
        renderWelcomeScreen()
      ) : (
        <div className="auth-page" id="profileCreationPage">
          <div className="auth-header">
            <div className="auth-logo">
              <div className="logo-icon">M</div>
              <h1>Mdates</h1>
            </div>
            <div className="progress-steps">
              <div className="progress-line"></div>
              <div
                className="progress-line-filled"
                id="progressLineFilled"
                style={{ width: `${progressPercentage}%` }}
              ></div>
              
              {[1, 2, 3].map((step) => (
                <div
                  key={step}
                  className={`step ${step < currentStep ? 'completed' : ''} ${step === currentStep ? 'active' : ''}`}
                  id={`step${step}`}
                >
                  <div className="step-circle">
                    {step < currentStep ? '✓' : step}
                  </div>
                  <div className="step-label">
                    {step === 1 ? 'Basic Info' : step === 2 ? 'Interests' : 'Preferences'}
                  </div>
                </div>
              ))}
            </div>
            
            <h2 id="profileStepTitle">{stepConfig[currentStep].title}</h2>
            <p id="profileStepDescription">{stepConfig[currentStep].description}</p>
          </div>

          <form className="auth-form" id="profileForm">
            {currentStep === 1 && renderStep1()}
            {currentStep === 2 && renderStep2()}
            {currentStep === 3 && renderStep3()}
          </form>
        </div>
      )}
    </div>
  );
};
export default ProfileSetup;