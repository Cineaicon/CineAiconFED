# Script para iniciar o frontend na porta 3001
Write-Host "Iniciando frontend na porta 3001..." -ForegroundColor Cyan

# Definir porta alternativa
$env:PORT = "3001"

# Iniciar o servidor
npm start




