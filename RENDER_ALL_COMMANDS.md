# 🚀 RENDER DEPLOYMENT - ALL COMMANDS

## QUICK START (Copy & Paste Ready)

### Windows Users - Run These Commands

```powershell
# Step 1: Prepare code
git add .
git commit -m "Prepare for Render deployment"
git push origin main

# Step 2: Validate deployment
.\validate-deployment.bat

# Step 3: Run deployment script
.\deploy-render.bat
```

### Mac/Linux Users - Run These Commands

```bash
# Step 1: Prepare code
git add .
git commit -m "Prepare for Render deployment"
git push origin main

# Step 2: Validate deployment
bash validate-deployment.sh

# Step 3: Run deployment script
bash deploy-render.sh
```

---

## COMPLETE COMMAND REFERENCE

### Phase 1: Git Setup

```bash
# Initialize repository
git init
git add .
git commit -m "Initial commit for Render deployment"

# Add GitHub remote (do this once)
git remote add origin https://github.com/YOUR_USERNAME/erp-portal.git

# Push to GitHub
git push -u origin main

# For subsequent pushes
git push origin main
```

### Phase 2: Pre-Deployment Checks

```bash
# Windows
.\validate-deployment.bat

# Mac/Linux
bash validate-deployment.sh
```

**Should see:**
- ✓ Node.js installed
- ✓ npm installed
- ✓ Git repository initialized
- ✓ backend/package.json exists
- ✓ frontend/package.json exists

### Phase 3: Install Dependencies Locally

```bash
# Backend
cd backend
npm install
cd ..

# Frontend
cd frontend
npm install
cd ..
```

### Phase 4: Test Locally Before Deploying

```bash
# Test backend
cd backend
npm start
# Should see: "MongoDB Connected" (if configured)

# In another terminal, test frontend
cd frontend
npm run build
npm run preview
```

### Phase 5: Deploy to Render

#### Option A: Using Dashboard (Manual)

```
Backend:
1. https://dashboard.render.com → New Web Service
2. Connect GitHub (erp-portal)
3. Name: erp-backend
4. Build: cd backend && npm install
5. Start: cd backend && npm start
6. Add Environment Variables (from .env.render)

Frontend:
1. https://dashboard.render.com → New Static Site
2. Connect GitHub (erp-portal)
3. Name: erp-frontend
4. Build: cd frontend && npm install && npm run build
5. Publish: frontend/dist
6. Add Environment Variables
```

#### Option B: Using render.yaml (Recommended)

```bash
# render.yaml is already created
# Just make sure to:
1. Push to GitHub
2. Render auto-detects render.yaml
3. Deploy both services automatically
```

---

## ENVIRONMENT VARIABLES TO SET

### In Render Dashboard for Backend Service

```env
NODE_ENV=production
PORT=3000
CLIENT_URL=https://your-frontend-url.onrender.com

# Database
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/erp_db

# Cache
REDIS_URL=redis://default:password@hostname:port

# JWT
JWT_SECRET=generate-random-string-here
JWT_REFRESH_SECRET=generate-another-random-string-here
JWT_EXPIRE=7d
JWT_REFRESH_EXPIRE=30d

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-specific-password
EMAIL_FROM=noreply@erp-platform.com

# File Upload
CLOUDINARY_NAME=your_name
CLOUDINARY_API_KEY=your_key
CLOUDINARY_API_SECRET=your_secret

# CORS
ALLOWED_ORIGINS=https://your-frontend-url.onrender.com

# Logging
LOG_LEVEL=info
```

### In Render Dashboard for Frontend Service

```env
VITE_API_BASE_URL=https://your-backend-url.onrender.com/api
VITE_SOCKET_URL=https://your-backend-url.onrender.com
```

---

## MONGODB ATLAS SETUP

