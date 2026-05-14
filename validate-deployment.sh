#!/bin/bash
# Pre-deployment validation script
# Run this before deploying to Render to catch common issues

set -e

echo "🔍 Pre-Deployment Validation Check"
echo "=================================="
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ERRORS=0

# Check if Node.js is installed
echo "Checking Node.js installation..."
if ! command -v node &> /dev/null; then
    echo -e "${RED}✗ Node.js not found${NC}"
    ERRORS=$((ERRORS+1))
else
    NODE_VERSION=$(node -v)
    echo -e "${GREEN}✓ Node.js installed: $NODE_VERSION${NC}"
fi

# Check if npm is installed
echo "Checking npm installation..."
if ! command -v npm &> /dev/null; then
    echo -e "${RED}✗ npm not found${NC}"
    ERRORS=$((ERRORS+1))
else
    NPM_VERSION=$(npm -v)
    echo -e "${GREEN}✓ npm installed: $NPM_VERSION${NC}"
fi

echo ""

# Check if git is initialized
echo "Checking git repository..."
if [ ! -d .git ]; then
    echo -e "${RED}✗ Git not initialized. Run: git init${NC}"
    ERRORS=$((ERRORS+1))
else
    echo -e "${GREEN}✓ Git repository initialized${NC}"
fi

# Check if GitHub remote is added
echo "Checking GitHub remote..."
if ! git remote | grep -q origin; then
    echo -e "${RED}✗ GitHub remote not found. Run: git remote add origin <url>${NC}"
    ERRORS=$((ERRORS+1))
else
    GITHUB_URL=$(git remote get-url origin)
    echo -e "${GREEN}✓ GitHub remote configured: $GITHUB_URL${NC}"
fi

echo ""

# Check backend structure
echo "Checking backend structure..."
if [ ! -f backend/package.json ]; then
    echo -e "${RED}✗ backend/package.json not found${NC}"
    ERRORS=$((ERRORS+1))
else
    echo -e "${GREEN}✓ backend/package.json exists${NC}"
fi

if [ ! -f backend/src/app.js ]; then
    echo -e "${RED}✗ backend/src/app.js not found${NC}"
    ERRORS=$((ERRORS+1))
else
    echo -e "${GREEN}✓ backend/src/app.js exists${NC}"
fi

# Check frontend structure
echo "Checking frontend structure..."
if [ ! -f frontend/package.json ]; then
    echo -e "${RED}✗ frontend/package.json not found${NC}"
    ERRORS=$((ERRORS+1))
else
    echo -e "${GREEN}✓ frontend/package.json exists${NC}"
fi

if [ ! -f frontend/vite.config.js ] && [ ! -f frontend/vite.config.ts ]; then
    echo -e "${RED}✗ frontend/vite.config.js not found${NC}"
    ERRORS=$((ERRORS+1))
else
    echo -e "${GREEN}✓ frontend vite config exists${NC}"
fi

echo ""

# Check environment files
echo "Checking environment configuration..."
if [ ! -f .env.render ]; then
    echo -e "${YELLOW}⚠ .env.render not found (template: .env.render)${NC}"
else
    echo -e "${GREEN}✓ .env.render exists${NC}"
fi

if [ ! -f render.yaml ]; then
    echo -e "${YELLOW}⚠ render.yaml not found${NC}"
else
    echo -e "${GREEN}✓ render.yaml exists${NC}"
fi

echo ""

# Check .gitignore
echo "Checking .gitignore..."
if ! grep -q ".env" .gitignore 2>/dev/null; then
    echo -e "${YELLOW}⚠ .env files not in .gitignore. This is important for security!${NC}"
else
    echo -e "${GREEN}✓ .env files in .gitignore${NC}"
fi

echo ""

# Check backend dependencies
echo "Checking backend dependencies..."
cd backend
if npm ls > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Backend dependencies are valid${NC}"
else
    echo -e "${RED}✗ Backend has dependency issues${NC}"
    ERRORS=$((ERRORS+1))
fi
cd ..

# Check frontend dependencies
echo "Checking frontend dependencies..."
cd frontend
if npm ls > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Frontend dependencies are valid${NC}"
else
    echo -e "${RED}✗ Frontend has dependency issues${NC}"
    ERRORS=$((ERRORS+1))
fi
cd ..

echo ""

# Check for uncommitted changes
echo "Checking git status..."
if ! git diff-index --quiet HEAD --; then
    echo -e "${YELLOW}⚠ Uncommitted changes detected${NC}"
    echo "  Run: git add . && git commit -m 'message'"
else
    echo -e "${GREEN}✓ No uncommitted changes${NC}"
fi

echo ""
echo "=================================="

if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}✓ All checks passed!${NC}"
    echo ""
    echo "You're ready to deploy to Render!"
    echo ""
    echo "Next steps:"
    echo "1. Go to https://dashboard.render.com"
    echo "2. Create new services for backend and frontend"
    echo "3. Set environment variables from .env.render"
    echo "4. Push to GitHub to trigger auto-deploy"
else
    echo -e "${RED}✗ Found $ERRORS error(s)${NC}"
    echo ""
    echo "Please fix the above issues before deploying to Render"
    exit 1
fi
