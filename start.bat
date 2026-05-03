@echo off
echo Starting Lucidia servers...

:: Start Python Face Recognition API
start "Face Recognition API" cmd /k "cd /d %~dp0Module && python api.py"

:: Start Node backend
start "Node Backend" cmd /k "cd /d %~dp0backend && npm run dev"

:: Start Frontend
start "Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

echo All servers started.
