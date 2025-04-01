import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { User, Check, X, ArrowLeft, Clock } from 'lucide-react';
import { io, Socket } from 'socket.io-client';
import { authGet, authPost, handleApiError } from '../../lib/authUtils';

// Get the unique tab ID or create one if it doesn't exist
const getTabId = () => {
  let tabId = sessionStorage.getItem('tabId');
  if (!tabId) {
    tabId = Math.random().toString(36).substring(2, 15);
    sessionStorage.setItem('tabId', tabId);
  }
  return tabId;
};

interface ConsultationRequest {
  _id: string;
  consultationId: string;
  sender: {
    _id: string;
    first_name: string;
    last_name: string;
    type: string;
  };
  topic: string;
  startTime: string;
  endTime: string;
  status: string;
}

const ConsultationRequests: React.FC = () => {
  // Enable React Router v7 future flags
  window.history.scrollRestoration = 'manual';
  const startTransition = React.startTransition;
  const relativeSplatPath = true;
  const { user } = useAuth();
  const navigate = useNavigate();
  const [requests, setRequests] = useState<ConsultationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [socket, setSocket] = useState<Socket | null>(null);
  const socketInitialized = useRef(false);

  // Initialize Socket.io connection
  useEffect(() => {
    if (!user || socketInitialized.current) return;
    
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
    
    if (user.id) {
      newSocket.emit('join_chat', `user_${user.id}`);
    }
    
    return () => {
      newSocket.disconnect();
      setSocket(null);
      socketInitialized.current = false;
    };
  }, [user]);

  // Listen for consultation request notifications
  useEffect(() => {
    if (!socket) return;
    
    const handleNewConsultationRequest = (data: ConsultationRequest) => {
      console.log('Received new consultation request:', data);
      setRequests(prev => [...prev, data]);
    };
    
    socket.on('consultation_request', handleNewConsultationRequest);
    
    return () => {
      socket.off('consultation_request', handleNewConsultationRequest);
    };
  }, [socket]);

  useEffect(() => {
    if (!user) {
      navigate('/signin');
      return;
    }

    fetchConsultationRequests();
  }, [user, navigate]);

  const fetchConsultationRequests = async () => {
    try {
      setLoading(true);
      setError('');
      
      const data = await authGet('consultation/consultations');
      const pendingRequests = data.filter((consultation: any) => 
        consultation.status === 'pending'
      );
      setRequests(pendingRequests);
    } catch (err: any) {
      console.error('Error fetching consultation requests:', handleApiError(err));
      setError('Failed to load consultation requests');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (consultationId: string, status: 'confirmed' | 'cancelled') => {
    try {
      await authPost(`consultation/consultations/${consultationId}/status`, { status });
      
      // Update the requests list
      setRequests(prev => prev.filter(req => req.consultationId !== consultationId));
      
      // Show success message
      alert(`Consultation request ${status}!`);
    } catch (err: any) {
      console.error(`Error ${status} consultation request:`, handleApiError(err));
      alert(`Failed to ${status} consultation request`);
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (!user || user.user_type !== 'expert') {
    return null;
  }

  return (
    <div className="flex flex-col h-screen bg-white rounded-lg shadow-md overflow-hidden">
      {/* Header */}
      <div className="flex items-center p-3 sm:p-4 border-b border-gray-200 bg-gray-50">
        <button 
          onClick={() => navigate(-1)} 
          className="mr-2 sm:mr-3 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft size={18} />
        </button>
        <h2 className="text-lg sm:text-xl font-semibold">Consultation Requests</h2>
      </div>

      {/* Requests List */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4">
        {error && (
          <div className="text-red-500 mb-3 sm:mb-4 text-sm">{error}</div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Clock className="animate-spin h-6 w-6 text-blue-500" />
            <span className="ml-2 text-gray-600">Loading requests...</span>
          </div>
        ) : requests.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No pending consultation requests
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map((request) => (
              <div key={request._id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900">{request.topic}</h3>
                    <p className="text-sm text-gray-600">
                      From: {request.sender.first_name} {request.sender.last_name} ({request.sender.type})
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleStatusUpdate(request.consultationId, 'confirmed')}
                      className="p-2 text-green-600 hover:bg-green-50 rounded-full transition-colors"
                      title="Accept"
                    >
                      <Check size={20} />
                    </button>
                    <button
                      onClick={() => handleStatusUpdate(request.consultationId, 'cancelled')}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors"
                      title="Reject"
                    >
                      <X size={20} />
                    </button>
                  </div>
                </div>
                <div className="text-sm text-gray-600">
                  <p>Start: {formatDateTime(request.startTime)}</p>
                  <p>End: {formatDateTime(request.endTime)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ConsultationRequests;