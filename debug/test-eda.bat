@echo off
REM EasyEDA Pro 执行代码并获取日志

setlocal enabledelayedexpansion

REM 查找桥接服务器端口
set BRIDGE_PORT=
for /L %%p in (49620,1,49629) do (
  curl -s http://localhost:%%p/health >nul 2>&1
  if !errorlevel! equ 0 (
    set BRIDGE_PORT=%%p
    goto :found
  )
)

echo ERROR: Bridge server not found on ports 49620-49629
echo Please start the bridge server first.
goto :end

:found
echo Bridge server found on port %BRIDGE_PORT%
echo.

REM 执行测试代码
echo Executing test code...
curl -X POST http://localhost:%BRIDGE_PORT%/execute ^
  -H "Content-Type: application/json" ^
  -d "{\"code\": \"console.log('[iBOM Test] Hello from EasyEDA!'); return 'test completed';\"}"
echo.
echo.

REM 获取项目信息
echo Getting project info...
curl -X POST http://localhost:%BRIDGE_PORT%/execute ^
  -H "Content-Type: application/json" ^
  -d "{\"code\": \"return await eda.dmt_Project.getCurrentProjectInfo();\"}"
echo.
echo.

REM 检查当前文档
echo Checking current document...
curl -X POST http://localhost:%BRIDGE_PORT%/execute ^
  -H "Content-Type: application/json" ^
  -d "{\"code\": \"return await eda.dmt_SelectControl.getCurrentDocumentInfo();\"}"
echo.
echo.

:end
pause
