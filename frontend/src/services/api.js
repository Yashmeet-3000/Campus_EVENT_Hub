import axios from 'axios';

/**
 * Axios instance configured for backend API
 * Base URL: http://localhost:5000/api
 * Timeout: 10 seconds
 */
const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

/**
 * Request interceptor
 * Automatically adds Authorization header with JWT token from localStorage
 */
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('campusEventToken');
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Response interceptor
 * Handles common error responses
 */
api.interceptors.response.use(
  (response) => {
    // Return only the data portion of the response
    return response.data;
  },
  (error) => {
    // Handle specific error cases
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;
      
      if (status === 401) {
        // Unauthorized - clear token and redirect to login
        localStorage.removeItem('campusEventToken');
        window.location.href = '/login';
      }
      
      // Attach error message to error object
      error.message = data.message || 'An error occurred';
    } else if (error.request) {
      // Request was made but no response received
      error.message = 'No response from server. Please check your connection.';
    } else {
      // Error in setting up the request
      error.message = 'Request failed. Please try again.';
    }
    
    return Promise.reject(error);
  }
);

// =====================
// Authentication APIs
// =====================

/**
 * Register a new user
 * 
 * @param {Object} userData - User registration data
 * @param {string} userData.name - User's full name
 * @param {string} userData.email - User's email
 * @param {string} userData.password - User's password
 * @param {string} [userData.phone] - User's phone number
 * @param {number} [userData.year_of_study] - Year of study (1-5)
 * @param {string} [userData.branch] - Academic branch
 * @returns {Promise<Object>} Registration response with user data
 */
export const registerUser = async (userData) => {
  try {
    const response = await api.post('/auth/register', userData);
    return response;
  } catch (error) {
    console.error('Register API error:', error.message);
    throw error;
  }
};

/**
 * Login user with credentials
 * 
 * @param {Object} credentials - Login credentials
 * @param {string} credentials.email - User's email
 * @param {string} credentials.password - User's password
 * @returns {Promise<Object>} Login response with token and user data
 */
export const loginUser = async (credentials) => {
  try {
    const response = await api.post('/auth/login', credentials);
    return response;
  } catch (error) {
    console.error('Login API error:', error.message);
    throw error;
  }
};

/**
 * Get current logged-in user profile
 * Requires authentication token
 * 
 * @returns {Promise<Object>} User profile data
 */
export const getMe = async () => {
  try {
    const response = await api.get('/auth/me');
    return response;
  } catch (error) {
    console.error('Get profile API error:', error.message);
    throw error;
  }
};

/**
 * Search users by name or email
 * Requires authentication
 * 
 * @param {string} query - Search query
 * @returns {Promise<Object>} List of matching users
 */
export const searchUsers = async (query) => {
  try {
    const response = await api.get(`/auth/search?query=${encodeURIComponent(query)}`);
    return response;
  } catch (error) {
    console.error('Search users API error:', error.message);
    throw error;
  }
};

// =====================
// Events APIs
// =====================

/**
 * Get all events with optional filters
 * 
 * @param {Object} [filters={}] - Filter parameters
 * @param {string} [filters.event_type] - Event type filter
 * @param {string} [filters.event_status] - Event status filter
 * @param {string} [filters.society_id] - Society ID filter
 * @param {number} [filters.skip] - Pagination skip
 * @param {number} [filters.limit] - Pagination limit
 * @returns {Promise<Object>} Events list with pagination info
 */
export const getAllEvents = async (filters = {}) => {
  try {
    const params = new URLSearchParams();
    
    Object.keys(filters).forEach(key => {
      if (filters[key]) {
        params.append(key, filters[key]);
      }
    });
    
    const response = await api.get(`/events?${params.toString()}`);
    return response;
  } catch (error) {
    console.error('Get events API error:', error.message);
    throw error;
  }
};

/**
 * Get single event by ID
 * 
 * @param {string} eventId - Event ID
 * @returns {Promise<Object>} Event details
 */
export const getEventById = async (eventId) => {
  try {
    const response = await api.get(`/events/${eventId}`);
    return response;
  } catch (error) {
    console.error('Get event API error:', error.message);
    throw error;
  }
};

/**
 * Create a new event
 * Requires authentication (society_head or admin)
 * 
 * @param {Object} eventData - Event data
 * @returns {Promise<Object>} Created event
 */
