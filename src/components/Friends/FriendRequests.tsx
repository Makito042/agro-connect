import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { User, UserCheck, UserX, ArrowLeft, Clock, Search, UserPlus, Check } from 'lucide-react';
import axios from 'axios';
import { io, Socket } from 'socket.io-client';

interface FriendRequest {
  requestId: string;
  from?: {
    _id: string;
    first_name: string;
    last_name: string;
    email: string;
    profile_picture?: string;
    user_type: string;
  };
  to?: {
    _id: string;
    first_name: string;
    last_name: string;
    email: string;
    profile_picture?: string;
    user_type: string;
  };
  createdAt: Date;
}

interface FriendRequestsData {
  incoming: FriendRequest[];
  outgoing: FriendRequest[];
}

const FriendRequests: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [requests, setRequests] = useState<FriendRequestsData>({ incoming: [], outgoing: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'incoming' | 'outgoing'>('incoming');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [requestSent, setRequestSent] = useState<{[key: string]: boolean}>({});
  const [socket, setSocket] = useState<Socket | null>(null);
  const socketInitialized = useRef(false);

  // Initialize Socket.io connection
  useEffect(() => {
    if (!user || socketInitialized.current) return;
    
    // Connect to Socket.io server
    const newSocket = io('http://localhost:5001', {
      withCredentials: true,
      transports: ['polling', 'websocket'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      autoConnect: true,
      path: '/socket.io/',
    });
    
    setSocket(newSocket);
    socketInitialized.current = true;
    
    // Join user's personal room for notifications
    if (user.id) {
      newSocket.emit('join_chat', `user_${user.id}`);
    }
    
    // Cleanup on unmount
    return () => {
      newSocket.disconnect();
      setSocket(null);
      socketInitialized.current = false;
    };
  }, [user]);

  // Listen for real-time friend request notifications
  useEffect(() => {
    if (!socket) return;
    
    // Handle new friend request
    const handleNewFriendRequest = (data) => {
      console.log('Received new friend request:', data);
      // Update the requests list with the new request
      setRequests(prev => ({
        ...prev,
        incoming: [...prev.incoming, data]
      }));
    };
    
    // Handle friend request accepted
    const handleFriendRequestAccepted = (data) => {
      console.log('Friend request accepted:', data);
      // Remove the request from outgoing list
      setRequests(prev => ({
        ...prev,
        outgoing: prev.outgoing.filter(req => req.requestId !== data.requestId)
      }));
    };
    
    // Register event listeners
    socket.on('new_friend_request', handleNewFriendRequest);
    socket.on('friend_request_accepted', handleFriendRequestAccepted);
    
    // Cleanup listeners
    return () => {
      socket.off('new_friend_request', handleNewFriendRequest);
      socket.off('friend_request_accepted', handleFriendRequestAccepted);
    };
  }, [socket]);

  useEffect(() => {
    if (!user) {
      navigate('/signin');
      return;
    }

    fetchFriendRequests();
  }, [user, navigate]);

  const fetchFriendRequests = async () => {
    try {
      setLoading(true);
      setError('');
      
      const token = localStorage.getItem('authToken');
      const response = await axios.get('http://localhost:5001/api/users/friend-requests', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      setRequests(response.data);
    } catch (err: any) {
      console.error('Error fetching friend requests:', err);
      setError(err.response?.data?.message || 'Failed to load friend requests');
    } finally {
      setLoading(false);
    }
  };

  const acceptRequest = async (requestId: string) => {
    try {
      const token = localStorage.getItem('authToken');
      await axios.put(`http://localhost:5001/api/users/friend-request/${requestId}/accept`, {}, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      // Update the requests list
      setRequests(prev => ({
        ...prev,
        incoming: prev.incoming.filter(req => req.requestId !== requestId)
      }));
      
      // Show success message
      alert('Friend request accepted!');
    } catch (err: any) {
      console.error('Error accepting friend request:', err);
      alert(err.response?.data?.message || 'Failed to accept friend request');
    }
  };

  const rejectRequest = async (requestId: string) => {
    try {
      const token = localStorage.getItem('authToken');
      await axios.put(`http://localhost:5001/api/users/friend-request/${requestId}/reject`, {}, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      // Update the requests list
      setRequests(prev => ({
        ...prev,
        incoming: prev.incoming.filter(req => req.requestId !== requestId)
      }));
    } catch (err: any) {
      console.error('Error rejecting friend request:', err);
      alert(err.response?.data?.message || 'Failed to reject friend request');
    }
  };

  const cancelRequest = async (requestId: string) => {
    try {
      const token = localStorage.getItem('authToken');
      await axios.put(`http://localhost:5001/api/users/friend-request/${requestId}/reject`, {}, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      // Update the requests list
      setRequests(prev => ({
        ...prev,
        outgoing: prev.outgoing.filter(req => req.requestId !== requestId)
      }));
    } catch (err: any) {
      console.error('Error canceling friend request:', err);
      alert(err.response?.data?.message || 'Failed to cancel friend request');
    }
  };
  
  // Search for users
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    try {
      setSearchLoading(true);
      setSearchError('');
      
      const token = localStorage.getItem('authToken');
      const response = await axios.get(`http://localhost:5001/api/users/search?query=${encodeURIComponent(searchQuery)}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      // Filter out current user from results
      const filteredResults = response.data.filter((result: any) => result._id !== user?.id);
      setSearchResults(filteredResults);
    } catch (err: any) {
      console.error('Error searching users:', err);
      setSearchError(err.response?.data?.message || 'Failed to search users');
    } finally {
      setSearchLoading(false);
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
      
      const token = localStorage.getItem('authToken');
      const response = await axios.post('http://localhost:5001/api/users/friend-request', 
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
      
      // Add to outgoing requests list
      if (response.data.request) {
        const recipient = searchResults.find(result => result._id === userId);
        if (recipient) {
          const newRequest = {
            requestId: response.data.request._id,
            to: {
              _id: recipient._id,
              first_name: recipient.first_name,
              last_name: recipient.last_name,
              email: recipient.email,
              profile_picture: recipient.profile_picture,
              user_type: recipient.user_type
            },
            createdAt: response.data.request.createdAt
          };
          
          setRequests(prev => ({
            ...prev,
            outgoing: [...prev.outgoing, newRequest]
          }));
        }
      }
      
      // Emit socket event for real-time notification
      if (socket && user) {
        socket.emit('send_friend_request', {
          recipientId: userId,
          senderId: user.id,
          senderName: `${user.first_name} ${user.last_name}`
        }, (acknowledgment) => {
          if (acknowledgment && !acknowledgment.success) {
            console.error('Failed to send friend request notification:', acknowledgment.error);
          }
        });
      }
    } catch (err: any) {
      console.error('Error sending friend request:', err);
      setError(err.response?.data?.message || 'Failed to send friend request');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: Date) => {
    const requestDate = new Date(date);
    const today = new Date();
    
    // If request is from today, show time
    if (requestDate.toDateString() === today.toDateString()) {
      return requestDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    // If request is from this week, show day name
    const diffDays = Math.floor((today.getTime() - requestDate.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays < 7) {
      return requestDate.toLocaleDateString([], { weekday: 'short' });
    }
    
    // Otherwise show date
    return requestDate.toLocaleDateString([], { month: 'short', day: 'numeric' });
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
        <h2 className="text-lg sm:text-xl font-semibold">Friend Requests</h2>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          className={`flex-1 py-2 sm:py-3 text-sm sm:text-base font-medium ${activeTab === 'incoming' ? 'text-blue-600 border-b-2 border-blue-500' : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveTab('incoming')}
        >
          Incoming
          {requests.incoming.length > 0 && (
            <span className="ml-1 sm:ml-2 px-1.5 py-0.5 text-xs rounded-full bg-blue-100 text-blue-800">
              {requests.incoming.length}
            </span>
          )}
        </button>
        <button
          className={`flex-1 py-2 sm:py-3 text-sm sm:text-base font-medium ${activeTab === 'outgoing' ? 'text-blue-600 border-b-2 border-blue-500' : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveTab('outgoing')}
        >
          Outgoing
          {requests.outgoing.length > 0 && (
            <span className="ml-1 sm:ml-2 px-1.5 py-0.5 text-xs rounded-full bg-blue-100 text-blue-800">
              {requests.outgoing.length}
            </span>
          )}
        </button>
      </div>
      
      {/* Search bar */}
      <div className="p-3 sm:p-4 border-b border-gray-200">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Search for new friends..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
          />
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            <Search size={16} />
          </div>
          <button
            onClick={handleSearch}
            disabled={searchLoading || !searchQuery.trim()}
            className={`absolute right-2 top-1/2 transform -translate-y-1/2 px-2 sm:px-3 py-1 rounded-md text-xs sm:text-sm ${searchLoading || !searchQuery.trim() ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-blue-500 text-white hover:bg-blue-600'}`}
          >
            {searchLoading ? 'Searching...' : 'Search'}
          </button>
        </div>
      </div>

      {/* Request list */}
      <div className="flex-1 overflow-y-auto">
        {error && (
          <div className="p-3 sm:p-4 text-red-500 text-sm">{error}</div>
        )}
        
        {/* Search Results */}
        {searchQuery && searchResults.length > 0 && (
          <div className="p-3 sm:p-4 border-b border-gray-200">
            <h3 className="font-medium text-gray-900 text-sm sm:text-base mb-2">Search Results</h3>
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
          </div>
        )}
        
        {searchQuery && searchResults.length === 0 && !searchLoading && !searchError && (
          <div className="p-3 sm:p-4 text-center text-gray-500">
            No users found matching '{searchQuery}'
          </div>
        )}
        
        {searchError && (
          <div className="p-3 sm:p-4 text-red-500 text-sm">{searchError}</div>
        )}

        {activeTab === 'incoming' && (
          <>
            {requests.incoming.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full p-4 text-center">
                <User className="w-12 sm:w-16 h-12 sm:h-16 text-gray-300 mb-3 sm:mb-4" />
                <p className="text-gray-500 mb-3 sm:mb-4 text-sm sm:text-base">No incoming friend requests</p>
                <button 
                  onClick={() => navigate('/find-friends')} 
                  className="px-3 py-1.5 sm:px-4 sm:py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm sm:text-base"
                >
                  Find Friends
                </button>
              </div>
            ) : (
              <ul className="divide-y divide-gray-200">
                {requests.incoming.map((request) => (
                  <li key={request.requestId} className="p-3 sm:p-4">
                    <div className="flex items-center">
                      <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-gray-300 flex items-center justify-center mr-3 sm:mr-4">
                        {request.from?.profile_picture ? (
                          <img 
                            src={`http://localhost:5001/uploads/profile-pictures/${request.from.profile_picture}`} 
                            alt={`${request.from.first_name} ${request.from.last_name}`}
                            className="h-10 w-10 sm:h-12 sm:w-12 rounded-full object-cover"
                          />
                        ) : (
                          <User className="text-gray-600" size={18} />
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900 text-sm sm:text-base">
                          {request.from?.first_name} {request.from?.last_name}
                        </h3>
                        <div className="flex items-center text-xs sm:text-sm text-gray-500">
                          <p className="mr-2">{request.from?.user_type}</p>
                          <span className="flex items-center text-gray-400">
                            <Clock size={12} className="mr-1" />
                            {formatDate(request.createdAt)}
                          </span>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => acceptRequest(request.requestId)}
                          className="p-1.5 sm:p-2 rounded-full bg-green-100 text-green-600 hover:bg-green-200 transition-colors"
                          title="Accept"
                        >
                          <UserCheck size={16} />
                        </button>
                        <button 
                          onClick={() => rejectRequest(request.requestId)}
                          className="p-1.5 sm:p-2 rounded-full bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
                          title="Reject"
                        >
                          <UserX size={16} />
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
        
        {activeTab === 'outgoing' && (
          <>
            {requests.outgoing.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full p-4 text-center">
                <User className="w-12 sm:w-16 h-12 sm:h-16 text-gray-300 mb-3 sm:mb-4" />
                <p className="text-gray-500 mb-3 sm:mb-4 text-sm sm:text-base">No outgoing friend requests</p>
                <button 
                  onClick={() => navigate('/find-friends')} 
                  className="px-3 py-1.5 sm:px-4 sm:py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm sm:text-base"
                >
                  Find Friends
                </button>
              </div>
            ) : (
              <ul className="divide-y divide-gray-200">
                {requests.outgoing.map((request) => (
                  <li key={request.requestId} className="p-3 sm:p-4">
                    <div className="flex items-center">
                      <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-gray-300 flex items-center justify-center mr-3 sm:mr-4">
                        {request.to?.profile_picture ? (
                          <img 
                            src={`http://localhost:5001/uploads/profile-pictures/${request.to.profile_picture}`} 
                            alt={`${request.to.first_name} ${request.to.last_name}`}
                            className="h-10 w-10 sm:h-12 sm:w-12 rounded-full object-cover"
                          />
                        ) : (
                          <User className="text-gray-600" size={18} />
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900 text-sm sm:text-base">
                          {request.to?.first_name} {request.to?.last_name}
                        </h3>
                        <div className="flex items-center text-xs sm:text-sm text-gray-500">
                          <p className="mr-2">{request.to?.user_type}</p>
                          <span className="flex items-center text-gray-400">
                            <Clock size={12} className="mr-1" />
                            {formatDate(request.createdAt)}
                          </span>
                        </div>
                      </div>
                      <div>
                        <button 
                          onClick={() => cancelRequest(request.requestId)}
                          className="p-1.5 sm:p-2 rounded-full bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
                          title="Cancel Request"
                        >
                          <UserX size={16} />
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default FriendRequests;