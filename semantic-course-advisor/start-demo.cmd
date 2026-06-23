@echo off
setlocal
set "PROJECT_DIR=%~dp0"
set "BUNDLED_NODE=C:\Users\anson\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"

if exist "%BUNDLED_NODE%" (
  set "NODE_EXE=%BUNDLED_NODE%"
) else (
  set "NODE_EXE=node"
)

echo Explainable Semantic Search Engine
echo.
echo Starting local server...
echo Open this URL in your browser:
echo http://127.0.0.1:5173/semantic-course-advisor/app/
echo.
echo Keep this window open while presenting the demo.
echo Press Ctrl+C to stop the server.
echo.
"%NODE_EXE%" "%PROJECT_DIR%scripts\serve.mjs"
