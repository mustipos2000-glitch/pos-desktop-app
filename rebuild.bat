@echo off
echo ========================================
echo Rebuilding POS Desktop Application
echo ========================================
echo.

echo Step 1: Cleaning old builds...
if exist dist rmdir /s /q dist
if exist packages\client\build rmdir /s /q packages\client\build
echo Done!
echo.

echo Step 2: Installing dependencies...
call npm install
echo Done!
echo.

echo Step 3: Rebuilding better-sqlite3 for Electron...
call npm rebuild better-sqlite3 --build-from-source
echo Done!
echo.

echo Step 4: Building client (React)...
call npm run build --workspace=client
echo Done!
echo.

echo Step 5: Building Electron app...
call npm run build:electron
echo Done!
echo.

echo ========================================
echo Build Complete!
echo ========================================
echo Your .exe file is in the dist folder
echo.
pause
