@echo off
echo ========================================
echo RENOMEAR PARA SUAGRANA-FINAL
echo ========================================
echo.
echo IMPORTANTE: Feche o VS Code e pare o servidor antes!
echo.
pause

cd ..
rename "SuaGrana-Clean" "SuaGrana-FINAL"

if %errorlevel% equ 0 (
    echo.
    echo ========================================
    echo SUCESSO! Pasta renomeada para SuaGrana-FINAL
    echo ========================================
) else (
    echo.
    echo ========================================
    echo ERRO! Feche todos os programas e tente novamente
    echo ========================================
)

echo.
pause
