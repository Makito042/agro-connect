import React, { useState, useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { uploadProfilePicture } from '../lib/api';

export default function Profile() {
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleImageUpload = async (e) => {
    try {
      setLoading(true);
      setError('');
      const formData = new FormData();
      formData.append('profile_picture', e.target.files[0]);

      await uploadProfilePicture(formData);
      // Add logic to update UI with new image
    } catch (err) {
      setError('Failed to upload image. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="profile-container">
      <input 
        type="file"
        onChange={handleImageUpload}
        accept="image/*"
        disabled={loading}
      />
      {error && <div className="error-message">{error}</div>}
    </div>
  );
}