# Script de desarrollo mejorado para Core DeFi Platform (Windows)
# Inicia el servidor API mock y el frontend con manejo de errores

Write-Host "🚀 Iniciando Core DeFi Platform Development Environment..." -ForegroundColor Green

# Función para limpiar procesos al salir
function Cleanup {
    Write-Host "🛑 Deteniendo todos los procesos..." -ForegroundColor Yellow
    if ($API_PID) { 
        Stop-Process -Id $API_PID -Force -ErrorAction SilentlyContinue 
        Write-Host "✅ API Mock detenido" -ForegroundColor Green
    }
    if ($FRONTEND_PID) { 
        Stop-Process -Id $FRONTEND_PID -Force -ErrorAction SilentlyContinue 
        Write-Host "✅ Frontend detenido" -ForegroundColor Green
    }
    exit 0
}

# Capturar señales de interrupción
Register-EngineEvent PowerShell.Exiting -Action { Cleanup }

# Verificar si Node.js está instalado
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Error: Node.js no está instalado" -ForegroundColor Red
    Write-Host "💡 Instala Node.js desde: https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}

# Verificar si pnpm está instalado
if (-not (Get-Command pnpm -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Error: pnpm no está instalado" -ForegroundColor Red
    Write-Host "💡 Instala pnpm con: npm install -g pnpm" -ForegroundColor Yellow
    exit 1
}

Write-Host "📦 Verificando dependencias..." -ForegroundColor Blue
try {
    pnpm install
    Write-Host "✅ Dependencias instaladas" -ForegroundColor Green
} catch {
    Write-Host "❌ Error instalando dependencias" -ForegroundColor Red
    exit 1
}

Write-Host "🔧 Generando ABIs..." -ForegroundColor Blue
try {
    pnpm run generate:abis
    Write-Host "✅ ABIs generados" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Advertencia: Error generando ABIs" -ForegroundColor Yellow
}

Write-Host "🌐 Iniciando servidor API mock..." -ForegroundColor Blue
try {
    Start-Process -FilePath "node" -ArgumentList "scripts/dev-api.js" -WindowStyle Hidden -PassThru | ForEach-Object { $API_PID = $_.Id }
    Write-Host "✅ API Mock iniciado (PID: $API_PID)" -ForegroundColor Green
} catch {
    Write-Host "❌ Error iniciando API Mock" -ForegroundColor Red
    exit 1
}

# Esperar un momento para que el API se inicie
Write-Host "⏳ Esperando que el API se inicie..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Verificar que el API esté funcionando
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8080/health" -UseBasicParsing -TimeoutSec 10
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ API Mock funcionando correctamente" -ForegroundColor Green
    } else {
        Write-Host "⚠️  API Mock respondió con código: $($response.StatusCode)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠️  No se pudo verificar el API Mock" -ForegroundColor Yellow
}

Write-Host "🎨 Iniciando frontend..." -ForegroundColor Blue
try {
    Start-Process -FilePath "pnpm" -ArgumentList "run", "dev" -WindowStyle Hidden -PassThru | ForEach-Object { $FRONTEND_PID = $_.Id }
    Write-Host "✅ Frontend iniciado (PID: $FRONTEND_PID)" -ForegroundColor Green
} catch {
    Write-Host "❌ Error iniciando frontend" -ForegroundColor Red
    Cleanup
    exit 1
}

Write-Host ""
Write-Host "🎉 ¡Desarrollo iniciado correctamente!" -ForegroundColor Green
Write-Host "📊 API Mock: http://localhost:8080" -ForegroundColor Cyan
Write-Host "🎨 Frontend: http://localhost:5173" -ForegroundColor Cyan
Write-Host ""
Write-Host "📋 Comandos útiles:" -ForegroundColor Yellow
Write-Host "   • Ver logs del API: Get-Process -Id $API_PID" -ForegroundColor Gray
Write-Host "   • Ver logs del frontend: Get-Process -Id $FRONTEND_PID" -ForegroundColor Gray
Write-Host "   • Detener todo: Ctrl+C" -ForegroundColor Gray
Write-Host ""
Write-Host "🔧 Endpoints disponibles:" -ForegroundColor Yellow
Write-Host "   • GET /status - Estado del sistema" -ForegroundColor Gray
Write-Host "   • GET /market/params - Parámetros del mercado" -ForegroundColor Gray
Write-Host "   • GET /market/metrics - Métricas del mercado" -ForegroundColor Gray
Write-Host "   • GET /market/liquidations - Liquidaciones" -ForegroundColor Gray
Write-Host "   • GET /market/history/:symbol - Historial de precios" -ForegroundColor Gray
Write-Host "   • GET /health - Estado de salud" -ForegroundColor Gray
Write-Host ""
Write-Host "Presiona Ctrl+C para detener todos los servicios" -ForegroundColor Yellow

# Mantener el script ejecutándose
try {
    while ($true) {
        Start-Sleep -Seconds 1
        
        # Verificar que los procesos sigan ejecutándose
        if ($API_PID -and -not (Get-Process -Id $API_PID -ErrorAction SilentlyContinue)) {
            Write-Host "⚠️  API Mock se detuvo inesperadamente" -ForegroundColor Yellow
            $API_PID = $null
        }
        
        if ($FRONTEND_PID -and -not (Get-Process -Id $FRONTEND_PID -ErrorAction SilentlyContinue)) {
            Write-Host "⚠️  Frontend se detuvo inesperadamente" -ForegroundColor Yellow
            $FRONTEND_PID = $null
        }
    }
}
catch {
    Write-Host "🛑 Deteniendo servicios..." -ForegroundColor Yellow
    Cleanup
}
