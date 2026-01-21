# Script para matar todos os processos Node.js
Write-Host "Encerrando processos Node.js..." -ForegroundColor Yellow

$processos = Get-Process node -ErrorAction SilentlyContinue
if ($processos) {
    $processos | Stop-Process -Force
    Write-Host "Processos Node.js encerrados!" -ForegroundColor Green
} else {
    Write-Host "Nenhum processo Node.js encontrado." -ForegroundColor Green
}

