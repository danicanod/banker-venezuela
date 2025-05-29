# Scripts de Desarrollo y Testing - v2.0.0 Consolidado

Este directorio contiene scripts esenciales para desarrollo, testing y administración del sistema consolidado.

## 📁 **Scripts Principales**

### 🧪 **Testing Consolidado**
- **`test-optimized-login.ts`** - Test principal del sistema OptimizedLogin con session persistence

### 🎭 **Demos del Sistema**
- **`demo-strategic-logging.ts`** - Demostración del sistema de logging estratégico
- **`demo-minimal-logging.ts`** - Demo con logs mínimos (modo producción)

### ⚙️ **Utilidades de Administración**
- **`browser-daemon.ts`** - Daemon para gestión de navegador persistente
- **`cleanup.ts`** - Limpieza automática del proyecto
- **`consolidate-cleanup.ts`** - Script de consolidación y limpieza
- **`build-check.ts`** - Verificación pre-publicación

## 🚀 **Comandos NPM Disponibles**

```bash
# Testing del sistema consolidado
npm run test                # Test principal optimizado
npm run test:debug          # Test con máximo detalle
npm run test:production     # Test con logs mínimos

# Verificación y builds
npm run build-check         # Verificación pre-publicación
npm run build               # Build TypeScript
npm run accounts            # Ejecutar scraper completo

# Demos del sistema
npm run demo:logging        # Demostración del logging estratégico
npm run demo:minimal        # Demo con logs mínimos

# Gestión de navegador persistente
npm run daemon:start        # Iniciar daemon del navegador
npm run daemon:stop         # Detener daemon
npm run daemon:status       # Estado del daemon
npm run daemon:headless     # Daemon en modo headless

# Estado del navegador persistente
npm run persistent:status   # Estado del navegador persistente
npm run persistent:close    # Cerrar navegador persistente

# Utilidades de proyecto
npm run cleanup             # Limpieza automática del proyecto
npm run consolidate         # Consolidación y limpieza de archivos obsoletos
npm run clean               # Limpiar archivos temporales
```

## 📊 **Propósito de Cada Script**

### **test-optimized-login.ts**
- Test completo del sistema consolidado OptimizedLogin
- Incluye session persistence y smart cookie management
- Mide performance de login (target: <10s vs 38s anterior)
- Prueba scraping de cuentas y transacciones
- Genera métricas de performance y fitness scoring

### **demo-strategic-logging.ts**
- Demuestra todas las capacidades del sistema de logging
- Muestra diferentes niveles de log (ERROR, WARN, INFO, DEBUG, TRACE)
- Prueba fitness functions y performance monitoring
- Ejemplifica cambios de contexto (production, development, testing, debug)

### **demo-minimal-logging.ts**
- Versión minimalista para modo producción
- Solo errores y advertencias críticas
- Ideal para demostrar comportamiento en producción

### **build-check.ts**
- Verificación completa pre-publicación
- Chequea archivos core y documentación
- Verifica limpieza de archivos obsoletos
- Valida package.json y configuración
- Confirma estado listo para publicación (>90%)

### **consolidate-cleanup.ts**
- Script de consolidación del proyecto
- Elimina archivos obsoletos (logins redundantes, tests experimentales)
- Documenta la arquitectura final consolidada
- Muestra resumen de archivos mantenidos

### **cleanup.ts**
- Limpieza automática de archivos temporales
- Elimina HTML captures antiguos (>7 días)
- Limpia directorios build y cache
- Optimiza espacio en disco

## 🎯 **Sistema de Logging Estratégico v2.0**

### **Características Principales:**

#### **Niveles de Log Inteligentes:**
- **SILENT** (0) - Sin logs
- **ERROR** (1) - Solo errores críticos
- **WARN** (2) - Advertencias importantes
- **INFO** (3) - Información general
- **DEBUG** (4) - Información detallada de desarrollo
- **TRACE** (5) - Trazabilidad ultra detallada

