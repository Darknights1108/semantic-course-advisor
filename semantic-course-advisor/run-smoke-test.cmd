@echo off
setlocal
set "PROJECT_DIR=%~dp0"
set "BUNDLED_NODE=C:\Users\anson\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"

if exist "%BUNDLED_NODE%" (
  set "NODE_EXE=%BUNDLED_NODE%"
) else (
  set "NODE_EXE=node"
)

"%NODE_EXE%" "%PROJECT_DIR%tests\smoke_test.mjs"
