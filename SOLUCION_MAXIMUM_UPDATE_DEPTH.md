# Solución: Maximum Update Depth Exceeded

## Problema Identificado

El error "Maximum update depth exceeded" estaba siendo causado por varios factores en el código:

1. **Inicialización de sistemas blockchain en el nivel superior**: Los managers se estaban iniciando fuera de componentes React
2. **useEffect sin dependencias adecuadas**: Varios useEffect estaban causando re-renders infinitos
3. **Configuración de cache global**: El setupGlobalCache se ejecutaba en cada render
4. **Optimistic updates**: El sistema de optimistic updates estaba causando actualizaciones en bucle
5. **WebSocket reconexiones múltiples**: El hook useWebSocket estaba causando reconexiones infinitas

## Soluciones Implementadas

### 1. Refactorización de AppProviders (`src/app/providers.tsx`)

- **Problema**: Inicialización de sistemas blockchain en el nivel superior
- **Solución**: Movido todo dentro del componente AppProviders con useEffect apropiados
- **Cambios**:
  - Agregado `useRef` para evitar inicialización múltiple
  - Movido `setupGlobalCache()` dentro del useEffect
  - Agregado cleanup functions apropiadas
  - Condicionado la inicialización de sistemas blockchain

### 2. Optimización del hook useOracle (`src/hooks/useOracle.ts`)

- **Problema**: Actualizaciones en bucle del cache persistente
- **Solución**: Memoización de funciones y validación de datos
- **Cambios**:
  - Agregado `useMemo` para `queryFn` y `placeholderData`
  - Validación de precio antes de actualizar cache persistente
  - Optimización de dependencias

### 3. Configuración de cache global (`src/lib/cache.ts`)

- **Problema**: setupGlobalCache se ejecutaba múltiples veces
- **Solución**: Control de inicialización única
- **Cambios**:
  - Agregado flag `globalCacheInitialized`
  - Configuración más conservadora en desarrollo
  - Cleanup function para limpiar intervalos

### 4. Sistema de optimistic updates (`src/lib/optimistic.tsx`)

- **Problema**: Suscripciones múltiples causando bucles infinitos
- **Solución**: Control de suscripciones y cleanup apropiado
- **Cambios**:
  - Agregado control de suscripción activa
  - Obtener estado inicial al montar
  - Cleanup apropiado al desmontar

### 5. Hook useWebSocket (`src/hooks/useWebSocket.ts`)

- **Problema**: Reconexiones múltiples causando bucles infinitos
- **Solución**: Optimización de dependencias del useEffect
- **Cambios**:
  - Removido `connect` y `disconnect` de las dependencias
  - Solo depende de `autoConnect`

### 6. Configuración de desarrollo (`src/lib/dev-config.ts`)

- **Problema**: Sistemas problemáticos ejecutándose en desarrollo
- **Solución**: Configuración específica para desarrollo
- **Cambios**:
  - Deshabilitación temporal de sistemas problemáticos
  - Configuración más conservadora de cache y polling
  - Control granular de funcionalidades

### 7. Optimización del Dashboard (`src/pages/Dashboard.tsx`)

- **Problema**: useEffect problemáticos causando re-renders
- **Solución**: Optimización de dependencias y configuración
- **Cambios**:
  - Uso de configuración de desarrollo
  - Optimización de intervalos de polling
  - Control de WebSocket basado en configuración

## Configuración de Variables de Entorno

Se agregaron nuevas variables de entorno para controlar sistemas problemáticos:

```env
# Development Configuration
VITE_DISABLE_BLOCKCHAIN_EVENTS=true
VITE_DISABLE_OPTIMISTIC_UPDATES=false
VITE_DISABLE_WEBSOCKET=false
```

## Cómo Usar la Solución

### 1. Desarrollo Local

Para desarrollo local, la configuración automáticamente:
- Deshabilita eventos blockchain
- Usa configuración de cache más conservadora
- Reduce intervalos de polling
- Deshabilita analytics y telemetry

### 2. Producción

Para producción, todos los sistemas están habilitados con configuración optimizada.

### 3. Control Manual

Puedes controlar manualmente qué sistemas deshabilitar usando las variables de entorno:

```bash
# Deshabilitar WebSocket
VITE_DISABLE_WEBSOCKET=true

# Deshabilitar optimistic updates
VITE_DISABLE_OPTIMISTIC_UPDATES=true

# Deshabilitar eventos blockchain
VITE_DISABLE_BLOCKCHAIN_EVENTS=true
```

## Verificación de la Solución

Para verificar que la solución funciona:

1. **Ejecutar en desarrollo**:
   ```bash
   pnpm run dev
   ```

2. **Verificar en la consola del navegador**:
   - No debe haber errores de "Maximum update depth exceeded"
   - Los logs deben mostrar inicialización única de sistemas
   - No debe haber reconexiones infinitas de WebSocket

3. **Verificar rendimiento**:
   - Menos re-renders innecesarios
   - Mejor rendimiento general
   - Sin bucles infinitos

## Prevención de Problemas Futuros

### 1. Reglas para useEffect

- Siempre incluir dependencias apropiadas
- Usar `useRef` para evitar inicialización múltiple
- Incluir cleanup functions cuando sea necesario
- Evitar dependencias que cambien en cada render

### 2. Reglas para Sistemas Globales

- Inicializar sistemas globales dentro de componentes React
- Usar flags para evitar inicialización múltiple
- Proporcionar cleanup functions apropiadas
- Condicionar inicialización basada en entorno

### 3. Reglas para Cache y Estado

- Memoizar funciones y objetos costosos
- Validar datos antes de actualizar estado
- Usar configuración apropiada para cada entorno
- Limpiar caches expirados regularmente

## Archivos Modificados

1. `src/app/providers.tsx` - Refactorización principal
2. `src/hooks/useOracle.ts` - Optimización de cache
3. `src/lib/cache.ts` - Control de inicialización
4. `src/lib/optimistic.tsx` - Control de suscripciones
5. `src/hooks/useWebSocket.ts` - Optimización de dependencias
6. `src/pages/Dashboard.tsx` - Uso de configuración de desarrollo
7. `src/lib/env.ts` - Nuevas variables de entorno
8. `src/lib/dev-config.ts` - Configuración de desarrollo (nuevo)

## Conclusión

La solución implementada resuelve el problema de "Maximum update depth exceeded" mediante:

1. **Control de inicialización**: Evita inicialización múltiple de sistemas
2. **Optimización de dependencias**: Corrige useEffect problemáticos
3. **Configuración por entorno**: Adapta el comportamiento según el entorno
4. **Cleanup apropiado**: Limpia recursos y suscripciones
5. **Memoización**: Evita recreaciones innecesarias de funciones y objetos

El código ahora es más robusto, eficiente y adecuado para desarrollo y producción.
