import toast from 'react-hot-toast';

/**
 * Notification Service
 * Wraps react-hot-toast for consistent notifications across the app
 */

/**
 * Show success notification
 * @param {string} message - Success message to display
 * @returns {string} Toast ID for potential updates
 */
export const notifySuccess = (message) => {
  return toast.success(message, {
    duration: 4000,
    style: {
      background: '#10B981',
      color: '#fff',
      padding: '16px',
      borderRadius: '8px',
    },
    iconTheme: {
      primary: '#fff',
      secondary: '#10B981',
    },
  });
};

/**
 * Show error notification
 * @param {string} message - Error message to display
 * @returns {string} Toast ID for potential updates
 */
export const notifyError = (message) => {
  return toast.error(message, {
    duration: 5000,
    style: {
      background: '#EF4444',
      color: '#fff',
      padding: '16px',
      borderRadius: '8px',
    },
    iconTheme: {
      primary: '#fff',
      secondary: '#EF4444',
    },
  });
};

/**
 * Show loading notification
 * @param {string} message - Loading message to display
 * @returns {string} Toast ID for updating later
 */
export const notifyLoading = (message) => {
  return toast.loading(message, {
    style: {
      background: '#3B82F6',
      color: '#fff',
      padding: '16px',
      borderRadius: '8px',
    },
  });
};

/**
 * Show info notification
 * @param {string} message - Info message to display
 * @returns {string} Toast ID for potential updates
 */
export const notifyInfo = (message) => {
  return toast(message, {
    duration: 4000,
    icon: 'ℹ️',
    style: {
      background: '#3B82F6',
      color: '#fff',
      padding: '16px',
      borderRadius: '8px',
    },
  });
};

/**
 * Show warning notification
 * @param {string} message - Warning message to display
 * @returns {string} Toast ID for potential updates
 */
export const notifyWarning = (message) => {
  return toast(message, {
    duration: 4000,
    icon: '⚠️',
    style: {
      background: '#F59E0B',
      color: '#fff',
      padding: '16px',
      borderRadius: '8px',
    },
  });
};

/**
 * Update an existing notification
 * @param {string} toastId - ID of the toast to update
 * @param {string} message - New message to display
 * @param {string} type - Type of notification: 'success', 'error', 'loading', 'info'
 */
export const updateNotification = (toastId, message, type = 'success') => {
  const options = {
    id: toastId,
  };

  switch (type) {
    case 'success':
      toast.success(message, options);
      break;
    case 'error':
      toast.error(message, options);
      break;
    case 'loading':
      toast.loading(message, options);
      break;
    case 'info':
      toast(message, { ...options, icon: 'ℹ️' });
      break;
    default:
      toast(message, options);
  }
};

/**
 * Dismiss a specific notification
 * @param {string} toastId - ID of the toast to dismiss
 */
export const dismissNotification = (toastId) => {
  toast.dismiss(toastId);
};

/**
 * Dismiss all notifications
 */
export const dismissAllNotifications = () => {
  toast.dismiss();
};

/**
 * Promise-based notification
 * Automatically shows loading, then success or error
 * @param {Promise} promise - Promise to track
 * @param {Object} messages - Messages for loading, success, error states
 */
export const notifyPromise = (promise, messages) => {
  return toast.promise(
    promise,
    {
      loading: messages.loading || 'Loading...',
      success: messages.success || 'Success!',
      error: messages.error || 'Something went wrong',
    },
    {
      style: {
        padding: '16px',
        borderRadius: '8px',
      },
      success: {
        duration: 4000,
        style: {
          background: '#10B981',
          color: '#fff',
        },
      },
      error: {
        duration: 5000,
        style: {
          background: '#EF4444',
          color: '#fff',
        },
      },
    }
  );
};