export const createEvent = async (eventData) => {
  try {
    const response = await api.post('/events', eventData);
    return response;
  } catch (error) {
    console.error('Create event API error:', error.message);
    throw error;
  }
};

/**
 * Update an existing event
 * Requires authentication (organizer or admin)
 * 
 * @param {string} eventId - Event ID
 * @param {Object} eventData - Updated event data
 * @returns {Promise<Object>} Updated event
 */
export const updateEvent = async (eventId, eventData) => {
  try {
    const response = await api.put(`/events/${eventId}`, eventData);
    return response;
  } catch (error) {
    console.error('Update event API error:', error.message);
    throw error;
  }
};

/**
 * Delete (cancel) an event
 * Requires authentication (organizer or admin)
 * 
 * @param {string} eventId - Event ID
 * @returns {Promise<Object>} Deletion confirmation
 */
export const deleteEvent = async (eventId) => {
  try {
    const response = await api.delete(`/events/${eventId}`);
    return response;
  } catch (error) {
    console.error('Delete event API error:', error.message);
    throw error;
  }
};

/**
 * Get event form fields
 * 
 * @param {string} eventId - Event ID
 * @returns {Promise<Object>} Form fields configuration
 */
export const getEventFormFields = async (eventId) => {
  try {
    const response = await api.get(`/events/${eventId}/form-fields`);
    return response;
  } catch (error) {
    console.error('Get form fields API error:', error.message);
    throw error;
  }
};

/**
 * Get events created by current user
 * Requires authentication (society_head or admin)
 * 
 * @returns {Promise<Object>} User's events
 */
export const getMyEvents = async () => {
  try {
    const response = await api.get('/events/my-events');
    return response;
  } catch (error) {
    console.error('Get my events API error:', error.message);
    throw error;
  }
};

// =====================
// Registrations APIs
// =====================

/**
 * Register for an event
 * Requires authentication
 * 
 * @param {Object} registrationData - Registration data
 * @param {string} registrationData.event_id - Event ID
 * @param {Array} [registrationData.form_answers] - Form answers
 * @param {Array} [registrationData.team_members] - Team member IDs (for team events)
 * @param {string} [registrationData.team_name] - Team name (for team events)
 * @returns {Promise<Object>} Registration confirmation
 */
export const registerForEvent = async (registrationData) => {
  try {
    const response = await api.post('/registrations', registrationData);
    return response;
  } catch (error) {
    console.error('Register for event API error:', error.message);
    throw error;
  }
};

/**
 * Get user's registrations
 * Requires authentication
 * 
 * @param {Object} [filters={}] - Filter parameters
 * @param {string} [filters.event_id] - Filter by event ID
 * @param {string} [filters.status] - Filter by status
 * @returns {Promise<Object>} User's registrations
 */
export const getUserRegistrations = async (filters = {}) => {
  try {
    const params = new URLSearchParams();
    
    Object.keys(filters).forEach(key => {
      if (filters[key]) {
        params.append(key, filters[key]);
      }
    });
    
    const response = await api.get(`/registrations?${params.toString()}`);
    return response;
  } catch (error) {
    console.error('Get registrations API error:', error.message);
    throw error;
  }
};

/**
 * Get single registration by ID
 * Requires authentication
 * 
 * @param {string} registrationId - Registration ID
 * @returns {Promise<Object>} Registration details
 */
export const getRegistrationById = async (registrationId) => {
  try {
    const response = await api.get(`/registrations/${registrationId}`);
    return response;
  } catch (error) {
    console.error('Get registration API error:', error.message);
    throw error;
  }
};

/**
 * Get pending team invitations for current user
 * Requires authentication
 * 
 * @returns {Promise<Object>} List of pending invitations
 */
export const getPendingInvitations = async () => {
  try {
    const response = await api.get('/registrations/invitations/pending');
    return response;
  } catch (error) {
    console.error('Get pending invitations API error:', error.message);
    throw error;
  }
};

/**
 * Accept or decline team invitation
 * Requires authentication
 * 
 * @param {string} registrationId - Registration ID
 * @param {string} action - 'accept' or 'decline'
 * @returns {Promise<Object>} Updated registration
 */
export const respondToInvitation = async (registrationId, action) => {
  try {
    const response = await api.put(
      `/registrations/${registrationId}/invitation`,
      { action }
    );
    return response;
  } catch (error) {
    console.error('Respond to invitation API error:', error.message);
    throw error;
  }
};

