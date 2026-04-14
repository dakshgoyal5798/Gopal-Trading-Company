@echo off
echo ===================================================
echo   Gopal Trading Company - ALL SERVICES
echo ===================================================

echo [1/2] Starting Backend Server (Port 5000)...
start "Gopal Backend" cmd /k "cd /d "%~dp0\back end" && "C:\Program Files\nodejs\node.exe" index.js"

echo [2/2] Starting Frontend Dev Server (Port 3000)...
start "Gopal Frontend" cmd /k "cd /d "%~dp0\front end" && "C:\Program Files\nodejs\node.exe" serve.js"

echo.
echo SUCCESS: All services are launching!
echo.
echo 🌐 Frontend:  http://localhost:3000
echo 🚀 Backend:   http://localhost:5000
echo.
echo You can keep these windows open while working.
echo If they close accidentally, just run this script again.
echo.
pause
