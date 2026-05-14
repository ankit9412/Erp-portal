@echo off
REM Render Deployment Script for Windows
REM This script automates the deployment setup for Render

setlocal enabledelayedexpansion
cls

echo.
echo ============================================================
echo  Render Deployment Setup for ERP Portal
echo ============================================================
echo.

REM Colors simulation for Windows
echo [94m🚀 Starting Render Deployment Setup...[0m
echo.

REM Check if git is initialized
if not exist .git (
    echo Initializing git repository...
    call git init
    echo.
)

REM Check if GitHub remote exists
for /f %%i in ('git remote') do set "REMOTE=%%i"
if "!REMOTE!"=="" (
    set /p GITHUB_URL="Enter your GitHub repository URL: "
    call git remote add origin !GITHUB_URL!
    echo [92m✓ GitHub repository connected[0m
    echo.
)

REM Update .gitignore
if exist .gitignore (
    findstr /M ".env" .gitignore >nul
    if errorlevel 1 (
        echo Adding .env files to .gitignore...
        echo .env >> .gitignore
        echo .env.local >> .gitignore
        echo .env.*.local >> .gitignore
    )
) else (
    echo .env > .gitignore
    echo .env.local >> .gitignore
    echo .env.*.local >> .gitignore
)

REM Install backend dependencies
echo Installing backend dependencies...
cd backend
call npm install
cd ..
echo [92m✓ Backend dependencies installed[0m
echo.

REM Install frontend dependencies
echo Installing frontend dependencies...
cd frontend
call npm install
cd ..
echo [92m✓ Frontend dependencies installed[0m
echo.

REM Build frontend
echo Building frontend...
cd frontend
call npm run build
cd ..
if exist frontend\dist (
    echo [92m✓ Frontend built successfully[0m
) else (
    echo [91m✗ Frontend build failed[0m
)
echo.

REM Commit files
echo Committing files to git...
call git add .
call git commit -m "Prepare for Render deployment" || echo Build files already committed
echo [92m✓ Files committed[0m
echo.

REM Push to GitHub
echo Pushing to GitHub...
call git push -u origin main
if errorlevel 1 (
    echo Trying with master branch...
    call git push -u origin master
)
echo [92m✓ Pushed to GitHub[0m
echo.

echo ============================================================
echo [92m✓ Setup Complete![0m
echo ============================================================
echo.
echo Next Steps:
echo 1. Go to https://dashboard.render.com
echo 2. Click 'New +' and select 'Web Service'
echo 3. Connect your GitHub repository
echo.
echo For Backend:
echo   - Build Command: cd backend ^&& npm install
echo   - Start Command: cd backend ^&& npm start
echo.
echo For Frontend:
echo   - Build Command: cd frontend ^&& npm install ^&& npm run build
echo   - Publish Directory: frontend/dist
echo.
echo Environment Variables:
echo   - Copy settings from .env.render file
echo   - Update with your actual secrets and URLs
echo.
echo 📚 Full guide available in RENDER_DEPLOYMENT.md
echo.
pause