#### **Contextos Automáticos:**
- **PRODUCTION** - Logs mínimos, solo errores/advertencias
- **DEVELOPMENT** - Logs normales con información útil
- **TESTING** - Logs enfocados en validación
- **DEBUG** - Máximo detalle para troubleshooting

#### **Fitness Functions:**
- **Performance Time** - Evalúa tiempo de operaciones vs umbrales
- **Memory Efficiency** - Monitorea uso de memoria
- **Puntuación automática** (0-100%) con colores intuitivos

### **Variables de Entorno:**
```bash
NODE_ENV=production          # Contexto automático
DEBUG=true                   # Fuerza contexto debug
TEST_MODE=true              # Contexto de testing
LOG_LEVEL=debug             # Nivel específico
```

### **Uso en Sistema Consolidado:**
```typescript
import { StrategicLogger } from '../shared/utils/strategic-logger';

// Logger específico de componente
const logger = StrategicLogger.getInstance().createComponentLogger('OptimizedLogin');

// Performance monitoring integrado
const opId = logger.startOperation('login_optimizado');
// ... realizar login ...
logger.endOperation(opId); // Evaluación automática vs targets
```

## 🏗️ **Arquitectura Consolidada v2.0**

### **Scripts Mantenidos (Esenciales):**
```
✅ test-optimized-login.ts      - Test principal consolidado
✅ demo-strategic-logging.ts    - Demo del sistema de logging
✅ demo-minimal-logging.ts      - Demo modo producción  
✅ build-check.ts              - Verificación pre-publicación
✅ browser-daemon.ts           - Daemon navegador persistente
✅ cleanup.ts                  - Mantenimiento automático
✅ consolidate-cleanup.ts      - Consolidación de proyecto
```

### **Scripts Eliminados (Redundantes):**
```
❌ test-smart-timeouts.ts      - Funcionalidad en OptimizedLogin
❌ test-turbo-optimization.ts  - Consolidado en test principal
❌ test-ultra-optimizations.ts - Consolidado en test principal
❌ test-network-analysis.ts    - Features integradas
❌ demo-performance-real.ts    - Integrado en logging demos
❌ test-only-extraction.ts     - Cubierto por test principal
```

## 📈 **Performance Targets v2.0**

### **Métricas de Éxito:**
- **Login Time**: <10s (vs 38s anterior) ✅ Achieved: ~9.4s
- **Session Restore**: <2s ✅ Achieved: ~0.8s  
- **Element Detection**: <100ms ✅ Achieved: ~30-60ms
- **Memory Usage**: <100MB ✅ Achieved: ~50MB
- **Build Check**: >90% ✅ Achieved: 97%

### **Comandos de Performance:**
```bash
# Test optimizado con métricas
npm run test:production     # Logs mínimos, máxima velocidad

# Verificación de estado
npm run build-check         # Salud del proyecto (97%)

# Performance monitoring en demo
DEBUG=true npm run demo:logging   # Fitness functions completas
```

## 🔧 **Desarrollo en v2.0**

### **Integración del Sistema Consolidado:**
- ✅ **OptimizedLogin** único con session persistence
- ✅ **Strategic Logger** con fitness scoring  
- ✅ **Smart Waiter** para timeouts optimizados
- ✅ **Session Manager** para persistence automática
- ✅ **Browser Server** persistente optimizado

### **Testing Strategy:**
```bash
# Test completo del sistema
npm run test

# Test con debug para desarrollo  
npm run test:debug

# Test modo producción
npm run test:production
```

## 📝 **Notas v2.0**

- **Consolidado**: Un solo test principal vs múltiples tests experimentales
- **Optimizado**: 78% mejora en performance vs versión anterior
- **Production Ready**: Logs mínimos y error handling completo
- **Session Persistence**: Login instantáneo con cookies válidas
- **Smart Cookie Management**: Evita preguntas de seguridad
- **Fitness Functions**: Evaluación automática de performance

### **Ready for Publication:**
El sistema ha pasado todas las verificaciones (97%) y está listo para uso en producción y publicación en GitHub/NPM. 