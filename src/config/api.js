export const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

export const API_ENDPOINTS = {
  LOGIN: `${BASE_URL}/api/auth/login/`,
  LOGOUT: `${BASE_URL}/api/auth/logout/`,
  REGISTER: `${BASE_URL}/api/auth/register/`,
  PROFILE: `${BASE_URL}/api/auth/profile/`,
  CHANGE_PASSWORD: `${BASE_URL}/api/auth/change-password/`,
  DELETE_ACCOUNT: `${BASE_URL}/api/auth/delete-account/`,
  REFRESH_TOKEN: `${BASE_URL}/api/auth/refresh/`,
  VERIFY_TOKEN: `${BASE_URL}/api/auth/verify/`,
  
  // User endpoints
  USERS: `${BASE_URL}/api/users/`,
  USER_PROFILE: (id) => `${BASE_URL}/api/users/${id}/`,
  USER_PHOTOS: `${BASE_URL}/api/users/photos/`,
  USER_INTERESTS: `${BASE_URL}/api/users/interests/`,
  USER_STATS: `${BASE_URL}/api/users/stats/`,
  BLOCK_USER: (id) => `${BASE_URL}/api/users/${id}/block/`,
  
  // Matching endpoints
  LIKES: `${BASE_URL}/api/matches/likes/`,
  DISLIKES: `${BASE_URL}/api/matches/dislikes/`,
  MATCHES: `${BASE_URL}/api/matches/matches/`,
  
  // Chat endpoints
  CHAT_CONVERSATIONS: `${BASE_URL}/api/chat/conversations/`,
  CHAT_CONVERSATION: (id) => `${BASE_URL}/api/chat/conversations/${id}/`,
  CHAT_MESSAGES: `${BASE_URL}/api/chat/messages/`,
  CHAT_CONVERSATION_MESSAGES: (id) => `${BASE_URL}/api/chat/conversations/${id}/messages/`,
  CHAT_MARK_ALL_READ: `${BASE_URL}/api/chat/conversations/mark_all_read/`,
  CHAT_MARK_READ: (id) => `${BASE_URL}/api/chat/conversations/${id}/mark_read/`,
  CHAT_CLEAR: (id) => `${BASE_URL}/api/chat/conversations/${id}/clear/`,
  CHAT_UPLOAD: `${BASE_URL}/api/chat/upload/`,
  CHAT_EXISTS: (userId) => `${BASE_URL}/api/chat/conversations/exists/${userId}/`,
  
  // Report endpoints
  REPORTS: `${BASE_URL}/api/reports/`,
  
  // Settings endpoints
  PRIVACY_SETTINGS: `${BASE_URL}/api/settings/privacy/`,
  SECURITY_SETTINGS: `${BASE_URL}/api/settings/security/`,
  CLEAR_DATA: `${BASE_URL}/api/settings/clear-data/`,
  
  // Upload endpoints
  UPLOAD_PHOTO: `${BASE_URL}/api/upload/photo/`,
};

// Helper to get authentication headers
export const getAuthHeaders = (token = null) => {
  const headers = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
};

export const fetchWithAuth = async (url, options = {}, token = null) => {
  const defaultOptions = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  };

  if (token) {
    defaultOptions.headers['Authorization'] = `Bearer ${token}`;
  }

  //  CSRF token 
  const csrfToken = getCookie('csrftoken');
  if (csrfToken) {
    defaultOptions.headers['X-CSRFToken'] = csrfToken;
  }

  try {
    const response = await fetch(url, defaultOptions);
    
    // Handle 401 Unauthorized (token expired)
    if (response.status === 401 && token) {
      // Try to refresh the token
      const refreshResponse = await fetch(API_ENDPOINTS.REFRESH_TOKEN, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(csrfToken && { 'X-CSRFToken': csrfToken }),
        },
      }); 
      if (refreshResponse.ok) {
        const refreshData = await refreshResponse.json();
        const newToken = refreshData.access || refreshData.token;
        
        defaultOptions.headers['Authorization'] = `Bearer ${newToken}`;
        return fetch(url, defaultOptions);
      } else {
        // Refresh failed, user needs to re-login
        throw new Error('SESSION_EXPIRED');
      }
    }
    
    return response;
  } catch (error) {
    console.error('Fetch error:', error);
    throw error;
  }
};

// Helper for JSON requests
export const fetchJSON = async (url, options = {}, token = null) => {
  const response = await fetchWithAuth(url, options, token);
  
  if (!response.ok) {
    let errorMessage = `HTTP error! status: ${response.status}`;
    
    try {
      const errorData = await response.json();
      errorMessage = errorData.detail || errorData.message || errorMessage;
    } catch (e) {
      
    }
    
    throw new Error(errorMessage);
  }
  
  return response.json();
};

//(for file uploads)
export const fetchFormData = async (url, formData, options = {}, token = null) => {
  const defaultOptions = {
    ...options,
    body: formData,
    headers: {},
  };

  if (token) {
    defaultOptions.headers['Authorization'] = `Bearer ${token}`;
  }

  const csrfToken = getCookie('csrftoken');
  if (csrfToken) {
    defaultOptions.headers['X-CSRFToken'] = csrfToken;
  }

  const response = await fetch(url, defaultOptions);
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  return response.json();
};
const getCookie = (name) => {
  let cookieValue = null;
  if (document.cookie && document.cookie !== '') {
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      if (cookie.substring(0, name.length + 1) === (name + '=')) {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
};