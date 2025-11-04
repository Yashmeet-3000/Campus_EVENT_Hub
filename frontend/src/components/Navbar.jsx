import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Navbar Component
 * Responsive navigation bar with authentication state
 */
const Navbar = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  /**
   * Handle logout
   */
  const handleLogout = () => {
    logout();
    setIsMobileMenuOpen(false);
    navigate('/login');
  };

  /**
   * Toggle mobile menu
   */
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  /**
   * Close mobile menu
   */
  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <nav className="bg-gradient-to-r from-gray-900 to-blue-900 text-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo/Brand */}
          <Link
            to={isAuthenticated ? "/dashboard" : "/"}
            className="flex items-center space-x-2 group"
            onClick={closeMobileMenu}
          >
            <svg className="w-8 h-8 text-blue-400 group-hover:text-blue-300 transition" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
            </svg>
            <span className="text-xl font-bold group-hover:text-blue-300 transition">Campus Event Hub</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {isAuthenticated ? (
              <>
                {/* Role-based navigation for society_head and admin */}
                {user && (user.role === 'society_head' || user.role === 'admin') && (
                  <>
                    <Link
                      to="/society/dashboard"
                      className="hover:text-blue-300 transition duration-200 font-medium"
                    >
                      My Events
                    </Link>
                    <Link
                      to="/society/create-event"
                      className="hover:text-blue-300 transition duration-200 font-medium"
                    >
                      Create Event
                    </Link>
                  </>
                )}
                
                {/* Role-based navigation for students */}
                {user && user.role === 'student' && (
                  <>
                    <Link
                      to="/dashboard"
                      className="hover:text-blue-300 transition duration-200 font-medium"
                    >
                      Browse Events
                    </Link>
                    <Link
                      to="/my-registrations"
                      className="hover:text-blue-300 transition duration-200 font-medium"
                    >
                      My Registrations
                    </Link>
                    <Link
                      to="/bookmarks"
                      className="hover:text-blue-300 transition duration-200 font-medium"
                    >
                      Bookmarked Events
                    </Link>
                  </>
                )}

                {/* User Dropdown */}
                <div className="flex items-center space-x-4 ml-4 pl-4 border-l border-blue-700">
                  <Link
                    to="/profile"
                    className="flex items-center space-x-2 hover:text-blue-300 transition duration-200"
                  >
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center font-semibold">
                      {user?.name?.charAt(0).toUpperCase()}
                    </div>
                    <span className="font-medium">{user?.name}</span>
                  </Link>

                  <button
                    onClick={handleLogout}
                    className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg font-medium transition duration-200 flex items-center space-x-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    <span>Logout</span>
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="hover:text-blue-300 transition duration-200 font-medium"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg font-medium transition duration-200"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={toggleMobileMenu}
            className="md:hidden p-2 rounded-lg hover:bg-blue-800 transition duration-200"
          >
            {isMobileMenuOpen ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-blue-800">
            {isAuthenticated ? (
              <div className="space-y-3">
                {/* User Info */}
                <div className="flex items-center space-x-3 px-4 py-2 bg-blue-800 rounded-lg">
                  <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center font-semibold text-lg">
                    {user?.name?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold">{user?.name}</p>
                    <p className="text-sm text-blue-300">{user?.email}</p>
                  </div>
                </div>

                {/* Role-based navigation for society_head and admin */}
                {user && (user.role === 'society_head' || user.role === 'admin') && (
                  <>
                    <Link
                      to="/society/dashboard"
                      onClick={closeMobileMenu}
                      className="block px-4 py-2 hover:bg-blue-800 rounded-lg transition duration-200"
                    >
                      My Events
                    </Link>
                    <Link
                      to="/society/create-event"
                      onClick={closeMobileMenu}
                      className="block px-4 py-2 hover:bg-blue-800 rounded-lg transition duration-200"
                    >
                      Create Event
                    </Link>
                  </>
                )}
                
                {/* Role-based navigation for students */}
                {user && user.role === 'student' && (
                  <>
                    <Link
                      to="/dashboard"
                      onClick={closeMobileMenu}
                      className="block px-4 py-2 hover:bg-blue-800 rounded-lg transition duration-200"
                    >
                      Browse Events
                    </Link>
                    <Link
                      to="/my-registrations"
                      onClick={closeMobileMenu}
                      className="block px-4 py-2 hover:bg-blue-800 rounded-lg transition duration-200"
                    >
                      My Registrations
                    </Link>
                    <Link
                      to="/bookmarks"
                      onClick={closeMobileMenu}
                      className="block px-4 py-2 hover:bg-blue-800 rounded-lg transition duration-200"
                    >
                      My Registrations
                    </Link>
                  </>
                )}
                <Link
                  to="/profile"
                  onClick={closeMobileMenu}
                  className="block px-4 py-2 hover:bg-blue-800 rounded-lg transition duration-200"
                >
                  My Profile
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition duration-200 flex items-center space-x-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <Link
                  to="/login"
                  onClick={closeMobileMenu}
                  className="block px-4 py-2 hover:bg-blue-800 rounded-lg transition duration-200"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  onClick={closeMobileMenu}
                  className="block px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition duration-200 text-center font-medium"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
