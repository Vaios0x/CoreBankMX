# 🚀 Core DeFi Platform - Guía de Desarrollo

## 📋 Prerrequisitos

- **Node.js** v18+ 
- **pnpm** v8+
- **Git**

## 🛠️ Configuración Inicial

```bash
# Clonar el repositorio
git clone <repository-url>
cd Core

# Instalar dependencias
pnpm install

# Generar ABIs de contratos
pnpm run generate:abis
```

## 🎯 Scripts de Desarrollo

### Opción 1: Desarrollo Completo (Recomendado)
```bash
# Inicia tanto el API mock como el frontend con manejo de errores
pnpm run dev:start
```

### Opción 2: Desarrollo Simple
```bash
# Inicia tanto el API mock como el frontend (versión simple)
pnpm run dev:full
```

### Opción 3: Servicios Individuales
```bash
# Solo el servidor API mock
pnpm run dev:api

# Solo el frontend
pnpm run dev
```

### Opción 4: Manual
```bash
# Terminal 1: API Mock
node scripts/dev-api.js

# Terminal 2: Frontend
pnpm run dev
```

## 🌐 URLs de Desarrollo

- **Frontend**: http://localhost:5173
- **API Mock**: http://localhost:8080
- **API Health**: http://localhost:8080/health

## 📊 Endpoints del API Mock

| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/status` | GET | Estado del sistema y contratos |
| `/market/params` | GET | Parámetros del mercado |
| `/market/metrics` | GET | Métricas del mercado |
| `/market/liquidations` | GET | Liquidaciones recientes |
| `/market/history/:symbol` | GET | Historial de precios |
| `/health` | GET | Estado de salud del API |

## 🔧 Configuración de Variables de Entorno

### Frontend (.env)
```env
VITE_API_URL=http://localhost:8080
VITE_USE_MOCKS=true
VITE_USE_ONCHAIN_ORACLE=false
```

### API (.env en services/api/)
```env
API_PORT=8080
API_KEY_ADMIN=admin_key_123
NODE_ENV=development
```

## 🐛 Solución de Problemas

### Error: "net::ERR_CONNECTION_REFUSED"
**Causa**: El servidor API no está ejecutándose
**Solución**: 
```bash
pnpm run dev:api
```

### Error: "Maximum update depth exceeded"
**Causa**: Bucle infinito en React
**Solución**: Verificar dependencias en useEffect

### Error: "require is not defined"
**Causa**: Conflicto entre CommonJS y ES modules
**Solución**: Usar `import` en lugar de `require`

## 📁 Estructura del Proyecto

```
Core/
├── src/                    # Frontend React
│   ├── components/         # Componentes UI
│   ├── pages/             # Páginas de la aplicación
│   ├── hooks/             # Custom hooks
│   ├── lib/               # Utilidades y configuración
│   └── state/             # Estado global (Zustand)
├── services/              # Servicios backend
│   ├── api/               # Servidor API
│   └── keeper/            # Servicio keeper
├── packages/              # Paquetes del workspace
│   └── contracts/         # Contratos Solidity
├── scripts/               # Scripts de desarrollo
└── tests/                 # Tests end-to-end
```

## 🧪 Testing

```bash
# Tests unitarios
pnpm run test:unit

# Tests de integración
pnpm run test:integration

# Tests end-to-end
pnpm run test:e2e

# Cobertura de tests
pnpm run test:coverage
```

## 🚀 Producción

```bash
# Build completo
pnpm run build:all

# Build solo frontend
pnpm run build

# Preview del build
pnpm run preview
```

## 📝 Contribución

1. Crear una rama feature: `git checkout -b feature/nueva-funcionalidad`
2. Hacer cambios y commits: `git commit -m "feat: nueva funcionalidad"`
3. Push a la rama: `git push origin feature/nueva-funcionalidad`
4. Crear Pull Request

## 🔒 Seguridad

- Todos los endpoints tienen rate limiting
- Validación de entrada en todos los formularios
- CSP (Content Security Policy) habilitado
- Sanitización de datos de entrada

## 📞 Soporte

Para problemas de desarrollo:
1. Revisar esta documentación
2. Verificar los logs del servidor
3. Comprobar la configuración de variables de entorno
4. Crear un issue en el repositorio
