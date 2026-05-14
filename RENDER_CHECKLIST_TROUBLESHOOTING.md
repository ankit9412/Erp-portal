# ✅ Render Deployment Checklist & Troubleshooting

## Pre-Deployment Checklist

### Code Repository
- [ ] Code committed to Git
- [ ] All files pushed to GitHub (main branch)
- [ ] `.env` files added to `.gitignore`
- [ ] No sensitive data hardcoded in source
- [ ] GitHub repository is accessible
- [ ] Branch protection disabled for deployment

### Project Structure
- [ ] `backend/` folder exists with `package.json`
- [ ] `frontend/` folder exists with `package.json`
- [ ] `backend/src/app.js` is the entry point
- [ ] `frontend/dist/` will be created after build
- [ ] `vite.config.js` exists in frontend
- [ ] All dependencies are in `package.json`

### Configuration Files
- [ ] `.env.render` file created with template values
- [ ] `render.yaml` exists in root directory
- [ ] `deploy-render.sh` or `.bat` scripts exist
- [ ] No `.env.production` or `.env.local` committed

### Dependencies
- [ ] Backend: `npm install` works without errors
- [ ] Frontend: `npm install` works without errors
- [ ] Backend: `npm start` works locally
- [ ] Frontend: `npm run build` creates dist folder

### Environment Variables Prepared
- [ ] MongoDB URI ready
- [ ] Redis URL ready
- [ ] JWT secrets generated
- [ ] Email credentials prepared
- [ ] Cloudinary API keys ready
- [ ] All values tested locally

### Database & External Services
- [ ] MongoDB Atlas account created
- [ ] MongoDB cluster created (M0 free tier)
- [ ] Database user created
- [ ] IP whitelist configured (0.0.0.0/0)
- [ ] Connection string copied
- [ ] Redis account created (Redis Cloud or Upstash)
- [ ] Redis connection URL ready

---

## Step-by-Step Deployment

### Phase 1: GitHub Setup (5 minutes)

```bash
# 1. Ensure all changes are committed
git status

# 2. Add files to staging
git add .

# 3. Commit with message
git commit -m "Prepare for Render deployment"

# 4. Push to GitHub
git push origin main

# 5. Verify on GitHub
# Go to https://github.com/YOUR_USERNAME/erp-portal
```

### Phase 2: Render Backend Deployment (10 minutes)

```
1. Go to https://dashboard.render.com
2. Click "New +" button
3. Select "Web Service"
4. Click "Connect GitHub"
5. Search for "erp-portal" repository
6. Click "Connect"
7. Fill in details:
   Name: erp-backend
   Environment: Node
   Region: Oregon (or nearest)
   Branch: main
   Build Command: cd backend && npm install
   Start Command: cd backend && npm start
8. Click "Create Web Service"
9. Service will start building
```

**After Backend Service Created:**

```
1. Go to Service Settings
2. Scroll to "Environment"
3. Add all variables from .env.render:
   - NODE_ENV=production
   - PORT=3000
   - CLIENT_URL=https://erp-frontend.onrender.com
   - MONGODB_URI=<your_mongodb_url>
   - REDIS_URL=<your_redis_url>
   - JWT_SECRET=<generated_secret>
   - JWT_REFRESH_SECRET=<generated_secret>
   - EMAIL_HOST=smtp.gmail.com
   - EMAIL_PORT=587
   - EMAIL_USER=your-email@gmail.com
   - EMAIL_PASS=your-app-password
   - CLOUDINARY_NAME=<your_name>
   - CLOUDINARY_API_KEY=<your_key>
   - CLOUDINARY_API_SECRET=<your_secret>
   - ALLOWED_ORIGINS=https://erp-frontend.onrender.com
4. Click "Save"
5. Wait for deployment to complete (5-10 minutes)
6. Check Logs for "MongoDB Connected"
```

### Phase 3: Render Frontend Deployment (10 minutes)

