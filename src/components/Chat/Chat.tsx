import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useParams, useNavigate } from 'react-router-dom';
import { Send, Image, Paperclip, ArrowLeft, User } from 'lucide-react';
import axios from 'axios';
import { io, Socket } from 'socket.io-client';

interface Message {
  _id?: string;
  sender: string;
  content: string;
  timestamp: Date;
  mediaUrl?: string;
  mediaType?: 'image' | 'video';
}

interface ChatProps {
  chatId?: string;
}

const Chat: React.FC<ChatProps> = ({ chatId: propsChatId }) => {
  const { user } = useAuth();
  const { chatId: paramsChatId } = useParams<{ chatId: string }>();
  const navigate = useNavigate();
  const activeChatId = propsChatId || paramsChatId;
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [chatInfo, setChatInfo] = useState<any>(null);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUser, setTypingUser] = useState<string | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize Socket.io connection
  useEffect(() => {
    if (!user) return;
    
    // Connect to Socket.io server with improved configuration
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
    
    // Join user's personal room for notifications
    if (user.id) {
      newSocket.emit('join_chat', `user_${user.id}`);
    }
    
    // Handle connection events
    newSocket.on('connect', () => {
      console.log('Connected to chat server');
    });
    
    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setError('Failed to connect to chat server');
    });
    
    // Cleanup on unmount
    return () => {
      if (activeChatId) {
        newSocket.emit('leave_chat', activeChatId);
      }
      newSocket.disconnect();
      setSocket(null);
    };
  }, [user]);
  
  // Join chat room when chat ID changes
  useEffect(() => {
    if (!socket || !activeChatId || !user) return;
    
    console.log(`Joining chat room: ${activeChatId}`);
    // Join the chat room and user's personal room
    socket.emit('join_chat', activeChatId);
    socket.emit('join_chat', `user_${user.id}`);
    
    // Define event handlers
    const handleReceiveMessage = (data) => {
      console.log('Received message:', data);
      if (data.chatId === activeChatId && data.message.sender !== user.id) {
        // Get chat participant info from localStorage
        const participantInfo = localStorage.getItem(`chat_${activeChatId}_participant`);
        const participant = participantInfo ? JSON.parse(participantInfo) : null;
        
        setMessages(prev => {
          // Check if this message already exists in our messages array
          const messageExists = prev.some(msg => 
            (msg._id && data.message._id && msg._id === data.message._id) || 
            (msg.timestamp && data.message.timestamp && 
             msg.sender === data.message.sender && 
             msg.content === data.message.content && 
             new Date(msg.timestamp).getTime() === new Date(data.message.timestamp).getTime())
          );
          
          if (messageExists) {
            return prev;
          }
          
          // Ensure the message has the correct format
          const newMessage = { 
            ...data.message, 
            _id: data.message._id || `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            timestamp: data.message.timestamp || new Date()
          };
          
          console.log('Adding new message to state:', newMessage);
          return [...prev, newMessage];
        });
      }
    };
    
    const handleTyping = (data) => {
      if (data.chatId === activeChatId && data.userId !== user?.id) {
        setIsTyping(true);
        setTypingUser(data.userName);
      }
    };
    
    const handleStopTyping = (data) => {
      if (data.chatId === activeChatId && data.userId !== user?.id) {
        setIsTyping(false);
        setTypingUser(null);
      }
    };
    
    // Register event listeners
    socket.on('receive_message', handleReceiveMessage);
    socket.on('typing', handleTyping);
    socket.on('stop_typing', handleStopTyping);
    
    // Cleanup listeners when leaving the chat
    return () => {
      console.log(`Leaving chat room: ${activeChatId}`);
      socket.emit('leave_chat', activeChatId);
      socket.off('receive_message', handleReceiveMessage);
      socket.off('typing', handleTyping);
      socket.off('stop_typing', handleStopTyping);
    };
  }, [socket, activeChatId, user]);
  
  // Fetch chat messages
  useEffect(() => {
    if (!activeChatId || !user) return;
    
    const fetchMessages = async () => {
      try {
        setLoading(true);
        setError('');
        
        const token = localStorage.getItem('authToken');
        const response = await axios.get(`http://localhost:5001/api/chat/messages/${activeChatId}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        setMessages(response.data);
        
        // Also fetch chat info
        const chatResponse = await axios.get(`http://localhost:5001/api/chat/${activeChatId}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        setChatInfo(chatResponse.data);
      } catch (err: any) {
        console.error('Error fetching messages:', err);
        setError(err.response?.data?.message || 'Failed to load messages');
      } finally {
        setLoading(false);
      }
    };
    
    fetchMessages();
  }, [activeChatId, user]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if ((!newMessage.trim() && !mediaFile) || !activeChatId || !user) return;
    
    try {
      setError('');
      const token = localStorage.getItem('authToken');
      
      // If there's a media file, upload it first
      let mediaUrl = '';
      if (mediaFile) {
        setUploadingMedia(true);
        const formData = new FormData();
        formData.append('media', mediaFile);
        
        const uploadResponse = await axios.post('http://localhost:5001/api/chat/upload', formData, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        });
        
        mediaUrl = uploadResponse.data.mediaUrl;
      }
      
      // Send the message with or without media
      const messageData: any = {
        content: newMessage.trim(),
      };
      
      if (mediaUrl) {
        messageData.mediaUrl = mediaUrl;
        messageData.mediaType = mediaType;
      }
      
      const response = await axios.post(`http://localhost:5001/api/chat/${activeChatId}/messages`, messageData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      // Add the new message to the list with a guaranteed unique ID
      const newMessageData = {
        ...response.data,
        _id: response.data._id || `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      };
      
      setMessages(prev => [...prev, newMessageData]);
      
      // Emit the message via socket.io to broadcast to other users in the chat
      if (socket) {
        const messagePayload = {
          chatId: activeChatId,
          message: newMessageData
        };
        console.log('Emitting message via socket:', messagePayload);
        socket.emit('send_message', messagePayload, (acknowledgment) => {
          if (acknowledgment && !acknowledgment.success) {
            console.error('Failed to send message via socket:', acknowledgment.error);
            setError('Message may not be delivered to all recipients. Please try again.');
          } else {
            console.log('Message successfully sent via socket');
          }
        });
        
        // Stop typing indicator
        socket.emit('stop_typing', {
          chatId: activeChatId,
          userId: user.id,
          userName: `${user.first_name} ${user.last_name}`
        });
      }
      
      // Clear the input and media preview
      setNewMessage('');
      setMediaFile(null);
      setMediaPreview(null);
      setMediaType(null);
    } catch (err: any) {
      console.error('Error sending message:', err);
      setError(err.response?.data?.message || 'Failed to send message');
    } finally {
      setUploadingMedia(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    } else {
      // Send typing indicator
      if (socket && activeChatId && user) {
        // Clear any existing timeout
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
        
        // Emit typing event
        socket.emit('typing', {
          chatId: activeChatId,
          userId: user.id,
          userName: `${user.first_name} ${user.last_name}`
        });
        
        // Set timeout to stop typing indicator after 2 seconds
        typingTimeoutRef.current = setTimeout(() => {
          socket.emit('stop_typing', {
            chatId: activeChatId,
            userId: user.id,
            userName: `${user.first_name} ${user.last_name}`
          });
        }, 2000);
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Check file type
    if (file.type.startsWith('image/')) {
      setMediaType('image');
    } else if (file.type.startsWith('video/')) {
      setMediaType('video');
    } else {
      setError('Unsupported file type. Please upload an image or video.');
      return;
    }
    
    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('File size should be less than 10MB');
      return;
    }
    
    setMediaFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setMediaPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveMedia = () => {
    setMediaFile(null);
    setMediaPreview(null);
    setMediaType(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleAttachmentClick = () => {
    fileInputRef.current?.click();
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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
          onClick={() => navigate('/chats')} 
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          Back to Chats
        </button>
      </div>
    );
  }

  if (!activeChatId) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4">
        <p className="text-gray-500 mb-4">Select a chat to start messaging</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-white rounded-lg shadow-md overflow-hidden">
      {/* Chat header */}
      <div className="flex items-center p-2 sm:p-4 border-b border-gray-200 bg-gray-50">
        <button 
          onClick={() => navigate('/chats')} 
          className="mr-2 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex items-center">
          <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-gray-300 flex items-center justify-center mr-2 sm:mr-3">
            {chatInfo?.chatType === 'group' ? (
              <Users size={18} className="text-gray-600" />
            ) : (
              <User size={18} className="text-gray-600" />
            )}
          </div>
          <div>
            <h3 className="font-medium text-sm sm:text-base truncate max-w-[150px] sm:max-w-[200px] md:max-w-[300px]">
              {chatInfo?.chatType === 'group' 
                ? chatInfo?.groupName 
                : (() => {
                    // Try to get participant info from localStorage first
                    const participantInfo = localStorage.getItem(`chat_${activeChatId}_participant`);
                    if (participantInfo) {
                      const participant = JSON.parse(participantInfo);
                      return `${participant.first_name || ''} ${participant.last_name || ''}`.trim() || 'Chat';
                    }
                    // Fallback to chatInfo if localStorage data is not available
                    const otherParticipant = chatInfo?.participants?.find((p: any) => p._id !== user?.id);
                    return otherParticipant 
                      ? `${otherParticipant.first_name || ''} ${otherParticipant.last_name || ''}`.trim() || 'Chat'
                      : 'Chat';
                  })()
              }
            </h3>
            <p className="text-xs text-gray-500">
              {chatInfo?.chatType === 'group' 
                ? `${chatInfo?.participants?.length || 0} members` 
                : 'Private chat'}
            </p>
          </div>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-2 sm:p-4 space-y-2 sm:space-y-4">
        {messages.length === 0 ? (
          <div className="flex justify-center items-center h-full">
            <p className="text-gray-500 text-sm sm:text-base">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((message, index) => {
            const isCurrentUser = message.sender === user?.id;
            return (
              <div 
                key={message._id || index} 
                className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
              >
                <div 
                  className={`max-w-[75%] sm:max-w-[70%] rounded-lg p-2 sm:p-3 ${isCurrentUser ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-800'}`}
                >
                  {message.mediaUrl && message.mediaType === 'image' && (
                    <div className="mb-2">
                      <img 
                        src={`http://localhost:5001/${message.mediaUrl}`} 
                        alt="Shared image" 
                        className="rounded-lg max-w-full h-auto" 
                        loading="lazy"
                      />
                    </div>
                  )}
                  {message.mediaUrl && message.mediaType === 'video' && (
                    <div className="mb-2">
                      <video 
                        src={`http://localhost:5001/${message.mediaUrl}`} 
                        controls 
                        className="rounded-lg max-w-full h-auto" 
                      />
                    </div>
                  )}
                  {message.content && <p className="text-sm sm:text-base break-words">{message.content}</p>}
                  <p className={`text-xs mt-1 ${isCurrentUser ? 'text-blue-100' : 'text-gray-500'}`}>
                    {formatTime(message.timestamp)}
                  </p>
                </div>
              </div>
            );
          })
        )}
        {isTyping && (
        <div className="flex items-center p-2 text-sm text-gray-500 italic">
          <div className="flex space-x-1 mr-2">
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
          {typingUser ? `${typingUser} is typing...` : 'Someone is typing...'}
        </div>
      )}
      <div ref={messagesEndRef} />
      </div>

      {/* Media preview */}
      {mediaPreview && (
        <div className="p-2 border-t border-gray-200">
          <div className="relative inline-block">
            {mediaType === 'image' ? (
              <img 
                src={mediaPreview} 
                alt="Upload preview" 
                className="h-16 sm:h-20 w-auto rounded-lg" 
              />
            ) : (
              <video 
                src={mediaPreview} 
                className="h-16 sm:h-20 w-auto rounded-lg" 
              />
            )}
            <button 
              onClick={handleRemoveMedia}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Message input */}
      <div className="p-2 sm:p-3 border-t border-gray-200">
        <div className="flex items-center space-x-1 sm:space-x-2">
          <button 
            onClick={handleAttachmentClick}
            className="p-1 sm:p-2 text-gray-500 hover:text-gray-700 focus:outline-none"
            disabled={uploadingMedia}
          >
            <Paperclip size={18} />
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileSelect} 
              className="hidden" 
              accept="image/*,video/*" 
              disabled={uploadingMedia}
            />
          </button>
          <div className="flex-1 relative">
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Type a message..."
              className="w-full border border-gray-300 rounded-full py-1 sm:py-2 px-3 sm:px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none overflow-hidden text-sm sm:text-base"
              rows={1}
              disabled={uploadingMedia}
            />
          </div>
          <button 
            onClick={handleSendMessage} 
            className={`p-1 sm:p-2 rounded-full ${(!newMessage.trim() && !mediaFile) || uploadingMedia ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-blue-500 text-white hover:bg-blue-600'}`}
            disabled={(!newMessage.trim() && !mediaFile) || uploadingMedia}
          >
            {uploadingMedia ? (
              <div className="h-4 w-4 sm:h-5 sm:w-5 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
            ) : (
              <Send size={18} />
            )}
          </button>
        </div>
        {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
      </div>
    </div>
  );
};

export default Chat;