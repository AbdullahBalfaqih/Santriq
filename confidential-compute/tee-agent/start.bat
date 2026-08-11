@echo off
echo ============================================================
echo   Sentriq Protocol TEE Agent - Starting...
echo ============================================================
echo.

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$env:PRIVATE_KEY='YOUR_PRIVATE_KEY_HERE';" ^
  "$env:CONTRACT_ADDRESS='0x248d4E9fbC4Ea0b184A090da8a627027D5bF6a85';" ^
  "$env:OPENROUTER_API_KEY='YOUR_OPENROUTER_API_KEY_HERE';" ^
  "$env:SIMULATED_TEE='true';" ^
  "python agent.py"

pause
