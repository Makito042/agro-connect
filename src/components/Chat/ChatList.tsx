import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { MessageSquare, User, Users, Plus } from 'lucide-react';
import axios from 'axios';
import { io, Socket } from 'socket.io-client';

// Get the unique tab ID or create one if it doesn't exist
const getTabId = () => {
  let tabId = sessionStorage.getItem('tabId');
  if (!tabId) {
    tabId = Math.random().toString(36).substring(2, 15);
    sessionStorage.setItem('tabId', tabId);
  }
  return tabId;
};

interface Chat {
  _id: string;
  participants: Array<{
    _id: string;
    first_name: string;
    last_name: string;
    profile_picture?: string;
  }>;
  lastMessage?: {
    content: string;
    timestamp: Date;
    sender: string;
  };
  chatType: 'private' | 'group';
  groupName?: string;
  createdAt: Date;
}

const ChatList: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [chats, setChats] = useState<Chat[]>([]);
  const [messageRequests, setMessageRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/signin');
      return;
    }

    // Initialize Socket.io connection with improved configuration
    const newSocket = io('http://localhost:5001', {
      withCredentials: true,
      transports: ['polling', 'websocket'], // Prioritize polling first for better compatibility
      reconnection: true,
      reconnectionAttempts: 10, // Increase reconnection attempts
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000, // Cap the reconnection delay
      timeout: 20000, // Increase connection timeout
      autoConnect: true,
      path: '/socket.io/', // Explicitly set the path to match server
    });
    
    setSocket(newSocket);
    
    // Socket connection event handlers
    newSocket.on('connect', () => {
      console.log('Connected to chat server');
      setConnected(true);
      // Join user's personal room for notifications
      if (user.id) {
        newSocket.emit('join_chat', `user_${user.id}`);
      }
    });
    
    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setConnected(false);
      setError('Unable to connect to chat server. Please try again later.');
    });
    
    newSocket.on('disconnect', (reason) => {
      console.log('Disconnected from chat server:', reason);
      setConnected(false);
      if (reason === 'io server disconnect') {
        // the disconnection was initiated by the server, reconnect manually
        newSocket.connect();
      }
    })
    
    // Listen for new messages
    newSocket.on('receive_message', (data) => {
      // Update the chat list when a new message is received
      setChats(prevChats => {
        // Find the chat that received the message
        const updatedChats = [...prevChats];
        const chatIndex = updatedChats.findIndex(chat => chat._id === data.chatId);
        
        if (chatIndex !== -1) {
          // Update the last message for this chat
          updatedChats[chatIndex] = {
            ...updatedChats[chatIndex],
            lastMessage: {
              content: data.message.content,
              timestamp: data.message.timestamp,
              sender: data.message.sender?._id || data.message.sender
            }
          };
          
          // Move this chat to the top of the list
          const updatedChat = updatedChats.splice(chatIndex, 1)[0];
          updatedChats.unshift(updatedChat);
        } else {
          // If the chat is not in the list, fetch the updated chat list
          const fetchChats = async () => {
            try {
              const token = sessionStorage.getItem('authToken');
              const response = await axios.get('http://localhost:5001/api/chat', {
                headers: {
                  Authorization: `Bearer ${token}`,
                  'X-Tab-ID': getTabId()
                }
              });
              setChats(response.data);
            } catch (err) {
              console.error('Error refreshing chats:', err);
            }
          };
          
          fetchChats();
        }
        
        return updatedChats;
      });
    });
    
    // Listen for chat list updates
    newSocket.on('update_chat_list', () => {
      // Refresh the chat list when this event is received
      const fetchChats = async () => {
        try {
          const token = sessionStorage.getItem('authToken');
          const response = await axios.get('http://localhost:5001/api/chat', {
            headers: {
              Authorization: `Bearer ${token}`
            }
          });
          setChats(response.data);
        } catch (err) {
          console.error('Error refreshing chats:', err);
        }
      };
      
      fetchChats();
    });
    
    // Cleanup on unmount
    return () => {
      newSocket.disconnect();
      setSocket(null);
    };
  }, [user, navigate]);

  useEffect(() => {
    if (!user) {
      navigate('/signin');
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        setError('');
        
        const token = sessionStorage.getItem('authToken');
        
        // Fetch chats
        const chatsResponse = await axios.get('http://localhost:5001/api/chat', {
          headers: {
            Authorization: `Bearer ${token}`,
            'X-Tab-ID': getTabId()
          }
        });
        
        setChats(chatsResponse.data);
        
        // Fetch message requests
        try {
          const requestsResponse = await axios.get('http://localhost:5001/api/users/message-requests', {
            headers: {
              Authorization: `Bearer ${token}`
            }
          });
          
          setMessageRequests(requestsResponse.data);
        } catch (requestErr) {
          console.error('Error fetching message requests:', requestErr);
          // Don't set the main error state for this, just log it
        }
      } catch (err: any) {
        console.error('Error fetching chats:', err);
        setError(err.response?.data?.message || 'Failed to load chats');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [user, navigate]);

  const formatTime = (date: Date) => {
    const messageDate = new Date(date);
    const today = new Date();
    
    // If message is from today, show time
    if (messageDate.toDateString() === today.toDateString()) {
      return messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    // If message is from this week, show day name
    const diffDays = Math.floor((today.getTime() - messageDate.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays < 7) {
      return messageDate.toLocaleDateString([], { weekday: 'short' });
    }
    
    // Otherwise show date
    return messageDate.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const getChatName = (chat: Chat) => {
    if (chat.chatType === 'group') {
      return chat.groupName;
    }
    
    // For private chats, show the other participant's name
    const otherParticipant = chat.participants.find(p => p._id !== user?.id);
    return otherParticipant ? `${otherParticipant.first_name} ${otherParticipant.last_name}` : 'Chat';
  };

  const getLastMessagePreview = (chat: Chat) => {
    if (!chat.lastMessage) return 'No messages yet';
    
    // Handle both string sender ID and object sender with _id property
    const senderId = typeof chat.lastMessage.sender === 'string' 
      ? chat.lastMessage.sender 
      : (chat.lastMessage.sender as any)?._id;
    
    const isCurrentUser = senderId === user?.id;
    const prefix = isCurrentUser ? 'You: ' : '';
    
    // Truncate message if too long
    const content = chat.lastMessage.content;
    return content.length > 30 ? `${prefix}${content.substring(0, 30)}...` : `${prefix}${content}`;
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
      <div className="flex items-center justify-between p-3 sm:p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center">
          <h2 className="text-lg sm:text-xl font-semibold">Chats</h2>
          {connected && (
            <span className="ml-2 inline-block w-2 h-2 rounded-full bg-green-500" title="Connected"></span>
          )}
          {!connected && !loading && (
            <span className="ml-2 inline-block w-2 h-2 rounded-full bg-red-500" title="Disconnected"></span>
          )}
        </div>
        <div className="flex space-x-2">
          {messageRequests.length > 0 && (
            <button 
              className="p-1.5 sm:p-2 rounded-full bg-yellow-500 text-white hover:bg-yellow-600 transition-colors relative"
              onClick={() => navigate('/message-requests')}
            >
              <MessageSquare size={18} />
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                {messageRequests.length}
              </span>
            </button>
          )}
          <button 
            className="p-1.5 sm:p-2 rounded-full bg-blue-500 text-white hover:bg-blue-600 transition-colors"
            onClick={() => navigate('/new-chat')}
          >
            <Plus size={18} />
          </button>
        </div>
      </div>

      {/* Chat list */}
      <div className="flex-1 overflow-y-auto">
        {chats.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-4 text-center">
            <MessageSquare className="w-12 sm:w-16 h-12 sm:h-16 text-gray-300 mb-3 sm:mb-4" />
            <p className="text-gray-500 mb-3 sm:mb-4 text-sm sm:text-base">No chats yet</p>
            <button 
              onClick={() => navigate('/new-chat')} 
              className="px-3 py-1.5 sm:px-4 sm:py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm sm:text-base"
            >
              Start a New Chat
            </button>
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {chats.map((chat) => (
              <li key={chat._id}>
                <Link 
                  to={`/chat/${chat._id}`} 
                  className="flex items-center p-3 sm:p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-gray-300 flex items-center justify-center mr-3 sm:mr-4">
                    {chat.chatType === 'group' ? (
                      <Users className="text-gray-600" size={18} />
                    ) : (
                      <User className="text-gray-600" size={18} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline">
                      <h3 className="text-sm sm:text-base font-medium text-gray-900 truncate max-w-[120px] sm:max-w-[200px] md:max-w-[300px]">
                        {getChatName(chat)}
                      </h3>
                      {chat.lastMessage && (
                        <span className="text-xs text-gray-500">
                          {formatTime(chat.lastMessage.timestamp)}
                        </span>
                      )}
                    </div>
                    <p className="text-xs sm:text-sm text-gray-500 truncate">
                      {getLastMessagePreview(chat)}
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default ChatList;