#!/bin/bash

# Script de desarrollo completo para Core DeFi Platform
# Inicia el servidor API mock y el frontend

echo "🚀 Iniciando Core DeFi Platform Development Environment..."

# Función para limpiar procesos al salir
cleanup() {
    echo "🛑 Deteniendo todos los procesos..."
    kill $API_PID $FRONTEND_PID 2>/dev/null
    exit 0
}

# Capturar señales de interrupción
trap cleanup SIGINT SIGTERM

# Verificar si Node.js está instalado
if ! command -v node &> /dev/null; then
    echo "❌ Error: Node.js no está instalado"
    exit 1
fi

# Verificar si pnpm está instalado
if ! command -v pnpm &> /dev/null; then
    echo "❌ Error: pnpm no está instalado"
    exit 1
fi

echo "📦 Instalando dependencias..."
pnpm install

echo "🔧 Generando ABIs..."
pnpm run generate:abis

echo "🌐 Iniciando servidor API mock..."
node scripts/dev-api.js &
API_PID=$!

# Esperar un momento para que el API se inicie
sleep 3

echo "🎨 Iniciando frontend..."
pnpm run dev &
FRONTEND_PID=$!

echo "✅ Desarrollo iniciado correctamente!"
echo "📊 API Mock: http://localhost:8080"
echo "🎨 Frontend: http://localhost:5173"
echo ""
echo "Presiona Ctrl+C para detener todos los servicios"

# Mantener el script ejecutándose
wait
