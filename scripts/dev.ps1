# Script de desarrollo completo para Core DeFi Platform (Windows)
# Inicia el servidor API mock y el frontend

Write-Host "🚀 Iniciando Core DeFi Platform Development Environment..." -ForegroundColor Green

# Función para limpiar procesos al salir
function Cleanup {
    Write-Host "🛑 Deteniendo todos los procesos..." -ForegroundColor Yellow
    if ($API_PID) { Stop-Process -Id $API_PID -Force -ErrorAction SilentlyContinue }
    if ($FRONTEND_PID) { Stop-Process -Id $FRONTEND_PID -Force -ErrorAction SilentlyContinue }
    exit 0
}

# Capturar señales de interrupción
Register-EngineEvent PowerShell.Exiting -Action { Cleanup }

# Verificar si Node.js está instalado
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Error: Node.js no está instalado" -ForegroundColor Red
    exit 1
}

# Verificar si pnpm está instalado
if (-not (Get-Command pnpm -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Error: pnpm no está instalado" -ForegroundColor Red
    exit 1
}

Write-Host "📦 Instalando dependencias..." -ForegroundColor Blue
pnpm install

Write-Host "🔧 Generando ABIs..." -ForegroundColor Blue
pnpm run generate:abis

Write-Host "🌐 Iniciando servidor API mock..." -ForegroundColor Blue
Start-Process -FilePath "node" -ArgumentList "scripts/dev-api.js" -WindowStyle Hidden -PassThru | ForEach-Object { $API_PID = $_.Id }

# Esperar un momento para que el API se inicie
Start-Sleep -Seconds 3

Write-Host "🎨 Iniciando frontend..." -ForegroundColor Blue
Start-Process -FilePath "pnpm" -ArgumentList "run", "dev" -WindowStyle Hidden -PassThru | ForEach-Object { $FRONTEND_PID = $_.Id }

Write-Host "✅ Desarrollo iniciado correctamente!" -ForegroundColor Green
Write-Host "📊 API Mock: http://localhost:8080" -ForegroundColor Cyan
Write-Host "🎨 Frontend: http://localhost:5173" -ForegroundColor Cyan
Write-Host ""
Write-Host "Presiona Ctrl+C para detener todos los servicios" -ForegroundColor Yellow

# Mantener el script ejecutándose
try {
    while ($true) {
        Start-Sleep -Seconds 1
    }
}
catch {
    Cleanup
}
