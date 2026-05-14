@echo off
REM Pre-deployment validation script for Windows
REM Run this before deploying to Render to catch common issues

setlocal enabledelayedexpansion

cls
echo.
echo ============================================================
echo  Pre-Deployment Validation Check
echo ============================================================
echo.

set ERRORS=0

REM Check Node.js
echo Checking Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo [91m✗ Node.js not found. Download from https://nodejs.org[0m
    set /a ERRORS+=1
) else (
    for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
    echo [92m✓ Node.js installed: !NODE_VERSION![0m
)

REM Check npm
echo Checking npm...
npm --version >nul 2>&1
if errorlevel 1 (
    echo [91m✗ npm not found[0m
    set /a ERRORS+=1
) else (
    for /f "tokens=*" %%i in ('npm --version') do set NPM_VERSION=%%i
    echo [92m✓ npm installed: !NPM_VERSION![0m
)

echo.

REM Check git
echo Checking git repository...
if not exist .git (
    echo [91m✗ Git not initialized. Run: git init[0m
    set /a ERRORS+=1
) else (
    echo [92m✓ Git repository initialized[0m
)

REM Check GitHub remote
echo Checking GitHub remote...
git remote get-url origin >nul 2>&1
if errorlevel 1 (
    echo [91m✗ GitHub remote not found. Run: git remote add origin ^<url^>[0m
    set /a ERRORS+=1
) else (
    for /f "tokens=*" %%i in ('git remote get-url origin') do set GITHUB_URL=%%i
    echo [92m✓ GitHub remote: !GITHUB_URL![0m
)

echo.

REM Check backend files
echo Checking backend structure...
if not exist backend\package.json (
    echo [91m✗ backend/package.json not found[0m
    set /a ERRORS+=1
) else (
    echo [92m✓ backend/package.json exists[0m
)

if not exist backend\src\app.js (
    echo [91m✗ backend/src/app.js not found[0m
    set /a ERRORS+=1
) else (
    echo [92m✓ backend/src/app.js exists[0m
)

REM Check frontend files
echo Checking frontend structure...
if not exist frontend\package.json (
    echo [91m✗ frontend/package.json not found[0m
    set /a ERRORS+=1
) else (
    echo [92m✓ frontend/package.json exists[0m
)

if not exist frontend\vite.config.js (
    if not exist frontend\vite.config.ts (
        echo [91m✗ frontend/vite.config not found[0m
        set /a ERRORS+=1
    ) else (
        echo [92m✓ frontend vite config exists[0m
    )
) else (
    echo [92m✓ frontend vite config exists[0m
)

echo.

REM Check configuration files
echo Checking deployment configuration...
if not exist .env.render (
    echo [93m⚠ .env.render not found[0m
) else (
    echo [92m✓ .env.render exists[0m
)

if not exist render.yaml (
    echo [93m⚠ render.yaml not found[0m
) else (
    echo [92m✓ render.yaml exists[0m
)

echo.

REM Check .gitignore
echo Checking .gitignore...
if exist .gitignore (
    findstr /M ".env" .gitignore >nul 2>&1
    if errorlevel 1 (
        echo [93m⚠ .env files not in .gitignore^! Add them now for security[0m
    ) else (
        echo [92m✓ .env files in .gitignore[0m
    )
) else (
    echo [93m⚠ .gitignore not found[0m
)

echo.

REM Check node_modules
echo Checking dependencies...
if not exist backend\node_modules (
    echo [93m⚠ backend node_modules not installed[0m
    echo    Run: cd backend ^&& npm install
) else (
    echo [92m✓ backend node_modules exists[0m
)

if not exist frontend\node_modules (
    echo [93m⚠ frontend node_modules not installed[0m
    echo    Run: cd frontend ^&& npm install
) else (
    echo [92m✓ frontend node_modules exists[0m
)

echo.
echo ============================================================
if !ERRORS! equ 0 (
    echo [92m✓ All checks passed![0m
    echo.
    echo You're ready to deploy to Render!
    echo.
    echo Next steps:
    echo 1. Go to https://dashboard.render.com
    echo 2. Create new services for backend and frontend
    echo 3. Set environment variables from .env.render
    echo 4. Push to GitHub to trigger auto-deploy
) else (
    echo [91m✗ Found !ERRORS! error^(s^)[0m
    echo.
    echo Please fix the above issues before deploying to Render
    echo.
    exit /b 1
)

echo.
pause
