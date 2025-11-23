@echo off
echo ========================================
echo GERANDO CHAVES SECRETAS
echo ========================================
echo.

echo 1. JWT_SECRET:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
echo.

echo 2. JWT_REFRESH_SECRET:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
echo.

echo 3. CRON_SECRET:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
echo.

echo ========================================
echo COPIE ESSAS 3 CHAVES!
echo ========================================
pause
