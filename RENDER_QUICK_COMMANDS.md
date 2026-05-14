# 🚀 Render Deployment - Quick Commands Reference

## One-Line Setup

### Windows
```powershell
# Run the deployment script
.\deploy-render.bat
```

### Mac/Linux
```bash
# Run the deployment script
bash deploy-render.sh
```

---

## Manual Step-by-Step Commands

### 1️⃣ Prepare Code for Deployment

```bash
# Initialize git if not done
git init

# Add all files
git add .

# Commit
git commit -m "Prepare for Render deployment"

# Add GitHub remote (if not added)
git remote add origin https://github.com/YOUR_USERNAME/erp-portal.git

# Push to GitHub
git push -u origin main
```

---

### 2️⃣ Deploy Backend Service

```bash
# These are the values to use in Render Dashboard:

# Build Command:
cd backend && npm install

# Start Command:
cd backend && npm start

# Or use render.yaml:
# The file already has all configuration ready
```

**Render Dashboard Steps:**
```
1. Go to https://dashboard.render.com
2. Click "New +" → "Web Service"
3. Connect GitHub repo (erp-portal)
4. Select branch: main
5. Name: erp-backend
6. Runtime: Node
7. Region: Oregon (or closest to you)
8. Build Command: cd backend && npm install
9. Start Command: cd backend && npm start
10. Instance Type: Free (or Starter+ for production)
11. Click "Create Web Service"
12. Add Environment Variables (see Step 3 below)
```

---

### 3️⃣ Set Environment Variables

**For Backend Service** - Go to Render Dashboard > Service Settings > Environment:

```bash
# Required:
NODE_ENV=production
PORT=3000
CLIENT_URL=https://your-erp-frontend.onrender.com

MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/erp_db
REDIS_URL=redis://default:password@hostname:port

JWT_SECRET=generate_a_random_string_here
JWT_REFRESH_SECRET=generate_another_random_string_here
JWT_EXPIRE=7d
JWT_REFRESH_EXPIRE=30d

# Email Setup:
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-specific-password
EMAIL_FROM=noreply@erp-platform.com

# File Upload:
CLOUDINARY_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# CORS:
ALLOWED_ORIGINS=https://your-erp-frontend.onrender.com

# Optional but recommended:
LOG_LEVEL=info
```

---

### 4️⃣ Deploy Frontend Service

**Render Dashboard Steps:**
```
1. Go to https://dashboard.render.com
2. Click "New +" → "Static Site"
3. Connect GitHub repo (erp-portal)
4. Select branch: main
5. Name: erp-frontend
6. Build Command: cd frontend && npm install && npm run build
7. Publish Directory: frontend/dist
8. Click "Create Static Site"
9. Add Environment Variables:
   - VITE_API_BASE_URL=https://your-erp-backend.onrender.com/api
   - VITE_SOCKET_URL=https://your-erp-backend.onrender.com
```

---

### 5️⃣ Setup MongoDB

```bash
# Go to MongoDB Atlas: https://www.mongodb.com/cloud/atlas
# 1. Create free account
# 2. Create new cluster (Free M0)
# 3. Create database user
# 4. Add IP to whitelist (0.0.0.0/0 for Render)
# 5. Get connection string: 
#    mongodb+srv://username:password@cluster.mongodb.net/dbname
# 6. Add to MONGODB_URI environment variable in Render
```

**Connection String Format:**
```
mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/erp_db?retryWrites=true&w=majority
```

---

### 6️⃣ Setup Redis

```bash
# Option 1: Redis Cloud (Recommended)
# Go to: https://redis.com/try-free/
# 1. Create free account
# 2. Create database
# 3. Get connection URL: redis://:password@hostname:port
# 4. Add to REDIS_URL in Render

# Option 2: Upstash Redis (Also Free)
# Go to: https://upstash.com
# 1. Create account
# 2. Create Redis database
# 3. Copy connection string
# 4. Add to REDIS_URL
```

---

## Testing Commands

### After Deployment

```bash
# Test Backend API
curl https://your-erp-backend.onrender.com/api/health

# Test Frontend
# Open in browser: https://your-erp-frontend.onrender.com

# Check Backend Logs
# Go to Render Dashboard > erp-backend > Logs

# Check Frontend Logs
# Go to Render Dashboard > erp-frontend > Logs
```

