@echo off
echo ========================================
echo Quick Build Test
echo ========================================
echo.

echo Checking if client build exists...
if not exist "packages\client\build" (
    echo ERROR: Client build not found!
    echo Run: npm run build --workspace=client
    pause
    exit /b 1
)
echo Client build found!
echo.

echo Checking better-sqlite3...
if not exist "node_modules\better-sqlite3" (
    echo ERROR: better-sqlite3 not installed!
    echo Run: npm install
    pause
    exit /b 1
)
echo better-sqlite3 found!
echo.

echo Starting Electron in production mode...
set NODE_ENV=production
call npm start

pause
