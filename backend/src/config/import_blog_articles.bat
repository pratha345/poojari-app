@echo off
REM =====================================================
REM Pojjari Blog Articles Import Script
REM Run this from the backend/src/config directory
REM =====================================================

SET DB_USER=root
SET DB_PASS=your_password_here
SET DB_NAME=pojjari_db

echo Importing Blog Articles 1-10...
mysql -u %DB_USER% -p%DB_PASS% %DB_NAME% < blog_articles_1_10.sql

echo Importing Blog Articles 11-20...
mysql -u %DB_USER% -p%DB_PASS% %DB_NAME% < blog_articles_11_20.sql

echo Done! 20 Marathi blog articles imported successfully.
pause
