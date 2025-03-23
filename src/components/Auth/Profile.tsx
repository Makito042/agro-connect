import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Building2, Github, Twitter, Linkedin, Camera, User } from 'lucide-react';
import { uploadProfilePicture } from '../../lib/api';

interface ProfileData {
  user_type: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  organization_name: string;
  organization_type: string;
  institution_name: string;
  field_of_study: string;
  expertise_area: string;
  years_of_experience: string;
  qualification: string;
  farm_size: string;
  farming_type: string;
  github_url: string;
  twitter_url: string;
  linkedin_url: string;
  bio: string;
  registration_number: string;
  profile_picture?: string;
}

export default function Profile() {
  const { user, signIn } = useAuth();
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [uploadError, setUploadError] = useState<string>('');

  useEffect(() => {
    if (user) {
      console.log('User data:', user); // Debug log
      const userData = {
        user_type: user.user_type || 'farmer',
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        phone: user.phone || '',
        organization_name: user.organization_name || '',
        organization_type: user.organization_type || '',
        institution_name: user.institution_name || '',
        field_of_study: user.field_of_study || '',
        expertise_area: user.expertise_area || '',
        years_of_experience: user.years_of_experience || '',
        qualification: user.qualification || '',
        farm_size: user.farm_size || '',
        farming_type: user.farming_type || '',
        github_url: user.github_url || '',
        twitter_url: user.twitter_url || '',
        linkedin_url: user.linkedin_url || '',
        bio: user.bio || '',
        registration_number: user.registration_number || '',
        profile_picture: user.profile_picture || null
      };
      setProfileData(userData);
      
      // Set profile picture URL directly
      if (user.profile_picture) {
        // Fix the URL path to avoid double path issue
        const profilePicUrl = `${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/uploads/profile-pictures/${user.profile_picture.replace('uploads/profile-pictures/', '')}`;
        setProfileImage(profilePicUrl);
        console.log('Setting profile image URL:', profilePicUrl); // Debug log
        // No need for additional fetch validation as it can cause issues
        // The image's onError handler will catch any loading problems
      }
    }
  }, [user]);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setUploadError('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Image size should be less than 5MB');
      return;
    }

    try {
      setUploadStatus('loading');
      setUploadError('');

      // Prepare form data
      const formData = new FormData();
      formData.append('profile_picture', file);

      // Upload to server using the API function
      const response = await uploadProfilePicture(formData);
      
      if (response.data?.data?.profile_picture) {
        // Ensure we're not duplicating the path
        const filename = response.data.data.profile_picture.replace('uploads/profile-pictures/', '');
        const profilePicUrl = `${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/uploads/profile-pictures/${filename}`;
        setProfileImage(profilePicUrl);
        console.log('Profile picture uploaded, URL:', profilePicUrl); // Debug log
        setUploadStatus('success');
        
        // Update the user data in localStorage and context
        const storedUser = localStorage.getItem('user');
        if (storedUser && user) {
          const updatedUser = { ...JSON.parse(storedUser), profile_picture: filename };
          localStorage.setItem('user', JSON.stringify(updatedUser));
          // We should not call signIn here as it requires password
          // Instead, just update the local state
        }
      } else {
        throw new Error('Profile picture URL not received');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      setUploadError('Failed to upload image. Please try again.');
      setUploadStatus('error');
    }
  };

  if (!profileData) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Profile Header */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <div className="flex items-center space-x-6">
            <div className="relative">
              <div className="h-32 w-32 rounded-full overflow-hidden bg-gray-100">
                {profileImage ? (
                  <img
                    src={profileImage}
                    alt="Profile"
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      console.error('Error loading profile image', e);
                      // Log the attempted URL for debugging
                      console.log('Failed image URL:', e.currentTarget.src);
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
              <label
                htmlFor="profile-picture-input"
                className={`absolute bottom-0 right-0 bg-white rounded-full p-2 shadow-lg cursor-pointer hover:bg-gray-50 ${uploadStatus === 'loading' ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <Camera className={`h-5 w-5 ${uploadStatus === 'loading' ? 'animate-pulse text-blue-600' : 'text-gray-600'}`} />
                <input
                  type="file"
                  id="profile-picture-input"
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={uploadStatus === 'loading'}
                  style={{ display: 'none' }}
                />
              </label>
              {uploadError && (
                <div className="absolute -bottom-8 left-0 right-0 text-center text-sm text-red-600">
                  {uploadError}
                </div>
              )}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {profileData.user_type === 'organization'
                  ? profileData.organization_name
                  : `${profileData.first_name} ${profileData.last_name}`}
              </h1>
              <p className="text-sm text-gray-500 capitalize">{profileData.user_type}</p>
            </div>
          </div>
        </div>

        {/* Profile Information */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Personal Information</h2>
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
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <p className="mt-1 text-gray-900">{profileData.email}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Phone</label>
              <p className="mt-1 text-gray-900">{profileData.phone}</p>
            </div>
          </div>
        </div>

        {/* Professional Information */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Professional Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {profileData.user_type === 'organization' ? (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Organization Type</label>
                  <p className="mt-1 text-gray-900 capitalize">{profileData.organization_type}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Registration Number</label>
                  <p className="mt-1 text-gray-900">{profileData.registration_number}</p>
                </div>
              </>
            ) : profileData.user_type === 'student' ? (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Institution Name</label>
                  <p className="mt-1 text-gray-900">{profileData.institution_name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Field of Study</label>
                  <p className="mt-1 text-gray-900">{profileData.field_of_study}</p>
                </div>
              </>
            ) : profileData.user_type === 'expert' ? (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Expertise Area</label>
                  <p className="mt-1 text-gray-900">{profileData.expertise_area}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Years of Experience</label>
                  <p className="mt-1 text-gray-900">{profileData.years_of_experience}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Qualification</label>
                  <p className="mt-1 text-gray-900">{profileData.qualification}</p>
                </div>
              </>
            ) : (
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
          </div>
        </div>

        {/* Social Media Links */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Social Media</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
                <Github className="w-4 h-4" /> GitHub
              </label>
              <p className="mt-1 text-gray-900">{profileData.github_url || 'Not provided'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
                <Twitter className="w-4 h-4" /> Twitter
              </label>
              <p className="mt-1 text-gray-900">{profileData.twitter_url || 'Not provided'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
                <Linkedin className="w-4 h-4" /> LinkedIn
              </label>
              <p className="mt-1 text-gray-900">{profileData.linkedin_url || 'Not provided'}</p>
            </div>
          </div>
        </div>

        {/* Bio */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Bio</h2>
          <p className="text-gray-900">{profileData.bio || 'No bio provided'}</p>
        </div>
      </div>
    </div>
  );
}