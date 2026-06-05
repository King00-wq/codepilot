@echo off
REM ─────────────────────────────────────────────────────────────────────────────
REM  CodePilot — Backend Setup & Run Script (Windows)
REM  Run this from inside the backend\ folder:  .\start.bat
REM ─────────────────────────────────────────────────────────────────────────────

echo.
echo [1/4] Locating Python 3.13...

REM Try py launcher first (recommended on Windows)
py -3.13 --version >nul 2>&1
if %errorlevel% == 0 (
    set PYTHON=py -3.13
    echo        Found via py launcher.
    goto :found
)

REM Fallback: python3.13 on PATH
python3.13 --version >nul 2>&1
if %errorlevel% == 0 (
    set PYTHON=python3.13
    echo        Found as python3.13.
    goto :found
)

REM Fallback: check common install path
if exist "C:\Python313\python.exe" (
    set PYTHON=C:\Python313\python.exe
    echo        Found at C:\Python313\python.exe.
    goto :found
)

echo.
echo  ERROR: Python 3.13 not found.
echo  Download it from https://www.python.org/downloads/release/python-3130/
echo  Make sure to tick "Add to PATH" during install.
echo.
pause
exit /b 1

:found
echo.
echo [2/4] Creating virtual environment (.venv)...
%PYTHON% -m venv .venv
if %errorlevel% neq 0 (
    echo  ERROR: Failed to create virtual environment.
    pause
    exit /b 1
)

echo.
echo [3/4] Installing dependencies into .venv...
.venv\Scripts\pip install --upgrade pip --quiet
.venv\Scripts\pip install -r requirements.txt
if %errorlevel% neq 0 (
    echo.
    echo  ERROR: pip install failed. See output above.
    pause
    exit /b 1
)

echo.
echo [4/4] Starting FastAPI server...
echo        API:  http://localhost:8000
echo        Docs: http://localhost:8000/docs
echo.
echo  Press Ctrl+C to stop the server.
echo.

.venv\Scripts\uvicorn main:app --reload --host 0.0.0.0 --port 8000
