@echo off
chcp 65001 >nul
setlocal
cd /d "%~dp0"

echo ================================================================
echo   SALES_COUNTER  --  bootstrap + push + GitHub Pages
echo ================================================================

REM 1. Node dependencies (force clean to avoid partial install artifacts)
if exist "node_modules" (
  echo [1/6] Clearing pre-existing node_modules for clean install ...
  rmdir /S /Q "node_modules"
)
if exist "package-lock.json" del /Q "package-lock.json"
echo [1/6] npm install ...
call npm install
if errorlevel 1 goto :err

REM 2. Build test (catches type errors before push)
echo.
echo [2/6] Test build ...
call npm run build
if errorlevel 1 goto :err

REM 3. Git init
echo.
if exist ".git" (
  echo [3/6] .git already exists. Skipping git init.
) else (
  echo [3/6] git init ...
  git init
  git branch -M main
)

REM 4. Create GitHub repo (Public, so Pages works on free tier)
echo.
echo [4/6] Creating GitHub repo (public) ...
gh repo create GridAtlas/SALES_COUNTER --public --source=. --remote=origin --description "Visit-sales funnel tap counter (mobile web app)" 2>nul
if errorlevel 1 (
  echo [INFO] Repo may already exist. Adding remote if missing ...
  git remote add origin https://github.com/GridAtlas/SALES_COUNTER.git 2>nul
)

REM 5. Commit + push
echo.
echo [5/6] Committing ...
git add .
git commit -m "chore: bootstrap SALES_COUNTER (Next.js static export, GH Pages)"
if errorlevel 1 (
  echo [INFO] Nothing to commit or already committed.
)

echo.
echo [5.5/6] Pushing to origin/main ...
git push -u origin main
if errorlevel 1 goto :err

REM 6. Enable Pages via API + kick workflow
echo.
echo [6/6] Enabling GitHub Pages (workflow source) ...
gh api -X POST /repos/GridAtlas/SALES_COUNTER/pages -f build_type=workflow 2>nul
if errorlevel 1 (
  echo [INFO] Pages may already be enabled. Continuing.
)

echo.
echo [6/6] Watching the Actions run ...
gh run watch --exit-status 2>nul
if errorlevel 1 (
  echo [INFO] Could not watch. Check Actions manually.
)

echo.
echo ================================================================
echo   DONE. Live URL:
echo     https://gridatlas.github.io/SALES_COUNTER/
echo   (may take 30-60s for first deploy to be visible)
echo ================================================================
pause
exit /b 0

:err
echo.
echo ================================================================
echo   ERROR occurred. Fix the issue above and re-run.
echo ================================================================
pause
exit /b 1
