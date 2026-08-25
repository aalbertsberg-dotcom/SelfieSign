@echo off
cd /d "%~dp0"
echo Checking Python...
python --version
if errorlevel 1 goto nopython
python -c "import qrcode" >nul 2>&1
if errorlevel 1 (
  echo Installing QR dependency...
  python -m pip install -r requirements.txt
  if errorlevel 1 goto failed
)
echo.
echo Starting Sign. Selfie. Send...
python scripts\server.py --port 5500
goto end
:nopython
echo.
echo Python was not found. Install Python and try again.
pause
goto end
:failed
echo.
echo Dependency install failed.
pause
:end
