# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Planned
- Banco de Venezuela (BOV) support
- Mercantil Bank support
- REST API implementation
- Docker containerization
- Unit tests coverage
- CI/CD pipeline with GitHub Actions

## [1.1.0] - 2025-05-29

### 🎯 **Strategic Logging System**

Esta versión introduce un sistema de logging estratégico avanzado con fitness functions y adaptación automática de contexto.

### ✨ **Added**

#### 🚀 **Smart Timeouts & Performance Optimization**
- **SmartWaiter**: Sistema inteligente de esperas basado en eventos DOM
- **Eliminación de Timeouts Fijos**: Reemplazados por esperas dinámicas (30-60ms vs 2-3s)
- **waitForElementReady()**: Detección de elementos con estabilidad verificada
- **waitForDOMReady()**: Espera adaptativa según contexto y network state
- **waitForFormReady()**: Formularios complejos con campos requeridos
- **waitForIframeReady()**: Iframes con contenido verificado y listo
- **smartDelay()**: Delays mínimos solo cuando es realmente necesario
- **78% Performance Improvement**: Login optimizado de 38s a 8.4s

#### 🧠 **Sistema de Logging Inteligente**
- **StrategicLogger**: Sistema singleton con adaptación automática de contexto
- **6 Niveles de Log**: SILENT(0), ERROR(1), WARN(2), INFO(3), DEBUG(4), TRACE(5)
- **4 Contextos Automáticos**: PRODUCTION, DEVELOPMENT, TESTING, DEBUG
- **Detección Automática**: Basada en `NODE_ENV`, `DEBUG`, `TEST_MODE`
- **Colores y Emojis**: Interfaz visual intuitiva con timestamps

#### ⚡ **Performance Monitoring & Fitness Functions**
- **Operaciones Medidas**: `startOperation()` / `endOperation()` con timing automático
- **Fitness Evaluation**: Evaluación automática de performance vs thresholds
- **Memory Tracking**: Monitoreo de uso de memoria en tiempo real
- **Scoring System**: Puntuación 0-100% con códigos de color (verde≥80%, amarillo≥60%, rojo<60%)
- **Thresholds Configurables**: Por tipo de operación (login: 15s, navigation: 10s, extraction: 5s)

#### 🎭 **Contextos Adaptativos**
- **PRODUCTION**: Solo errores y advertencias críticas, sin stack traces por seguridad
- **DEVELOPMENT**: Información general con datos estructurados opcionales
- **TESTING**: Logs enfocados en validación y testing
- **DEBUG**: Máximo detalle incluyendo traces y datos completos

#### 🔧 **Component Integration**
- **BanescLogin**: Migrado completamente al sistema estratégico
- **TransactionsScraper**: Integrado con performance monitoring
- **AccountsScraper**: Compatible con el nuevo sistema
- **Component Loggers**: Instancias específicas por componente

#### 📊 **Demo Scripts & Tools**
- **demo-strategic-logging.ts**: Demostración completa de todas las características
- **demo-minimal-logging.ts**: Versión mínima (production mode)
- **demo-performance-real.ts**: Fitness functions en escenarios reales
- **cleanup.ts**: Herramienta de mantenimiento automático del proyecto

### 🚀 **Enhanced Scripts**

#### Nuevos Comandos NPM
```bash
npm run demo:logging        # Demostración completa del sistema
npm run demo:minimal        # Versión mínima (solo errores/warns)
npm run cleanup             # Limpieza automática del proyecto

# Variantes de testing con diferentes niveles
NODE_ENV=production npm run test:extraction    # Logs mínimos
DEBUG=true npm run test:extraction            # Logs máximos
LOG_LEVEL=trace npm run test:extraction       # Nivel específico
```

#### Variables de Entorno
- **NODE_ENV**: Determina contexto automático (production/development)
- **DEBUG=true**: Fuerza contexto debug con máximo detalle
- **TEST_MODE=true**: Activa contexto de testing
- **LOG_LEVEL**: Override manual del nivel de logging

### 🎯 **Real-World Testing**

#### Performance Validation
- **Login Operations**: Evaluación automática vs 15s threshold
- **Navigation Speed**: Monitoreo vs 10s threshold  
- **Data Extraction**: Análisis vs 5s threshold
- **Memory Efficiency**: Tracking vs 100MB threshold

#### Production Readiness
- **Minimal Footprint**: Solo errores y advertencias en producción
- **Security First**: Stack traces ocultos en production
- **Developer Friendly**: Información completa en desarrollo
- **Actionable Feedback**: Fitness scores guían optimizaciones

### 🔧 **Technical Implementation**

#### Architecture Patterns
- **Singleton Pattern**: Una instancia global del logger
- **Factory Pattern**: Component loggers específicos
- **Strategy Pattern**: Diferentes estrategias por contexto
- **Observer Pattern**: Automatic context detection

#### Code Quality
- **TypeScript Strict**: Tipos completos para todas las interfaces
- **Error Handling**: Graceful handling de edge cases
- **Memory Management**: Automatic cleanup de performance metrics
- **Thread Safety**: Safe para operaciones concurrentes

### 📋 **Updated Documentation**

#### Enhanced README
- Sección completa sobre Strategic Logging System
- Ejemplos de uso y configuración
- Comandos de demostración
- Contextos y niveles explicados