```
1. Go to https://dashboard.render.com
2. Click "New +" button
3. Select "Static Site"
4. Click "Connect GitHub"
5. Search for "erp-portal" repository
6. Click "Connect"
7. Fill in details:
   Name: erp-frontend
   Branch: main
   Build Command: cd frontend && npm install && npm run build
   Publish Directory: frontend/dist
8. Click "Create Static Site"
9. Service will build and deploy
```

**After Frontend Service Created:**

```
1. Go to Service Settings
2. Add Environment Variables:
   VITE_API_BASE_URL=https://erp-backend.onrender.com/api
   VITE_SOCKET_URL=https://erp-backend.onrender.com
3. Click "Save"
4. Frontend will automatically rebuild (2-3 minutes)
5. Access at: https://erp-frontend.onrender.com
```

### Phase 4: Verification

```bash
# Test Backend
curl https://erp-backend.onrender.com/api/health

# Test Frontend
# Open in browser: https://erp-frontend.onrender.com

# Check Backend Logs
# Render Dashboard > erp-backend > Logs
# Look for: "MongoDB Connected", "Redis Connected"

# Check Frontend Logs
# Render Dashboard > erp-frontend > Logs
# Look for: Build successful messages
```

---

## 🐛 Troubleshooting Guide

### Backend Not Starting

**Symptom:** Service shows failed status, keeps restarting

**Solutions:**

```bash
# 1. Check logs in Render Dashboard
#    Render > erp-backend > Logs
#    Look at the red error messages

# Common Issues:

# Issue: "Cannot find module 'express'"
# Solution: package.json is missing or dependencies not installed
#   - Verify backend/package.json exists
#   - Check Build Command: cd backend && npm install

# Issue: "connect ECONNREFUSED 127.0.0.1:27017"
# Solution: Database connection failed
#   - Verify MONGODB_URI is correct
#   - Add Render IPs to MongoDB Atlas whitelist
#   - Check MongoDB Atlas cluster is running

# Issue: "Cannot connect to Redis"
# Solution: Redis URL is wrong or service is down
#   - Verify REDIS_URL format
#   - Test Redis service is running
#   - Check credentials in URL

# Issue: "Port already in use"
# Solution: PORT environment variable conflict
#   - Set NODE_ENV=production
#   - Set PORT=3000 explicitly
#   - Don't use hardcoded port

# Issue: "ENOENT: no such file or directory"
# Solution: Missing required files
#   - Verify backend/src/app.js exists
#   - Check all required config files exist
#   - Ensure no typos in file paths
```

### Frontend Not Displaying

**Symptom:** Shows error page or blank page

**Solutions:**

```bash
# 1. Check Publish Directory is correct: frontend/dist

# 2. Check Build Command output in Logs
#    Should show: "vite v... building"

# 3. Common Issues:

# Issue: "frontend/dist not found"
# Solution:
#   - Build Command must be: cd frontend && npm install && npm run build
#   - Ensure vite.config.js is correct
#   - Check frontend package.json has build script

# Issue: "404 on all pages"
# Solution:
#   - Add SPA routing in Render settings
#   - Or check: Routes > /* to /index.html

# Issue: "API calls fail with CORS error"
# Solution:
#   - Verify VITE_API_BASE_URL includes correct backend URL
#   - Check backend ALLOWED_ORIGINS has frontend URL
#   - Add: ALLOWED_ORIGINS=https://erp-frontend.onrender.com

# Issue: "Blank page with no errors"
# Solution:
#   - Check browser Console (F12)
#   - Verify VITE_API_BASE_URL is set
#   - Check build artifacts in frontend/dist

# Issue: "Cannot reach https://localhost:3000"
# Solution:
#   - Don't use localhost in production
#   - Use full Render URLs: https://erp-backend.onrender.com
#   - Update VITE_API_BASE_URL with production URL
```

### Database Connection Issues

**Symptom:** "MongoDB connection timeout" or "ECONNREFUSED"

