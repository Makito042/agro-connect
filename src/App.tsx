import React, { useState } from 'react';
import { 
  Sprout,
  User,
  LogOut,
  MessageSquare,
  Users,
  Layout,
  UserPlus,
  UserCheck,
  Search
} from 'lucide-react';
import { BrowserRouter, Link, Routes, Route, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Home from './components/Home';
import Features from './components/Features';
import Forum from './components/Forum';
import SignIn from './components/Auth/SignIn';
import Register from './components/Auth/Register';
import Profile from './components/Auth/Profile';
import ChatList from './components/Chat/ChatList';
import Chat from './components/Chat/Chat';
import NewChat from './components/Chat/NewChat';
import MessageRequests from './components/Chat/MessageRequests';
import FriendList from './components/Friends/FriendList';
import FriendRequests from './components/Friends/FriendRequests';
import FindFriends from './components/Friends/FindFriends';
import UserProfile from './components/Friends/UserProfile';

function App() {
  const Navigation = () => {
    const { user, signOut } = useAuth();
    const navigate = useNavigate();
    const [isProfileOpen, setIsProfileOpen] = useState(false);

    return (
      <nav className="bg-[#2c3e50] text-white py-4">
        <div className="container mx-auto px-4">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <Sprout className="w-8 h-8 text-[#3498db]" />
              <span className="text-2xl font-bold">Agro-Connected</span>
            </Link>
            <div className="ml-auto flex items-center space-x-6">
              <Link to="/" className="hover:text-[#3498db] transition-colors">Home</Link>
              <Link to="/features" className="hover:text-[#3498db] transition-colors">Features</Link>
              <Link to="/forum" className="hover:text-[#3498db] transition-colors">Forum</Link>
              {!user ? (
                <>
                  <Link to="/signin" className="hover:text-[#3498db] transition-colors">Sign In</Link>
                  <Link to="/register" className="bg-[#3498db] text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors">Register</Link>
                </>
              ) : (
                <div className="relative">
                  <button
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className="flex items-center space-x-2 hover:text-[#3498db] transition-colors focus:outline-none"
                  >
                    <User className="w-6 h-6" />
                    <span>{user.first_name || 'Profile'}</span>
                  </button>

                  {isProfileOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                      <Link
                        to="/profile"
                        className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100"
                        onClick={() => setIsProfileOpen(false)}
                      >
                        <User className="w-4 h-4 mr-2" />
                        Profile
                      </Link>
                      <Link
                        to="/chats"
                        className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100"
                        onClick={() => setIsProfileOpen(false)}
                      >
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Chats
                      </Link>
                      <Link
                        to="/friends"
                        className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100"
                        onClick={() => setIsProfileOpen(false)}
                      >
                        <UserPlus className="w-4 h-4 mr-2" />
                        Friends
                      </Link>
                      <Link
                        to="/friend-requests"
                        className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100"
                        onClick={() => setIsProfileOpen(false)}
                      >
                        <UserCheck className="w-4 h-4 mr-2" />
                        Friend Requests
                      </Link>
                      <Link
                        to="/channels"
                        className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100"
                        onClick={() => setIsProfileOpen(false)}
                      >
                        <Layout className="w-4 h-4 mr-2" />
                        Channels
                      </Link>
                      <Link
                        to="/groups"
                        className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100"
                        onClick={() => setIsProfileOpen(false)}
                      >
                        <Users className="w-4 h-4 mr-2" />
                        Groups
                      </Link>
                      <button
                        onClick={() => {
                          signOut();
                          setIsProfileOpen(false);
                          navigate('/signin');
                        }}
                        className="flex items-center w-full px-4 py-2 text-gray-700 hover:bg-gray-100"
                      >
                        <LogOut className="w-4 h-4 mr-2" />
                        Log out
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>
    );
  };

  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-[#ecf0f1]">
          <Navigation />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/features" element={<Features />} />
            <Route path="/forum" element={<Forum />} />
            <Route path="/signin" element={<SignIn />} />
            <Route path="/register" element={<Register />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/chats" element={<ChatList />} />
            <Route path="/chat/:chatId" element={<Chat />} />
            <Route path="/new-chat" element={<NewChat />} />
            <Route path="/message-requests" element={<MessageRequests />} />
            <Route path="/friends" element={<FriendList />} />
            <Route path="/friend-requests" element={<FriendRequests />} />
            <Route path="/find-friends" element={<FindFriends />} />
            <Route path="/user-profile/:userId" element={<UserProfile />} />
          </Routes>

          {/* Footer */}
          <footer id="contact" className="bg-[#2c3e50] text-white py-8">
            <div className="container mx-auto px-4">
              <div className="flex flex-col md:flex-row justify-between items-center">
                <div className="flex items-center space-x-2 mb-4 md:mb-0">
                  <Sprout className="w-6 h-6 text-[#3498db]" />
                  <span className="font-bold">Agro-Connected</span>
                </div>
                <div className="text-gray-400 mb-4 md:mb-0">
                  © 2024 Agro-Connected. All rights reserved.
                </div>
                <div className="flex gap-6">
                  <a href="#" className="text-gray-400 hover:text-white transition-colors">Terms of Service</a>
                  <a href="#" className="text-gray-400 hover:text-white transition-colors">Privacy Policy</a>
                </div>
              </div>
            </div>
          </footer>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;