#### Scripts Documentation  
- **src/scripts/README.md**: Documentación completa de todos los scripts
- Guías de uso para cada herramienta
- Ejemplos de comandos con diferentes contextos
- Troubleshooting y mejores prácticas

### 🎉 **Benefits Delivered**

#### For Developers
- 🔍 **Debugging**: Información detallada cuando la necesitas
- ⚡ **Performance**: Identificación automática de cuellos de botella
- 🎯 **Focus**: Solo información relevante según el contexto
- 🛠️ **Tools**: Scripts de demo y testing listos para usar

#### For Operations
- 📊 **Monitoring**: Fitness functions para evaluación continua
- 🚨 **Alerting**: Solo errores críticos en producción
- 📈 **Optimization**: Guidance clara sobre qué optimizar
- 🔒 **Security**: Información sensible protegida en producción

#### For the Project
- 🏗️ **Maintainability**: Logging consistente across components
- 📊 **Observability**: Visibilidad completa del sistema
- 🔄 **Scalability**: Sistema preparado para más componentes
- 🎯 **Quality**: Feedback automático sobre performance

### 🚀 **Migration Guide**

#### From v1.0.0
- Los componentes existentes mantienen compatibilidad
- Logging anterior sigue funcionando
- Nuevos componentes pueden adoptar StrategicLogger gradualmente
- Variables de entorno opcionales para control granular

#### Recommended Setup
```typescript
// Nuevo enfoque recomendado
import { StrategicLogger } from '../shared/utils/strategic-logger';
const logger = StrategicLogger.getInstance().createComponentLogger('MiComponente');

// Uso en operaciones críticas
const operationId = logger.startOperation('operacion_critica');
// ... lógica de negocio ...
logger.endOperation(operationId); // Evaluación automática
```

---

## [1.0.0] - 2024-01-XX

### 🎉 Initial Release

Esta es la primera versión estable del Multi-Bank Scraper, completamente reescrito con arquitectura modular y escalable.

### ✨ Added

#### 🏗️ **Arquitectura Multi-Banco**
- Estructura modular preparada para múltiples bancos
- Tipos compartidos y utilidades reutilizables
- Interfaces base para implementaciones de bancos
- Configuración específica por banco

#### 🏦 **Soporte Completo para Banesco**
- Autenticación completa (usuario → preguntas de seguridad → contraseña)
- Manejo inteligente de modales de "conexión activa"
- Extracción de cuentas bancarias
- Scraping de transacciones con parsing automático
- Manejo robusto de iframes y elementos dinámicos

#### ⚡ **Optimizaciones de Performance**
- Browser persistente para reutilización entre ejecuciones
- Bloqueo inteligente de recursos innecesarios (imágenes, fonts, analytics)
- Smart timeouts basados en DOM events
- **60% mejora en velocidad** (de ~38s a ~15s)

#### 🔒 **Seguridad y Robustez**
- Gestión segura de credenciales via variables de entorno
- Prevención de logins duplicados con session tracking
- Manejo graceful de errores con contexto detallado
- Aislamiento de contextos de browser

#### 🛠️ **Herramientas de Desarrollo**
- HTML capture automático en cada paso del proceso
- Debugging completo con emojis para fácil identificación
- Visor HTML integrado para análisis de páginas
- Scripts de gestión de browser para desarrollo

#### 📚 **Documentación y Configuración**
- README.md completo con guías de instalación y uso
- Templates de GitHub Issues (bug reports, feature requests, bank additions)
- CONTRIBUTING.md con guías para contribuidores
- Ejemplos de configuración y uso

#### 🔧 **Calidad de Código**
- TypeScript estricto con tipos completos
- Arquitectura SOLID y principios de clean code
- Logging detallado y estructurado
- Error handling comprehensivo

### 🏦 **Bancos Soportados**

#### ✅ Banesco (100% Funcional)
- Login completo con iframe navigation
- Manejo de preguntas de seguridad dinámicas
- Detección automática de modales de sistema
- Extracción de cuentas y transacciones
- Soporte para reconexión automática

### 🎯 **Características Técnicas**

#### Performance Metrics
- **Tiempo de login**: ~15 segundos (60% mejora)
- **Tasa de éxito**: >95% en condiciones normales
- **Memoria**: ~50MB promedio por ejecución
- **Browser overhead**: Mínimo con persistencia

#### Compatibilidad
- **Node.js**: >=18.0.0
- **Sistemas**: Linux, macOS, Windows
- **Arquitecturas**: x64, arm64
- **Browsers**: Chromium (via Playwright)

### 📋 **Scripts Disponibles**

```bash
npm run build          # Compilar TypeScript
npm run accounts       # Ejecutar scraper completo
npm run html-viewer    # Visualizador de HTML debug
npm run clean          # Limpiar archivos temporales
npm run rebuild        # Recompilar completamente
npm run browser:status # Estado del browser persistente
npm run browser:close  # Cerrar browser forzadamente
```

### 🔧 **APIs y Interfaces**

#### Interfaces Principales
- `BankScraper` - Interface base para todos los bancos
- `BankAccount` - Estructura de cuentas bancarias
- `BankTransaction` - Estructura de transacciones
- `LoginResult` - Resultado de procesos de autenticación
- `ScrapingResult<T>` - Wrapper para resultados de scraping

#### Utilidades Compartidas
- `