@echo off
echo ========================================
echo Testing POS Application Build
echo ========================================
echo.

echo 1. Checking if installer exists...
if exist "dist\Point of Sale Application Setup 0.0.4.exe" (
    echo [OK] Installer found
    dir "dist\Point of Sale Application Setup 0.0.4.exe" | find "Point of Sale"
) else (
    echo [FAIL] Installer not found!
)
echo.

echo 2. Checking if portable ZIP exists...
if exist "dist\Point of Sale Application-0.0.4-win.zip" (
    echo [OK] Portable ZIP found
) else (
    echo [FAIL] Portable ZIP not found!
)
echo.

echo 3. Checking if migrations are in build...
if exist "dist\win-unpacked\resources\app.asar.unpacked\packages\server\migrations" (
    echo [OK] Migrations folder found
    dir /b "dist\win-unpacked\resources\app.asar.unpacked\packages\server\migrations\*.js"
) else (
    echo [FAIL] Migrations folder not found!
)
echo.

echo 4. Checking if migrate.js is in build...
if exist "dist\win-unpacked\resources\app.asar.unpacked\packages\server\migrate.js" (
    echo [OK] migrate.js found
) else (
    echo [FAIL] migrate.js not found!
)
echo.

echo 5. Checking if server.js is in build...
if exist "dist\win-unpacked\resources\app.asar.unpacked\packages\server\server.js" (
    echo [OK] server.js found
    findstr /C:"runMigrations" "dist\win-unpacked\resources\app.asar.unpacked\packages\server\server.js" >nul
    if errorlevel 1 (
        echo [WARN] Migration runner call not found in server.js
    ) else (
        echo [OK] Contains migration runner call
    )
) else (
    echo [FAIL] server.js not found!
)
echo.

echo 6. Checking if database exists...
if exist "%APPDATA%\POS Desktop\database\pos.db" (
    echo [OK] Database found at: %APPDATA%\POS Desktop\database\pos.db
    dir "%APPDATA%\POS Desktop\database\pos.db" | find "pos.db"
) else (
    echo [INFO] Database not found (app not run yet)
    echo       Expected location: %APPDATA%\POS Desktop\database\pos.db
)
echo.

echo 7. Checking unpacked application...
if exist "dist\win-unpacked\Point of Sale Application.exe" (
    echo [OK] Unpacked .exe found
    echo       You can test by running: cd dist\win-unpacked ^&^& "Point of Sale Application.exe"
) else (
    echo [FAIL] Unpacked .exe not found!
)
echo.

echo ========================================
echo Test Complete!
echo ========================================
echo.
echo Next Steps:
echo 1. Test the unpacked version:
echo    cd dist\win-unpacked
echo    "Point of Sale Application.exe"
echo.
echo 2. Or install using the installer:
echo    "dist\Point of Sale Application Setup 0.0.4.exe"
echo.
echo 3. Watch for migration messages in the console
echo.
pause
