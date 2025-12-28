import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_ENDPOINTS, fetchJSON } from '../config/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => {
    
    return sessionStorage.getItem('auth_token');
  });
  const [loading, setLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const navigate = useNavigate();

  // Check for existing session on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        if (token) {
          // Verify token and get user data
          const userData = await fetchJSON(API_ENDPOINTS.PROFILE, {}, token);
          setUser(userData);
        } else {
        
          try {
            const userData = await fetchJSON(API_ENDPOINTS.PROFILE, {});
            setUser(userData);
          } catch (cookieError) {
            // No valid session found
            console.log('No valid session, user needs to login');
          }
        }
      } catch (error) {
        console.error('Auth check error:', error);
        
        // Handle token expiration
        if (error.message.includes('SESSION_EXPIRED') || error.message.includes('401')) {
          sessionStorage.removeItem('auth_token');
          setToken(null);
        }
      } finally {
        setLoading(false);
        setIsInitialized(true);
      }
    };

    checkAuth();
  }, [token]);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const loginData = await fetchJSON(API_ENDPOINTS.LOGIN, {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      const authToken = loginData.access || loginData.token;
      const userData = loginData.user || loginData;

      if (authToken) {
        setToken(authToken);
        sessionStorage.setItem('auth_token', authToken);
      }
      
      setUser(userData);
      
      return { success: true, data: loginData };
    } catch (error) {
      console.error('Login error:', error);
      return { 
        success: false, 
        error: error.message || 'Invalid credentials' 
      };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await fetchJSON(
        API_ENDPOINTS.LOGOUT,
        { method: 'POST' },
        token
      );
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear everything
      setUser(null);
      setToken(null);
      sessionStorage.removeItem('auth_token');
      navigate('/login');
    }
  };

  const register = async (userData) => {
    setLoading(true);
    try {
      const registrationData = await fetchJSON(API_ENDPOINTS.REGISTER, {
        method: 'POST',
        body: JSON.stringify(userData),
      });

      // Handle different response formats
      const authToken = registrationData.access || registrationData.token;
      const newUser = registrationData.user || registrationData;

      if (authToken) {
        setToken(authToken);
        sessionStorage.setItem('auth_token', authToken);
      }
      
      setUser(newUser);
      
      return { success: true, data: registrationData };
    } catch (error) {
      console.error('Registration error:', error);
      return { 
        success: false, 
        error: error.message || 'Registration failed' 
      };
    } finally {
      setLoading(false);
    }
  };

  const updateUser = useCallback((userData) => {
    setUser(prevUser => ({ ...prevUser, ...userData }));
  }, []);

  const refreshToken = async () => {
    try {
      const refreshData = await fetchJSON(API_ENDPOINTS.REFRESH_TOKEN, {
        method: 'POST',
      });

      const newToken = refreshData.access || refreshData.token;
      if (newToken) {
        setToken(newToken);
        sessionStorage.setItem('auth_token', newToken);
        return newToken;
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
      logout();
    }
    return null;
  };

  const getUserId = useCallback(() => {
    return user?.id || user?.user_id || user?._id || user?.pk;
  }, [user]);

  const value = {
    user,
    token,
    userId: getUserId(),
    getUserId,
    loading: loading || !isInitialized,
    login,
    logout,
    register,
    updateUser,
    refreshToken,
    isAuthenticated: !!user && isInitialized,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;