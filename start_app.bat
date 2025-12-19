@echo off
setlocal
:: Get the directory where this script is located
set "SCRIPT_DIR=%~dp0"
:: Remove trailing backslash if present
if "%SCRIPT_DIR:~-1%"=="\" set "SCRIPT_DIR=%SCRIPT_DIR:~0,-1%"

cd /d "%SCRIPT_DIR%"

echo ===================================================
echo     NAVIGATE - AI-Powered Learning Platform
echo            Setup and Startup Script
echo ===================================================
echo.
echo Working Directory: %SCRIPT_DIR%
echo Installing dependencies and starting services...
echo.

REM --- 1. AI Services ---
echo [1/3] Setting up AI Services...
if exist "%SCRIPT_DIR%\ai_services" (
    cd "%SCRIPT_DIR%\ai_services"
    if not exist node_modules (
        echo Installing AI Services dependencies...
        call npm install
    ) else (
        echo AI Services dependencies already installed.
    )
    if not exist .env (
        echo Creating .env from template...
        copy .env.template .env
    )
) else (
    echo ERROR: ai_services folder not found at %SCRIPT_DIR%\ai_services
)

REM --- 2. Backend ---
echo.
echo [2/3] Setting up Backend...
if exist "%SCRIPT_DIR%\backend" (
    cd "%SCRIPT_DIR%\backend"
    if not exist node_modules (
        echo Installing Backend dependencies...
        call npm install
    ) else (
        echo Backend dependencies already installed.
    )
    if not exist .env (
        echo Creating .env from template...
        copy .env.template .env
    )
    
    echo Starting Backend Server...
    :: Use /D to set the working directory for the new window explicitly
    start "Navigate Backend" /D "%SCRIPT_DIR%\backend" cmd /k "npm run dev"
) else (
     echo ERROR: backend folder not found at %SCRIPT_DIR%\backend
)

REM --- 3. Frontend ---
echo.
echo [3/3] Setting up Frontend...
if exist "%SCRIPT_DIR%\frontend" (
    cd "%SCRIPT_DIR%\frontend"
    if not exist node_modules (
        echo Installing Frontend dependencies...
        call npm install --legacy-peer-deps
    ) else (
        echo Frontend dependencies already installed.
    )
    
    echo Starting Frontend Client...
    start "Navigate Frontend" /D "%SCRIPT_DIR%\frontend" cmd /k "npm start"
) else (
    echo ERROR: frontend folder not found at %SCRIPT_DIR%\frontend
)

cd /d "%SCRIPT_DIR%"
echo.
echo ===================================================
echo             Services Starting...
echo ===================================================
echo Backend running on: http://localhost:5000
echo Frontend running on: http://localhost:3000
echo.
echo Please inspect the two new terminal windows for any errors.
echo If windows close immediately, there is an error in that service.
echo ===================================================
pause
