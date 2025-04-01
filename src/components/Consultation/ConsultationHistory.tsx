import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface Consultation {
  _id: string;
  expert: {
    first_name: string;
    last_name: string;
    expertise_area: string;
  };
  farmer: {
    first_name: string;
    last_name: string;
  };
  startTime: string;
  endTime: string;
  topic: string;
  description: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  chatId: string;
}

const ConsultationHistory: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [consultations, setConsultations] = useState<Consultation[]>([]);

  useEffect(() => {
    fetchConsultations();
  }, []);

  const fetchConsultations = async () => {
    try {
      const token = sessionStorage.getItem('authToken');
      const response = await axios.get('http://localhost:5001/api/consultation/consultations', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setConsultations(response.data);
    } catch (error) {
      console.error('Error fetching consultations:', error);
    }
  };

  const updateStatus = async (consultationId: string, newStatus: string) => {
    try {
      const token = sessionStorage.getItem('authToken');
      await axios.patch(
        `http://localhost:5001/api/consultation/consultations/${consultationId}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchConsultations(); // Refresh the list
    } catch (error) {
      console.error('Error updating consultation status:', error);
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const getStatusColor = (status: string) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-green-100 text-green-800',
      completed: 'bg-blue-100 text-blue-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Consultation History</h2>
        <button
          onClick={() => navigate('/book-consultation')}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Book Consultation
        </button>
      </div>

      <div className="space-y-4">
        {consultations.map((consultation) => (
          <div key={consultation._id} className="border rounded-lg p-4 space-y-3">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-semibold">{consultation.topic}</h3>
                <p className="text-gray-600">
                  {user?.user_type === 'expert' 
                    ? `With: ${consultation.farmer.first_name} ${consultation.farmer.last_name}`
                    : `Expert: ${consultation.expert.first_name} ${consultation.expert.last_name} (${consultation.expert.expertise_area})`
                  }
                </p>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(consultation.status)}`}>
                {consultation.status.charAt(0).toUpperCase() + consultation.status.slice(1)}
              </span>
            </div>

            <div className="text-sm text-gray-600">
              <p>Start: {formatDateTime(consultation.startTime)}</p>
              <p>End: {formatDateTime(consultation.endTime)}</p>
              <p className="mt-2">{consultation.description}</p>
            </div>

            {user?.user_type === 'expert' && consultation.status === 'pending' && (
              <div className="flex space-x-2 mt-3">
                <button
                  onClick={() => updateStatus(consultation._id, 'confirmed')}
                  className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                >
                  Confirm
                </button>
                <button
                  onClick={() => updateStatus(consultation._id, 'cancelled')}
                  className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                >
                  Cancel
                </button>
              </div>
            )}

            {user?.user_type === 'expert' && consultation.status === 'confirmed' && (
              <button
                onClick={() => updateStatus(consultation._id, 'completed')}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Mark as Completed
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ConsultationHistory;