---

## Auto-Deploy on Git Push

```bash
# Once deployed on Render:
# 1. Every git push to main branch auto-deploys
# 2. Render watches your GitHub repository
# 3. No manual redeploy needed

# To trigger deployment:
git add .
git commit -m "Update feature"
git push origin main

# Render automatically:
# 1. Builds the code
# 2. Runs build commands
# 3. Deploys new version
```

---

## Troubleshooting Commands

### Backend Not Starting

```bash
# Check Render logs:
# 1. Go to Render Dashboard
# 2. Select erp-backend service
# 3. Click "Logs" tab
# 4. Look for error messages

# Common issues:
# - Missing environment variables
# - Wrong MONGODB_URI
# - Wrong REDIS_URL
# - Port conflicts (use 3000)
```

### Frontend Showing 404

```bash
# Verify build directory:
# Should have frontend/dist folder after build

# Check Render settings:
# Service Settings > Publish Directory = frontend/dist

# Common issues:
# - Build command failed
# - Publish directory wrong
# - Vite config issues
```

### Database Connection Timeout

```bash
# For MongoDB:
# 1. Add Render IP to MongoDB Atlas whitelist
# 2. Go to MongoDB Atlas
# 3. Network Access > Add IP Address
# 4. Add: 0.0.0.0/0 (allows all IPs)

# Test connection:
# Check backend logs for "MongoDB Connected"
```

### API Not Connecting from Frontend

```bash
# Check:
# 1. VITE_API_BASE_URL is set correctly
# 2. Backend ALLOWED_ORIGINS includes frontend URL
# 3. Backend CORS middleware is configured

# In backend src/app.js:
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS?.split(','),
  credentials: true
};
```

---

## Advanced Commands

### Manual Redeploy

```bash
# Go to Render Dashboard:
# 1. Select service
# 2. Settings tab
# 3. Scroll down
# 4. Click "Redeploy latest commit"

# Or push a new commit:
git commit --allow-empty -m "Trigger redeploy"
git push origin main
```

### View Deployment Status

```bash
# Go to Render Dashboard:
# 1. Select service
# 2. Deployments tab
# 3. View deployment history and logs

# Green checkmark = Successful
# Red X = Failed
# Click for detailed logs
```

### Scale Services

```bash
# Go to Render Dashboard:
# 1. Select service > Settings
# 2. Instance Type options:
#    - Free (limited, sleep after 15 min inactivity)
#    - Starter+ ($7/month - recommended for production)
#    - Standard/Pro (higher capacity)
```

---

## Environment Variables for Different Environments

### Development (.env)
```env
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/erp_db
REDIS_URL=redis://localhost:6379
```

### Production (.env.render / Render Dashboard)
```env
NODE_ENV=production
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/erp_db
REDIS_URL=redis://user:pass@hostname:port
```

---

## Quick Deployment Checklist

- [ ] Code pushed to GitHub (main branch)
- [ ] render.yaml exists in root directory
- [ ] .env.render file has all required variables
- [ ] MongoDB connection string verified
- [ ] Redis connection string verified
- [ ] Backend build command: `cd backend && npm install`
- [ ] Backend start command: `cd backend && npm start`
- [ ] Frontend build command: `cd frontend && npm install && npm run build`
- [ ] Frontend publish directory: `frontend/dist`
- [ ] VITE_API_BASE_URL points to correct backend URL
- [ ] All sensitive keys in Render Environment (not hardcoded)
- [ ] MongoDB Atlas whitelist updated for Render IPs
- [ ] Email credentials configured
- [ ] Cloudinary API keys added

---

## Useful Links

- **Render Dashboard:** https://dashboard.render.com
- **MongoDB Atlas:** https://www.mongodb.com/cloud/atlas
- **Redis Cloud:** https://redis.com/try-free/
- **Upstash Redis:** https://upstash.com
- **Render Docs:** https://render.com/docs
- **Render Pricing:** https://render.com/pricing

---

## Support

If deployment fails:
1. Check Render Dashboard logs
2. Review environment variables
3. Verify GitHub repository connection
4. Check MongoDB/Redis connectivity
5. Look at this guide's troubleshooting section
6. Contact Render support: https://render.com/support

