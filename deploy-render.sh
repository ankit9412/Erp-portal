#!/bin/bash
# Render Deployment Script
# This script automates the deployment setup for Render

set -e

echo "🚀 Starting ERP Portal Render Deployment Setup"
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if git is initialized
if [ ! -d .git ]; then
    echo -e "${YELLOW}Initializing git repository...${NC}"
    git init
fi

# Check if repository is connected to GitHub
if ! git remote | grep -q origin; then
    read -p "Enter your GitHub repository URL: " GITHUB_URL
    git remote add origin $GITHUB_URL
    echo -e "${GREEN}✓ GitHub repository connected${NC}"
fi

# Ensure .env files are not committed
if ! grep -q ".env*" .gitignore 2>/dev/null; then
    echo -e "${YELLOW}Adding .env files to .gitignore...${NC}"
    echo ".env" >> .gitignore
    echo ".env.local" >> .gitignore
    echo ".env.*.local" >> .gitignore
fi

# Install backend dependencies
echo -e "${YELLOW}Installing backend dependencies...${NC}"
cd backend
npm install
cd ..
echo -e "${GREEN}✓ Backend dependencies installed${NC}"

# Install frontend dependencies
echo -e "${YELLOW}Installing frontend dependencies...${NC}"
cd frontend
npm install
cd ..
echo -e "${GREEN}✓ Frontend dependencies installed${NC}"

# Build frontend
echo -e "${YELLOW}Building frontend...${NC}"
cd frontend
npm run build
cd ..
echo -e "${GREEN}✓ Frontend built successfully${NC}"

# Commit files
echo -e "${YELLOW}Committing files to git...${NC}"
git add .
git commit -m "Prepare for Render deployment" || true
echo -e "${GREEN}✓ Files committed${NC}"

# Push to GitHub
echo -e "${YELLOW}Pushing to GitHub...${NC}"
git push -u origin main || git push -u origin master || true
echo -e "${GREEN}✓ Pushed to GitHub${NC}"

echo ""
echo "=================================================="
echo -e "${GREEN}✓ Setup Complete!${NC}"
echo "=================================================="
echo ""
echo "Next Steps:"
echo "1. Go to https://dashboard.render.com"
echo "2. Click 'New +' and select 'Web Service'"
echo "3. Connect your GitHub repository"
echo ""
echo "For Backend:"
echo "  - Build Command: cd backend && npm install"
echo "  - Start Command: cd backend && npm start"
echo ""
echo "For Frontend:"
echo "  - Build Command: cd frontend && npm install && npm run build"
echo "  - Publish Directory: frontend/dist"
echo ""
echo "Environment Variables:"
echo "  - Copy from .env.render file"
echo "  - Update with your actual secrets and URLs"
echo ""
echo "📚 Full guide available in RENDER_DEPLOYMENT.md"
