import axios from 'axios';

// Base URL for API requests
const API_BASE_URL = 'http://localhost:5001/api';

/**
 * Get the authentication token from localStorage
 * @returns The token or null if not found
 */
export const getAuthToken = (): string | null => {
  return sessionStorage.getItem('authToken');
};

/**
 * Check if the token is valid (not expired)
 * This is a simple check based on token presence
 * A more robust solution would decode the JWT and check its expiration
 */
export const isTokenValid = (): boolean => {
  const token = getAuthToken();
  if (!token) return false;
  
  // For a more robust solution, you could decode the JWT and check its expiration
  // This would require a JWT decoding library or custom implementation
  // For now, we'll just check if the token exists
  return true;
};

/**
 * Create an axios instance with authentication headers
 * @returns Axios instance with auth headers
 */
export const createAuthenticatedAxios = () => {
  const token = getAuthToken();
  
  return axios.create({
    baseURL: API_BASE_URL,
    headers: {
      'Authorization': token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json'
    }
  });
};

/**
 * Handle API errors consistently
 * @param error The error object from axios
 * @returns Formatted error message
 */
export const handleApiError = (error: any): string => {
  // Check if it's an authentication error
  if (error.response && error.response.status === 401) {
    // Clear invalid token
    sessionStorage.removeItem('authToken');
    sessionStorage.removeItem('user');
    
    // Redirect to login page if not already there
    if (window.location.pathname !== '/signin') {
      window.location.href = '/signin';
    }
    return 'Your session has expired. Please sign in again.';
  }
  
  // Return appropriate error message
  return error.response?.data?.message || error.message || 'An error occurred';
};

/**
 * Make an authenticated GET request
 * @param endpoint API endpoint
 * @returns Promise with response data
 */
export const authGet = async (endpoint: string) => {
  try {
    const authAxios = createAuthenticatedAxios();
    const response = await authAxios.get(endpoint);
    return response.data;
  } catch (error) {
    console.error(`Error fetching ${endpoint}:`, error);
    throw error;
  }
};

/**
 * Make an authenticated POST request
 * @param endpoint API endpoint
 * @param data Request payload
 * @returns Promise with response data
 */
export const authPost = async (endpoint: string, data: any) => {
  try {
    const authAxios = createAuthenticatedAxios();
    const response = await authAxios.post(endpoint, data);
    return response.data;
  } catch (error) {
    console.error(`Error posting to ${endpoint}:`, error);
    throw error;
  }
};

/**
 * Make an authenticated PATCH request
 * @param endpoint API endpoint
 * @param data Request payload
 * @returns Promise with response data
 */
export const authPatch = async (endpoint: string, data: any) => {
  try {
    const authAxios = createAuthenticatedAxios();
    const response = await authAxios.patch(endpoint, data);
    return response.data;
  } catch (error) {
    console.error(`Error patching ${endpoint}:`, error);
    throw error;
  }
};