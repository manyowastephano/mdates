import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FaUser,
  FaEnvelope,
  FaLock,
  FaEye,
  FaEyeSlash,
  FaCalendar,
  FaVenusMars,
  FaExclamationCircle,
  FaSpinner,
  FaUserPlus,
  FaGoogle,
  FaFacebook
} from 'react-icons/fa';
import './styles/Signup.css'
import { useAuth } from '../../context/AuthContext';
const Signup = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    birthdate: '',
    gender: '',
    terms: false
  });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();
  const { register, loading: authLoading } = useAuth();
  useEffect(() => {
    const today = new Date();
    const minDate = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
    const maxDateStr = minDate.toISOString().split('T')[0];
    const dateInput = document.getElementById('signupBirthdate');
    if (dateInput) {
      dateInput.max = maxDateStr;
    }
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked, id } = e.target;
    const fieldName = name || id;
    if (!fieldName) return;
    
    setFormData({
      ...formData,
      [fieldName]: type === 'checkbox' ? checked : value
    });
    if (errors[fieldName]) {
      setErrors({
        ...errors,
        [fieldName]: ''
      });
    }
  };

  const togglePasswordVisibility = (field) => {
    if (field === 'password') {
      setShowPassword(!showPassword);
    } else {
      setShowConfirmPassword(!showConfirmPassword);
    }
  };
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!isValidEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }
    
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    if (!formData.birthdate) {
      newErrors.birthdate = 'Birthdate is required';
    } else {
      const birthDate = new Date(formData.birthdate);
      const age = calculateAge(birthDate);
      if (age < 18) {
        newErrors.birthdate = 'You must be at least 18 years old';
      }
    }
    if (!formData.gender) {
      newErrors.gender = 'Please select your gender';
    }
    if (!formData.terms) {
      newErrors.terms = 'You must agree to the terms and conditions';
    }
    
    return newErrors;
  };

  const isValidEmail = (email) => {
    const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email);
  };

  const calculateAge = (birthDate) => {
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validateForm();
    
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    const signupData = {
      name: formData.name,
      email: formData.email,
      password: formData.password,
      birthdate: formData.birthdate,
      gender: formData.gender
    };
    const result = await register(signupData);
    
    if (result.success) {
      navigate('/profile-setup');
    } else {
      if (result.error && result.error.includes('already exists')) {
        setErrors({ email: 'An account with this email already exists' });
      } else {
        setErrors({ 
          general: result.error || 'Registration failed. Please try again.' 
        });
      }
    }
  };
  const handleSocialSignup = (provider) => {
    console.log(`Signup with ${provider}`);
    // OAuth login 
  };
  return (
    <div className="app-container">
      <div className="auth-page" id="signupPage">
        <div className="auth-header">
          <div className="auth-logo">
            <div className="logo-icon">M</div>
            <h1>Mdates</h1>
          </div>
          <h2>Create Your Account</h2>
          <p>Join our community to find meaningful relationships</p>
        </div>
        <form className="auth-form" id="signupForm" onSubmit={handleSubmit}>
          {errors.general && (
            <div className="form-error" style={{ marginBottom: '20px' }}>
              <FaExclamationCircle /> {errors.general}
            </div>
          )}
          <div className="form-group">
            <label className="form-label" htmlFor="signupName">Full Name</label>
            <div className="input-with-icon">
              <FaUser className="input-icon" />
              <input
                type="text"
                id="signupName"
                name="name"
                className="form-input"
                placeholder="Enter your full name"
                value={formData.name}
                onChange={handleChange}
                required
                disabled={authLoading}
              />
            </div>
            {errors.name && <div className="form-error" id="signupNameError">
              <FaExclamationCircle /> {errors.name}
            </div>}
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="signupEmail">Email Address</label>
            <div className="input-with-icon">
              <FaEnvelope className="input-icon" />
              <input
                type="email"
                id="signupEmail"
                name="email"
                className="form-input"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleChange}
                required
                disabled={authLoading}
              />
            </div>
            {errors.email && <div className="form-error" id="signupEmailError">
              <FaExclamationCircle /> {errors.email}
            </div>}
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="signupPassword">Password</label>
            <div className="input-with-icon">
              <FaLock className="input-icon" />
              <input
                type={showPassword ? "text" : "password"}
                id="signupPassword"
                name="password"
                className="form-input"
                placeholder="Create a password"
                value={formData.password}
                onChange={handleChange}
                required
                disabled={authLoading}
              />
              <button
                type="button"
                className="password-toggle"
                id="signupPasswordToggle"
                onClick={() => togglePasswordVisibility('password')}
                disabled={authLoading}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
            {errors.password && <div className="form-error" id="signupPasswordError">
              <FaExclamationCircle /> {errors.password}
            </div>}
            <div className="form-hint">Use at least 8 characters with a mix of letters, numbers, and symbols</div>
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="signupConfirmPassword">Confirm Password</label>
            <div className="input-with-icon">
              <FaLock className="input-icon" />
              <input
                type={showConfirmPassword ? "text" : "password"}
                id="signupConfirmPassword"
                name="confirmPassword"
                className="form-input"
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                disabled={authLoading}
              />
              <button
                type="button"
                className="password-toggle"
                id="signupConfirmPasswordToggle"
                onClick={() => togglePasswordVisibility('confirm')}
                disabled={authLoading}
              >
                {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
            {errors.confirmPassword && <div className="form-error" id="signupConfirmPasswordError">
              <FaExclamationCircle /> {errors.confirmPassword}
            </div>}
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="signupBirthdate">Date of Birth</label>
            <div className="input-with-icon">
              <FaCalendar className="input-icon" />
              <input
                type="date"
                id="signupBirthdate"
                name="birthdate"
                className="form-input"
                value={formData.birthdate}
                onChange={handleChange}
                required
                disabled={authLoading}
              />
            </div>
            {errors.birthdate && <div className="form-error" id="signupBirthdateError">
              <FaExclamationCircle /> {errors.birthdate}
            </div>}
            <div className="form-hint">You must be at least 18 years old to join</div>
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="signupGender">Gender</label>
            <div className="input-with-icon">
              <FaVenusMars className="input-icon" />
              <select
                id="signupGender"
                name="gender"
                className="form-input"
                value={formData.gender}
                onChange={handleChange}
                required
                disabled={authLoading}
              >
                <option value="">Select your gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="non-binary">Non-binary</option>
                <option value="prefer-not-to-say">Prefer not to say</option>
              </select>
            </div>
            {errors.gender && <div className="form-error" id="signupGenderError">
              <FaExclamationCircle /> {errors.gender}
            </div>}
          </div>
          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                id="signupTerms"
                name="terms"
                className="checkbox-input"
                checked={formData.terms}
                onChange={handleChange}
                required
                disabled={authLoading}
              />
              <span>I agree to the <Link to="#" style={{ color: 'var(--mubas-blue)' }}>Terms of Service</Link> and <Link to="#" style={{ color: 'var(--mubas-blue)' }}>Privacy Policy</Link></span>
            </label>
            {errors.terms && <div className="form-error" id="signupTermsError">
              <FaExclamationCircle /> {errors.terms}
            </div>}
          </div>
          <button
            type="submit"
            className="auth-button"
            id="signupButton"
            disabled={authLoading}
          >
            {authLoading ? (
              <FaSpinner className="fa-spin" />
            ) : (
              <FaUserPlus />
            )}
            {authLoading ? 'Creating Account...' : 'Create Account'}
          </button>
          <div className="auth-divider">
            <span>Or sign up with</span>
          </div>
          <div className="social-login">
            <button
              type="button"
              className="social-button google"
              onClick={() => handleSocialSignup('google')}
              disabled={authLoading}
            >
              <FaGoogle />
              Continue with Google
            </button>
            <button
              type="button"
              className="social-button facebook"
              onClick={() => handleSocialSignup('facebook')}
              disabled={authLoading}
            >
              <FaFacebook />
              Continue with Facebook
            </button>
          </div>
          <div className="auth-redirect">
            Already have an account? <Link to="/login" id="goToLoginLink">Sign in here</Link>
          </div>
        </form>
      </div>
    </div>
  );
};
export default Signup;