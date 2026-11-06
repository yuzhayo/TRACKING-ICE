@echo off
setlocal EnableExtensions
cd /d "%~dp0"
title TRACKING-ICE - deploy (GitHub + Cloudflare Pages)

REM ===========================================================================
REM  deploy.bat
REM
REM  One button: commit everything outstanding, push to GitHub, rebuild,
REM  deploy the fresh dist/ to Cloudflare Pages PRODUCTION.
REM
REM  Usage:
REM    deploy.bat                 -> asks for a commit message (Enter = abort)
REM    deploy.bat "my message"    -> no prompt
REM
REM  What it will never do:
REM    - never force-push, never touch anything outside this folder
REM    - never stage/commit credential files (hard-aborts if any appear)
REM    - never print the Cloudflare token (read straight into the environment)
REM    - never push if the build or svelte-check fails
REM ===========================================================================

echo.
echo  ============================================
echo   TRACKING-ICE - deploy
echo  ============================================
echo.

REM --- 0. prerequisites ------------------------------------------------------
where node >nul 2>nul || (echo ERROR: node not on PATH. & pause & exit /b 2)
where npm  >nul 2>nul || (echo ERROR: npm not on PATH. & pause & exit /b 3)
where git  >nul 2>nul || (echo ERROR: git not on PATH. & pause & exit /b 4)
if not exist "cloudflare-key.txt" (
  echo ERROR: cloudflare-key.txt not found - it holds the Cloudflare API token and account ID.
  echo The deploy cannot run without it.
  pause & exit /b 5
)

REM --- 1. stage everything, then SECRET GUARD --------------------------------
git add -A || (echo ERROR: git add failed. & pause & exit /b 6)

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$m = git diff --cached --name-only; $bad = $m | Where-Object { $_ -match '(?i)(cloudflare-key|NETLIFY_PERSONAL|\.key$|-key\.txt$|\.pem$|id_rsa|\.env(\.|$)|credentials|secret)' }; if ($bad) { Write-Host ('ABORT: refusing to commit secret-looking files: ' + ($bad -join ', ')); git reset -q; exit 9 } else { Write-Host ('staged: ' + ($m | Measure-Object).Count + ' file(s)') }"

if errorlevel 9 (
  echo.
  echo Secret guard tripped. Everything is UNSTAGED again. Nothing was committed or pushed.
  pause & exit /b 9
)

REM --- 2. commit (message = argument or prompt) ------------------------------
set "MSG=%~1"
if "%MSG%"=="" set /p MSG=Commit message (Enter to abort):
if "%MSG%"=="" (
  echo Aborted - no message. Nothing committed, pushed or deployed.
  git reset -q
  pause & exit /b 10
)

git diff --cached --quiet
if errorlevel 1 (
  git commit -m "%MSG%" || (echo ERROR: commit failed. & pause & exit /b 11)
) else (
  echo Nothing to commit - continuing with push and deploy.
)

REM --- 3. push ---------------------------------------------------------------
echo.
echo [push] origin main
git push origin main || (echo ERROR: push failed - remote rejected or network down. Deploy NOT started. & pause & exit /b 12)

REM --- 4. build + type-check gate --------------------------------------------
echo.
echo [build] npm run build
call npm run build || (echo ERROR: build failed. Deploy NOT started. & pause & exit /b 13)
echo.
echo [check] npm run check
call npm run check || (echo ERROR: svelte-check failed. Deploy NOT started. & pause & exit /b 14)

REM --- 5. deploy to Cloudflare Pages PRODUCTION ------------------------------
REM  Reads the API token (line 9) and account ID (line 5) from cloudflare-key.txt
REM  straight into env vars. Values are never printed.
echo.
echo [deploy] Cloudflare Pages: report-ice-cube (production, branch main)
powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -Command ^
  "$lines = Get-Content cloudflare-key.txt; $env:CLOUDFLARE_API_TOKEN = $lines[8].Trim(); $env:CLOUDFLARE_ACCOUNT_ID = $lines[4].Trim(); npx --yes wrangler pages deploy dist --project-name=report-ice-cube --branch=main"
if errorlevel 1 (echo ERROR: deploy failed - see wrangler output above. & pause & exit /b 15)

REM --- 6. verify the live domain serves THIS build ---------------------------
echo.
echo [verify] checking https://report-ice-cube.pages.dev/ serves the new asset hashes...
powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -Command ^
  "$page = (Invoke-WebRequest -UseBasicParsing -Uri 'https://report-ice-cube.pages.dev/' -TimeoutSec 30).Content; $rx = [regex] 'assets/index-[A-Za-z0-9_-]+\.(js|css)'; $live = ($rx.Matches($page) | ForEach-Object { $_.Value }) -join ', '; $local = ($rx.Matches((Get-Content dist\index.html -Raw)) | ForEach-Object { $_.Value }) -join ', '; Write-Host ('live  : ' + $live); Write-Host ('local : ' + $local); if ($live -eq $local) { Write-Host 'VERIFIED: production serves this build'; exit 0 } else { Write-Host 'MISMATCH: production does not (yet) serve this build'; exit 16 }"
if errorlevel 16 (echo Verify FAILED - redeploy before trusting the site. & pause & exit /b 16)

echo.
echo  ============================================
echo   DONE. GitHub pushed, Cloudflare deployed, verified.
echo  ============================================
pause
