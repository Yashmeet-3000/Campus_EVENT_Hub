import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getEventById, registerForEvent, searchUsers, getUserRegistrations, bookmarkEvent, removeBookmark, checkBookmark } from '../services/api';
import { useAuth } from '../context/AuthContext';

/**
 * EventDetail Page Component
 * Shows full event details and registration form
 */
const EventDetail = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isAlreadyRegistered, setIsAlreadyRegistered] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [bookmarkLoading, setBookmarkLoading] = useState(false);
  const [formAnswers, setFormAnswers] = useState({});
  const [teamName, setTeamName] = useState(''); // For team registrations
  const [teamMembers, setTeamMembers] = useState([]); // Array of {_id, name, email}
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const searchRef = useRef(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [registrationError, setRegistrationError] = useState('');

  /**
   * Fetch event details
   */
  useEffect(() => {
    const fetchEvent = async () => {
      setLoading(true);
      setError('');

      try {
        const response = await getEventById(eventId);
        setEvent(response.event);

        // Check if user is already registered for this event
        if (isAuthenticated) {
          try {
            const regResponse = await getUserRegistrations({ event_id: eventId });
            if (regResponse.registrations && regResponse.registrations.length > 0) {
              setIsAlreadyRegistered(true);
            }
          } catch (regErr) {
            // User not registered, continue
            console.log('Not registered yet');
          }

          // Check if event is bookmarked
          try {
            const bookmarkResponse = await checkBookmark(eventId);
            setIsBookmarked(bookmarkResponse.isBookmarked);
          } catch (bookmarkErr) {
            console.log('Failed to check bookmark status');
          }
        }

        // Initialize form answers
        const initialAnswers = {};
        if (response.event.form_fields) {
          response.event.form_fields.forEach(field => {
            initialAnswers[field.field_id] = '';
          });
        }
        setFormAnswers(initialAnswers);
      } catch (err) {
        setError(err.message || 'Failed to load event details');
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [eventId]);

  /**
   * Handle form answer change
   */
  const handleAnswerChange = (fieldId, value) => {
    setFormAnswers(prev => ({
      ...prev,
      [fieldId]: value
    }));
  };

  /**
   * Search users with debounce
   */
  useEffect(() => {
    const searchUsersDebounced = async () => {
      if (searchQuery.length < 2) {
        setSearchResults([]);
        setShowDropdown(false);
        return;
      }

      setIsSearching(true);
      try {
        const response = await searchUsers(searchQuery);
        // Filter out already added members
        const filtered = response.users.filter(
          user => !teamMembers.find(m => m._id === user._id)
        );
        setSearchResults(filtered);
        setShowDropdown(true);
      } catch (error) {
        console.error('Search error:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    };

    const timer = setTimeout(searchUsersDebounced, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, teamMembers]);

  /**
   * Handle bookmark toggle
   */
  const handleBookmarkToggle = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    setBookmarkLoading(true);
    try {
      if (isBookmarked) {
        await removeBookmark(eventId);
        setIsBookmarked(false);
      } else {
        await bookmarkEvent(eventId);
        setIsBookmarked(true);
      }
    } catch (err) {
      alert(err.message || 'Failed to update bookmark');
    } finally {
      setBookmarkLoading(false);
    }
  };

  /**
   * Close dropdown when clicking outside
   */
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  /**
   * Add team member from search results
   */
  const addTeamMember = (user) => {
    if (teamMembers.length >= (event?.max_team_size - 1)) {
      setRegistrationError(`Maximum ${event?.max_team_size} team members allowed (including you)`);
      return;
    }

    setTeamMembers([...teamMembers, { _id: user._id, name: user.name, email: user.email }]);
    setSearchQuery('');
    setSearchResults([]);
    setShowDropdown(false);
    setRegistrationError('');
  };

  /**
   * Remove team member
   */
  const removeTeamMember = (index) => {
    setTeamMembers(teamMembers.filter((_, i) => i !== index));
  };

  /**
   * Validate registration form
   */
  const validateForm = () => {
    // Validate team name for team events
    if (event.registration_mode === 'team') {
      if (!teamName.trim()) {
        setRegistrationError('Please enter a team name');
        return false;
      }

      // Validate team size (leader + members)
      const totalMembers = teamMembers.length + 1; // +1 for leader
      if (totalMembers < event.min_team_size) {
        setRegistrationError(`Team must have at least ${event.min_team_size} members (including you). Currently: ${totalMembers}`);
        return false;
      }
      if (totalMembers > event.max_team_size) {
        setRegistrationError(`Team cannot exceed ${event.max_team_size} members`);
        return false;
      }
    }

    if (!event.form_fields || event.form_fields.length === 0) {
      return true;
    }

    for (const field of event.form_fields) {
      if (field.is_required && !formAnswers[field.field_id]?.trim()) {
        setRegistrationError(`Please fill in the required field: ${field.label}`);
        return false;
      }
    }

    return true;
  };

  /**
   * Handle registration submission
   */
  const handleRegistration = async (e) => {
    e.preventDefault();

    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (!validateForm()) {
      return;
    }

    setIsRegistering(true);
    setRegistrationError('');

    try {
      // Convert form answers to API format
      const formattedAnswers = Object.keys(formAnswers).map(fieldId => ({
        field_id: fieldId,
        value: formAnswers[fieldId]
      }));

      // Build registration data
      const registrationData = {
        event_id: eventId,
        form_answers: formattedAnswers
      };

      // Add team data for team events
      if (event.registration_mode === 'team') {
        registrationData.team_name = teamName;
        // Send only user IDs
        registrationData.team_members_info = teamMembers.map(m => ({
          _id: m._id,
          name: m.name,
          email: m.email
        }));
      }

      await registerForEvent(registrationData);

      setSuccessMessage('Successfully registered for the event!');
      setTimeout(() => {
        navigate('/my-registrations');
      }, 2000);
    } catch (err) {
      setRegistrationError(err.message || 'Failed to register for event');
    } finally {
      setIsRegistering(false);
    }
  };

  /**
   * Format date and time
   */
  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg">
          <p className="font-semibold">{error}</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="mt-4 text-sm underline hover:no-underline"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!event) return null;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="mb-6 flex items-center text-blue-600 hover:text-blue-700 font-medium"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Event Header with Image */}
          <div className="relative h-80 bg-gradient-to-br from-blue-600 to-purple-700">
            {event.poster_url ? (
              <img
                src={event.poster_url}
                alt={event.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <svg className="w-32 h-32 text-white opacity-30" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                </svg>
              </div>
            )}
            <div className="absolute top-4 right-4">
              <span className="bg-white text-gray-800 px-4 py-2 rounded-full text-sm font-semibold shadow-lg">
                {event.event_type}
              </span>
            </div>
          </div>

          <div className="p-8">
            {/* Event Title */}
            <h1 className="text-4xl font-bold text-gray-900 mb-4">{event.title}</h1>

            {/* Event Meta Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              <div className="flex items-start">
                <svg className="w-6 h-6 mr-3 text-blue-500 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <div>
                  <p className="text-sm text-gray-500">Start</p>
                  <p className="font-semibold text-gray-900">{formatDateTime(event.start_datetime)}</p>
                </div>
              </div>

              <div className="flex items-start">
                <svg className="w-6 h-6 mr-3 text-red-500 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <div>
                  <p className="text-sm text-gray-500">End</p>
                  <p className="font-semibold text-gray-900">{formatDateTime(event.end_datetime)}</p>
                </div>
              </div>

              <div className="flex items-start">
                <svg className="w-6 h-6 mr-3 text-green-500 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <div>
                  <p className="text-sm text-gray-500">Venue</p>
                  <p className="font-semibold text-gray-900">{event.venue}</p>
                </div>
              </div>

              {event.society_id && (
                <div className="flex items-start">
                  <svg className="w-6 h-6 mr-3 text-purple-500 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <div>
                    <p className="text-sm text-gray-500">Organized By</p>
                    <p className="font-semibold text-gray-900">{event.society_id.name}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Bookmark Button */}
            {isAuthenticated && (
              <div className="mb-6">
                <button
                  onClick={handleBookmarkToggle}
                  disabled={bookmarkLoading}
                  className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-semibold transition duration-200 ${
                    isBookmarked
                      ? 'bg-red-600 hover:bg-red-700 text-white'
                      : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                  } disabled:opacity-50`}
                >
                  <svg className="w-6 h-6" fill={isBookmarked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                  </svg>
                  <span>{isBookmarked ? 'Remove Bookmark' : 'Bookmark Event'}</span>
                </button>
              </div>
            )}

            {/* Description */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">About This Event</h2>
              <p className="text-gray-700 leading-relaxed whitespace-pre-line">{event.description}</p>
            </div>

            {/* Registration Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
              <h3 className="text-lg font-bold text-blue-900 mb-2">Registration Information</h3>
              <div className="text-sm text-blue-800 space-y-1">
                <p>Registration Mode: <span className="font-semibold">{event.registration_mode === 'team' ? 'Team' : 'Individual'}</span></p>
                <p>Registration Deadline: <span className="font-semibold">{formatDateTime(event.registration_end_datetime)}</span></p>
                {event.registration_mode === 'team' && (
                  <p>Team Size: <span className="font-semibold">{event.min_team_size} - {event.max_team_size} members</span></p>
                )}
                {event.max_teams && <p>Max Capacity: <span className="font-semibold">{event.max_teams} teams</span></p>}
              </div>
            </div>

            {/* Success Message */}
            {successMessage && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6 flex items-start">
                <svg className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                {successMessage}
              </div>
            )}

            {/* Registration Error */}
            {registrationError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-start">
                <svg className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                {registrationError}
              </div>
            )}

            {/* Already Registered Message */}
            {isAuthenticated && isAlreadyRegistered && (
              <div className="border-t border-gray-200 pt-8">
                <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                  <svg className="w-16 h-16 mx-auto text-green-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h3 className="text-xl font-bold text-green-900 mb-2">You're Already Registered!</h3>
                  <p className="text-green-700 mb-4">You have already registered for this event.</p>
                  <button
                    onClick={() => navigate('/my-registrations')}
                    className="bg-green-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-green-700 transition duration-200"
                  >
                    View My Registrations
                  </button>
                </div>
              </div>
            )}

            {/* Registration Form */}
            {isAuthenticated && !successMessage && !isAlreadyRegistered && (
              <div className="border-t border-gray-200 pt-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Register for This Event</h2>

                <form onSubmit={handleRegistration} className="space-y-6">
                  {/* Team Name Input (for team events) */}
                  {event.registration_mode === 'team' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Team Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={teamName}
                          onChange={(e) => setTeamName(e.target.value)}
                          placeholder="Enter your team name"
                          required
                          className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 outline-none"
                          disabled={isRegistering}
                        />
                      </div>

                      {/* Team Members Section */}
                      <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
                        <h4 className="font-semibold text-gray-900 mb-3">
                          Team Members <span className="text-sm font-normal text-gray-600">({event.min_team_size} - {event.max_team_size} members including you)</span>
                        </h4>

                        {/* Current team member count */}
                        <div className="mb-3 text-sm text-gray-600">
                          Current team size: <span className="font-semibold">{teamMembers.length + 1}</span> (You + {teamMembers.length} member{teamMembers.length !== 1 ? 's' : ''})
                        </div>

                        {/* Team Members List */}
                        {teamMembers.length > 0 && (
                          <div className="space-y-2 mb-4">
                            {teamMembers.map((member, index) => (
                              <div key={index} className="flex items-center justify-between bg-white p-3 rounded border border-gray-200">
                                <div className="flex-1">
                                  <p className="font-medium text-gray-900">{member.name}</p>
                                  <p className="text-sm text-gray-600">{member.email}</p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => removeTeamMember(index)}
                                  className="text-red-600 hover:text-red-800 ml-2"
                                  disabled={isRegistering}
                                >
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Add Team Member Search */}
                        {teamMembers.length < (event.max_team_size - 1) && (
                          <div className="space-y-3" ref={searchRef}>
                            <p className="text-sm font-medium text-gray-700">Add Team Member</p>
                            <div className="relative">
                              <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search by name or email..."
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                disabled={isRegistering}
                              />
                              {isSearching && (
                                <div className="absolute right-3 top-3">
                                  <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                                </div>
                              )}
                              {/* Search Results Dropdown */}
                              {showDropdown && searchResults.length > 0 && (
                                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                  {searchResults.map((user) => (
                                    <button
                                      key={user._id}
                                      type="button"
                                      onClick={() => addTeamMember(user)}
                                      className="w-full px-4 py-3 text-left hover:bg-blue-50 transition duration-150 border-b border-gray-100 last:border-b-0"
                                    >
                                      <div className="font-medium text-gray-900">{user.name}</div>
                                      <div className="text-sm text-gray-600">{user.email}</div>
                                    </button>
                                  ))}
                                </div>
                              )}
                              {showDropdown && searchQuery.length >= 2 && searchResults.length === 0 && !isSearching && (
                                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg px-4 py-3 text-gray-500 text-sm">
                                  No users found. Only registered users can be added to teams.
                                </div>
                              )}
                            </div>
                            {searchQuery.length < 2 && (
                              <p className="text-xs text-gray-500">Type at least 2 characters to search for registered users</p>
                            )}
                          </div>
                        )}
                      </div>
                    </>
                  )}

                  {/* Dynamic Form Fields */}
                  {event.form_fields && event.form_fields.length > 0 ? (
                    event.form_fields.map((field) => (
                      <div key={field.field_id}>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {field.label} {field.is_required && <span className="text-red-500">*</span>}
                        </label>

                        {field.field_type === 'long_text' ? (
                          <textarea
                            value={formAnswers[field.field_id] || ''}
                            onChange={(e) => handleAnswerChange(field.field_id, e.target.value)}
                            required={field.is_required}
                            rows={4}
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 outline-none"
                            disabled={isRegistering}
                          />
                        ) : field.field_type === 'select' ? (
                          <select
                            value={formAnswers[field.field_id] || ''}
                            onChange={(e) => handleAnswerChange(field.field_id, e.target.value)}
                            required={field.is_required}
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 outline-none"
                            disabled={isRegistering}
                          >
                            <option value="">Select an option</option>
                            {field.options?.map((option, idx) => (
                              <option key={idx} value={option}>{option}</option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type={field.field_type === 'email' ? 'email' : field.field_type === 'number' ? 'number' : field.field_type === 'date' ? 'date' : 'text'}
                            value={formAnswers[field.field_id] || ''}
                            onChange={(e) => handleAnswerChange(field.field_id, e.target.value)}
                            required={field.is_required}
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 outline-none"
                            disabled={isRegistering}
                          />
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-600">No additional information required</p>
                  )}

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isRegistering}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-6 rounded-lg font-semibold
                             hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                             disabled:opacity-50 disabled:cursor-not-allowed transition duration-200 transform hover:scale-[1.02]"
                  >
                    {isRegistering ? (
                      <span className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Registering...
                      </span>
                    ) : (
                      'Register Now'
                    )}
                  </button>
                </form>
              </div>
            )}

            {!isAuthenticated && !successMessage && (
              <div className="border-t border-gray-200 pt-8 text-center">
                <p className="text-gray-600 mb-4">Please sign in to register for this event</p>
                <button
                  onClick={() => navigate('/login')}
                  className="bg-blue-600 text-white py-3 px-8 rounded-lg font-semibold hover:bg-blue-700 transition duration-200"
                >
                  Sign In to Register
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDetail;
