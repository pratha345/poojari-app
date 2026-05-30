@echo off
echo ============================================================
echo  धर्मसिंधु Blog Articles Import
echo  30 blogs - 3 parts
echo ============================================================

set /p DB_USER="MySQL Username (default: root): "
if "%DB_USER%"=="" set DB_USER=root

set /p DB_NAME="Database Name (default: pojjari_db): "
if "%DB_NAME%"=="" set DB_NAME=pojjari_db

echo.
echo Importing Part 1 - आह्निक कर्मे, संस्कार, श्राद्ध (blogs 1-10)...
mysql -u %DB_USER% -p %DB_NAME% < dharmasindhu_part1.sql
if %ERRORLEVEL% NEQ 0 (echo ERROR: Part 1 import failed! && pause && exit /b 1)
echo Part 1 done.

echo.
echo Importing Part 2 - व्रते, उत्सव, तीर्थयात्रा (blogs 11-20)...
mysql -u %DB_USER% -p %DB_NAME% < dharmasindhu_part2.sql
if %ERRORLEVEL% NEQ 0 (echo ERROR: Part 2 import failed! && pause && exit /b 1)
echo Part 2 done.

echo.
echo Importing Part 3 - प्रायश्चित्त, दान, काल निर्णय (blogs 21-30)...
mysql -u %DB_USER% -p %DB_NAME% < dharmasindhu_part3.sql
if %ERRORLEVEL% NEQ 0 (echo ERROR: Part 3 import failed! && pause && exit /b 1)
echo Part 3 done.

echo.
echo ============================================================
echo  सर्व 30 blogs यशस्वीरित्या import झाले!
echo ============================================================
pause
