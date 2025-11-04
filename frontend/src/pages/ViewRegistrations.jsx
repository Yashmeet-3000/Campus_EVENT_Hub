import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getEventById, getUserRegistrations } from '../services/api';

/**
 * ViewRegistrations Page
 * Society heads view and manage registrations for their events
 */
const ViewRegistrations = () => {
  const { eventId } = useParams();
  
  // State management
  const [event, setEvent] = useState(null);
  const [registrations, setRegistrations] = useState([]);
  const [filteredRegistrations, setFilteredRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedRows, setExpandedRows] = useState(new Set());

  /**
   * Fetch event and registrations on mount
   */
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError('');
        
        // Fetch event details
        const eventResponse = await getEventById(eventId);
        setEvent(eventResponse.event);
        
        // Fetch registrations for this event
        try {
          const registrationsResponse = await getUserRegistrations({ event_id: eventId });
          const regs = registrationsResponse.registrations || [];
          setRegistrations(regs);
          setFilteredRegistrations(regs);
        } catch (regErr) {
          // If fetching registrations fails, set empty array (shows "No registrations yet")
          console.log('No registrations found or API error:', regErr);
          setRegistrations([]);
          setFilteredRegistrations([]);
        }
      } catch (err) {
        console.error('Fetch event error:', err);
        // Only set error if event fetch fails
        if (err.response?.status === 404) {
          setError('Event not found.');
        } else {
          setError('Failed to load event details. Please try again.');
        }
      } finally {
        setLoading(false);
      }
    };

    if (eventId) {
      fetchData();
    }
  }, [eventId]);

  /**
   * Filter registrations based on status and search term
   */
  useEffect(() => {
    let filtered = [...registrations];

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(reg => reg.status === statusFilter);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(reg => {
        const userName = reg.user?.name?.toLowerCase() || '';
        const teamName = reg.team_name?.toLowerCase() || '';
        const search = searchTerm.toLowerCase();
        return userName.includes(search) || teamName.includes(search);
      });
    }

    setFilteredRegistrations(filtered);
  }, [statusFilter, searchTerm, registrations]);

  /**
   * Toggle row expansion
   */
  const toggleRowExpansion = (regId) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(regId)) {
      newExpanded.delete(regId);
    } else {
      newExpanded.add(regId);
    }
    setExpandedRows(newExpanded);
  };

  /**
   * Get status badge
   */
  const getStatusBadge = (status) => {
    const statusColors = {
      pending: 'bg-yellow-100 text-yellow-700',
      confirmed: 'bg-green-100 text-green-700',
      waitlisted: 'bg-blue-100 text-blue-700',
      cancelled: 'bg-red-100 text-red-700'
    };
    
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[status] || 'bg-gray-100 text-gray-700'}`}>
        {status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Unknown'}
      </span>
    );
  };

  /**
   * Format date
   */
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
          <Link to="/society/dashboard" className="mt-4 inline-block text-blue-600 hover:text-blue-800">
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Back Button */}
        <div className="mb-4">
          <Link
            to="/society/dashboard"
            className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-800 transition duration-200"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>Back to Dashboard</span>
          </Link>
        </div>

        {/* Event Info Header */}
        {event && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{event.title}</h1>
                <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                  <span className="flex items-center">
                    <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {formatDate(event.start_datetime)}
                  </span>
                  <span className="flex items-center">
                    <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {event.venue}
                  </span>
                  <span className="capitalize flex items-center">
                    <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                    {event.event_type}
                  </span>
                </div>
              </div>
              <div className="mt-4 md:mt-0">
                <div className="text-center bg-blue-50 rounded-lg p-4">
                  <p className="text-sm font-medium text-gray-600">Total Registrations</p>
                  <p className="text-4xl font-bold text-blue-600">{registrations.length}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Status Filter */}
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="waitlisted">Waitlisted</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            {/* Search */}
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name or team name..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Registrations List */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Registrations ({filteredRegistrations.length})</h2>
          </div>

          {filteredRegistrations.length === 0 ? (
            <div className="p-12 text-center">
              <svg className="w-20 h-20 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <p className="text-gray-600 text-lg">No registrations yet</p>
              <p className="text-gray-500 text-sm mt-2">Registrations will appear here as students sign up</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredRegistrations.map((registration) => (
                <div key={registration.id} className="hover:bg-gray-50 transition duration-150">
                  {/* Main Row */}
                  <div
                    className="px-6 py-4 cursor-pointer"
                    onClick={() => toggleRowExpansion(registration.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        {/* Individual Registration */}
                        {event?.registration_mode === 'individual' ? (
                          <div>
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                                {registration.user?.name?.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-900">{registration.user?.name}</p>
                                <p className="text-sm text-gray-500">{registration.user?.email}</p>
                              </div>
                            </div>
                          </div>
                        ) : (
                          /* Team Registration */
                          <div>
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-900">{registration.team_name || 'Unnamed Team'}</p>
                                <p className="text-sm text-gray-500">
                                  Leader: {registration.user?.name} • {registration.team_members?.length || 0} members
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center space-x-4">
                        <div className="text-sm text-gray-500">
                          {formatDate(registration.created_at)}
                        </div>
                        {getStatusBadge(registration.status)}
                        <svg
                          className={`w-5 h-5 text-gray-400 transition-transform ${
                            expandedRows.has(registration.id) ? 'transform rotate-180' : ''
                          }`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {expandedRows.has(registration.id) && (
                    <div className="px-6 pb-4 bg-gray-50">
                      <div className="border-t pt-4 space-y-4">
                        {/* Team Members (for team events) */}
                        {event?.registration_mode === 'team' && registration.team_members && (
                          <div>
                            <h4 className="text-sm font-medium text-gray-900 mb-2">Team Members</h4>
                            <div className="space-y-2">
                              {registration.team_members.map((member, idx) => (
                                <div key={idx} className="flex items-center space-x-2 text-sm">
                                  <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center text-gray-700 text-xs">
                                    {member.name?.charAt(0).toUpperCase()}
                                  </div>
                                  <span className="text-gray-900">{member.name}</span>
                                  <span className="text-gray-500">({member.email})</span>
                                  <span className={`text-xs px-2 py-1 rounded ${
                                    member.invite_status === 'accepted'
                                      ? 'bg-green-100 text-green-700'
                                      : member.invite_status === 'declined'
                                      ? 'bg-red-100 text-red-700'
                                      : 'bg-yellow-100 text-yellow-700'
                                  }`}>
                                    {member.invite_status}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Form Answers */}
                        {registration.form_answers && registration.form_answers.length > 0 && (
                          <div>
                            <h4 className="text-sm font-medium text-gray-900 mb-2">Form Answers</h4>
                            <div className="space-y-2">
                              {registration.form_answers.map((answer, idx) => (
                                <div key={idx} className="text-sm">
                                  <span className="font-medium text-gray-700">{answer.question}: </span>
                                  <span className="text-gray-900">{answer.answer}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex space-x-2 pt-2">
                          <button
                            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition duration-200"
                            onClick={(e) => {
                              e.stopPropagation();
                              // Handle approve
                              alert('Approve functionality to be implemented');
                            }}
                          >
                            Approve
                          </button>
                          <button
                            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg transition duration-200"
                            onClick={(e) => {
                              e.stopPropagation();
                              // Handle reject
                              alert('Reject functionality to be implemented');
                            }}
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ViewRegistrations;
