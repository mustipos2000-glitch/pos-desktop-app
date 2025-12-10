@echo off
REM Batch file to rebuild better-sqlite3 with Visual Studio 2022 environment

setlocal enabledelayedexpansion

REM Find Visual Studio 2022
set "VS_PATH="
if exist "C:\Program Files (x86)\Microsoft Visual Studio\18\BuildTools" (
    set "VS_PATH=C:\Program Files (x86)\Microsoft Visual Studio\18\BuildTools"
) else if exist "C:\Program Files\Microsoft Visual Studio\2022\BuildTools" (
    set "VS_PATH=C:\Program Files\Microsoft Visual Studio\2022\BuildTools"
) else if exist "C:\Program Files (x86)\Microsoft Visual Studio\2022\BuildTools" (
    set "VS_PATH=C:\Program Files (x86)\Microsoft Visual Studio\2022\BuildTools"
)

if "%VS_PATH%"=="" (
    echo ERROR: Visual Studio 2022 Build Tools not found
    exit /b 1
)

echo Found Visual Studio at: %VS_PATH%

REM Set up Visual Studio environment
call "%VS_PATH%\VC\Auxiliary\Build\vcvarsall.bat" x64 >nul 2>&1

if errorlevel 1 (
    echo WARNING: Failed to set up Visual Studio environment
)

REM Find and set Python (node-gyp requires Python)
set PYTHON=
if exist "C:\Python313\python.exe" (
    set "PYTHON=C:\Python313\python.exe"
    set "PATH=C:\Python313;%PATH%"
) else if exist "C:\Python312\python.exe" (
    set "PYTHON=C:\Python312\python.exe"
    set "PATH=C:\Python312;%PATH%"
) else if exist "C:\Python311\python.exe" (
    set "PYTHON=C:\Python311\python.exe"
    set "PATH=C:\Python311;%PATH%"
) else (
    REM Try to find Python using py launcher
    for /f "tokens=*" %%i in ('py -3 -c "import sys; print(sys.executable)" 2^>nul') do set "PYTHON=%%i"
    if defined PYTHON (
        for %%p in ("%PYTHON%") do set "PATH=%%~dpp;%PATH%"
    )
)

if defined PYTHON (
    echo Found Python at: %PYTHON%
) else (
    echo WARNING: Python not found. node-gyp requires Python 3.6+
    echo Trying to use py launcher...
    set "PYTHON=py"
)

REM Set node-gyp variables
set GYP_MSVS_VERSION=2022
set npm_config_msvs_version=2022

REM Run the rebuild (PYTHON env var is already set above)
echo Running electron-rebuild...
call npm exec -- @electron/rebuild --module-dir "%~1" --arch=x64 --electron-version=%~2 --force

endlocal

