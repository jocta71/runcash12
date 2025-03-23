@echo off
echo ===================================
echo Iniciando Servidor WebSocket RunCash
echo ===================================
echo.

cd %~dp0\backend
node websocket_server.js

echo.
echo Servidor encerrado. Pressione qualquer tecla para fechar esta janela.
pause > nul 