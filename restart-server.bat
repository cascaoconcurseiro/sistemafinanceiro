@echo off
echo ========================================
echo REINICIANDO SERVIDOR
echo ========================================
echo.

echo [1/4] Parando processos Node...
taskkill /F /IM node.exe 2>nul
timeout /t 2 /nobreak >nul

echo [2/4] Gerando cliente Prisma...
call npx prisma generate

echo [3/4] Aguardando 2 segundos...
timeout /t 2 /nobreak >nul

echo [4/4] Iniciando servidor...
echo.
echo ========================================
echo Servidor reiniciado com sucesso!
echo Execute: npm run dev
echo ========================================
pause