**Solutions:**

```bash
# 1. MongoDB Atlas Whitelist

# For Render deployment:
# 1. Go to MongoDB Atlas Dashboard
# 2. Network Access > Add IP Address
# 3. Select "Allow access from anywhere" (0.0.0.0/0)
# 4. Confirm

# Alternative: Add specific Render IPs (look up in Render docs)

# 2. Check Connection String Format

# Correct format:
# mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/dbname

# Common errors:
# - Missing username/password
# - Wrong cluster name
# - @ symbol not in password (encode special chars)

# 3. Test Connection Locally

# Before deploying:
npm install
npm start
# Should show: "MongoDB Connected: ..."

# 4. Update Environment Variable

# Go to Render Dashboard > erp-backend > Environment
# MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/erp_db
# Click "Save"
# Service auto-redeploys

# 5. Check Logs

# Render > erp-backend > Logs
# Search for "MongoDB"
# Should see: "MongoDB Connected: cluster0.xxxxx.mongodb.net"
```

### Redis Connection Issues

**Symptom:** "Redis connection refused" or "ECONNREFUSED"

**Solutions:**

```bash
# 1. Verify Redis URL Format

# Redis Cloud format:
# redis://default:password@hostname:port

# Upstash format (with TLS):
# redis://default:password@hostname:port

# 2. Check Credentials

# Verify password doesn't have special characters
# If it does, URL encode them:
#   @ becomes %40
#   : becomes %3A
#   # becomes %23

# 3. Test Redis Connection

# Check backend logs for "Redis Connected" message
# Go to Render > erp-backend > Logs

# 4. Alternative: Use without Redis (not recommended)

# Comment out Redis connection in backend/src/config/redis.js
# But cache features won't work

# 5. Update REDIS_URL

# Go to Render > erp-backend > Environment
# Add: REDIS_URL=redis://default:password@hostname:port
# Click "Save"
# Service auto-redeploys
```

### API Not Working from Frontend

**Symptom:** Network errors, 404, CORS errors

**Solutions:**

```bash
# 1. Check VITE_API_BASE_URL

# In Render Frontend Environment:
# VITE_API_BASE_URL=https://erp-backend.onrender.com/api
# (note the /api suffix)

# 2. Verify Backend URL

# Open browser console (F12)
# Make API call from frontend
# Check Network tab
# Should show: https://erp-backend.onrender.com/api/...

# 3. Check CORS Settings

# Backend needs to allow frontend domain
# Go to Render > erp-backend > Environment
# ALLOWED_ORIGINS=https://erp-frontend.onrender.com

# 4. Test Backend Directly

# curl https://erp-backend.onrender.com/api/health
# Should return 200 OK

# 5. Check Authentication

# Verify JWT tokens are being sent
# Look for "Authorization: Bearer ..." in Network tab

# 6. Common Errors:

# CORS error: Update ALLOWED_ORIGINS
# 404 Not Found: Check API endpoint path
# 500 Server Error: Check backend logs
# Network Error: Backend might be sleeping (Free plan)
```

### Free Plan Services Going to Sleep

**Symptom:** "Service unavailable" after 15 min inactivity

**Solutions:**

```bash
# Free plan services auto-pause after 15 min of inactivity
# When you access the site, they wake up (30 sec delay)

# Options:

# 1. Use Free Plan (acceptable for development)
#    - Services wake on demand
#    - Some delay expected

# 2. Upgrade to Starter+ ($7/month)
#    - Services always running
#    - Recommended for production

# 3. Keep-Alive Script (workaround)
#    - Ping service every 10 minutes
#    - External monitoring service
#    - Not ideal for production

# To Upgrade:
# 1. Go to Render > erp-backend > Settings
# 2. Instance Type > Starter+ or higher
# 3. Click "Upgrade"
# 4. Service redeploys with 24/7 uptime
```

### Build Fails

**Symptom:** Red X on deployment, build logs show errors

