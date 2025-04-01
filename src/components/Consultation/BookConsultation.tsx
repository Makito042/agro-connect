import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { authGet, authPost, handleApiError } from '../../lib/authUtils';

interface Expert {
  _id: string;
  first_name: string;
  last_name: string;
  expertise_area: string;
  years_of_experience: string;
  qualification: string;
  rating?: number;
  total_consultations?: number;
}

interface AvailabilitySlot {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isRecurring: boolean;
}

const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const BookConsultation: React.FC = () => {
  // CSS styles for digital clock
  const styles = {
    digitalClockContainer: `
      bg-white rounded-lg p-4 shadow-lg
      border border-gray-200
    `,
    timeSlotButton: `
      p-3 rounded font-mono text-lg
      transition-all duration-200
      hover:scale-105
      focus:outline-none focus:ring-2 focus:ring-blue-500
    `,
    activeTimeSlot: `
      bg-blue-600 text-white
      shadow-lg shadow-blue-500/50
    `,
    inactiveTimeSlot: `
      bg-gray-100 text-gray-800
      hover:bg-gray-200
      hover:text-gray-900
    `
  };
  const { user } = useAuth();
  const navigate = useNavigate();
  const [experts, setExperts] = useState<Expert[]>([]);
  const [filteredExperts, setFilteredExperts] = useState<Expert[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expertiseFilter, setExpertiseFilter] = useState<string>('');
  const [experienceFilter, setExperienceFilter] = useState<string>('');
  const [selectedExpert, setSelectedExpert] = useState<string>('');
  const [hasSearched, setHasSearched] = useState<boolean>(false);
  const [availableSlots, setAvailableSlots] = useState<AvailabilitySlot[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [topic, setTopic] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showConfirmation, setShowConfirmation] = useState<boolean>(false);
  const [bookingStatus, setBookingStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');

  useEffect(() => {
    fetchExperts();
  }, []);

  useEffect(() => {
    if (searchQuery.trim()) {
      handleSearch();
    }
  }, [searchQuery]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setExperts([]);
      setHasSearched(false);
      return;
    }
    await fetchExperts();
    setHasSearched(true);
  };

  useEffect(() => {
    if (!experts.length) return;

    let filtered = [...experts];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(expert => 
        expert.first_name.toLowerCase().includes(query) ||
        expert.last_name.toLowerCase().includes(query) ||
        expert.expertise_area.toLowerCase().includes(query) ||
        expert.qualification.toLowerCase().includes(query)
      );
    }

    if (expertiseFilter) {
      filtered = filtered.filter(expert =>
        expert.expertise_area.toLowerCase() === expertiseFilter.toLowerCase()
      );
    }

    if (experienceFilter) {
      filtered = filtered.filter(expert => {
        const years = parseInt(expert.years_of_experience);
        switch(experienceFilter) {
          case '0-5': return years <= 5;
          case '5-10': return years > 5 && years <= 10;
          case '10+': return years > 10;
          default: return true;
        }
      });
    }

    setFilteredExperts(filtered);
  }, [searchQuery, experts, expertiseFilter, experienceFilter]);

  useEffect(() => {
    if (selectedExpert) {
      fetchExpertAvailability();
    }
  }, [selectedExpert]);

  const fetchExperts = async () => {
    try {
      const data = await authGet('users/experts');
      setExperts(data);
    } catch (error) {
      console.error('Error fetching experts:', handleApiError(error));
    }
  };

  const fetchExpertAvailability = async () => {
    try {
      const data = await authGet(`consultation/availability/${selectedExpert}`);
      setAvailableSlots(data);
    } catch (error) {
      console.error('Error fetching availability:', handleApiError(error));
      setAvailableSlots([]);
    }
  };

  const handleBookingRequest = async () => {
    if (!selectedExpert || !selectedDate || !selectedTime || !topic) {
      alert('Please fill in all required fields');
      return;
    }
    setShowConfirmation(true);
  };

  const handleConfirmBooking = async () => {
    setIsSubmitting(true);
    setBookingStatus('pending');
    try {
      const [hours, minutes] = selectedTime.split(':');
      const startTime = new Date(selectedDate);
      startTime.setHours(parseInt(hours), parseInt(minutes));

      const endTime = new Date(startTime);
      endTime.setHours(startTime.getHours() + 1); // 1-hour consultation

      const selectedExpertDetails = experts.find(e => e._id === selectedExpert);
      const response = await authPost('consultation/book', {
        expertId: selectedExpert,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        topic,
        description,
        expertName: `${selectedExpertDetails?.first_name} ${selectedExpertDetails?.last_name}`,
        expertiseArea: selectedExpertDetails?.expertise_area,
        senderName: `${user?.first_name} ${user?.last_name}`
      });

      if (response) {
        setBookingStatus('success');
        // Show success message with more details
        const successMessage = `Your consultation request has been sent successfully!\n\nDetails:\nExpert: ${selectedExpertDetails?.first_name} ${selectedExpertDetails?.last_name}\nDate: ${new Date(selectedDate).toLocaleDateString()}\nTime: ${formatTime(selectedTime)}\nTopic: ${topic}\n\nYou will be redirected to consultation history.`;
        
        setTimeout(() => {
          alert(successMessage);
          // Reset form
          setSelectedDate('');
          setSelectedTime('');
          setTopic('');
          setDescription('');
          setShowConfirmation(false);
          setBookingStatus('idle');
          // Navigate to consultation history
          navigate('/consultation-history');
        }, 1500);
      } else {
        throw new Error('Failed to book consultation');
      }
    } catch (error) {
      console.error('Error booking consultation:', handleApiError(error));
      setBookingStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelBooking = () => {
    setShowConfirmation(false);
    setBookingStatus('idle');
  };

  const getAvailableTimeSlots = () => {
    if (!selectedDate || !availableSlots.length) return [];

    const selectedDay = new Date(selectedDate).getDay();
    const availableSlotsForDay = availableSlots.filter(slot => slot.dayOfWeek === selectedDay);

    const slots: { startTime: string }[] = [];
    availableSlotsForDay.forEach(slot => {
      const [startHour, startMinute] = slot.startTime.split(':');
      const [endHour, endMinute] = slot.endTime.split(':');
      
      let currentHour = parseInt(startHour);
      let currentMinute = parseInt(startMinute);
      
      while (currentHour < parseInt(endHour) || (currentHour === parseInt(endHour) && currentMinute < parseInt(endMinute))) {
        const formattedTime = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
        const slotDateTime = new Date(selectedDate);
        slotDateTime.setHours(currentHour, currentMinute);

        // Only add future time slots for today
        if (new Date(selectedDate).toDateString() !== new Date().toDateString() || slotDateTime > new Date()) {
          slots.push({ startTime: formattedTime });
        }
        
        currentMinute += 30; // 30-minute intervals
        if (currentMinute >= 60) {
          currentHour++;
          currentMinute = 0;
        }
      }
    });
    
    return slots;
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    return `${hours}:${minutes}`;
  };

  const handleExpertSelect = (expertId: string) => {
    setSelectedExpert(expertId);
    setSelectedDate('');
    setSelectedTime('');
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Book a Consultation</h2>
        {user?.user_type === 'expert' && (
          <button
            onClick={() => navigate('/consultation/availability')}
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
          >
            Manage Availability
          </button>
        )}
      </div>

      <form onSubmit={(e) => { e.preventDefault(); handleBookingRequest(); }} className="space-y-6">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Expert
              </label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full p-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="Search by name or qualification..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Expertise Area
              </label>
              <select
                value={expertiseFilter}
                onChange={(e) => setExpertiseFilter(e.target.value)}
                className="w-full p-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Areas</option>
                {Array.from(new Set(experts.map(expert => expert.expertise_area))).map(area => (
                  <option key={area} value={area}>{area}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Years of Experience
              </label>
              <select
                value={experienceFilter}
                onChange={(e) => setExperienceFilter(e.target.value)}
                className="w-full p-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Experience</option>
                <option value="0-5">0-5 years</option>
                <option value="5-10">5-10 years</option>
                <option value="10+">10+ years</option>
              </select>
            </div>
          </div>
          
          <div className="grid grid-cols-1 gap-4">
            {!hasSearched ? (
              <p className="text-gray-500 text-center py-4">Search for experts by name, expertise, or qualification</p>
            ) : filteredExperts.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No experts found matching your search criteria</p>
            ) : (
              filteredExperts.map(expert => (
                <div 
                  key={expert._id} 
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${selectedExpert === expert._id ? 'border-blue-500 bg-blue-50' : 'hover:border-gray-400'}`}
                  onClick={() => setSelectedExpert(expert._id)}
                >
                  <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                    <div className="flex-grow">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium text-gray-900">{expert.first_name} {expert.last_name}</h3>
                        <div className="flex items-center space-x-2">
                          <span className="text-yellow-400">
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          </span>
                          <span className="text-sm font-medium text-gray-600">{expert.rating || 4.5}</span>
                          <span className="text-sm text-gray-500">({expert.total_consultations || 0} consultations)</span>
                        </div>
                      </div>
                      <div className="mt-2">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {expert.expertise_area}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mt-2">{expert.qualification}</p>
                      <p className="text-sm text-gray-500">{expert.years_of_experience} years of experience</p>
                    </div>
                    <div className="flex-shrink-0 self-center space-x-2">
                      {selectedExpert === expert._id && (
                        <span className="inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium bg-green-100 text-green-800">
                          Selected
                        </span>
                      )}
                      <button
                        onClick={() => setSelectedExpert(expert._id)}
                        className="bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 text-sm"
                      >
                        View Availability
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {selectedExpert && (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Date
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => {
                      setSelectedDate(e.target.value);
                      setSelectedTime('');
                    }}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full p-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 bg-white cursor-pointer pl-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => document.querySelector('input[type="date"]')?.showPicker()}
                    className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400 hover:text-gray-500"
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </button>
                </div>
                {!selectedDate && (
                  <div className="mt-2 text-sm text-blue-600">
                    Please select a date to view available time slots
                  </div>
                )}
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Time</label>
                <div className={styles.digitalClockContainer}>
                  <div className="grid grid-cols-4 gap-2">
                    {!selectedDate ? (
                      <div className="col-span-4 text-center py-4 bg-blue-50 rounded-lg border-2 border-blue-200">
                        <svg className="mx-auto h-12 w-12 text-blue-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <p className="text-blue-700 font-medium">Please select a date first</p>
                        <p className="text-blue-600 text-sm mt-1">Use the date picker above to view available time slots</p>
                      </div>
                    ) : (
                      <>
                        {getAvailableTimeSlots().length > 0 ? (
                          <div className="grid grid-cols-4 gap-2">
                            {getAvailableTimeSlots().map((slot, index) => (
                              <button
                                key={index}
                                onClick={() => setSelectedTime(slot.startTime)}
                                className={`${styles.timeSlotButton} ${selectedTime === slot.startTime ? styles.activeTimeSlot : styles.inactiveTimeSlot}`}
                              >
                                {formatTime(slot.startTime)}
                              </button>
                            ))}
                          </div>
                        ) : (
                          <div className="col-span-4 text-center py-4 bg-gray-50 rounded-lg border-2 border-gray-200">
                            <p className="text-gray-600">No available time slots for selected date</p>
                            <p className="text-gray-500 text-sm mt-1">Please try selecting a different date</p>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                  {!selectedDate && (
                    <div className="text-blue-400 font-mono text-lg text-center mt-4">
                    Select a date first
                  </div>
                  )}
                  {selectedTime && (
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg border">
                    <div className="flex flex-col items-center">
                      <div className="text-4xl font-mono bg-black text-green-400 px-4 py-2 rounded-lg shadow-inner mb-2">
                        {formatTime(selectedTime)}
                      </div>
                      <div className="text-sm text-gray-600">
                        Duration: 1 hour
                      </div>
                      <div className="text-sm text-gray-600">
                        Ends at: {formatTime(new Date(new Date(`2000-01-01T${selectedTime}`).getTime() + 60 * 60 * 1000).toTimeString().slice(0, 5))}
                      </div>
                    </div>
                  </div>
                  )}
                </div>
              </div>
            </div>

            {/* Expert Availability Calendar */}
            <div className="mb-6">
              <h4 className="text-lg font-medium mb-4">Available Time Slots</h4>
              <div className="grid grid-cols-1 gap-4">
                {availableSlots.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No availability slots found for this expert</p>
                ) : (
                  <div className="space-y-4">
                    {daysOfWeek.map((day, index) => {
                      const daySlots = availableSlots.filter(slot => slot.dayOfWeek === index);
                      if (daySlots.length === 0) return null;
                      
                      return (
                        <div key={day} className="border rounded-lg p-4">
                          <h4 className="font-medium text-lg mb-2">{day}</h4>
                          <div className="grid grid-cols-2 gap-2">
                            {daySlots.map((slot, slotIndex) => (
                              <div key={slotIndex} className="text-sm text-gray-600">
                                {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                                {slot.isRecurring && (
                                  <span className="ml-2 text-xs text-blue-600">(Recurring)</span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Consultation Topic
              </label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="w-full p-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., Crop Disease Management"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                rows={4}
                placeholder="Describe your consultation needs..."
                required
              />
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Booking...' : 'Request Consultation'}
            </button>
          </div>
        )}

        {/* Confirmation Dialog */}
        {showConfirmation && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full space-y-4">
              <h3 className="text-lg font-medium text-gray-900">
                Confirm Consultation Request
              </h3>
              <div className="text-sm text-gray-500 space-y-2">
                <p><strong>Expert:</strong> {experts.find(e => e._id === selectedExpert)?.first_name} {experts.find(e => e._id === selectedExpert)?.last_name}</p>
                <p><strong>Date:</strong> {new Date(selectedDate).toLocaleDateString()}</p>
                <p><strong>Time:</strong> {formatTime(selectedTime)}</p>
                <p><strong>Topic:</strong> {topic}</p>
              </div>
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={handleConfirmBooking}
                  disabled={bookingStatus === 'pending'}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                >
                  {bookingStatus === 'pending' ? 'Sending Request...' : 'Confirm'}
                </button>
                <button
                  type="button"
                  onClick={handleCancelBooking}
                  disabled={bookingStatus === 'pending'}
                  className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                >
                  Cancel
                </button>
              </div>
              {bookingStatus === 'success' && (
                <div className="text-green-600 text-sm text-center">
                  Consultation request sent successfully! The expert will review your request.
                </div>
              )}
              {bookingStatus === 'error' && (
                <div className="text-red-600 text-sm text-center">
                  Failed to send request. Please try again.
                </div>
              )}
            </div>
          </div>
        )}
      </form>
    </div>
  );
};

export default BookConsultation;