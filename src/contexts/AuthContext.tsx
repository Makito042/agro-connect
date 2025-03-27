import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  user_type?: string;
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

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (userData: any) => Promise<void>;
  signOut: () => void;
  updateUserData: (userData: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for stored auth token and user data
    const token = localStorage.getItem('authToken');
    const storedUser = localStorage.getItem('user');
    
    if (token && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        console.log('Loaded stored user data:', parsedUser); // Debug log
        setUser(parsedUser);
      } catch (error) {
        console.error('Error parsing stored user data:', error);
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
      }
    }
    
    setLoading(false);
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      // Here you would typically make an API call to your backend
      const response = await fetch('http://localhost:5001/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Invalid email or password');
      }

      const { user, token } = data;
      
      // Ensure all user fields are properly stored
      const userData2 = {
        id: user.id,
        user_type: user.user_type,
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email,
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
        profile_picture: user.profile_picture || ''
      };
      
      // Store the token and user data
      localStorage.setItem('authToken', token);
      localStorage.setItem('user', JSON.stringify(userData2));
      
      setUser(userData2);
    } catch (error) {
      throw error;
    }
  };

  const signUp = async (userData: any) => {
    try {
      // Here you would typically make an API call to your backend
      const response = await fetch('http://localhost:5001/api/auth/register', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(Array.isArray(error.errors) ? error.errors.join(', ') : (error.message || 'Failed to sign up'));
      }

      const { user, token } = await response.json();
      
      // Ensure all user fields are properly stored
      const userData2 = {
        id: user.id,
        user_type: user.user_type,
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email,
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
        profile_picture: user.profile_picture || ''
      };
      
      // Store the token and user data
      localStorage.setItem('authToken', token);
      localStorage.setItem('user', JSON.stringify(userData2));
      
      setUser(userData2);
    } catch (error) {
      throw error;
    }
  };

  const signOut = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    setUser(null);
  };

  // Add method to update user data without requiring re-authentication
  const updateUserData = (userData: Partial<User>) => {
    if (!user) return;
    
    // Create updated user object by merging current user with new data
    const updatedUser = { ...user, ...userData };
    
    // Update localStorage
    localStorage.setItem('user', JSON.stringify(updatedUser));
    
    // Update state
    setUser(updatedUser);
  };

  const value = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    updateUserData,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}