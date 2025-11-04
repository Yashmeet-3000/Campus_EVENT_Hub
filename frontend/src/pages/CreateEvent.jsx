import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { createEvent, getAllEvents } from '../services/api';
import FormBuilder from '../components/FormBuilder';

/**
 * CreateEvent Page
 * Multi-step form for society heads to create new events
 * Step 1: Event Details
 * Step 2: Registration Form Builder
 */
const CreateEvent = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  
  // Authorization check
  useEffect(() => {
    if (isAuthenticated && user && user.role !== 'society_head' && user.role !== 'admin') {
      navigate('/dashboard');
    }
  }, [isAuthenticated, user, navigate]);

  // State management
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Event details state
  const [eventDetails, setEventDetails] = useState({
    title: '',
    description: '',
    event_type: 'workshop',
    start_datetime: '',
    end_datetime: '',
    venue: '',
    poster_url: '',
    registration_mode: 'individual',
    min_team_size: 2,
    max_team_size: 5,
    max_teams: '',
    registration_start_datetime: '',
    registration_end_datetime: '',
    society_id: ''
  });

  // Form fields state
  const [formFields, setFormFields] = useState([]);

  // Validation errors
  const [validationErrors, setValidationErrors] = useState({});

  /**
   * Validate Step 1: Event Details
   */
  const validateStep1 = () => {
    const errors = {};

    if (!eventDetails.title.trim() || eventDetails.title.length < 5) {
      errors.title = 'Title must be at least 5 characters';
    }

    if (!eventDetails.description.trim() || eventDetails.description.length < 10) {
      errors.description = 'Description must be at least 10 characters';
    }

    if (!eventDetails.start_datetime) {
      errors.start_datetime = 'Start date & time is required';
    }

    if (!eventDetails.end_datetime) {
      errors.end_datetime = 'End date & time is required';
    }

    if (eventDetails.start_datetime && eventDetails.end_datetime) {
      if (new Date(eventDetails.end_datetime) <= new Date(eventDetails.start_datetime)) {
        errors.end_datetime = 'End date must be after start date';
      }
    }

    if (!eventDetails.venue.trim()) {
      errors.venue = 'Venue is required';
    }

    if (!eventDetails.registration_start_datetime) {
      errors.registration_start_datetime = 'Registration start date is required';
    }

    if (!eventDetails.registration_end_datetime) {
      errors.registration_end_datetime = 'Registration end date is required';
    }

    if (eventDetails.registration_end_datetime && eventDetails.start_datetime) {
      if (new Date(eventDetails.registration_end_datetime) >= new Date(eventDetails.start_datetime)) {
        errors.registration_end_datetime = 'Registration must end before event starts';
      }
    }

    if (eventDetails.registration_mode === 'team') {
      if (eventDetails.min_team_size < 1) {
        errors.min_team_size = 'Minimum team size must be at least 1';
      }
      if (eventDetails.max_team_size < eventDetails.min_team_size) {
        errors.max_team_size = 'Maximum team size must be >= minimum team size';
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  /**
   * Validate Step 2: Form Builder
   */
  const validateStep2 = () => {
    const errors = {};

    if (formFields.length === 0) {
      errors.formFields = 'At least 1 form field is required';
    }

    // Check each field
    formFields.forEach((field, index) => {
      if (!field.label.trim()) {
        errors[`field_${index}_label`] = 'Field label is required';
      }
      if ((field.type === 'select' || field.type === 'multi_select') && field.options.length === 0) {
        errors[`field_${index}_options`] = 'Options are required for select fields';
      }
    });

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  /**
   * Handle input change for event details
   */
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEventDetails(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear validation error for this field
    if (validationErrors[name]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  /**
   * Handle next button (Step 1 -> Step 2)
   */
  const handleNext = () => {
    if (validateStep1()) {
      setStep(2);
      window.scrollTo(0, 0);
    }
  };

  /**
   * Handle back button (Step 2 -> Step 1)
   */
  const handleBack = () => {
    setStep(1);
    window.scrollTo(0, 0);
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateStep2()) {
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Prepare event data
      const eventData = {
        ...eventDetails,
        event_status: 'published', // Set status to published instead of draft
        form_fields: formFields.map((field, index) => ({
          label: field.label,
          field_type: field.type, // Backend expects 'field_type' not 'type'
          is_required: field.required, // Backend expects 'is_required' not 'required'
          options: field.options,
          order_index: index // Add order_index based on array position
        }))
      };

      // Remove empty optional fields
      if (!eventData.poster_url) delete eventData.poster_url;
      if (!eventData.max_teams) delete eventData.max_teams;
      if (!eventData.society_id) delete eventData.society_id;
      if (eventData.registration_mode === 'individual') {
        delete eventData.min_team_size;
        delete eventData.max_team_size;
        delete eventData.max_teams;
      }

      console.log('Submitting event data:', JSON.stringify(eventData, null, 2));

      // Call API to create event
      const response = await createEvent(eventData);
      
      setSuccess('Event created successfully!');
      
      // Redirect to society dashboard after 2 seconds
      setTimeout(() => {
        navigate('/society/dashboard');
      }, 2000);
    } catch (err) {
      console.error('Create event error:', err);
      console.error('Error response:', err.response?.data);
      
      // Extract detailed error message
      let errorMsg = 'Failed to create event. Please try again.';
      if (err.response?.data?.details) {
        errorMsg = err.response.data.details.join(', ');
      } else if (err.response?.data?.message) {
        errorMsg = err.response.data.message;
      } else if (err.message) {
        errorMsg = err.message;
      }
      
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Event types
  const eventTypes = [
    'workshop',
    'seminar',
    'competition',
    'cultural',
    'sports',
    'orientation',
    'hackathon'
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Create New Event</h1>
          <p className="text-gray-600">Fill in the details to create an event for your society</p>
        </div>

        {/* Progress Indicator */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center space-x-4">
            {/* Step 1 */}
            <div className="flex items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                step === 1 ? 'bg-blue-600 text-white' : 'bg-green-500 text-white'
              }`}>
                {step > 1 ? (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                ) : '1'}
              </div>
              <span className="ml-2 text-sm font-medium text-gray-700">Event Details</span>
            </div>
            
            {/* Connector */}
            <div className={`w-16 h-1 ${step === 2 ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
            
            {/* Step 2 */}
            <div className="flex items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                step === 2 ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'
              }`}>
                2
              </div>
              <span className="ml-2 text-sm font-medium text-gray-700">Registration Form</span>
            </div>
          </div>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
            {success}
          </div>
        )}

        {/* Form */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <form onSubmit={handleSubmit}>
            {/* Step 1: Event Details */}
            {step === 1 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-semibold text-gray-900 mb-6">Event Details</h2>

                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Event Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={eventDetails.title}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Annual Tech Fest 2024"
                  />
                  {validationErrors.title && (
                    <p className="text-red-500 text-sm mt-1">{validationErrors.title}</p>
                  )}
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="description"
                    value={eventDetails.description}
                    onChange={handleInputChange}
                    rows="4"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Describe your event..."
                  />
                  {validationErrors.description && (
                    <p className="text-red-500 text-sm mt-1">{validationErrors.description}</p>
                  )}
                </div>

                {/* Event Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Event Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="event_type"
                    value={eventDetails.event_type}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent capitalize"
                  >
                    {eventTypes.map(type => (
                      <option key={type} value={type} className="capitalize">
                        {type}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Date & Time */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Start Date & Time <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="datetime-local"
                      name="start_datetime"
                      value={eventDetails.start_datetime}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    {validationErrors.start_datetime && (
                      <p className="text-red-500 text-sm mt-1">{validationErrors.start_datetime}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      End Date & Time <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="datetime-local"
                      name="end_datetime"
                      value={eventDetails.end_datetime}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    {validationErrors.end_datetime && (
                      <p className="text-red-500 text-sm mt-1">{validationErrors.end_datetime}</p>
                    )}
                  </div>
                </div>

                {/* Venue */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Venue <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="venue"
                    value={eventDetails.venue}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Main Auditorium, Room 101"
                  />
                  {validationErrors.venue && (
                    <p className="text-red-500 text-sm mt-1">{validationErrors.venue}</p>
                  )}
                </div>

                {/* Poster URL */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Poster URL (Optional)
                  </label>
                  <input
                    type="url"
                    name="poster_url"
                    value={eventDetails.poster_url}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="https://example.com/poster.jpg"
                  />
                </div>

                {/* Registration Mode */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Registration Mode <span className="text-red-500">*</span>
                  </label>
                  <div className="flex space-x-4">
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="registration_mode"
                        value="individual"
                        checked={eventDetails.registration_mode === 'individual'}
                        onChange={handleInputChange}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span>Individual</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="registration_mode"
                        value="team"
                        checked={eventDetails.registration_mode === 'team'}
                        onChange={handleInputChange}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span>Team</span>
                    </label>
                  </div>
                </div>

                {/* Team Settings (only if team mode) */}
                {eventDetails.registration_mode === 'team' && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-4">
                    <h3 className="text-lg font-medium text-gray-900">Team Settings</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Min Team Size <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          name="min_team_size"
                          value={eventDetails.min_team_size}
                          onChange={handleInputChange}
                          min="1"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        {validationErrors.min_team_size && (
                          <p className="text-red-500 text-sm mt-1">{validationErrors.min_team_size}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Max Team Size <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          name="max_team_size"
                          value={eventDetails.max_team_size}
                          onChange={handleInputChange}
                          min={eventDetails.min_team_size}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        {validationErrors.max_team_size && (
                          <p className="text-red-500 text-sm mt-1">{validationErrors.max_team_size}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Max Teams (Optional)
                        </label>
                        <input
                          type="number"
                          name="max_teams"
                          value={eventDetails.max_teams}
                          onChange={handleInputChange}
                          min="1"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Registration Period */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Registration Start <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="datetime-local"
                      name="registration_start_datetime"
                      value={eventDetails.registration_start_datetime}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    {validationErrors.registration_start_datetime && (
                      <p className="text-red-500 text-sm mt-1">{validationErrors.registration_start_datetime}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Registration End <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="datetime-local"
                      name="registration_end_datetime"
                      value={eventDetails.registration_end_datetime}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    {validationErrors.registration_end_datetime && (
                      <p className="text-red-500 text-sm mt-1">{validationErrors.registration_end_datetime}</p>
                    )}
                  </div>
                </div>

                {/* Next Button */}
                <div className="flex justify-end pt-4">
                  <button
                    type="button"
                    onClick={handleNext}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-medium transition duration-200 flex items-center space-x-2"
                  >
                    <span>Next: Build Registration Form</span>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Form Builder */}
            {step === 2 && (
              <div className="space-y-6">
                <FormBuilder formFields={formFields} setFormFields={setFormFields} />

                {validationErrors.formFields && (
                  <p className="text-red-500 text-sm">{validationErrors.formFields}</p>
                )}

                {/* Action Buttons */}
                <div className="flex justify-between pt-6 border-t">
                  <button
                    type="button"
                    onClick={handleBack}
                    className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-3 rounded-lg font-medium transition duration-200 flex items-center space-x-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 17l-5-5m0 0l5-5m-5 5h12" />
                    </svg>
                    <span>Back</span>
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg font-medium transition duration-200 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                        <span>Creating...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                        <span>Create Event</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateEvent;
