@echo off
title Library Management System - Backend Server
cd /d "%~dp0backend"
echo ===================================================
echo   Starting Library Management System Backend...
echo   Port: 5000 ^| URL: http://localhost:5000/api
echo ===================================================
node server.js
pause
