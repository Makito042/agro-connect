import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import { authGet, authPost, handleApiError } from '../../lib/authUtils';

interface AvailabilitySlot {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isRecurring: boolean;
}

const ExpertAvailability: React.FC = () => {
  const { user } = useAuth();
  const [availabilitySlots, setAvailabilitySlots] = useState<AvailabilitySlot[]>([]);
  const [newSlot, setNewSlot] = useState<AvailabilitySlot>({
    dayOfWeek: 0,
    startTime: '09:00',
    endTime: '17:00',
    isRecurring: true
  });

  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  useEffect(() => {
    fetchAvailability();
  }, []);

  const fetchAvailability = async () => {
    try {
      if (!user?.id) return;
      const data = await authGet('consultation/availability/' + user.id);
      setAvailabilitySlots(data);
    } catch (error) {
      console.error('Error fetching availability:', handleApiError(error));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Validate time slots
      const start = new Date(`1970-01-01T${newSlot.startTime}`);
      const end = new Date(`1970-01-01T${newSlot.endTime}`);
      
      if (end <= start) {
        alert('End time must be after start time');
        return;
      }

      // Check for overlapping slots on the same day
      const hasOverlap = availabilitySlots.some(slot => {
        if (slot.dayOfWeek !== newSlot.dayOfWeek) return false;
        
        const existingStart = new Date(`1970-01-01T${slot.startTime}`);
        const existingEnd = new Date(`1970-01-01T${slot.endTime}`);
        
        return (start < existingEnd && end > existingStart);
      });

      if (hasOverlap) {
        alert('This time slot overlaps with an existing slot');
        return;
      }

      await authPost('consultation/availability', { 
        availabilitySlots: [...availabilitySlots, newSlot] 
      });
      
      setAvailabilitySlots([...availabilitySlots, newSlot]);
      setNewSlot({
        dayOfWeek: 0,
        startTime: '09:00',
        endTime: '17:00',
        isRecurring: true
      });
    } catch (error) {
      console.error('Error setting availability:', handleApiError(error));
      alert('Failed to set availability. Please try again.');
    }
  };

  const handleDelete = async (index: number) => {
    try {
      const updatedSlots = availabilitySlots.filter((_, i) => i !== index);
      await authPost('consultation/availability', { availabilitySlots: updatedSlots });
      setAvailabilitySlots(updatedSlots);
    } catch (error) {
      console.error('Error deleting availability slot:', handleApiError(error));
      alert('Failed to delete availability slot. Please try again.');
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6">Manage Your Availability</h2>
      
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-4">Current Availability</h3>
        {availabilitySlots.map((slot, index) => (
          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded mb-2">
            <div>
              <span className="font-medium">{daysOfWeek[slot.dayOfWeek]}</span>
              <span className="mx-2">|</span>
              <span>{slot.startTime} - {slot.endTime}</span>
              <span className="ml-2 text-sm text-gray-500">
                {slot.isRecurring ? '(Recurring)' : '(One-time)'}
              </span>
            </div>
            <button
              onClick={() => handleDelete(index)}
              className="text-red-600 hover:text-red-800"
            >
              Remove
            </button>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Day of Week</label>
            <select
              value={newSlot.dayOfWeek}
              onChange={(e) => setNewSlot({...newSlot, dayOfWeek: parseInt(e.target.value)})}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              {daysOfWeek.map((day, index) => (
                <option key={index} value={index}>{day}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Start Time</label>
            <input
              type="time"
              value={newSlot.startTime}
              onChange={(e) => setNewSlot({...newSlot, startTime: e.target.value})}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">End Time</label>
            <input
              type="time"
              value={newSlot.endTime}
              onChange={(e) => setNewSlot({...newSlot, endTime: e.target.value})}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={newSlot.isRecurring}
              onChange={(e) => setNewSlot({...newSlot, isRecurring: e.target.checked})}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label className="ml-2 block text-sm text-gray-900">Recurring weekly</label>
          </div>
        </div>
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Add Availability Slot
        </button>
      </form>
    </div>
  );
};

export default ExpertAvailability;