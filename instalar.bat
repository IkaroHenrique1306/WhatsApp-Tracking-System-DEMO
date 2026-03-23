@echo off
chcp 65001 > nul
echo ============================================
echo  Rastreio WA — Instalação de Dependências
echo ============================================
echo.

:: ── Python / Flask ───────────────────────────────────────────
echo [1/2] Instalando dependências Python (Flask)...
pip install flask
if %errorlevel% neq 0 (
    echo.
    echo ERRO: Falha ao instalar Flask.
    echo Certifique-se de que o Python está instalado e no PATH.
    echo Download: https://python.org
    pause
    exit /b 1
)
echo Flask instalado com sucesso.
echo.

:: ── Node.js / whatsapp-web.js ─────────────────────────────────
echo [2/2] Instalando dependências Node.js...
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo ERRO: Node.js não encontrado.
    echo Instale o Node.js LTS em: https://nodejs.org
    pause
    exit /b 1
)
npm install
if %errorlevel% neq 0 (
    echo.
    echo ERRO: Falha ao instalar dependências Node.js.
    pause
    exit /b 1
)
echo Dependências Node.js instaladas com sucesso.
echo.

:: ── Concluído ─────────────────────────────────────────────────
echo ============================================
echo  Instalação concluída!
echo.
echo  Para iniciar:
echo    Backend:  python app.py
echo    Bot:      node whatsapp-rastreio.js
echo ============================================
pause
