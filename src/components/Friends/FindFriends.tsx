import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Search, User, ArrowLeft, UserPlus, Check } from 'lucide-react';
import axios from 'axios';

interface UserResult {
  _id: string;
  first_name: string;
  last_name: string;
  email: string;
  profile_picture?: string;
  user_type: string;
  isFriend?: boolean;
  hasPendingRequest?: boolean;
}

const FindFriends: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [requestSent, setRequestSent] = useState<{[key: string]: boolean}>({});

  useEffect(() => {
    if (!user) {
      navigate('/signin');
    }
  }, [user, navigate]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    try {
      setLoading(true);
      setError('');
      
      const token = sessionStorage.getItem('authToken');
      const response = await axios.get(`http://localhost:5001/api/users/search?query=${encodeURIComponent(searchQuery)}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      // Filter out current user from results
      const filteredResults = response.data.filter((result: UserResult) => result._id !== user?.id);
      setSearchResults(filteredResults);
    } catch (err: any) {
      console.error('Error searching users:', err);
      setError(err.response?.data?.message || 'Failed to search users');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const sendFriendRequest = async (userId: string) => {
    try {
      setLoading(true);
      setError('');
      
      const token = sessionStorage.getItem('authToken');
      await axios.post('http://localhost:5001/api/users/friend-request', 
        { recipientId: userId },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      // Update the UI to show request sent
      setRequestSent(prev => ({
        ...prev,
        [userId]: true
      }));
    } catch (err: any) {
      console.error('Error sending friend request:', err);
      setError(err.response?.data?.message || 'Failed to send friend request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-white rounded-lg shadow-md overflow-hidden">
      {/* Header */}
      <div className="flex items-center p-3 sm:p-4 border-b border-gray-200 bg-gray-50">
        <button 
          onClick={() => navigate('/friends')} 
          className="mr-2 sm:mr-3 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft size={18} />
        </button>
        <h2 className="text-lg sm:text-xl font-semibold">Find Friends</h2>
      </div>

      {/* Search bar */}
      <div className="p-3 sm:p-4 border-b border-gray-200">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Search for users..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
          />
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            <Search size={16} />
          </div>
          <button
            onClick={handleSearch}
            disabled={loading || !searchQuery.trim()}
            className={`absolute right-2 top-1/2 transform -translate-y-1/2 px-2 sm:px-3 py-1 rounded-md text-xs sm:text-sm ${loading || !searchQuery.trim() ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-blue-500 text-white hover:bg-blue-600'}`}
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>
      </div>

      {/* Search results */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4">
        {error && (
          <div className="text-red-500 mb-3 sm:mb-4 text-sm">{error}</div>
        )}

        {searchResults.length === 0 && searchQuery && !loading && !error ? (
          <div className="text-center py-6 sm:py-8 text-gray-500 text-sm sm:text-base">
            No users found matching '{searchQuery}'
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {searchResults.map((result) => (
              <li key={result._id} className="py-2 sm:py-3">
                <div className="w-full flex items-center p-2 hover:bg-gray-50 rounded-lg transition-colors">
                  <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-gray-300 flex items-center justify-center mr-3 sm:mr-4">
                    {result.profile_picture ? (
                      <img 
                        src={`http://localhost:5001/uploads/profile-pictures/${result.profile_picture}`} 
                        alt={`${result.first_name} ${result.last_name}`}
                        className="h-10 w-10 sm:h-12 sm:w-12 rounded-full object-cover"
                      />
                    ) : (
                      <User className="text-gray-600" size={18} />
                    )}
                  </div>
                  <div className="flex-1 text-left">
                    <h3 className="font-medium text-gray-900 text-sm sm:text-base truncate">
                      {result.first_name} {result.last_name}
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-500">
                      {result.user_type}
                    </p>
                  </div>
                  <div className="flex flex-col space-y-2">
                    {result.isFriend ? (
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-md flex items-center">
                        <Check size={14} className="mr-1" /> Friends
                      </span>
                    ) : result.hasPendingRequest || requestSent[result._id] ? (
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-md">
                        Request Sent
                      </span>
                    ) : (
                      <button
                        onClick={() => sendFriendRequest(result._id)}
                        disabled={loading}
                        className="px-2 py-1 bg-blue-500 text-white text-xs rounded-md hover:bg-blue-600 transition-colors flex items-center"
                      >
                        <UserPlus size={14} className="mr-1" /> Add Friend
                      </button>
                    )}
                    <button
                      onClick={() => navigate(`/user-profile/${result._id}`)}
                      className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-md hover:bg-gray-200 transition-colors"
                    >
                      View Profile
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

export default FindFriends;