```bash
# 1. Go to https://www.mongodb.com/cloud/atlas
# 2. Create Account/Login
# 3. Create New Project
# 4. Build a Cluster (M0 Free Tier)
# 5. Wait 5-10 minutes for cluster to be created
# 6. Create Database User:
#    - Username: <your-username>
#    - Password: <generate-strong-password>
# 7. Network Access > Add IP Address
#    - Select "Allow access from anywhere" (0.0.0.0/0)
#    - This allows Render to connect
# 8. Click "Connect" on cluster
#    - Select "Connect your application"
#    - Copy connection string
#    - Format: mongodb+srv://user:password@cluster.mongodb.net/dbname
# 9. Add to MONGODB_URI in Render

# Connection String with credentials:
mongodb+srv://USERNAME:PASSWORD@cluster0.xxxxx.mongodb.net/erp_db?retryWrites=true&w=majority
```

---

## REDIS SETUP

### Option 1: Redis Cloud (Recommended)

```bash
# 1. Go to https://redis.com/try-free/
# 2. Create Free Account
# 3. Create Database
# 4. Copy connection URL
# 5. Format: redis://default:password@hostname:port
# 6. Add to REDIS_URL in Render
```

### Option 2: Upstash

```bash
# 1. Go to https://upstash.com
# 2. Create Account
# 3. Create Redis Database
# 4. Copy REST URL or connection string
# 5. Add to REDIS_URL in Render
```

---

## TESTING AFTER DEPLOYMENT

```bash
# Test Backend API
curl https://your-backend-name.onrender.com/api/health
# Should return: {"status":"ok"} or similar

# Test Frontend
# Open in browser: https://your-frontend-name.onrender.com
# Should show login page

# Check Backend Logs
# Render Dashboard > erp-backend > Logs
# Look for:
#   - "MongoDB Connected: ..."
#   - "Redis Connected" (if using Redis)
#   - "Server running on port 3000"
#   - No error messages

# Check Frontend Logs
# Render Dashboard > erp-frontend > Logs
# Look for:
#   - Build successful messages
#   - No error messages
```

---

## UPDATING DEPLOYMENT

### Deploy New Code

```bash
# Make changes to code
# Commit and push
git add .
git commit -m "Description of changes"
git push origin main

# Render automatically:
# - Detects the push
# - Rebuilds services
# - Deploys new version
# - Takes 5-15 minutes

# Monitor deployment
# Render Dashboard > Service > Deployments
# Watch for "Live" status
```

### Force Redeploy

```bash
# If something is wrong:
# Render Dashboard > Service Settings > Redeploy
# Click "Redeploy latest commit"

# Or push an empty commit:
git commit --allow-empty -m "Trigger redeploy"
git push origin main
```

### Rollback to Previous Version

```bash
# Render Dashboard > Service > Deployments
# Find previous successful deployment
# Click the deploy button
# Service reverts to that version
```

---

## TROUBLESHOOTING COMMANDS

### Backend Issues

```bash
# Check logs
# Render Dashboard > erp-backend > Logs

# Common issues:
# "MongoDB connection timeout" → Whitelist Render IPs in MongoDB Atlas
# "Cannot find module" → Check npm install ran
# "Port in use" → Set PORT=3000 in environment
# "REDIS connection refused" → Check REDIS_URL is correct

# View detailed error
# Look for red text in logs with timestamps
```

### Frontend Issues

```bash
# Check logs
# Render Dashboard > erp-frontend > Logs

# Common issues:
# "dist folder not found" → Build command failed
# "404 on all routes" → SPA routing not configured
# "API calls fail" → Check VITE_API_BASE_URL

# Test build locally
cd frontend
npm install
npm run build
# Should create frontend/dist folder
```

### Database Connection Issues

```bash
# 1. Verify connection string format
# mongodb+srv://user:pass@cluster.mongodb.net/dbname

# 2. Check credentials have no special chars
# If they do, URL encode them (% encoded)

# 3. Add Render IPs to MongoDB Atlas whitelist
# MongoDB Atlas > Network Access > Add IP
# Select "Allow access from anywhere"

# 4. Test connection locally
npm install
npm start
# Should show "MongoDB Connected"

# 5. Check Render environment variable
# MONGODB_URI should be set correctly
```

