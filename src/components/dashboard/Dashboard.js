import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { BASE_URL, API_ENDPOINTS, fetchJSON } from '../../config/api';
import { useAuth } from '../../context/AuthContext';
import UserCard from './UserCard';
import Filters from './Filters';
import ProfilePopup from '../matches/ProfilePopup';
import Loading from '../common/Loading';
import './styles/Dashboard.css';

const Dashboard = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showProfilePopup, setShowProfilePopup] = useState(false);
  const [likedUsers, setLikedUsers] = useState(new Set());
  const [matches, setMatches] = useState(new Set());
  
  const location = useLocation();
  const navigate = useNavigate();
  const { token, user: currentUser } = useAuth();
  
  const searchParams = new URLSearchParams(location.search);
  const urlSearchQuery = searchParams.get('q') || '';
  const [searchQuery, setSearchQuery] = useState(urlSearchQuery);

  useEffect(() => {
    if (token) {
      fetchUsers();
      fetchLikes();
      fetchMatches();
    } else {
      navigate('/login');
    }
  }, [token]);

  useEffect(() => {
    filterUsers();
  }, [users, activeFilter, searchQuery]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const query = params.get('q') || '';
    setSearchQuery(query);
  }, [location.search]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await fetchJSON(
        API_ENDPOINTS.USERS,
        {},
        token
      );
      const mappedUsers = data.map(user => ({
        id: user.id,
        name: user.first_name || user.username,
        age: user.age || 25,
        job: user.occupation || 'Not specified',
        bio: user.bio || 'Looking for meaningful connections',
        distance: user.distance || Math.random() * 30,
        status: user.is_online ? 'online' : 'offline',
        color: `linear-gradient(135deg, ${getRandomColor()}, ${getRandomColor()})`,
        initials: getInitials(user.first_name || user.username),
        isMatch: false,
        interests: user.interests || [],
        compatibility: calculateCompatibility(user),
        lastActive: formatLastActive(user.last_seen),
        verified: user.is_verified || false,
        image: user.profile_picture 
      }));

      setUsers(mappedUsers);
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setLoading(false);
    }
  };
  const fetchLikes = async () => {
    if (!token) return;
    
    try {
      const data = await fetchJSON(
        API_ENDPOINTS.LIKES,
        {},
        token
      );
      
      const likedIds = new Set(data.map(like => like.liked_user_id));
      setLikedUsers(likedIds);
    } catch (error) {
      console.error('Error fetching likes:', error);
    }
  };
  const fetchMatches = async () => {
    if (!token) return;
    
    try {
      const data = await fetchJSON(
        API_ENDPOINTS.MATCHES,
        {},
        token
      );
      
      const matchIds = new Set(data.map(match => match.matched_user_id));
      setMatches(matchIds);
      
      setUsers(prevUsers => 
        prevUsers.map(user => ({
          ...user,
          isMatch: matchIds.has(user.id)
        }))
      );
    } catch (error) {
      console.error('Error fetching matches:', error);
    }
  };
  const getRandomColor = () => {
    const colors = ['#003A8F', '#a78bfa', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#ef4444', '#06b6d4'];
    return colors[Math.floor(Math.random() * colors.length)];
  };
  const getInitials = (name) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  const calculateCompatibility = (user) => {
    return Math.floor(Math.random() * 25) + 70;
  };

  const formatLastActive = (timestamp) => {
    if (!timestamp) return 'Recently';
    
    const now = new Date();
    const lastActive = new Date(timestamp);
    const diffMinutes = Math.floor((now - lastActive) / (1000 * 60));
    
    if (diffMinutes < 60) return `${diffMinutes} min ago`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)} hours ago`;
    return `${Math.floor(diffMinutes / 1440)} days ago`;
  };
  const filterUsers = () => {
    let filtered = [...users];

    if (searchQuery) {
      filtered = filtered.filter(user =>
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.job.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.bio.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.interests.some(interest => 
          interest.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    }
    switch (activeFilter) {
      case 'online':
        filtered = filtered.filter(user => user.status === 'online');
        break;
      case 'near':
        filtered = filtered.filter(user => user.distance < 5);
        break;
      case 'new':
        filtered = filtered.slice(0, 3);
        break;
      case 'recommended':
        filtered = filtered.filter(user => user.compatibility >= 85);
        break;
    }
    setFilteredUsers(filtered);
  };
  const handleUserClick = (user) => {
    setSelectedUser(user);
    setShowProfilePopup(true);
  };
  const handleFilterChange = (filter) => {
    setActiveFilter(filter);
  };
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    
    const params = new URLSearchParams(location.search);
    if (value) {
      params.set('q', value);
    } else {
      params.delete('q');
    }
    navigate(`?${params.toString()}`, { replace: true });
  };

  const clearSearch = () => {
    setSearchQuery('');
    const params = new URLSearchParams(location.search);
    params.delete('q');
    navigate(`?${params.toString()}`, { replace: true });
  };

  const handleMessageClick = (user) => {
    navigate('/chat/new', {
      state: { 
        user: {
          ...user,
          isMatch: matches.has(user.id) || false
        }
      }
    });
  };
  const handleLikeUser = async (userId) => {
    if (!token) {
      alert('Please login to like users');
      navigate('/login');
      return;
    }
    
    try {
      const data = await fetchJSON(
        API_ENDPOINTS.LIKES,
        {
          method: 'POST',
          body: JSON.stringify({
            liked_user_id: userId
          })
        },
        token
      );
      
      setLikedUsers(prev => {
        const newLiked = new Set(prev);
        newLiked.add(userId);
        return newLiked;
      });

      if (data.is_match) {
        setMatches(prevMatches => {
          const newMatches = new Set(prevMatches);
          newMatches.add(userId);
          return newMatches;
        });    
        setUsers(prevUsers => 
          prevUsers.map(user => 
            user.id === userId ? { ...user, isMatch: true } : user
          )
        );
        
        const matchedUser = users.find(u => u.id === userId);
        if (matchedUser) {
          alert(`🎉 It's a match! You and ${matchedUser.name} have liked each other!`);
        }
      } else {
        const likedUser = users.find(u => u.id === userId);
        if (likedUser) {
          alert(`You liked ${likedUser.name}! They'll be notified.`);
        }
      }
    } catch (error) {
      console.error('Error liking user:', error);
      alert('Failed to like user. Please try again.');
    }
  };
  const handlePassUser = async (userId) => {
    if (!token) {
      alert('Please login to interact with users');
      navigate('/login');
      return;
    }
    
    try {
      await fetchJSON(
        `${BASE_URL}/api/dislikes/`,
        {
          method: 'POST',
          body: JSON.stringify({
            disliked_user_id: userId
          })
        },
        token
      );

      const passedUser = users.find(u => u.id === userId);
      alert(`You passed on ${passedUser.name}`);
      
      setUsers(prevUsers => prevUsers.filter(user => user.id !== userId));
    } catch (error) {
      console.error('Error passing user:', error);
      const passedUser = users.find(u => u.id === userId);
      if (passedUser) {
        alert(`You passed on ${passedUser.name}`);
      }
      setUsers(prevUsers => prevUsers.filter(user => user.id !== userId));
    }
  };

  const handleViewProfile = (user) => {
    navigate(`/user/${user.id}`, {
      state: { user }
    });
  };

  if (!token) {
    return <Loading message="Checking authentication..." />;
  }
  if (loading) {
    return (
      <div className="dashboard-page">
        <Loading message="Finding people near you..." />
      </div>
    );
  }
  return (
    <div className="dashboard-page">   
      <Filters activeFilter={activeFilter} onFilterChange={handleFilterChange} />
      {filteredUsers.length === 0 ? (
        <div className="empty-state">
          <div style={{ 
            textAlign: 'center', 
            padding: '40px 20px', 
            color: 'var(--text-secondary)' 
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>👥</div>
            <h3 style={{ marginBottom: '8px' }}>
              {searchQuery ? 'No users found' : 'No users available'}
            </h3>
            <p>
              {searchQuery 
                ? `No results for "${searchQuery}". Try a different search term.`
                : 'Try changing your filters or check back later.'
              }
            </p>
            {searchQuery && (
              <button
                className="auth-button secondary"
                onClick={clearSearch}
                style={{ marginTop: '20px', width: 'auto' }}
              >
                Clear Search
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="user-list">
          {filteredUsers.map(user => (
            <UserCard 
              key={user.id} 
              user={user} 
              onClick={() => handleUserClick(user)}
              onMessage={() => handleMessageClick(user)}
              onLike={() => handleLikeUser(user.id)}
              onPass={() => handlePassUser(user.id)}
              onViewProfile={() => handleViewProfile(user)}
              isLiked={likedUsers.has(user.id)}
              isMatch={matches.has(user.id)}
            />
          ))}
        </div>
      )}

      {showProfilePopup && selectedUser && (
        <ProfilePopup
          user={selectedUser}
          onClose={() => setShowProfilePopup(false)}
          onLike={() => {
            handleLikeUser(selectedUser.id);
            setShowProfilePopup(false);
          }}
          onPass={() => {
            handlePassUser(selectedUser.id);
            setShowProfilePopup(false);
          }}
          onMessage={() => {
            handleMessageClick(selectedUser);
            setShowProfilePopup(false);
          }}
          isLiked={likedUsers.has(selectedUser.id)}
          isMatch={matches.has(selectedUser.id)}
        />
      )}
    </div>
  );
};
export default Dashboard;