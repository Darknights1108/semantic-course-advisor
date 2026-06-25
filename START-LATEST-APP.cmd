@echo off
setlocal EnableExtensions
title CareerGraph - Semantic Career Advisor

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
  echo.
  echo CareerGraph could not start because Node.js was not found.
  echo Install Node.js LTS from https://nodejs.org/
  echo Then double-click this file again.
  echo.
  pause
  exit /b 1
)

if not defined PORT (
  for /f %%P in ('powershell -NoProfile -Command "$p=5173; while($p -le 5193){try{$l=[Net.Sockets.TcpListener]::new([Net.IPAddress]::Loopback,$p);$l.Start();$l.Stop();$p;break}catch{$p++}}"') do set "PORT=%%P"
)

if not defined PORT (
  echo.
  echo No available local port was found between 5173 and 5193.
  echo Close another local development server and try again.
  echo.
  pause
  exit /b 1
)

set "APP_URL=http://127.0.0.1:%PORT%/app/"

echo.
echo ============================================================
echo   CareerGraph - Latest Semantic Career Advisor
echo ============================================================
echo.
echo Starting the redesigned app:
echo %APP_URL%
echo.
echo Keep this window open while using the app.
echo Press Ctrl+C to stop the server.
echo.

if /i not "%NO_BROWSER%"=="1" (
  start "" /b powershell -NoProfile -WindowStyle Hidden -Command "$u='%APP_URL%'; for($i=0;$i -lt 40;$i++){try{Invoke-WebRequest -UseBasicParsing $u -TimeoutSec 1 ^| Out-Null; Start-Process $u; break}catch{Start-Sleep -Milliseconds 250}}"
)

"%NODE_EXE%" "%PROJECT_DIR%scripts\serve.mjs"

echo.
echo CareerGraph server stopped.
pause