/**
 * Add team members to existing registration (team leader only)
 * Requires authentication
 * 
 * @param {string} registrationId - Registration ID
 * @param {Array} membersToAdd - Array of user objects {_id, name, email}
 * @returns {Promise<Object>} Updated registration
 */
export const addTeamMembers = async (registrationId, membersToAdd) => {
  try {
    const response = await api.post(
      `/registrations/${registrationId}/members`,
      { members_to_add: membersToAdd }
    );
    return response;
  } catch (error) {
    console.error('Add team members API error:', error.message);
    throw error;
  }
};

/**
 * Remove team member from registration (team leader only)
 * Requires authentication
 * 
 * @param {string} registrationId - Registration ID
 * @param {string} memberId - Member user ID to remove
 * @returns {Promise<Object>} Updated registration
 */
export const removeTeamMember = async (registrationId, memberId) => {
  try {
    const response = await api.delete(
      `/registrations/${registrationId}/members/${memberId}`
    );
    return response;
  } catch (error) {
    console.error('Remove team member API error:', error.message);
    throw error;
  }
};

/**
 * Update team member invite status
 * Requires authentication
 * 
 * @param {string} registrationId - Registration ID
 * @param {string} memberId - Member user ID
 * @param {string} inviteStatus - 'accepted' or 'declined'
 * @returns {Promise<Object>} Updated registration
 */
export const updateMemberStatus = async (registrationId, memberId, inviteStatus) => {
  try {
    const response = await api.put(
      `/registrations/${registrationId}/members/${memberId}`,
      { invite_status: inviteStatus }
    );
    return response;
  } catch (error) {
    console.error('Update member status API error:', error.message);
    throw error;
  }
};

// =====================
// Bookmarks APIs
// =====================

/**
 * Bookmark an event
 * Requires authentication
 * 
 * @param {string} eventId - Event ID to bookmark
 * @returns {Promise<Object>} Bookmark confirmation
 */
export const bookmarkEvent = async (eventId) => {
  try {
    const response = await api.post('/bookmarks', { event_id: eventId });
    return response;
  } catch (error) {
    console.error('Bookmark event API error:', error.message);
    throw error;
  }
};

/**
 * Get user's bookmarked events
 * Requires authentication
 * 
 * @returns {Promise<Object>} List of bookmarked events
 */
export const getBookmarks = async () => {
  try {
    const response = await api.get('/bookmarks');
    return response;
  } catch (error) {
    console.error('Get bookmarks API error:', error.message);
    throw error;
  }
};

/**
 * Remove bookmark from event
 * Requires authentication
 * 
 * @param {string} eventId - Event ID to unbookmark
 * @returns {Promise<Object>} Unbookmark confirmation
 */
export const removeBookmark = async (eventId) => {
  try {
    const response = await api.delete(`/bookmarks/${eventId}`);
    return response;
  } catch (error) {
    console.error('Remove bookmark API error:', error.message);
    throw error;
  }
};

/**
 * Check if event is bookmarked
 * Requires authentication
 * 
 * @param {string} eventId - Event ID to check
 * @returns {Promise<Object>} Bookmark status
 */
export const checkBookmark = async (eventId) => {
  try {
    const response = await api.get(`/bookmarks/check/${eventId}`);
    return response;
  } catch (error) {
    console.error('Check bookmark API error:', error.message);
    throw error;
  }
};

/**
 * Cancel a registration
 * Requires authentication
 * 
 * @param {string} registrationId - Registration ID
 * @returns {Promise<Object>} Cancellation confirmation
 */
export const cancelRegistration = async (registrationId) => {
  try {
    const response = await api.delete(`/registrations/${registrationId}`);
    return response;
  } catch (error) {
    console.error('Cancel registration API error:', error.message);
    throw error;
  }
};

/**
 * Update registration status
 * Requires authentication (organizer or admin)
 * 
 * @param {string} registrationId - Registration ID
 * @param {string} status - New status (pending, confirmed, waitlisted, cancelled)
 * @returns {Promise<Object>} Updated registration
 */
export const updateRegistrationStatus = async (registrationId, status) => {
  try {
    const response = await api.put(`/registrations/${registrationId}`, { status });
    return response;
  } catch (error) {
    console.error('Update registration status API error:', error.message);
    throw error;
  }
};

export default api;
