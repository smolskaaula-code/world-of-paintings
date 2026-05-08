@echo off
cd /d %USERPROFILE%\Desktop\world-of-paintings

echo ========================================
echo Получение IP-адресов...

setlocal enabledelayedexpansion
set "IP_LIST="

for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4-адрес" /c:"IPv4 Address"') do (
    set "IP=%%a"
    set "IP=!IP: =!"
    if not "!IP!"=="" (
        echo Найден IP: !IP!
        set "IP_LIST=!IP_LIST! !IP!"
    )
)

echo.
echo ========================================
echo Сервер будет запущен...
echo.
echo ДЛЯ ДОСТУПА С ДРУГОГО УСТРОЙСТВА:
echo Введи в браузере на телефоне/другом ПК:
echo.

set COUNT=0
for %%i in (%IP_LIST%) do (
    set /a COUNT+=1
    echo   http://%%i:3000
)

if %COUNT%==0 (
    echo   ❌ IP-адреса не найдены
    echo   Проверь подключение к сети
)

echo.
echo ДЛЯ ДОСТУПА НА ЭТОМ КОМПЬЮТЕРЕ:
echo   http://localhost:3000
echo ========================================
echo.

start http://localhost:3000
node server.js

pause