@echo off
REM 自动加载 iBOM 扩展到 EasyEDA Pro

echo ========================================
echo Loading iBOM Extension to EasyEDA Pro
echo ========================================
echo.

set EXT_FILE=D:\easyeda-eext\eext-interative-bom\build\dist\eext-interative-bom_v1.0.0.eext

if not exist "%EXT_FILE%" (
  echo ERROR: Extension file not found!
  echo %EXT_FILE%
  pause
  exit /b 1
)

echo Extension file: %EXT_FILE%
echo.
echo Please manually load this extension in EasyEDA Pro:
echo 1. Open Extension Manager
echo 2. Click "Load Extension"
echo 3. Select the file above
echo.
echo Or use the bridge server to execute:
echo   curl -X POST http://localhost:49620/execute ^
echo     -H "Content-Type: application/json" ^
echo     -d "{\"code\": \"eda.extension.loadExtension('eext-interative-bom').then(r =^> 'Loaded').catch(e =^> 'Error: ' + e.message);\"}"
echo.
pause
