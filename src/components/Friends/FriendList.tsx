import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { User, Search, MessageSquare, UserMinus, ArrowLeft } from 'lucide-react';
import axios from 'axios';

interface Friend {
  _id: string;
  first_name: string;
  last_name: string;
  email: string;
  profile_picture?: string;
  user_type: string;
}

const FriendList: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredFriends, setFilteredFriends] = useState<Friend[]>([]);

  useEffect(() => {
    if (!user) {
      navigate('/signin');
      return;
    }

    fetchFriends();
  }, [user, navigate]);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredFriends(friends);
    } else {
      const filtered = friends.filter(friend => {
        const fullName = `${friend.first_name} ${friend.last_name}`.toLowerCase();
        return fullName.includes(searchQuery.toLowerCase()) || 
               friend.email.toLowerCase().includes(searchQuery.toLowerCase());
      });
      setFilteredFriends(filtered);
    }
  }, [searchQuery, friends]);

  const fetchFriends = async () => {
    try {
      setLoading(true);
      setError('');
      
      const token = sessionStorage.getItem('authToken');
      const response = await axios.get('http://localhost:5001/api/users/friends', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      setFriends(response.data);
      setFilteredFriends(response.data);
    } catch (err: any) {
      console.error('Error fetching friends:', err);
      setError(err.response?.data?.message || 'Failed to load friends');
    } finally {
      setLoading(false);
    }
  };

  const removeFriend = async (friendId: string) => {
    if (!window.confirm('Are you sure you want to remove this friend?')) {
      return;
    }
    
    try {
      const token = sessionStorage.getItem('authToken');
      await axios.delete(`http://localhost:5001/api/users/friends/${friendId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      // Update the friends list
      setFriends(prevFriends => prevFriends.filter(friend => friend._id !== friendId));
    } catch (err: any) {
      console.error('Error removing friend:', err);
      alert(err.response?.data?.message || 'Failed to remove friend');
    }
  };

  const startChat = async (friendId: string) => {
    try {
      const token = sessionStorage.getItem('authToken');
      const response = await axios.post('http://localhost:5001/api/chat/private', 
        { recipientId: friendId },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      // Store friend's info in chat state before navigating
      const friend = friends.find(f => f._id === friendId);
      if (friend) {
        localStorage.setItem(`chat_${response.data._id}_participant`, JSON.stringify({
          _id: friend._id,
          first_name: friend.first_name,
          last_name: friend.last_name,
          profile_picture: friend.profile_picture
        }));
      }
      
      // Navigate to the chat
      navigate(`/chat/${response.data._id}`);
    } catch (err: any) {
      console.error('Error creating chat:', err);
      alert(err.response?.data?.message || 'Failed to create chat');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-white rounded-lg shadow-md overflow-hidden">
      {/* Header */}
      <div className="flex items-center p-3 sm:p-4 border-b border-gray-200 bg-gray-50">
        <button 
          onClick={() => navigate('/profile')} 
          className="mr-2 sm:mr-3 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft size={18} />
        </button>
        <h2 className="text-lg sm:text-xl font-semibold">Friends</h2>
      </div>

      {/* Search bar */}
      <div className="p-3 sm:p-4 border-b border-gray-200">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search friends..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
          />
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            <Search size={16} />
          </div>
        </div>
      </div>

      {/* Friends list */}
      <div className="flex-1 overflow-y-auto">
        {error && (
          <div className="p-3 sm:p-4 text-red-500 text-sm">{error}</div>
        )}

        {filteredFriends.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-4 text-center">
            <User className="w-12 sm:w-16 h-12 sm:h-16 text-gray-300 mb-3 sm:mb-4" />
            {friends.length === 0 ? (
              <p className="text-gray-500 mb-3 sm:mb-4 text-sm sm:text-base">You don't have any friends yet</p>
            ) : (
              <p className="text-gray-500 mb-3 sm:mb-4 text-sm sm:text-base">No friends match your search</p>
            )}
            <button 
              onClick={() => navigate('/find-friends')} 
              className="px-3 py-1.5 sm:px-4 sm:py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm sm:text-base"
            >
              Find Friends
            </button>
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {filteredFriends.map((friend) => (
              <li key={friend._id} className="p-3 sm:p-4">
                <div className="flex items-center">
                  <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-gray-300 flex items-center justify-center mr-3 sm:mr-4">
                    {friend.profile_picture ? (
                      <img 
                        src={`http://localhost:5001/uploads/profile-pictures/${friend.profile_picture}`} 
                        alt={`${friend.first_name} ${friend.last_name}`}
                        className="h-10 w-10 sm:h-12 sm:w-12 rounded-full object-cover"
                      />
                    ) : (
                      <User className="text-gray-600" size={18} />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900 text-sm sm:text-base">
                      {friend.first_name} {friend.last_name}
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-500">
                      {friend.user_type}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <button 
                      onClick={() => startChat(friend._id)}
                      className="p-1.5 sm:p-2 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors"
                      title="Start Chat"
                    >
                      <MessageSquare size={16} />
                    </button>
                    <button 
                      onClick={() => navigate(`/user-profile/${friend._id}`)}
                      className="p-1.5 sm:p-2 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                      title="View Profile"
                    >
                      <User size={16} />
                    </button>
                    <button 
                      onClick={() => removeFriend(friend._id)}
                      className="p-1.5 sm:p-2 rounded-full bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
                      title="Remove Friend"
                    >
                      <UserMinus size={16} />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default FriendList;