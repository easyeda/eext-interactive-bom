@echo off
REM EasyEDA Pro iBOM 扩展调试环境一键启动脚本

echo ========================================
echo EasyEDA Pro iBOM Extension Debug Setup
echo ========================================
echo.

REM 1. 检查桥接服务器是否已运行
echo [1/4] Checking bridge server status...
set BRIDGE_PORT=
for /L %%p in (49620,1,49629) do (
  curl -s http://localhost:%%p/health >nul 2>&1
  if !errorlevel! equ 0 (
    set BRIDGE_PORT=%%p
    echo Bridge server already running on port %%p
    goto :bridge_found
  )
)

echo Bridge server not running, starting...
start /B node C:\Users\AOC\.qwen\skills\easyeda-api\scripts\bridge-server.mjs
timeout /t 3 /nobreak >nul

REM 重新检查
for /L %%p in (49620,1,49629) do (
  curl -s http://localhost:%%p/health >nul 2>&1
  if !errorlevel! equ 0 (
    set BRIDGE_PORT=%%p
    echo Bridge server started on port %%p
    goto :bridge_found
  )
)

echo ERROR: Failed to start bridge server!
echo Please manually run:
echo   node C:\Users\AOC\.qwen\skills\easyeda-api\scripts\bridge-server.mjs
goto :error

:bridge_found
echo.

REM 2. 验证 EDA 连接
echo [2/4] Verifying EasyEDA connection...
curl -s http://localhost:%BRIDGE_PORT%/eda-windows > "%TEMP%\eda-windows.json"
findstr /C:"count" "%TEMP%\eda-windows.json"
echo.

REM 3. 检查扩展文件
echo [3/4] Checking extension file...
set EXT_FILE=D:\easyeda-eext\eext-interative-bom\build\dist\eext-interative-bom_v1.0.0.eext
if exist "%EXT_FILE%" (
  echo Extension file found: %EXT_FILE%
) else (
  echo Extension file not found!
  echo Building extension...
  cd /d D:\easyeda-eext\eext-interative-bom
  call npm run build
  if errorlevel 1 (
    echo ERROR: Build failed!
    goto :error
  )
)
echo.

REM 4. 显示使用说明
echo [4/4] Debug Environment Ready!
echo.
echo ========================================
echo Next Steps:
echo ========================================
echo.
echo 1. Open EasyEDA Pro and ensure a PCB document is open
echo.
echo 2. Load the extension in EasyEDA Pro:
echo    - Open Extension Manager
echo    - Click "Load Extension"
echo    - Select: %EXT_FILE%
echo.
echo 3. Open Developer Tools in EasyEDA Pro (Press F12)
echo.
echo 4. Click menu: Interactive BOM ^> Open Interactive BOM...
echo.
echo 5. Check console for logs
echo.
echo ========================================
echo Useful Commands:
echo ========================================
echo.
echo Check bridge status:
echo   curl http://localhost:%BRIDGE_PORT%/health
echo.
echo List EDA windows:
echo   curl http://localhost:%BRIDGE_PORT%/eda-windows
echo.
echo Execute code on EDA:
echo   curl -X POST http://localhost:%BRIDGE_PORT%/execute ^
echo     -H "Content-Type: application/json" ^
echo     -d "{\"code\": \"return await eda.dmt_Project.getCurrentProjectInfo();\"}"
echo.
echo Load log collector in EasyEDA console:
echo   Copy and paste content of: debug\log-collector.js
echo.
echo ========================================
echo Bridge Port: %BRIDGE_PORT%
echo ========================================
echo.

goto :end

:error
echo.
echo ========================================
echo Setup failed!
echo ========================================
echo.
echo Troubleshooting:
echo 1. Ensure Node.js is installed
echo 2. Ensure run-api-gateway.eext is installed in EasyEDA Pro
echo 3. Download: https://ext.lceda.cn/item/oshwhub/run-api-gateway
echo 4. Restart EasyEDA Pro
echo.

:end
echo.
echo Press any key to continue...
pause >nul
