import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  FaEnvelope, 
  FaLock, 
  FaEye, 
  FaEyeSlash, 
  FaExclamationCircle,
  FaSpinner,
  FaSignInAlt,
  FaGoogle,
  FaFacebook,
  FaApple
} from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import './styles/Login.css'

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();
  const { login, loading: authLoading } = useAuth();

  const handleChange = (e) => {
    const { name, value, id } = e.target;
    const fieldName = name || id;
    
    if (!fieldName) return;
    setFormData({
      ...formData,
      [fieldName]: value
    });
    if (errors[fieldName]) {
      setErrors({
        ...errors,
        [fieldName]: ''
      });
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!isValidEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    }
    return newErrors;
  };

  const isValidEmail = (email) => {
    const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    const result = await login(formData.email, formData.password);
    if (result.success) {
      if (result.data?.user?.profile_complete || result.data?.profile_complete) {
        navigate('/');
      } else {
        navigate('/profile-setup');
      }
    } else {
      setErrors({ 
        general: result.error || 'Invalid email or password' 
      });
    }
  };

  const handleSocialLogin = (provider) => {
    console.log(`Login with ${provider}`);
    // oath login
  };

  const handleForgotPassword = () => {
    const email = prompt('Please enter your email address to reset your password:');
    if (email && isValidEmail(email)) {
      alert(`Password reset instructions have been sent to ${email}`);
    } else if (email) {
      alert('Please enter a valid email address');
    }
  };

  return (
    <div className="app-container">
      <div className="auth-page" id="loginPage">
        <div className="auth-header">
          <div className="auth-logo">
            <div className="logo-icon">M</div>
            <h1>Mdates</h1>
          </div>
          <h2>Welcome Back</h2>
          <p>Sign in to continue your journey to find meaningful connections</p>
        </div>

        <form className="auth-form" id="loginForm" onSubmit={handleSubmit}>
          {errors.general && (
            <div className="form-error" style={{ marginBottom: '20px' }}>
              <FaExclamationCircle /> {errors.general}
            </div>
          )}
          <div className="form-group">
            <label className="form-label" htmlFor="loginEmail">Email Address</label>
            <div className="input-with-icon">
              <FaEnvelope className="input-icon" />
              <input
                type="email"
                id="loginEmail"
                name="email"
                className="form-input"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleChange}
                required
                disabled={authLoading}
              />
            </div>
            {errors.email && <div className="form-error" id="loginEmailError">
              <FaExclamationCircle /> {errors.email}
            </div>}
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="loginPassword">Password</label>
            <div className="input-with-icon">
              <FaLock className="input-icon" />
              <input
                type={showPassword ? "text" : "password"}
                id="loginPassword"
                name="password"
                className="form-input"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
                required
                disabled={authLoading}
              />
              <button
                type="button"
                className="password-toggle"
                id="loginPasswordToggle"
                onClick={togglePasswordVisibility}
                disabled={authLoading}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
            {errors.password && <div className="form-error" id="loginPasswordError">
              <FaExclamationCircle /> {errors.password}
            </div>}
            <div className="form-footer">
              <button
                type="button"
                className="forgot-password"
                id="forgotPasswordLink"
                onClick={handleForgotPassword}
                disabled={authLoading}
              >
                Forgot password?
              </button>
            </div>
          </div>
          <button
            type="submit"
            className="auth-button"
            id="loginButton"
            disabled={authLoading}
          >
            {authLoading ? (
              <FaSpinner className="fa-spin" />
            ) : (
              <FaSignInAlt />
            )}
            {authLoading ? 'Signing In...' : 'Sign In'}
          </button>

          <div className="auth-divider">
            <span>Or continue with</span>
          </div>
          <div className="social-login">
            <button
              type="button"
              className="social-button google"
              onClick={() => handleSocialLogin('google')}
              disabled={authLoading}
            >
              <FaGoogle />
              Continue with Google
            </button>
            <button
              type="button"
              className="social-button facebook"
              onClick={() => handleSocialLogin('facebook')}
              disabled={authLoading}
            >
              <FaFacebook />
              Continue with Facebook
            </button>
            <button
              type="button"
              className="social-button apple"
              onClick={() => handleSocialLogin('apple')}
              disabled={authLoading}
            >
              <FaApple />
              Continue with Apple
            </button>
          </div>
          <div className="auth-redirect">
            Don't have an account? <Link to="/signup" id="goToSignupLink">Sign up now</Link>
          </div>
        </form>
      </div>
    </div>
  );
};
export default Login;