### API Not Working from Frontend

```bash
# 1. Check VITE_API_BASE_URL is set correctly
# Should include /api suffix
# https://your-backend.onrender.com/api

# 2. Verify backend CORS settings
# ALLOWED_ORIGINS should include frontend URL
# https://your-frontend.onrender.com

# 3. Test backend directly
curl https://your-backend.onrender.com/api/health

# 4. Check browser console
# Open developer tools (F12)
# Network tab > check requests to backend
# Should see 200 OK responses

# 5. Check logs
# Browser console for frontend errors
# Render logs for backend errors
```

---

## QUICK REFERENCE TABLE

| Task | Command |
|------|---------|
| **Commit Code** | `git add . && git commit -m "message"` |
| **Push to GitHub** | `git push origin main` |
| **Install Backend Deps** | `cd backend && npm install && cd ..` |
| **Install Frontend Deps** | `cd frontend && npm install && cd ..` |
| **Build Frontend** | `cd frontend && npm run build && cd ..` |
| **Run Backend** | `cd backend && npm start` |
| **Run Frontend** | `cd frontend && npm run preview` |
| **Validate Deployment** | Windows: `.\validate-deployment.bat` / Mac: `bash validate-deployment.sh` |
| **View Logs** | Render Dashboard > Service > Logs |
| **Set Env Vars** | Render Dashboard > Service > Environment |
| **Redeploy** | Render Dashboard > Service > Settings > Redeploy |
| **Test Backend** | `curl https://backend-name.onrender.com/api/health` |
| **Access Frontend** | https://frontend-name.onrender.com (in browser) |

---

## HELPFUL LINKS

| Resource | Link |
|----------|------|
| Render Dashboard | https://dashboard.render.com |
| Render Pricing | https://render.com/pricing |
| Render Docs | https://render.com/docs |
| MongoDB Atlas | https://www.mongodb.com/cloud/atlas |
| Redis Cloud | https://redis.com/try-free/ |
| Upstash Redis | https://upstash.com |
| Render Support | https://render.com/support |
| Render Discord | https://discord.gg/render |

---

## COMPLETE DEPLOYMENT CHECKLIST

Before Running Any Commands:
- [ ] GitHub repository created and ready
- [ ] Code committed and ready to push
- [ ] MongoDB Atlas account created
- [ ] Redis service ready (Redis Cloud or Upstash)
- [ ] Environment variables prepared

Before Deploying to Render:
- [ ] All code pushed to GitHub main branch
- [ ] `.env` files in `.gitignore`
- [ ] Backend `npm install` works locally
- [ ] Frontend `npm run build` works locally
- [ ] MongoDB whitelist includes 0.0.0.0/0
- [ ] Connection strings tested locally

After Deployment:
- [ ] Both services show "Live" status
- [ ] Backend logs show "MongoDB Connected"
- [ ] Frontend loads without errors
- [ ] API calls work from frontend
- [ ] Authentication works
- [ ] No errors in service logs

---

## 📞 GETTING HELP

1. **Check Render Logs First**
   - Service > Logs > Search for errors

2. **Test Locally**
   - Run same commands locally
   - Debug before deploying again

3. **Review Configuration**
   - Double-check environment variables
   - Verify database URLs are correct

4. **Contact Support**
   - Render: https://render.com/support
   - Discord: https://discord.gg/render

---

## 🎉 SUCCESS!

When you see:
- ✓ Backend service: "Live"
- ✓ Frontend service: "Live"
- ✓ Application loads in browser
- ✓ Features working correctly

**Your ERP application is successfully deployed on Render! 🚀**

For updates, just push to GitHub and Render will auto-deploy!

