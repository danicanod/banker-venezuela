# Scripts de Desarrollo y Testing

Este directorio contiene scripts utilitarios para desarrollo, testing y debugging del sistema.

## 📁 **Estructura de Scripts**

### 🧪 **Scripts de Testing**
- **`test-network-analysis.ts`** - Test completo con análisis de red y performance
- **`test-only-extraction.ts`** - Test enfocado únicamente en extracción de transacciones  
- **`test-transactions-complete.ts`** - Test completo de transacciones (si existe)

### 🐛 **Scripts de Debug**
- **`debug-transactions.ts`** - Debug en vivo de extracción de transacciones
- **`analyze-html-transactions.ts`** - Análisis de archivos HTML guardados

### ⚙️ **Scripts Utilitarios**
- **`browser-daemon.ts`** - Daemon para gestión de navegador persistente
- **`cleanup.ts`** - Limpieza automática del proyecto
- **`demo-strategic-logging.ts`** - Demostración del sistema de logging estratégico

## 🚀 **Comandos NPM Disponibles**

```bash
# Testing principal
npm run test:network         # Test completo con análisis de red
npm run test:extraction      # Test solo de extracción de transacciones

# Debug y análisis
npm run debug:transactions   # Debug en vivo
npm run analyze:html        # Análisis de HTML guardado

# Utilidades de proyecto
npm run cleanup             # Limpieza automática del proyecto
npm run demo:logging        # Demostración del sistema de logging

# Gestión de navegador
npm run daemon:start        # Iniciar daemon del navegador
npm run daemon:stop         # Detener daemon
npm run daemon:status       # Estado del daemon
npm run daemon:headless     # Daemon en modo headless

# Performance y navegador persistente
npm run persistent:status   # Estado del navegador persistente
npm run persistent:close    # Cerrar navegador persistente
npm run performance:test    # Test de performance
```

## 📊 **Propósito de Cada Script**

### **test-network-analysis.ts**
- Test más completo
- Incluye análisis de red en tiempo real
- Mide performance de login, navegación y extracción
- Genera estadísticas de requests de red
- Ideal para desarrollo y optimización

### **test-only-extraction.ts**  
- Enfocado únicamente en la extracción de transacciones
- Más rápido que el test completo
- Muestra estadísticas detalladas de transacciones
- Ideal para debugging de la lógica de extracción

### **debug-transactions.ts**
- Debug en vivo usando navegador real
- Extrae datos directamente de las tablas HTML
- Muestra estructura de tablas y contenido
- Perfecto para troubleshooting

### **analyze-html-transactions.ts**
- Analiza archivos HTML previamente guardados
- No requiere navegador activo
- Más rápido para análisis offline
- Útil para development sin hacer requests reales

### **demo-strategic-logging.ts**
- Demuestra todas las capacidades del sistema de logging
- Muestra diferentes niveles de log (ERROR, WARN, INFO, DEBUG, TRACE)
- Prueba fitness functions y performance monitoring
- Ejemplifica cambios de contexto (production, development, testing, debug)

### **cleanup.ts**
- Limpieza automática de archivos temporales
- Elimina HTML captures antiguos (>7 días)
- Limpia directorios build y cache
- Optimiza espacio en disco

## 🎯 **Sistema de Logging Estratégico**

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

#### **Variables de Entorno:**
```bash
NODE_ENV=production          # Contexto automático
DEBUG=true                   # Fuerza contexto debug
TEST_MODE=true              # Contexto de testing
LOG_LEVEL=debug             # Nivel específico
```

### **Uso Básico:**
```typescript
import { StrategicLogger } from '../shared/utils/strategic-logger';

// Logger global
const logger = StrategicLogger.getInstance();

// Logger específico de componente
const myLogger = logger.createComponentLogger('MyComponent');

// Logging básico
myLogger.info('Mensaje informativo', { data: 'opcional' });
myLogger.error('Error ocurrido', error);

// Performance monitoring
const opId = myLogger.startOperation('operacion_critica');
// ... hacer trabajo ...
myLogger.endOperation(opId); // Evaluación automática de fitness
```

### **Comandos de Demostración:**
```bash
# Diferentes niveles de verbosidad
NODE_ENV=production npm run demo:logging    # Logs mínimos
NODE_ENV=development npm run demo:logging   # Logs normales  
DEBUG=true npm run demo:logging             # Logs máximos
LOG_LEVEL=trace npm run demo:logging        # Todos los logs
TEST_MODE=true npm run demo:logging         # Modo testing
```

## 🔧 **Desarrollo**

Todos los scripts están configurados para:
- Usar el sistema de logging estratégico con fitness functions
- Adaptarse automáticamente al contexto de desarrollo
- Usar el navegador persistente para mejor performance
- Guardar HTML de debug automáticamente
- Manejar errores gracefully
- Limpiar recursos al finalizar

### **Integración del Logger:**
Los componentes principales (Login, AccountsScraper, TransactionsScraper) han sido migrados al sistema de logging estratégico para:
- Logs más informativos y estructurados
- Performance monitoring automático
- Evaluación de fitness en tiempo real
- Adaptación automática según el contexto

## 📝 **Notas**

- Los scripts asumen que las credenciales están en `.env`
- Requieren que el directorio `html-captures/` esté disponible
- Algunos scripts pueden requerir archivos HTML previamente capturados
- Todos los imports han sido ajustados para la estructura de directorios actual
- El sistema de logging se adapta automáticamente según NODE_ENV y variables de entorno 