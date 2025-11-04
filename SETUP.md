# Campus Event Hub - Setup Guide

## 🎉 Full-Stack Application Complete!

A complete event management system for campus with JWT authentication, event registration, and team support.

---

## 📁 Project Structure

```
campus-event-hub/
├── backend/
│   ├── config/
│   │   └── database.js
│   ├── middleware/
│   │   ├── auth.js
│   │   └── validation.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Society.js
│   │   ├── Event.js
│   │   ├── Registration.js
│   │   └── Bookmark.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── events.js
│   │   └── registrations.js
│   ├── server.js
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── EventsList.jsx
    │   │   └── Navbar.jsx
    │   ├── context/
    │   │   └── AuthContext.jsx
    │   ├── pages/
    │   │   ├── Login.jsx
    │   │   ├── Register.jsx
    │   │   ├── Dashboard.jsx
    │   │   └── EventDetail.jsx
    │   ├── services/
    │   │   └── api.js
    │   ├── App.jsx
    │   └── main.jsx
    └── package.json
```

---

## 🚀 Quick Start

### 1. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create .env file
cat > .env << EOF
MONGODB_URI=your_mongodb_connection_string_here
JWT_SECRET=your_super_secret_jwt_key_here
PORT=5000
EOF

# Start development server
npm run dev
```

### 2. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install react-router-dom axios

# Start development server
npm run dev
```

---

## 🔑 Environment Variables

### Backend (.env)
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/campus-event-hub
JWT_SECRET=your-secret-key-minimum-32-characters
PORT=5000
```

### Frontend (if needed)
```env
VITE_API_URL=http://localhost:5000/api
```

---

## 📦 Dependencies Already Installed

### Backend
- ✅ express v5.1.0
- ✅ mongoose v8.19.2
- ✅ jsonwebtoken v9.0.2
- ✅ bcryptjs v3.0.2
- ✅ express-validator v7.3.0
- ✅ cors v2.8.5
- ✅ dotenv v17.2.3
- ✅ uuid v13.0.0

### Frontend (Need to Install)
```bash
npm install react-router-dom axios
```

---

## 🎨 Features Implemented

### Backend
- ✅ JWT Authentication with token verification
- ✅ User registration and login
- ✅ Password hashing with bcryptjs
- ✅ Input validation with express-validator
- ✅ Event CRUD operations
- ✅ Event registration (individual & team)
- ✅ Dynamic form fields for events
- ✅ Authorization middleware
- ✅ Global error handling
- ✅ MongoDB connection with no deprecated options

### Frontend
- ✅ Authentication Context with useReducer
- ✅ Protected and Public routes
- ✅ Login page with validation
- ✅ Registration page with multi-field form
- ✅ Dashboard with event listings
- ✅ Event detail page with dynamic registration form
- ✅ Responsive Navbar with mobile menu
- ✅ Events grid with filtering
- ✅ Axios API service with interceptors
- ✅ Loading states and error handling
- ✅ Tailwind CSS styling

---

## 🔐 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (protected)

### Events
- `GET /api/events` - List all events (public)
- `GET /api/events/:id` - Get event details (public)
- `POST /api/events` - Create event (society_head/admin)
- `PUT /api/events/:id` - Update event (organizer/admin)
- `DELETE /api/events/:id` - Cancel event (organizer/admin)
- `GET /api/events/:id/form-fields` - Get registration form

### Registrations
- `POST /api/registrations` - Register for event (protected)
- `GET /api/registrations` - List registrations (protected)
- `GET /api/registrations/:id` - Get registration details (protected)
- `PUT /api/registrations/:id/members/:memberId` - Accept/decline team invite
- `DELETE /api/registrations/:id` - Cancel registration

---

## 🧪 Testing the Application

### 1. Start Backend
```bash
cd backend
npm run dev
# Should see: "MongoDB Connected" and "Server is running on port 5000"
```

### 2. Start Frontend
```bash
cd frontend
npm run dev
# Visit: http://localhost:5173
```

### 3. Test Flow
1. Register a new user at `/register`
2. Login at `/login`
3. View dashboard with events
4. Click on an event to see details
5. Register for an event
6. View registrations at `/my-registrations`

---

## 📱 Frontend Routes

- `/` - Redirects to dashboard or login
- `/login` - User login (public)
- `/register` - User registration (public)
- `/dashboard` - Home page with events (protected)
- `/events/:id` - Event details and registration (protected)
- `/my-registrations` - User's event registrations (protected)
- `/profile` - User profile (protected)
- `*` - 404 Not Found

---

## 🎯 Default User Roles

- `student` - Regular user (default)
- `society_head` - Can create/manage events
- `admin` - Full access

---

## 🐛 Common Issues

### Backend won't start
- Check MongoDB connection string in `.env`
- Ensure MongoDB is accessible
- Check if port 5000 is already in use

### Frontend API errors
- Verify backend is running on port 5000
- Check CORS is enabled
- Verify JWT_SECRET is set in backend .env

### Login/Register not working
- Check network tab for API responses
- Verify JWT_SECRET is at least 32 characters
- Check MongoDB connection

---

## 🔨 Next Steps

1. ✅ All core features implemented
2. 📝 Add user profile editing
3. 📊 Add event analytics dashboard
4. 📧 Add email notifications
5. 🔍 Add advanced search and filters
6. 📱 Add event bookmarks feature
7. 👥 Add society management features
8. 📅 Add calendar view for events

---

## 💡 Tips

- Use MongoDB Compass to view your database
- Use Postman/Thunder Client to test API endpoints
- Check browser DevTools console for errors
- Use React DevTools to debug component state

---

## 📞 Support

For issues or questions:
1. Check this README
2. Review console/terminal errors
3. Verify environment variables
4. Check MongoDB connection

---

**Built with:**
- Node.js + Express
- MongoDB + Mongoose
- React + Vite
- Tailwind CSS
- JWT Authentication

**Happy Coding! 🚀**
