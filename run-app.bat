@echo off
setlocal EnableExtensions
cd /d "%~dp0"
title TRACKING-ICE - dev server

REM ===========================================================================
REM  run-app.bat
REM
REM  Menjalankan dev server TRACKING-ICE (Vite) dari folder ini.
REM  - Cek node dan npm ada di PATH; kalau tidak, beri pesan jelas lalu stop.
REM  - Kalau node_modules belum ada, jalankan npm install dulu.
REM  - Port default: 5300.
REM
REM  TANPA ARGUMEN (double-click dari Explorer) -> muncul menu pilihan:
REM    1. Buka di browser default, tab baru
REM    2. Buka di automation Chrome (port 9333), tab baru, profil C:\RARA\BROWSER-AUTOMATION
REM    0. Keluar
REM
REM  LANGSUNG tanpa menu (terminal / script):
REM    run-app.bat automation
REM    run-app.bat --port 5300
REM    run-app.bat automation --port 5300
REM
REM  Ctrl+C atau tutup jendela ini untuk mematikan server.
REM ===========================================================================

where node >nul 2>nul
if errorlevel 1 (
  echo ERROR: node tidak ditemukan di PATH.
  echo Install Node.js dulu dari https://nodejs.org lalu jalankan lagi.
  pause
  exit /b 2
)

where npm >nul 2>nul
if errorlevel 1 (
  echo ERROR: npm tidak ditemukan di PATH.
  echo Install Node.js dulu dari https://nodejs.org lalu jalankan lagi.
  pause
  exit /b 3
)

if not exist "node_modules" (
  echo [SETUP] node_modules belum ada - menjalankan npm install dulu...
  call npm install --no-audit --no-fund
  if errorlevel 1 (
    echo ERROR: npm install gagal. Cek koneksi internet lalu coba lagi.
    pause
    exit /b 4
  )
)

set "AUTO=0"
set "PORT=5300"
set "EXTRA="
set "VITE_ARGS="

if "%~1"=="" goto menu

if /i "%~1"=="automation" goto mode_automation
goto collect_args

:menu
cls
echo.
echo  ============================================
echo   TRACKING-ICE
echo  ============================================
echo.
echo   1. Buka di browser default
echo   2. Buka di automation Chrome, port 9333
echo   0. Keluar
echo.
set "PILIH="
set /p "PILIH=  Pilih 1, 2, atau 0 (Enter = 1): "
if "%PILIH%"=="0" exit /b 0
cls
if "%PILIH%"=="2" goto menu_automation

set "VITE_ARGS=--host 0.0.0.0 --port %PORT% --open=http://127.0.0.1:%PORT%/"
goto banner

:menu_automation
set "AUTO=1"
set "VITE_ARGS=--host 0.0.0.0 --port %PORT%"
goto banner

:mode_automation
set "AUTO=1"
shift

:collect_args
if "%~1"=="" goto args_done

if /i "%~1"=="--port" goto read_port

set "EXTRA=%EXTRA% %~1"
shift
goto collect_args

:read_port
shift
if "%~1"=="" goto args_done

set "PORT=%~1"
shift
goto collect_args

:args_done
set "VITE_ARGS=--host 0.0.0.0 --port %PORT%"
if defined EXTRA set "VITE_ARGS=%VITE_ARGS%%EXTRA%"

:banner
echo.
echo  ============================================
echo   TRACKING-ICE
echo  ============================================
echo   folder : %CD%
echo   port   : %PORT%
if "%AUTO%"=="1" echo   browser: automation Chrome, port 9333
echo   url    : http://127.0.0.1:%PORT%/
echo   run    : npm run dev -- %VITE_ARGS%
echo.
echo   Ctrl+C atau tutup jendela ini untuk mematikan server.
echo.

if not "%AUTO%"=="1" goto run_server

pushd "%~dp0.."
set "RARA_ROOT=%CD%"
popd

set "PROFILE=%RARA_ROOT%\BROWSER-AUTOMATION"
set "CHROME=C:\Program Files\Google\Chrome\Application\chrome.exe"

if not exist "%CHROME%" (
  echo ERROR: Chrome tidak ditemukan di "%CHROME%".
  pause
  exit /b 5
)

if not exist "%PROFILE%" (
  echo ERROR: profil automation tidak ditemukan di "%PROFILE%".
  echo Jalankan BROWSER-AUTOMATION\0Browser\start-automation-chrome.bat dulu.
  pause
  exit /b 6
)

set "HELPER=%~dp0open-automation-tab.ps1"

if not exist "%HELPER%" (
  echo ERROR: helper baru tidak ditemukan di "%HELPER%".
  pause
  exit /b 7
)

start "" /min powershell -NoProfile -ExecutionPolicy Bypass -File "%HELPER%" -Port %PORT% -ProfileDir "%PROFILE%" -Chrome "%CHROME%"

:run_server
call npm run dev -- %VITE_ARGS%

echo.
echo   Dev server berhenti.
pause
