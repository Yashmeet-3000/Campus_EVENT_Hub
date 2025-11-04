/**
 * Theme Utilities
 * Reusable Tailwind CSS class combinations for consistent styling
 */

// Button Styles
export const primaryButton = "bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none";

export const secondaryButton = "bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-6 rounded-lg transition duration-200 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";

export const dangerButton = "bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-6 rounded-lg transition duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none";

export const successButton = "bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-6 rounded-lg transition duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none";

export const outlineButton = "border-2 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white font-semibold py-2 px-6 rounded-lg transition duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";

export const linkButton = "text-blue-600 hover:text-blue-700 font-medium underline-offset-4 hover:underline transition duration-200 focus:outline-none";

// Input Field Styles
export const inputField = "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 outline-none disabled:bg-gray-100 disabled:cursor-not-allowed";

export const inputFieldError = "w-full px-4 py-2 border-2 border-red-500 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition duration-200 outline-none";

export const textareaField = "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 outline-none resize-none disabled:bg-gray-100 disabled:cursor-not-allowed";

export const selectField = "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 outline-none disabled:bg-gray-100 disabled:cursor-not-allowed cursor-pointer";

// Container Styles
export const cardContainer = "bg-white rounded-lg shadow-md hover:shadow-lg transition duration-300 overflow-hidden";

export const pageContainer = "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8";

export const sectionContainer = "mb-8 p-6 bg-white rounded-lg shadow";

export const modalContainer = "bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full";

// Badge Styles
export const badge = "inline-flex items-center px-3 py-1 rounded-full text-sm font-medium";

export const badgeSuccess = "inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800";

export const badgeError = "inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800";

export const badgeWarning = "inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800";

export const badgeInfo = "inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800";

export const badgeGray = "inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800";

// Text Styles
export const headingXL = "text-4xl font-bold text-gray-900 mb-4";

export const headingLG = "text-3xl font-bold text-gray-900 mb-3";

export const headingMD = "text-2xl font-bold text-gray-900 mb-2";

export const headingSM = "text-xl font-semibold text-gray-900 mb-2";

export const bodyText = "text-base text-gray-700 leading-relaxed";

export const captionText = "text-sm text-gray-500";

export const linkText = "text-blue-600 hover:text-blue-800 transition duration-200";

// Form Styles
export const formLabel = "block text-sm font-medium text-gray-700 mb-2";

export const formError = "text-sm text-red-600 mt-1";

export const formGroup = "mb-6";

// Alert Styles
export const alertSuccess = "bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg";

export const alertError = "bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg";

export const alertWarning = "bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-lg";

export const alertInfo = "bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg";

// Table Styles
export const tableHeader = "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50";

export const tableRow = "hover:bg-gray-50 transition duration-150";

export const tableCell = "px-6 py-4 whitespace-nowrap text-sm text-gray-900";

// Loading/Skeleton Styles
export const skeleton = "bg-gray-200 rounded animate-pulse";

// Divider
export const divider = "border-t border-gray-200 my-6";

// Colors (for direct use)
export const colors = {
  primary: {
    50: '#EFF6FF',
    100: '#DBEAFE',
    200: '#BFDBFE',
    300: '#93C5FD',
    400: '#60A5FA',
    500: '#3B82F6',
    600: '#2563EB',
    700: '#1D4ED8',
    800: '#1E40AF',
    900: '#1E3A8A',
  },
  success: '#10B981',
  error: '#EF4444',
  warning: '#F59E0B',
  info: '#3B82F6',
  gray: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
  },
};
