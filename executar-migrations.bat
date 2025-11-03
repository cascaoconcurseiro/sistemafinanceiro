@echo off
echo.
echo ========================================
echo   Executar Migrations do Banco de Dados
echo ========================================
echo.
echo IMPORTANTE: Voce precisa da DATABASE_URL do Neon!
echo.
echo 1. Acesse: https://console.neon.tech
echo 2. Copie a Pooled Connection String
echo 3. Cole aqui quando solicitado
echo.
pause
echo.
set /p DATABASE_URL="Cole a DATABASE_URL aqui: "
echo.
echo Executando migrations...
echo.
npx prisma migrate deploy
echo.
if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo   Sucesso! Tabelas criadas!
    echo ========================================
    echo.
    echo Agora teste criar um usuario em:
    echo https://lovely-kheer-a87838.netlify.app/auth/register
    echo.
) else (
    echo.
    echo ========================================
    echo   Erro ao executar migrations!
    echo ========================================
    echo.
    echo Verifique:
    echo - A DATABASE_URL esta correta?
    echo - Tem conexao com a internet?
    echo - A senha do Neon esta correta?
    echo.
)
pause
