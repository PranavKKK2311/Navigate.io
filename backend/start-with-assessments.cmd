@echo off
echo Starting Navigate backend server...
set NODE_ENV=development
echo Environment: %NODE_ENV%

echo.
echo Server starting with development configuration
echo.

node server.js
