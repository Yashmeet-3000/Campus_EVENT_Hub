# Deployment Guide

## Important: Frontend and Backend Deployment

This is a **full-stack application** with separate frontend and backend. They need to be deployed separately.

## Backend Deployment (Vercel/Render/Railway)

### Option 1: Vercel (Recommended)

1. Go to [vercel.com](https://vercel.com)
2. Import the **backend** folder from GitHub
3. Configure:
   - **Root Directory**: `backend`
   - **Build Command**: Leave empty
   - **Output Directory**: Leave empty
4. Add Environment Variables:
   ```
   MONGODB_URI=your_mongodb_atlas_uri
   JWT_SECRET=your_secret_key
   PORT=5000
   ```
5. Deploy

### Option 2: Render

1. Go to [render.com](https://render.com)
2. Create a new Web Service
3. Connect your GitHub repo
4. Configure:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
5. Add Environment Variables (same as above)
6. Deploy

## Frontend Deployment (Netlify/Vercel)

### Option 1: Netlify (Recommended for Frontend)

1. Go to [netlify.com](https://netlify.com)
2. Import the repository from GitHub
3. Configure:
   - **Base Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Publish Directory**: `frontend/dist`
4. Add Environment Variable:
   ```
   VITE_API_URL=https://your-backend-url.vercel.app/api
   ```
5. Deploy

### Option 2: Vercel

1. Go to [vercel.com](https://vercel.com)
2. Import the repository
3. Configure:
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Add Environment Variable:
   ```
   VITE_API_URL=https://your-backend-url.vercel.app/api
   ```
5. Deploy

## MongoDB Setup (Required)

You need MongoDB Atlas for production:

1. Go to [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free cluster
3. Create a database user
4. Whitelist all IPs: `0.0.0.0/0` (for serverless deployment)
5. Get connection string and use it as `MONGODB_URI`

## Complete Deployment Steps

1. **Deploy Backend First**
   - Deploy backend to Vercel/Render
   - Get the backend URL (e.g., `https://your-backend.vercel.app`)

2. **Deploy Frontend**
   - Use the backend URL in `VITE_API_URL` environment variable
   - Deploy frontend to Netlify/Vercel

3. **Update Backend CORS** (if needed)
   - Add your frontend URL to CORS allowed origins in `backend/server.js`

## Quick Deploy Commands

If deploying manually via CLI:

### Backend (Vercel)
```bash
cd backend
vercel --prod
```

### Frontend (Netlify)
```bash
cd frontend
netlify deploy --prod
```

## Important Notes

- **DO NOT** try to deploy the entire root folder - deploy frontend and backend separately
- Frontend build output is in `dist` folder after running `npm run build`
- Backend has a `vercel.json` file already configured
- Make sure to set environment variables on the hosting platform
- MongoDB Atlas is **required** for production (local MongoDB won't work)

## Troubleshooting

- **404 on page refresh**: Fixed by `_redirects`, `netlify.toml`, or `vercel.json` files
- **CORS errors**: Add frontend URL to backend CORS configuration
- **API connection failed**: Check `VITE_API_URL` environment variable
- **Database connection failed**: Verify MongoDB Atlas URI and IP whitelist
