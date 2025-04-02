import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { User, Building2, Github, Twitter, Linkedin, ArrowLeft, MessageSquare } from 'lucide-react';
import axios from 'axios';

interface UserProfileData {
  _id: string;
  user_type: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  organization_name?: string;
  organization_type?: string;
  institution_name?: string;
  field_of_study?: string;
  expertise_area?: string;
  years_of_experience?: string;
  qualification?: string;
  farm_size?: string;
  farming_type?: string;
  github_url?: string;
  twitter_url?: string;
  linkedin_url?: string;
  bio?: string;
  registration_number?: string;
  profile_picture?: string;
}

const UserProfile: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState<UserProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [profileImage, setProfileImage] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      navigate('/friends');
      return;
    }

    fetchUserProfile(userId);
  }, [userId, navigate]);

  const fetchUserProfile = async (id: string) => {
    try {
      setLoading(true);
      setError('');
      
      const token = sessionStorage.getItem('authToken');
      const response = await axios.get(`http://localhost:5001/api/users/${id}/profile`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      setProfileData(response.data);
      
      // Set profile picture URL if available
      if (response.data.profile_picture) {
        const profilePicUrl = `http://localhost:5001/uploads/profile-pictures/${response.data.profile_picture}`;
        setProfileImage(profilePicUrl);
      }
    } catch (err: any) {
      console.error('Error fetching user profile:', err);
      setError(err.response?.data?.message || 'Failed to load user profile');
    } finally {
      setLoading(false);
    }
  };

  const startChat = async () => {
    if (!profileData) return;
    
    try {
      const token = sessionStorage.getItem('authToken');
      const response = await axios.post('http://localhost:5001/api/chat/private', 
        { participantId: profileData._id },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      // Store participant info in localStorage before navigating
      localStorage.setItem(`chat_${response.data._id}_participant`, JSON.stringify({
        _id: profileData._id,
        first_name: profileData.first_name,
        last_name: profileData.last_name,
        profile_picture: profileData.profile_picture
      }));
      
      // Navigate to the chat
      navigate(`/chat/${response.data._id}`);
    } catch (err: any) {
      console.error('Error creating chat:', err);
      alert(err.response?.data?.message || 'Failed to create chat');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !profileData) {
    return (
      <div className="flex flex-col items-center justify-center h-screen p-4">
        <div className="text-red-500 mb-4">{error || 'User profile not found'}</div>
        <button
          onClick={() => navigate('/friends')}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          Back to Friends
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header with back button */}
        <div className="mb-6 flex items-center">
          <button 
            onClick={() => navigate(-1)} 
            className="mr-3 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-semibold">User Profile</h1>
        </div>

        {/* Profile Header */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-6">
            <div className="relative">
              <div className="h-32 w-32 rounded-full overflow-hidden bg-gray-100">
                {profileImage ? (
                  <img
                    src={profileImage}
                    alt="Profile"
                    className="h-full w-full object-cover"
                    crossOrigin="anonymous"
                    onError={(e) => {
                      console.error('Error loading profile image');
                      e.currentTarget.src = '';
                      setProfileImage(null);
                    }}
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center">
                    <User className="h-16 w-16 text-gray-400" />
                  </div>
                )}
              </div>
            </div>
            <div className="text-center sm:text-left flex-1">
              <h1 className="text-2xl font-bold text-gray-900">
                {profileData.user_type === 'organization'
                  ? profileData.organization_name
                  : `${profileData.first_name} ${profileData.last_name}`}
              </h1>
              <p className="text-sm text-gray-500 capitalize">{profileData.user_type}</p>
              
              {/* Message button */}
              <button
                onClick={startChat}
                className="mt-3 inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
              >
                <MessageSquare size={16} className="mr-2" />
                Message
              </button>
            </div>
          </div>
        </div>

        {/* Profile Information */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Profile Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {profileData.user_type !== 'organization' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700">First Name</label>
                  <p className="mt-1 text-gray-900">{profileData.first_name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Last Name</label>
                  <p className="mt-1 text-gray-900">{profileData.last_name}</p>
                </div>
              </>
            )}

            {/* Organization specific fields */}
            {profileData.user_type === 'organization' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Organization Name</label>
                  <p className="mt-1 text-gray-900">{profileData.organization_name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Organization Type</label>
                  <p className="mt-1 text-gray-900">{profileData.organization_type}</p>
                </div>
              </>
            )}

            {/* Researcher specific fields */}
            {profileData.user_type === 'researcher' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Institution</label>
                  <p className="mt-1 text-gray-900">{profileData.institution_name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Field of Study</label>
                  <p className="mt-1 text-gray-900">{profileData.field_of_study}</p>
                </div>
              </>
            )}

            {/* Farmer specific fields */}
            {profileData.user_type === 'farmer' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Farm Size</label>
                  <p className="mt-1 text-gray-900">{profileData.farm_size}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Farming Type</label>
                  <p className="mt-1 text-gray-900">{profileData.farming_type}</p>
                </div>
              </>
            )}

            {/* Common fields that might be relevant */}
            {profileData.expertise_area && (
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Expertise Area</label>
                <p className="mt-1 text-gray-900">{profileData.expertise_area}</p>
              </div>
            )}

            {profileData.years_of_experience && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Years of Experience</label>
                <p className="mt-1 text-gray-900">{profileData.years_of_experience}</p>
              </div>
            )}

            {profileData.qualification && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Qualification</label>
                <p className="mt-1 text-gray-900">{profileData.qualification}</p>
              </div>
            )}
          </div>
        </div>

        {/* Bio Section */}
        {profileData.bio && (
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Bio</h2>
            <p className="text-gray-700 whitespace-pre-line">{profileData.bio}</p>
          </div>
        )}

        {/* Social Links */}
        {(profileData.github_url || profileData.twitter_url || profileData.linkedin_url) && (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Social Links</h2>
            <div className="flex flex-wrap gap-4">
              {profileData.github_url && (
                <a 
                  href={profileData.github_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center text-gray-700 hover:text-blue-600"
                >
                  <Github className="h-5 w-5 mr-2" />
                  GitHub
                </a>
              )}
              {profileData.twitter_url && (
                <a 
                  href={profileData.twitter_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center text-gray-700 hover:text-blue-600"
                >
                  <Twitter className="h-5 w-5 mr-2" />
                  Twitter
                </a>
              )}
              {profileData.linkedin_url && (
                <a 
                  href={profileData.linkedin_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center text-gray-700 hover:text-blue-600"
                >
                  <Linkedin className="h-5 w-5 mr-2" />
                  LinkedIn
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserProfile;