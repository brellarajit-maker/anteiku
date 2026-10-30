@echo off
rem ---------------------------------------------------------------------------
rem  Double-click this to preview the site.
rem
rem  A Next.js project has no index.html to open — the pages are built and
rem  served. This finds Node (which is installed but not on this machine's
rem  PATH), installs anything missing, starts the server and opens the browser.
rem
rem  Close this window to stop the server.
rem ---------------------------------------------------------------------------
setlocal
cd /d "%~dp0"
title Anteiku - preview

rem Node is at %LOCALAPPDATA%\Programs\nodejs on this machine and is not on
rem PATH. Prefer whatever is on PATH; fall back to that folder.
where npm >nul 2>nul
if errorlevel 1 (
  if exist "%LOCALAPPDATA%\Programs\nodejs\npm.cmd" (
    set "PATH=%LOCALAPPDATA%\Programs\nodejs;%PATH%"
  )
)

where npm >nul 2>nul
if errorlevel 1 (
  echo.
  echo   Could not find npm.
  echo   Install Node.js from https://nodejs.org and run this again.
  echo.
  pause
  exit /b 1
)

if not exist "node_modules\next" (
  echo.
  echo   First run - installing dependencies. This takes a few minutes.
  echo.
  call npm install
  if errorlevel 1 (
    echo.
    echo   Install failed. Nothing was started.
    echo.
    pause
    exit /b 1
  )
)

echo.
echo   Starting the site at http://localhost:3210
echo   The browser opens in a moment. Close this window to stop.
echo.

rem Open the browser once the server has had time to come up.
start "" /min cmd /c "timeout /t 6 /nobreak >nul & start "" http://localhost:3210"

call npm run dev

echo.
echo   Server stopped.
pause
