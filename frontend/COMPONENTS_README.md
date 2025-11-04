# UI Components & Utilities Guide

## 🎨 New Components Added

### 1. LoadingSpinner (`components/LoadingSpinner.jsx`)
Reusable loading spinner with size variations.

**Usage:**
```jsx
import LoadingSpinner from './components/LoadingSpinner';

// Default (medium size)
<LoadingSpinner />

// With custom message
<LoadingSpinner message="Loading events..." />

// Different sizes
<LoadingSpinner size="sm" message="Loading..." />
<LoadingSpinner size="lg" message="Please wait..." />
```

**Props:**
- `message` (string, optional): Loading text (default: "Loading...")
- `size` (string, optional): 'sm', 'md', 'lg' (default: 'md')

---

### 2. ErrorAlert (`components/ErrorAlert.jsx`)
Dismissible alert component for different message types.

**Usage:**
```jsx
import ErrorAlert from './components/ErrorAlert';

// Error alert
<ErrorAlert 
  message="Something went wrong!" 
  type="error" 
  onClose={() => setError('')} 
/>

// Success alert
<ErrorAlert 
  message="Event created successfully!" 
  type="success" 
  onClose={() => setSuccess('')} 
/>

// Warning alert
<ErrorAlert 
  message="Registration closing soon" 
  type="warning" 
/>

// Info alert
<ErrorAlert 
  message="Please complete your profile" 
  type="info" 
/>
```

**Props:**
- `message` (string, required): Alert message
- `type` (string, optional): 'error', 'warning', 'info', 'success' (default: 'error')
- `onClose` (function, optional): Callback when dismissed

---

### 3. Skeleton (`components/Skeleton.jsx`)
Loading placeholder with pulse animation.

**Usage:**
```jsx
import Skeleton from './components/Skeleton';

// Text skeleton (3 lines by default)
<Skeleton type="text" count={5} />

// Card skeleton (for event cards)
<Skeleton type="card" />

// Image skeleton
<Skeleton type="image" />

// Table skeleton (3 rows by default)
<Skeleton type="table" count={5} />

// Profile skeleton
<Skeleton type="profile" />
```

**Props:**
- `type` (string, optional): 'text', 'card', 'image', 'table', 'profile' (default: 'text')
- `count` (number, optional): Number of lines/rows (default: 3)

---

## 🔔 Notification Service

### Toast Notifications (`services/notifications.js`)
Wrapped react-hot-toast for consistent notifications.

**Usage:**
```jsx
import { 
  notifySuccess, 
  notifyError, 
  notifyLoading,
  notifyInfo,
  notifyWarning,
  notifyPromise 
} from '../services/notifications';

// Success notification
notifySuccess('Event created successfully!');

// Error notification
notifyError('Failed to load events');

// Loading notification (returns ID for updating)
const toastId = notifyLoading('Creating event...');

// Update notification
updateNotification(toastId, 'Event created!', 'success');

// Info notification
notifyInfo('New feature available');

// Warning notification
notifyWarning('Registration closes in 1 hour');

// Promise-based (auto loading → success/error)
notifyPromise(
  createEventAPI(data),
  {
    loading: 'Creating event...',
    success: 'Event created successfully!',
    error: 'Failed to create event'
  }
);
```

**Functions:**
- `notifySuccess(message)` - Green success toast
- `notifyError(message)` - Red error toast
- `notifyLoading(message)` - Blue loading toast
- `notifyInfo(message)` - Blue info toast
- `notifyWarning(message)` - Orange warning toast
- `notifyPromise(promise, messages)` - Auto handles promise states
- `updateNotification(toastId, message, type)` - Update existing toast
- `dismissNotification(toastId)` - Dismiss specific toast
- `dismissAllNotifications()` - Dismiss all toasts

---

## 🎨 Theme Utilities (`utils/theme.js`)

Reusable Tailwind class combinations for consistent styling.

**Usage:**
```jsx
import { primaryButton, cardContainer, badgeSuccess } from '../utils/theme';

// Use in components
<button className={primaryButton}>Click Me</button>
<div className={cardContainer}>...</div>
<span className={badgeSuccess}>Active</span>
```

