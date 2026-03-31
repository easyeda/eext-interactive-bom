@echo off
REM EasyEDA Pro 桥接服务器状态检查脚本

echo ========================================
echo EasyEDA Pro Bridge Server Status Check
echo ========================================
echo.

REM 检查端口 49620-49629
echo Checking ports 49620-49629...
echo.

for /L %%p in (49620,1,49629) do (
  curl -s http://localhost:%%p/health >nul 2>&1
  if %errorlevel% equ 0 (
    echo [FOUND] Bridge server running on port %%p
    echo.
    
    REM 获取健康状态
    echo Health Status:
    curl -s http://localhost:%%p/health
    echo.
    echo.
    
    REM 获取已连接的 EDA 窗口
    echo Connected EDA Windows:
    curl -s http://localhost:%%p/eda-windows
    echo.
    echo.
    
    REM 设置环境变量
    set BRIDGE_PORT=%%p
    goto :found
  )
)

echo [NOT FOUND] No bridge server found on ports 49620-49629
echo.
echo To start the bridge server:
echo   1. Install run-api-gateway.eext in EasyEDA Pro
echo   2. Download: https://ext.lceda.cn/item/oshwhub/run-api-gateway
echo   3. Run: node C:\Users\AOC\.qwen\skills\easyeda-api\scripts\bridge-server.mjs
echo.
goto :end

:found
echo ========================================
echo Bridge server is running!
echo Port: %BRIDGE_PORT%
echo ========================================
echo.
echo Next steps:
echo 1. Open EasyEDA Pro
echo 2. Install/Load the extension: build\dist\eext-interative-bom_v1.0.0.eext
echo 3. Click menu: Interactive BOM ^> Open Interactive BOM...
echo 4. Check console for logs
echo.
echo To execute code on EDA:
echo   curl -X POST http://localhost:%BRIDGE_PORT%/execute ^
echo     -H "Content-Type: application/json" ^
echo     -d "{\"code\": \"return console.log('test');\"}"
echo.

:end
pause
