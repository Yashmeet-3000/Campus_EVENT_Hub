# Troubleshooting Guide

## ❗ Common Issues & Solutions

### 1. Event Creation Fails with "Validation Failed"

**Problem:** When creating an event, you get a validation error.

**Solutions:**

#### ✅ Check User Role
Your role in MongoDB must be **exactly** `'society_head'` (with underscore), not `'society-head'` (with hyphen).

**To fix in MongoDB:**
```javascript
db.users.updateOne(
  { email: "your.email@example.com" },
  { $set: { role: "society_head" } }
)
```

#### ✅ Check Event Start Date
The event start date **must be in the future**. Backend validation rejects past dates.

**Solution:** Set event start date to tomorrow or later.

#### ✅ Check Required Fields
All these fields are **required**:
- Title (min 5 characters)
- Description (min 10 characters)
- Event Type (must be one of: workshop, seminar, competition, cultural, sports, orientation, hackathon)
- Start Date & Time (must be future date)
- End Date & Time (must be after start date)
- Venue (required)
- Registration Start Date & Time
- Registration End Date & Time (must be before event start)

---

### 2. User Roles in the System

There are **3 valid roles**:

1. **`'student'`** (default)
   - Can browse events
   - Can register for events
   - Can view their registrations

2. **`'society_head'`** (event organizer)
   - All student permissions
   - Can create events
   - Can manage their events
   - Can view event registrations
   - Routes: `/society/dashboard`, `/society/create-event`

3. **`'admin'`** (system administrator)
   - All permissions
   - Can manage all events
   - Can manage users

**Note:** There is NO `'society-head'` role (with hyphen). It must be `'society_head'` with underscore!

---

### 3. MongoDB Connection Issues

**Problem:** Users not appearing in MongoDB after registration.

**Solutions:**

#### ✅ Check Connection String
Verify `.env` file in backend:
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database_name
```

#### ✅ Check Database Name
Make sure you're looking at the correct database in MongoDB Atlas/Compass:
- Database name: `campus_event_hub_db`
- Collection name: `users`

#### ✅ Check Backend Logs
Look at backend console for connection errors:
```
✅ MongoDB Connected: cluster-name
```

---

### 4. Login/Registration Not Working

**Problem:** Can't log in or register, or page doesn't redirect.

**Solutions:**

#### ✅ Clear Browser Cache
1. Press `Ctrl+Shift+Delete`
2. Clear "Cached images and files"
3. Hard refresh with `Ctrl+Shift+R`

#### ✅ Check Backend is Running
Backend should be running on `http://localhost:5000`
```bash
cd backend
node server.js
```

#### ✅ Check Frontend is Running
Frontend should be running on `http://localhost:3000`
```bash
cd frontend
npm start
```

#### ✅ Check API URL
In `frontend/src/services/api.js`, verify:
```javascript
baseURL: 'http://localhost:5000/api'
```

---

### 5. Black Screen Issue on Login/Register Pages

**Problem:** Login/Register pages show 2/3 black screen with footer.

**Solution:** This has been fixed in the latest App.jsx. Make sure you have:
- Restarted both frontend and backend
- Cleared browser cache
- Using the latest App.jsx with `AuthenticatedLayout` wrapper

The new structure:
- **Public routes** (login/register): NO navbar, NO footer, NO wrapper
- **Protected routes**: Wrapped with `AuthenticatedLayout` (navbar + footer)

---

### 6. Navigation Not Working

**Problem:** Clicking links doesn't navigate, needs page refresh.

**Solution:** This has been fixed. The issue was:
- `PublicRoute` was redirecting to hardcoded `/dashboard`
- Now uses `DashboardRedirect` for role-based routing

Make sure you're using the latest code.

---

### 7. Date/Time Field Format Issues

**Problem:** Date/time fields not accepting input or causing validation errors.

**Solution:**

#### ✅ Use `datetime-local` input type
```jsx
<input type="datetime-local" name="start_datetime" />
```

#### ✅ Field names must match backend exactly
Frontend field names:
- `start_datetime` ✅
- `end_datetime` ✅
- `registration_start_datetime` ✅
- `registration_end_datetime` ✅

**NOT:**
- `start_date` ❌
- `registration_start` ❌

---

### 8. Form Fields Not Saving in CreateEvent

**Problem:** Registration form fields don't save or validation fails.

**Solutions:**

#### ✅ Add at least 1 field
The form builder requires **at least 1 field** in the registration form.

#### ✅ Fill all required properties
Each field must have:
- Label (required)
- Type (required)
- Options (required for select/multi_select types)

#### ✅ Proper options format
For select/multi_select fields, enter options as **comma-separated**:
```
Small, Medium, Large, XL
```

---

### 9. Token/Authentication Errors

**Problem:** Getting "Unauthorized" errors or session expires immediately.

**Solutions:**

#### ✅ Check JWT_SECRET
Backend `.env` file must have:
```env
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production_2025
```

#### ✅ Check Token Storage
Token is stored in localStorage as `campusEventToken`:
- Open DevTools (F12)
- Go to Application → Local Storage
- Check for `campusEventToken`

#### ✅ Clear and Re-login
If token is corrupted:
1. Clear localStorage
2. Log out
3. Log in again

---

### 10. Events Not Showing on Dashboard

**Problem:** Created events don't appear on dashboard.

**Solutions:**

#### ✅ Check Event Status
Events might be in `draft` status. Check MongoDB:
```javascript
db.events.find({ organizer_id: ObjectId("your_user_id") })
```

#### ✅ Check API Response
Open DevTools → Network tab and check:
- `/events/my-events` response
- Check if events array is populated

#### ✅ Verify User ID Match
Make sure `organizer_id` in events matches your user `_id` in MongoDB.

---

## 🔧 Development Tips

### Testing Event Creation

1. **Use future dates** for testing:
   - Event start: Tomorrow at 10:00 AM
   - Event end: Tomorrow at 5:00 PM
   - Registration start: Today
   - Registration end: Tomorrow at 9:00 AM

2. **Minimum form fields:**
   - At least 1 field in registration form
   - Fill all required event details

3. **Check console logs:**
   - Backend console for API errors
   - Frontend console (F12) for client errors

### Database Quick Checks

**Check all users:**
```javascript
db.users.find().pretty()
```

**Check user role:**
```javascript
db.users.find({ email: "your@email.com" }, { role: 1, name: 1 })
```

**Update user role:**
```javascript
db.users.updateOne(
  { email: "your@email.com" },
  { $set: { role: "society_head" } }
)
```

**Check all events:**
```javascript
db.events.find().pretty()
```

**Check events by user:**
```javascript
db.events.find({ organizer_id: ObjectId("your_user_id") })
```

---

## 📝 Still Having Issues?

If none of these solutions work:

1. **Check backend console** for error messages
2. **Check browser console** (F12) for errors
3. **Check Network tab** (F12 → Network) for failed API calls
4. **Restart both servers** (backend and frontend)
5. **Clear node_modules cache:**
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

---

## ✅ Verification Checklist

Before creating an event, verify:
- [ ] Backend is running (`http://localhost:5000`)
- [ ] Frontend is running (`http://localhost:3000`)
- [ ] MongoDB is connected (check backend console)
- [ ] You're logged in as `society_head` or `admin`
- [ ] Your role in MongoDB is `'society_head'` (with underscore)
- [ ] Event start date is in the **future**
- [ ] Registration end is **before** event start
- [ ] At least **1 form field** is added
- [ ] All form fields have **labels**

---

Happy event organizing! 🎉
