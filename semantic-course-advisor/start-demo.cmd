@echo off
setlocal
set "PROJECT_DIR=%~dp0"
cd /d "%PROJECT_DIR%"

set "NODE_EXE="

if exist "%PROJECT_DIR%runtime\node\node.exe" set "NODE_EXE=%PROJECT_DIR%runtime\node\node.exe"
if not defined NODE_EXE if exist "%PROJECT_DIR%node\node.exe" set "NODE_EXE=%PROJECT_DIR%node\node.exe"
if not defined NODE_EXE if exist "%PROJECT_DIR%tools\node\node.exe" set "NODE_EXE=%PROJECT_DIR%tools\node\node.exe"
if not defined NODE_EXE (
  where node.exe >nul 2>nul
  if not errorlevel 1 set "NODE_EXE=node"
)

if not defined NODE_EXE (
  echo Semantic Career Recommendation Platform
  echo.
  echo Node.js was not found on this computer.
  echo Please install Node.js LTS from https://nodejs.org/
  echo Then double-click start-demo.cmd again.
  echo.
  pause
  exit /b 1
)

if "%PORT%"=="" set "PORT=5173"

echo Semantic Career Recommendation Platform
echo.
echo Starting local server from:
echo %PROJECT_DIR%
echo.
echo Open this URL in your browser:
echo http://127.0.0.1:%PORT%/app/
echo.
echo The old project URL also works:
echo http://127.0.0.1:%PORT%/semantic-course-advisor/app/
echo.
echo Keep this window open while using the demo.
echo Press Ctrl+C to stop the server.
echo.

start "" "http://127.0.0.1:%PORT%/app/"
"%NODE_EXE%" "%PROJECT_DIR%scripts\serve.mjs"

echo.
echo Server stopped.
pause