**Available Utilities:**

### Buttons
- `primaryButton` - Blue primary button
- `secondaryButton` - Gray secondary button
- `dangerButton` - Red delete/cancel button
- `successButton` - Green success button
- `outlineButton` - Outlined button
- `linkButton` - Text link button

### Form Elements
- `inputField` - Standard input field
- `inputFieldError` - Input with error state
- `textareaField` - Textarea field
- `selectField` - Select dropdown
- `formLabel` - Form label
- `formError` - Error message text
- `formGroup` - Form group container

### Containers
- `cardContainer` - Card with shadow and hover
- `pageContainer` - Page wrapper with padding
- `sectionContainer` - Section container
- `modalContainer` - Modal dialog container

### Badges
- `badge` - Basic badge
- `badgeSuccess` - Green success badge
- `badgeError` - Red error badge
- `badgeWarning` - Yellow warning badge
- `badgeInfo` - Blue info badge
- `badgeGray` - Gray neutral badge

### Text
- `headingXL` - Extra large heading
- `headingLG` - Large heading
- `headingMD` - Medium heading
- `headingSM` - Small heading
- `bodyText` - Body text
- `captionText` - Caption/small text
- `linkText` - Link text

### Tables
- `tableHeader` - Table header cell
- `tableRow` - Table row
- `tableCell` - Table data cell

### Alerts
- `alertSuccess` - Success alert box
- `alertError` - Error alert box
- `alertWarning` - Warning alert box
- `alertInfo` - Info alert box

### Others
- `skeleton` - Loading skeleton
- `divider` - Horizontal divider
- `colors` - Color palette object

---

## 📦 Installation

The required package is already installed:
```bash
npm install react-hot-toast
```

---

## 🚀 Integration Examples

### Example: Event Creation with Notifications
```jsx
import { notifySuccess, notifyError, notifyLoading } from '../services/notifications';
import LoadingSpinner from '../components/LoadingSpinner';

const CreateEvent = () => {
  const [loading, setLoading] = useState(false);
  
  const handleSubmit = async (data) => {
    setLoading(true);
    const toastId = notifyLoading('Creating event...');
    
    try {
      await createEvent(data);
      updateNotification(toastId, 'Event created successfully!', 'success');
      navigate('/society/dashboard');
    } catch (error) {
      updateNotification(toastId, 'Failed to create event', 'error');
    } finally {
      setLoading(false);
    }
  };
  
  if (loading) {
    return <LoadingSpinner message="Creating event..." />;
  }
  
  return <form>...</form>;
};
```

### Example: Event List with Loading and Error States
```jsx
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorAlert from '../components/ErrorAlert';
import Skeleton from '../components/Skeleton';

const EventsList = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [events, setEvents] = useState([]);
  
  if (loading) {
    return (
      <div className="grid grid-cols-3 gap-4">
        <Skeleton type="card" />
        <Skeleton type="card" />
        <Skeleton type="card" />
      </div>
    );
  }
  
  if (error) {
    return (
      <ErrorAlert 
        message={error} 
        type="error" 
        onClose={() => setError('')} 
      />
    );
  }
  
  return <div>...</div>;
};
```

---

## 🎯 Best Practices

1. **Use theme utilities** instead of inline Tailwind classes for consistency
2. **Show skeletons** instead of spinners for better UX on data loading
3. **Use toast notifications** for user actions (create, update, delete)
4. **Use ErrorAlert** for form validation errors
5. **Always provide loading states** for async operations
6. **Make alerts dismissible** when appropriate

---

## 🔧 Customization

All components use Tailwind CSS and can be customized by:
1. Editing the component files directly
2. Extending Tailwind config
3. Adding new theme utilities in `utils/theme.js`

---

## 📝 Notes

- **Toaster** is already integrated in App.jsx
- All notifications auto-dismiss after 4 seconds (except loading)
- Loading toasts must be manually updated or dismissed
- Skeleton components automatically pulse animate
- Theme utilities can be combined with additional classes

---

Happy coding! 🎉
