@echo off
echo ================================
echo  Household Expense Tracker
echo ================================
echo.
echo Starting Backend (port 5000)...
start "Backend" cmd /k "cd /d %~dp0backend && node server.js"
timeout /t 2 /nobreak >nul
echo Starting Frontend (port 3000)...
start "Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"
timeout /t 3 /nobreak >nul
echo.
echo App is starting...
echo Open your browser at: http://localhost:3000
echo.
start http://localhost:3000