**Solutions:**

```bash
# 1. Check Build Command

# Backend Build Command:
# cd backend && npm install

# Frontend Build Command:
# cd frontend && npm install && npm run build

# 2. Common Build Errors:

# Error: "ERR! code ERESOLVE"
# Solution: npm install --legacy-peer-deps (if needed)

# Error: "npm ERR! 404 Not Found"
# Solution: Package doesn't exist or typo in package.json

# Error: "vite build failed"
# Solution: Check for syntax errors in frontend code

# 3. Test Build Locally

# For Backend:
cd backend
npm install
npm start

# For Frontend:
cd frontend
npm install
npm run build

# 4. Check for .env Files

# .env files shouldn't be committed
# They go to Render Environment variables
# Check .gitignore includes .env

# 5. Rebuild on Render

# Render > Select Service > Settings > Redeploy
# Click "Redeploy latest commit"
```

---

## 🔍 Verification Checklist After Deployment

- [ ] Backend service shows "Live" status
- [ ] Frontend service shows "Live" status
- [ ] Backend logs show "MongoDB Connected"
- [ ] Backend logs show "Redis Connected" (if used)
- [ ] Frontend loads without errors
- [ ] API calls work from frontend
- [ ] Login/authentication works
- [ ] Database operations work (create/read/update/delete)
- [ ] Email sending works (if configured)
- [ ] File uploads work (if configured)
- [ ] Real-time features work (Socket.IO if used)

---

## 📞 Getting Help

If you're stuck:

1. **Check Render Logs**
   - Render Dashboard > Service > Logs
   - Look for error messages with timestamps

2. **Check Environment Variables**
   - Render Dashboard > Service > Environment
   - Verify all required variables are set

3. **Local Testing**
   - Run same commands locally
   - Debug locally first, then deploy

4. **Review Configuration**
   - Double-check render.yaml
   - Verify file paths are correct

5. **Render Support**
   - https://render.com/support
   - Response time: Usually 24-48 hours

6. **Community Help**
   - Render Discord: https://discord.gg/render
   - Stack Overflow: Tag with `render`
   - GitHub Issues: In your repository

---

## 📊 Monitoring After Deployment

### Daily Monitoring

```bash
# Check Render Dashboard daily
# 1. Services should show "Live" status
# 2. No errors in recent logs
# 3. Response times acceptable

# Monitor via browser:
# 1. https://erp-frontend.onrender.com
# 2. Check basic functionality works
# 3. Monitor performance
```

### Set Up Alerts

```bash
# In Render Dashboard:
# 1. Account Settings > Notifications
# 2. Enable email alerts for:
#    - Service failures
#    - High memory usage
#    - Build failures
3. Check emails regularly
```

---

## 🔄 Updating Deployment

### Deploy New Changes

```bash
# 1. Make code changes locally
# 2. Commit changes
git commit -m "Description of changes"

# 3. Push to GitHub
git push origin main

# 4. Render automatically:
#    - Detects the push
#    - Rebuilds services
#    - Deploys new version

# 5. Check status in Render Dashboard
#    - Should show "Deployed" after 5-15 minutes
```

### Roll Back to Previous Version

```bash
# If deployment breaks:
# 1. Render > Service > Deployments
# 2. Find previous successful deployment
# 3. Click "Redeploy"
# 4. Service reverts to previous version

# To restore code:
# 1. Git history > Find previous commit
# git revert <commit-hash>
# 2. Or reset to previous commit
# git reset --hard <commit-hash>
# 3. Push to GitHub
# 4. Render auto-deploys
```

---

## 🎉 Success Indicators

Your deployment is successful when:

✅ Both services show "Live" status  
✅ Frontend loads without errors  
✅ Backend API responds to requests  
✅ Database connections established  
✅ Authentication works  
✅ No errors in Render logs  
✅ Response times are acceptable  
✅ All features working as expected  

**Congratulations! Your ERP application is now live on Render! 🚀**

