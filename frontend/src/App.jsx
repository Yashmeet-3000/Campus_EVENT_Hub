import { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, Link } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { getUserRegistrations, getPendingInvitations, respondToInvitation, addTeamMembers, removeTeamMember, searchUsers, getBookmarks, removeBookmark } from './services/api';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import EventDetail from './pages/EventDetail';
import SocietyDashboard from './pages/SocietyDashboard';
import CreateEvent from './pages/CreateEvent';
import ViewRegistrations from './pages/ViewRegistrations';
import DashboardRedirect from './components/DashboardRedirect';

/**
 * ProtectedRoute Component
 * Wrapper for routes that require authentication
 */
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

/**
 * PublicRoute Component
 * Wrapper for routes that should redirect authenticated users
 */
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
      </div>
    );
  }

  if (isAuthenticated) {
    // Redirect to appropriate dashboard based on role
    return <DashboardRedirect />;
  }

  return <div key={location.pathname}>{children}</div>;
};

const MyRegistrations = () => {
  const { user } = useAuth();
  const [registrations, setRegistrations] = useState([]);
  const [pendingInvitations, setPendingInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(null);
  
  // Team management modal state
  const [managingTeam, setManagingTeam] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const searchRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [regResponse, invResponse] = await Promise.all([
          getUserRegistrations(),
          getPendingInvitations()
        ]);
        setRegistrations(regResponse.registrations || []);
        setPendingInvitations(invResponse.invitations || []);
      } catch (err) {
        setError('Failed to load data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleInvitationResponse = async (registrationId, action) => {
    try {
      setActionLoading(registrationId);
      await respondToInvitation(registrationId, action);
      
      // Refresh data
      const [regResponse, invResponse] = await Promise.all([
        getUserRegistrations(),
        getPendingInvitations()
      ]);
      setRegistrations(regResponse.registrations || []);
      setPendingInvitations(invResponse.invitations || []);
    } catch (err) {
      alert(`Failed to ${action} invitation`);
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  // Search users for team management
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
        const filtered = response.users.filter(
          u => !managingTeam?.members?.find(m => m.user_id?._id === u._id)
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
  }, [searchQuery, managingTeam]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAddMember = async (userToAdd) => {
    try {
      setActionLoading('adding');
      await addTeamMembers(managingTeam._id, [userToAdd]);
      
      // Refresh data
      const response = await getUserRegistrations();
      setRegistrations(response.registrations || []);
      const updated = response.registrations.find(r => r._id === managingTeam._id);
      setManagingTeam(updated);
      setSearchQuery('');
      setSearchResults([]);
    } catch (err) {
      alert(err.message || 'Failed to add member');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRemoveMember = async (memberId) => {
    if (!window.confirm('Are you sure you want to remove this member?')) return;
    
    try {
      setActionLoading(memberId);
      await removeTeamMember(managingTeam._id, memberId);
      
      // Refresh data
      const response = await getUserRegistrations();
      setRegistrations(response.registrations || []);
      const updated = response.registrations.find(r => r._id === managingTeam._id);
      setManagingTeam(updated);
    } catch (err) {
      alert(err.message || 'Failed to remove member');
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">My Registrations</h1>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Pending Team Invitations */}
        {pendingInvitations.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Pending Team Invitations</h2>
            <div className="space-y-4">
              {pendingInvitations.map((invitation) => (
                <div key={invitation._id} className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-6 shadow-md">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 mb-2">
                        {invitation.event_id?.title}
                      </h3>
                      <p className="text-gray-700 mb-3">
                        <span className="font-semibold">{invitation.leader_user_id?.name}</span> invited you to join team <span className="font-semibold">{invitation.team_name}</span>
                      </p>
                      <div className="flex items-center text-sm text-gray-600 space-x-4">
                        <div className="flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          {formatDate(invitation.event_id?.start_datetime)}
                        </div>
                        <div className="flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          </svg>
                          {invitation.event_id?.venue}
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-2 ml-4">
                      <button
                        onClick={() => handleInvitationResponse(invitation._id, 'accept')}
                        disabled={actionLoading === invitation._id}
                        className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-semibold transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {actionLoading === invitation._id ? 'Processing...' : 'Accept'}
                      </button>
                      <button
                        onClick={() => handleInvitationResponse(invitation._id, 'decline')}
                        disabled={actionLoading === invitation._id}
                        className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-semibold transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* My Registrations */}
        <h2 className="text-2xl font-bold text-gray-900 mb-4">My Registrations</h2>
        {registrations.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <svg className="w-20 h-20 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            <p className="text-gray-600 text-lg">You haven't registered for any events yet</p>
            <Link to="/dashboard" className="mt-4 inline-block text-blue-600 hover:text-blue-800">
              Browse Events
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {registrations.map((reg) => (
              <div key={reg._id} className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition duration-200">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-xl font-bold text-gray-900">{reg.event_id?.title}</h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      reg.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                      reg.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                      reg.status === 'waitlisted' ? 'bg-blue-100 text-blue-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {reg.status}
                    </span>
                  </div>
                  
                  <div className="space-y-2 text-sm text-gray-600 mb-4">
                    <div className="flex items-center">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {formatDate(reg.event_id?.start_datetime)}
                    </div>
                    <div className="flex items-center">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      </svg>
                      {reg.event_id?.venue}
                    </div>
                    {reg.mode === 'team' && reg.team_name && (
                      <>
                        <div className="flex items-center">
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                          Team: {reg.team_name}
                        </div>
                        {reg.members && reg.members.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <p className="text-xs font-semibold text-gray-700 mb-2">Team Members:</p>
                            <div className="space-y-1">
                              {reg.members.map((member, idx) => (
                                <div key={idx} className="flex items-center justify-between text-xs">
                                  <span className="text-gray-700">
                                    {member.user_id?.name || member.name || member.email}
                                    {member.role === 'leader' && <span className="ml-1 text-blue-600">(Leader)</span>}
                                  </span>
                                  <span className={`px-2 py-0.5 rounded text-xs ${
                                    member.invite_status === 'accepted' || member.invite_status === 'auto_added' ? 'bg-green-100 text-green-700' :
                                    member.invite_status === 'declined' ? 'bg-red-100 text-red-700' :
                                    'bg-yellow-100 text-yellow-700'
                                  }`}>
                                    {member.invite_status === 'auto_added' ? 'Leader' : member.invite_status}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Link
                      to={`/events/${reg.event_id?._id}`}
                      className="block w-full text-center bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium transition duration-200"
                    >
                      View Event Details
                    </Link>
                    {reg.mode === 'team' && reg.leader_user_id?._id === user?.id && (
                      <button
                        onClick={() => setManagingTeam(reg)}
                        className="block w-full text-center bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg font-medium transition duration-200"
                      >
                        Manage Team
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Team Management Modal */}
        {managingTeam && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-900">Manage Team: {managingTeam.team_name}</h2>
                  <button
                    onClick={() => {
                      setManagingTeam(null);
                      setSearchQuery('');
                      setSearchResults([]);
                    }}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <p className="text-sm text-gray-600 mt-2">{managingTeam.event_id?.title}</p>
              </div>

              <div className="p-6">
                {/* Current Team Members */}
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-900 mb-3">Current Team Members ({managingTeam.members?.length || 0})</h3>
                  <div className="space-y-2">
                    {managingTeam.members?.map((member) => (
                      <div key={member.user_id?._id || member.email} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">
                            {member.user_id?.name || member.name || member.email}
                            {member.role === 'leader' && <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">Leader</span>}
                          </p>
                          <p className="text-sm text-gray-600">{member.user_id?.email || member.email}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`text-xs px-2 py-1 rounded ${
                            member.invite_status === 'accepted' || member.invite_status === 'auto_added' ? 'bg-green-100 text-green-700' :
                            member.invite_status === 'declined' ? 'bg-red-100 text-red-700' :
                            'bg-yellow-100 text-yellow-700'
                          }`}>
                            {member.invite_status === 'auto_added' ? 'Leader' : member.invite_status}
                          </span>
                          {member.role !== 'leader' && (
                            <button
                              onClick={() => handleRemoveMember(member.user_id?._id)}
                              disabled={actionLoading === member.user_id?._id}
                              className="text-red-600 hover:text-red-800 disabled:opacity-50"
                              title="Remove member"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Add New Member */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Add New Member</h3>
                  <div className="relative" ref={searchRef}>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search by name or email..."
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      disabled={actionLoading === 'adding'}
                    />
                    {isSearching && (
                      <div className="absolute right-3 top-3">
                        <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                      </div>
                    )}
                    {showDropdown && searchResults.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {searchResults.map((u) => (
                          <button
                            key={u._id}
                            type="button"
                            onClick={() => handleAddMember(u)}
                            className="w-full px-4 py-3 text-left hover:bg-blue-50 transition duration-150 border-b border-gray-100 last:border-b-0"
                          >
                            <div className="font-medium text-gray-900">{u.name}</div>
                            <div className="text-sm text-gray-600">{u.email}</div>
                          </button>
                        ))}
                      </div>
                    )}
                    {showDropdown && searchQuery.length >= 2 && searchResults.length === 0 && !isSearching && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg px-4 py-3 text-gray-500 text-sm">
                        No users found
                      </div>
                    )}
                  </div>
                  {searchQuery.length < 2 && (
                    <p className="text-xs text-gray-500 mt-2">Type at least 2 characters to search</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const BookmarkedEvents = () => {
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchBookmarks = async () => {
      try {
        setLoading(true);
        const response = await getBookmarks();
        setBookmarks(response.bookmarks || []);
      } catch (err) {
        setError('Failed to load bookmarks');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchBookmarks();
  }, []);

  const handleRemoveBookmark = async (eventId) => {
    try {
      await removeBookmark(eventId);
      setBookmarks(bookmarks.filter(b => b.event_id?._id !== eventId));
    } catch (err) {
      alert('Failed to remove bookmark');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Bookmarked Events</h1>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {bookmarks.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <svg className="w-20 h-20 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
            <p className="text-gray-600 text-lg">No bookmarked events yet</p>
            <Link to="/dashboard" className="mt-4 inline-block text-blue-600 hover:text-blue-800">
              Browse Events
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {bookmarks.map((bookmark) => (
              <div key={bookmark._id} className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition duration-200">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-xl font-bold text-gray-900 flex-1">{bookmark.event_id?.title}</h3>
                    <button
                      onClick={() => handleRemoveBookmark(bookmark.event_id?._id)}
                      className="text-red-600 hover:text-red-800 ml-2"
                      title="Remove bookmark"
                    >
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
                      </svg>
                    </button>
                  </div>
                  
                  <div className="space-y-2 text-sm text-gray-600 mb-4">
                    <div className="flex items-center">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                      <span className="capitalize">{bookmark.event_id?.event_type}</span>
                    </div>
                    <div className="flex items-center">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {formatDate(bookmark.event_id?.start_datetime)}
                    </div>
                    <div className="flex items-center">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      </svg>
                      {bookmark.event_id?.venue}
                    </div>
                  </div>

                  <Link
                    to={`/events/${bookmark.event_id?._id}`}
                    className="block w-full text-center bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium transition duration-200"
                  >
                    View Event Details
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const Profile = () => {
  const { user } = useAuth();
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">My Profile</h1>
        <div className="bg-white rounded-lg shadow p-8">
          <div className="flex items-center space-x-4 mb-6">
            <div className="w-20 h-20 bg-blue-500 rounded-full flex items-center justify-center text-white text-3xl font-bold">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{user?.name}</h2>
              <p className="text-gray-600">{user?.email}</p>
            </div>
          </div>
          <div className="border-t pt-6 space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Role</label>
              <p className="text-lg text-gray-900 capitalize">{user?.role}</p>
            </div>
            {user?.phone && (
              <div>
                <label className="text-sm font-medium text-gray-500">Phone</label>
                <p className="text-lg text-gray-900">{user.phone}</p>
              </div>
            )}
            {user?.branch && (
              <div>
                <label className="text-sm font-medium text-gray-500">Branch</label>
                <p className="text-lg text-gray-900">{user.branch}</p>
              </div>
            )}
            {user?.year_of_study && (
              <div>
                <label className="text-sm font-medium text-gray-500">Year of Study</label>
                <p className="text-lg text-gray-900">{user.year_of_study}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const NotFound = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <h1 className="text-9xl font-bold text-gray-300">404</h1>
      <h2 className="text-3xl font-bold text-gray-900 mb-4">Page Not Found</h2>
      <p className="text-gray-600 mb-8">The page you're looking for doesn't exist.</p>
      <a href="/" className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition duration-200">
        Go to Home
      </a>
    </div>
  </div>
);

/**
 * Layout wrapper for authenticated pages
 */
const AuthenticatedLayout = ({ children }) => (
  <div className="flex flex-col min-h-screen">
    <Navbar />
    <main className="flex-grow">
      {children}
    </main>
    <footer className="bg-gray-900 text-white py-8 mt-auto">
      <div className="max-w-7xl mx-auto px-4 text-center">
        <p className="text-gray-400">© 2025 Campus Event Hub. All rights reserved.</p>
      </div>
    </footer>
  </div>
);

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes - No Layout - Full Width */}
      <Route path="/login" element={<PublicRoute><div className="w-full"><Login /></div></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><div className="w-full"><Register /></div></PublicRoute>} />
      
      {/* Protected Routes - With Layout */}
      <Route path="/dashboard" element={<ProtectedRoute><AuthenticatedLayout><Dashboard /></AuthenticatedLayout></ProtectedRoute>} />
      <Route path="/events/:eventId" element={<ProtectedRoute><AuthenticatedLayout><EventDetail /></AuthenticatedLayout></ProtectedRoute>} />
      <Route path="/my-registrations" element={<ProtectedRoute><AuthenticatedLayout><MyRegistrations /></AuthenticatedLayout></ProtectedRoute>} />
      <Route path="/bookmarks" element={<ProtectedRoute><AuthenticatedLayout><BookmarkedEvents /></AuthenticatedLayout></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><AuthenticatedLayout><Profile /></AuthenticatedLayout></ProtectedRoute>} />
      
      {/* Society Head Routes */}
      <Route path="/society/dashboard" element={<ProtectedRoute><AuthenticatedLayout><SocietyDashboard /></AuthenticatedLayout></ProtectedRoute>} />
      <Route path="/society/create-event" element={<ProtectedRoute><AuthenticatedLayout><CreateEvent /></AuthenticatedLayout></ProtectedRoute>} />
      <Route path="/society/events/:eventId/registrations" element={<ProtectedRoute><AuthenticatedLayout><ViewRegistrations /></AuthenticatedLayout></ProtectedRoute>} />
      
      {/* Default Route */}
      <Route path="/" element={<DashboardRedirect />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <Toaster 
          position="top-right"
          reverseOrder={false}
          gutter={8}
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
          }}
        />
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}

export default App;
