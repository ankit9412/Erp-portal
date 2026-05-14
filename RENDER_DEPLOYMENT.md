# 🚀 Render Deployment Guide for ERP Platform

This guide provides step-by-step instructions to deploy your full-stack ERP application on Render.

## Prerequisites

- Render account (https://render.com)
- GitHub repository with your code pushed
- MongoDB Atlas account (or use Render PostgreSQL as alternative)
- Redis database URL (Render or Redis Cloud)

---

## 📋 Step 1: Environment Variables Setup

### Backend Environment Variables
Create `.env` file in the `backend/` directory:

```env
# Server
NODE_ENV=production
PORT=3000
CLIENT_URL=https://your-frontend-url.onrender.com

# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/erp_db

# Redis
REDIS_URL=redis://default:password@redis-hostname:port

# JWT
JWT_SECRET=your_jwt_secret_key_here
JWT_REFRESH_SECRET=your_jwt_refresh_secret_key_here
JWT_EXPIRE=7d
JWT_REFRESH_EXPIRE=30d

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
EMAIL_FROM=noreply@erp-platform.com

# Cloudinary (for file uploads)
CLOUDINARY_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# CORS
ALLOWED_ORIGINS=https://your-frontend-url.onrender.com

# Sentry (optional, for error tracking)
SENTRY_DSN=your_sentry_dsn

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Session
SESSION_SECRET=your_session_secret
```

---

## 📋 Step 2: Create Render Configuration

### Option A: Using render.yaml (Recommended)

Create `render.yaml` in the root directory:

```yaml
services:
  - type: web
    name: erp-backend
    env: node
    plan: free
    buildCommand: cd backend && npm install && npm run build
    startCommand: cd backend && npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: MONGODB_URI
        fromDatabase:
          name: erp-mongodb
          property: connectionString
      - key: REDIS_URL
        sync: false

  - type: web
    name: erp-frontend
    env: static
    plan: free
    buildCommand: cd frontend && npm install && npm run build
    staticPublishPath: frontend/dist
    routes:
      - path: /
        destination: /index.html
      - path: /api/*
        destination: http://erp-backend/api/*

  - type: pserv
    name: erp-mongodb
    ipAllowList: []
    plan: free

  - type: redis
    name: erp-redis
    plan: free
```

---

## 🔧 Step 3: CLI Commands for Deployment

### 3.1 Initial Setup & Push Code

```bash
# Initialize git if not already done
git init
git add .
git commit -m "Initial commit for Render deployment"
git remote add origin https://github.com/YOUR_USERNAME/erp-portal.git
git push -u origin main
```

### 3.2 Deploy Backend on Render

```bash
# Using Render Dashboard:
# 1. Go to https://dashboard.render.com
# 2. Click "New +" > "Web Service"
# 3. Connect your GitHub repository
# 4. Fill in the configuration:

# Build Command:
cd backend && npm install

# Start Command:
cd backend && npm start

# Environment Variables: (Copy from .env.backend section above)
# Set all variables from Step 1
```

**Alternative: Using Render CLI**

```bash
# Install Render CLI
npm install -g render-cli

# Login to Render
render login

# Deploy backend
render deploy --service erp-backend
```

### 3.3 Deploy Frontend on Render

```bash
# Using Render Dashboard:
# 1. Click "New +" > "Static Site"
# 2. Connect your GitHub repository
# 3. Fill in the configuration:

# Build Command:
cd frontend && npm install && npm run build

# Publish Directory:
frontend/dist

# Environment Variables:
# VITE_API_BASE_URL=https://your-backend-service.onrender.com/api
```

---

## 🗄️ Step 4: Database Setup

### MongoDB Atlas Setup

```bash
# 1. Go to https://www.mongodb.com/cloud/atlas
# 2. Create a free cluster
# 3. Get connection string: mongodb+srv://user:pass@cluster.mongodb.net/dbname

# Add to Render backend environment variables as MONGODB_URI
```

### Alternative: MongoDB on Render

```bash
# Render also offers PostgreSQL, but for MongoDB:
# Use MongoDB Atlas (free tier available)
# Connection string format:
# mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/database_name
```

### Redis Setup

```bash
# Option 1: Redis Cloud (Recommended for free tier)
# 1. Go to https://redis.com/try-free/
# 2. Create free database
# 3. Get connection URL

# Option 2: Render Redis
# Available as add-on service in render.yaml

# Add to REDIS_URL environment variable
```

---

## 🚀 Step 5: Complete Deployment Steps

### Full Deployment Command Sequence

```bash
# 1. Ensure all code is committed
git status
git add .
git commit -m "Prepare for Render deployment"

# 2. Push to GitHub
git push origin main

# 3. Navigate to Render Dashboard
# https://dashboard.render.com

# 4. For Backend Deployment:
# - New Web Service
# - Select: GitHub Repository
# - Build Command: cd backend && npm install
# - Start Command: cd backend && npm start
# - Instance Type: Free (or Starter+)
# - Add all environment variables from .env

# 5. For Frontend Deployment:
# - New Static Site
# - Select: GitHub Repository
# - Build Command: cd frontend && npm install && npm run build
# - Publish Directory: frontend/dist
# - Add VITE_API_BASE_URL environment variable

# 6. Verify both services are running
# Backend: https://your-backend-name.onrender.com
# Frontend: https://your-frontend-name.onrender.com

# 7. Update frontend API endpoint:
# Set VITE_API_BASE_URL=https://your-backend-name.onrender.com/api
```

---

## 📦 Step 6: Backend Build Files

### Update backend/package.json (if needed)

```json
{
  "name": "erp-backend",
  "version": "1.0.0",
  "main": "src/app.js",
  "engines": {
    "node": "18.x",
    "npm": "9.x"
  },
  "scripts": {
    "start": "node src/app.js",
    "dev": "nodemon src/app.js",
    "build": "echo 'Build complete'"
  }
}
```

### Create backend/Procfile (optional)

```
web: node src/app.js
```

---

## 📦 Step 7: Frontend Build Files

### Create frontend/.env.production

```env
VITE_API_BASE_URL=https://your-backend-service.onrender.com/api
VITE_SOCKET_URL=https://your-backend-service.onrender.com
```

### Ensure frontend/package.json has correct build

```json
{
  "scripts": {
    "build": "vite build"
  }
}
```

---

## 🔐 Step 8: Security Configuration

### Add CORS Middleware (backend/src/middleware/cors.middleware.js)

```javascript
const cors = require('cors');

const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS?.split(',') || [
    'https://your-frontend-url.onrender.com'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

module.exports = cors(corsOptions);
```

---

## 🧪 Step 9: Testing Deployment

```bash
# 1. Test backend is running
curl https://your-backend-service.onrender.com/api/health

# 2. Test frontend is loading
# Navigate to https://your-frontend-service.onrender.com

# 3. Check Render logs
# Go to your service > Logs tab

# 4. Monitor for errors
# Check Winston logs or Sentry integration

# 5. Test MongoDB connection
# Check backend logs for "MongoDB Connected" message

# 6. Test Redis connection
# Check backend logs for Redis connection confirmation
```

---

## 🔄 Step 10: Continuous Deployment

### Auto-deploy on GitHub Push

```bash
# 1. In Render Dashboard, go to Service Settings
# 2. Find "Auto-Deploy" option
# 3. Select: "Yes" for auto-deploy on every push

# Manual trigger if needed:
git push origin main
# This automatically triggers Render deployment
```

---

## 🆘 Troubleshooting

### Backend won't start

```bash
# 1. Check Render logs:
# Go to Service > Logs

# 2. Common issues:
# - Missing environment variables: Add to service settings
# - Port issues: Ensure PORT=3000 in env
# - Database connection: Verify MONGODB_URI

# 3. Local test before deploying:
npm install
npm start
```

### Frontend showing 404 errors

```bash
# 1. Verify build artifacts:
# frontend/dist directory should exist

# 2. Check vite.config.js settings
# 3. Ensure Publish Directory is set to: frontend/dist

# 4. Clear Render cache and redeploy:
# Service Settings > Redeploy
```

### API calls failing from frontend

```bash
# 1. Verify VITE_API_BASE_URL is set correctly
# 2. Check backend ALLOWED_ORIGINS includes frontend URL
# 3. Verify CORS headers are being sent
# 4. Check Render backend logs for request details
```

### Database connection timeout

```bash
# 1. Verify MongoDB URI is correct
# 2. Add Render IP to MongoDB Atlas whitelist:
#    - MongoDB Atlas > Network Access > Add IP Address
#    - Add: 0.0.0.0/0 (or specific Render IPs)

# 3. Check connection pool settings in backend
```

---

## 📊 Monitoring & Logs

### Access Logs

```bash
# Go to Render Dashboard > Select Service > Logs
# Monitor in real-time

# Using CLI:
render logs --service erp-backend
render logs --service erp-frontend
```

### Set Up Error Tracking

```bash
# 1. Add Sentry integration (optional)
npm install @sentry/node

# 2. Add SENTRY_DSN to environment variables

# 3. Include in backend/src/app.js:
const Sentry = require('@sentry/node');
Sentry.init({ dsn: process.env.SENTRY_DSN });
```

---

## 💰 Cost Optimization

### Recommended Plan for Production

```
- Backend: Starter+ ($7/month) - for production reliability
- Frontend: Free Tier - static sites are free
- MongoDB: Free Tier (512MB) or shared tier ($9/month+)
- Redis: Free Tier or Redis Cloud
```

### Commands to Monitor Usage

```bash
# Check current deployment status
render list

# View service details
render services
```

---

## 🔄 Rollback & Redeploy

### Force Redeploy

```bash
# In Render Dashboard:
# 1. Go to Service > Settings > Redeploy
# Click "Manual Redeploy" button

# OR using CLI:
render deploy --service erp-backend --force
render deploy --service erp-frontend --force
```

### Rollback to Previous Version

```bash
# 1. In Render Dashboard, go to Deployments
# 2. Find previous successful deployment
# 3. Click deploy button to rollback
```

---

## 📝 Quick Reference

| Task | Command |
|------|---------|
| Deploy Backend | `git push origin main` (auto) |
| Deploy Frontend | `git push origin main` (auto) |
| View Logs | Render Dashboard > Logs |
| Add Environment Variable | Render Dashboard > Environment |
| Redeploy | Render Dashboard > Redeploy |
| Check Status | `render list` |

---

## ✅ Pre-deployment Checklist

- [ ] All environment variables set in Render
- [ ] MongoDB URI configured and whitelist updated
- [ ] Redis URL configured
- [ ] Git repository connected to Render
- [ ] Backend build command: `cd backend && npm install`
- [ ] Backend start command: `cd backend && npm start`
- [ ] Frontend build command: `cd frontend && npm install && npm run build`
- [ ] Frontend publish directory: `frontend/dist`
- [ ] VITE_API_BASE_URL points to backend service
- [ ] CORS configured for frontend domain
- [ ] `.env` files NOT committed to git (.gitignore)
- [ ] All tests passing locally
- [ ] Database migrations run (if needed)

---

## 🎉 Success!

Your ERP application should now be running on Render! 

**Access Your Application:**
- Frontend: `https://your-frontend-service.onrender.com`
- Backend API: `https://your-backend-service.onrender.com/api`
