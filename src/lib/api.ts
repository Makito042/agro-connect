import axios from 'axios';

const API_BASE_URL = 'http://localhost:5001/api';

interface ApiResponse {
  success: boolean;
  message?: string;
  data?: {
    profile_picture: string;
    [key: string]: any;
  };
}

export const uploadProfilePicture = async (formData: FormData): Promise<ApiResponse> => {
  try {
    const token = localStorage.getItem('authToken');
    if (!token) {
      throw new Error('Authentication token not found');
    }

    const response = await axios.post(`${API_BASE_URL}/auth/profile-picture`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        Authorization: `Bearer ${token}`,
      },
    });

    // Ensure we have the profile picture data in the response
    if (!response.data?.data?.profile_picture) {
      throw new Error('Profile picture data not received from server');
    }

    return {
      success: true,
      data: response.data,
      message: 'Profile picture uploaded successfully'
    };
  } catch (error: any) {
    console.error('Error uploading image:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Failed to upload image');
  }
};