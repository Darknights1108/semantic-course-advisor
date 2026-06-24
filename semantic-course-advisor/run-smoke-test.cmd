@echo off
setlocal
set "PROJECT_DIR=%~dp0"
cd /d "%PROJECT_DIR%"

set "NODE_EXE="

if exist "%PROJECT_DIR%runtime\node\node.exe" set "NODE_EXE=%PROJECT_DIR%runtime\node\node.exe"
if not defined NODE_EXE if exist "%PROJECT_DIR%node\node.exe" set "NODE_EXE=%PROJECT_DIR%node\node.exe"
if not defined NODE_EXE if exist "%PROJECT_DIR%tools\node\node.exe" set "NODE_EXE=%PROJECT_DIR%tools\node\node.exe"
if not defined NODE_EXE if defined SEMANTIC_ADVISOR_NODE if exist "%SEMANTIC_ADVISOR_NODE%" set "NODE_EXE=%SEMANTIC_ADVISOR_NODE%"
if not defined NODE_EXE if exist "%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" set "NODE_EXE=%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
if not defined NODE_EXE (
  where node.exe >nul 2>nul
  if not errorlevel 1 set "NODE_EXE=node"
)

if not defined NODE_EXE (
  echo Node.js was not found on this computer.
  echo Please install Node.js LTS from https://nodejs.org/
  echo.
  pause
  exit /b 1
)

"%NODE_EXE%" "%PROJECT_DIR%tests\smoke_test.mjs"
echo.
pause
