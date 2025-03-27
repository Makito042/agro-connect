import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Check, X } from 'lucide-react';
import axios from 'axios';

interface MessageRequest {
  _id: string;
  chatId: string;
  from: {
    _id: string;
    first_name: string;
    last_name: string;
    email: string;
    profile_picture?: string;
    user_type: string;
  };
  status: string;
  createdAt: Date;
}

const MessageRequests: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [requests, setRequests] = useState<MessageRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) {
      navigate('/signin');
      return;
    }

    const fetchMessageRequests = async () => {
      try {
        setLoading(true);
        setError('');
        
        const token = localStorage.getItem('authToken');
        const response = await axios.get('http://localhost:5001/api/users/message-requests', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        setRequests(response.data);
      } catch (err: any) {
        console.error('Error fetching message requests:', err);
        setError(err.response?.data?.message || 'Failed to load message requests');
      } finally {
        setLoading(false);
      }
    };
    
    fetchMessageRequests();
  }, [user, navigate]);

  const handleAccept = async (requestId: string, chatId: string) => {
    try {
      setLoading(true);
      
      const token = localStorage.getItem('authToken');
      await axios.post(`http://localhost:5001/api/users/message-requests/${requestId}/accept`, {}, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      // Remove the request from the list
      setRequests(prev => prev.filter(req => req._id !== requestId));
      
      // Navigate to the chat
      navigate(`/chat/${chatId}`);
    } catch (err: any) {
      console.error('Error accepting message request:', err);
      setError(err.response?.data?.message || 'Failed to accept message request');
      setLoading(false);
    }
  };

  const handleReject = async (requestId: string) => {
    try {
      setLoading(true);
      
      const token = localStorage.getItem('authToken');
      await axios.post(`http://localhost:5001/api/users/message-requests/${requestId}/reject`, {}, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      // Remove the request from the list
      setRequests(prev => prev.filter(req => req._id !== requestId));
      setLoading(false);
    } catch (err: any) {
      console.error('Error rejecting message request:', err);
      setError(err.response?.data?.message || 'Failed to reject message request');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4">
        <p className="text-red-500 mb-4">{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-white rounded-lg shadow-md overflow-hidden">
      {/* Header */}
      <div className="flex items-center p-3 sm:p-4 border-b border-gray-200 bg-gray-50">
        <button 
          onClick={() => navigate('/chats')} 
          className="mr-2 sm:mr-3 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft size={18} />
        </button>
        <h2 className="text-lg sm:text-xl font-semibold">Message Requests</h2>
      </div>

      {/* Request list */}
      <div className="flex-1 overflow-y-auto">
        {requests.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-4 text-center">
            <p className="text-gray-500 mb-3 sm:mb-4 text-sm sm:text-base">No message requests</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {requests.map((request) => (
              <li key={request._id} className="p-3 sm:p-4">
                <div className="flex items-center">
                  <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-gray-300 flex items-center justify-center mr-3 sm:mr-4">
                    {request.from.profile_picture ? (
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
                    <h3 className="font-medium text-sm sm:text-base">
                      {request.from.first_name} {request.from.last_name}
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-500">
                      Wants to send you a message
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(request.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <button 
                      onClick={() => handleAccept(request._id, request.chatId)}
                      className="p-1.5 sm:p-2 rounded-full bg-green-500 text-white hover:bg-green-600 transition-colors"
                      title="Accept"
                    >
                      <Check size={16} />
                    </button>
                    <button 
                      onClick={() => handleReject(request._id)}
                      className="p-1.5 sm:p-2 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors"
                      title="Reject"
                    >
                      <X size={16} />
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

export default MessageRequests;