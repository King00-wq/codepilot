@echo off
REM ─────────────────────────────────────────────────────────────────────────────
REM  CodePilot — Frontend Setup & Run Script (Windows)
REM  Run this from inside the frontend\ folder:  .\start.bat
REM ─────────────────────────────────────────────────────────────────────────────

echo.
echo [1/2] Installing frontend dependencies...
call npm install
if %errorlevel% neq 0 (
    echo.
    echo  ERROR: npm install failed.
    echo  Make sure Node.js is installed: https://nodejs.org
    pause
    exit /b 1
)

echo.
echo [2/2] Starting React development server...
echo        App: http://localhost:3000
echo.
echo  Press Ctrl+C to stop.
echo.

call npm start
