# 📖 Guía de Scripts - Banker Venezuela

## 🎯 Scripts de Transacciones (Recomendados)

### ⭐ **Altamente Recomendados**

#### `npm run transactions:direct`
- **📁 Archivo**: `src/scripts/transactions-direct.ts`
- **🎯 Uso**: **RECOMENDADO** - Manejo directo de browser, respuesta inteligente a preguntas de seguridad
- **⚡ Velocidad**: Óptima (1-2s para preguntas de seguridad)
- **🧠 Inteligencia**: Detecta automáticamente password vs preguntas de seguridad
- **✅ Ventajas**: Single browser instance, timeouts inteligentes, manejo robusto de errores

#### `npm run transactions:working`
- **📁 Archivo**: `src/scripts/transactions-final-working.ts`
- **🎯 Uso**: Versión más completa y detallada con análisis exhaustivo
- **⚡ Velocidad**: Excelente
- **🧠 Inteligencia**: Análisis completo de cuentas y períodos, extracción robusta de datos
- **✅ Ventajas**: Máxima compatibilidad, logging detallado, manejo de múltiples períodos

#### `npm run transactions:optimized`
- **📁 Archivo**: `src/scripts/transactions-optimized.ts`
- **🎯 Uso**: Versión optimizada para velocidad máxima
- **⚡ Velocidad**: Ultra-rápida
- **🧠 Inteligencia**: Navegación directa, menos verificaciones para máximo rendimiento
- **✅ Ventajas**: Mínimo tiempo de ejecución, ideal para uso en producción

### 🚀 **Alternativas por Velocidad**

#### `npm run transactions:simple`
- **📁 Archivo**: `src/scripts/transactions-simple.ts`
- **🎯 Uso**: Evita preguntas de seguridad completamente
- **⚡ Velocidad**: Ultra-rápida si no hay preguntas
- **⚠️ Limitación**: Aborta inmediatamente si detecta preguntas de seguridad

#### `npm run transactions:fast`
- **📁 Archivo**: `src/scripts/transactions-fast.ts`
- **🎯 Uso**: Optimizado con sistema persistente (puede tener problemas)
- **⚡ Velocidad**: Rápida cuando funciona
- **⚠️ Advertencia**: Puede fallar por dependencias del sistema persistente

#### `npm run transactions:turbo`
- **📁 Archivo**: `src/scripts/transactions-turbo.ts`
- **🎯 Uso**: Ultra-rápido con timeouts agresivos de 5s
- **⚡ Velocidad**: Máxima velocidad
- **⚠️ Riesgo**: Timeouts muy cortos pueden causar fallos en conexiones lentas

#### `npm run transactions:fixed`
- **📁 Archivo**: `src/scripts/transactions-fixed.ts`
- **🎯 Uso**: Versión corregida con manejo específico del flujo iframe/portal
- **⚡ Velocidad**: Buena
- **✅ Ventajas**: Maneja correctamente la transición iframe → portal principal

### 📋 **Script Básico**

#### `npm run transactions`
- **📁 Archivo**: `src/scripts/scrape-transactions.ts`
- **🎯 Uso**: Script básico original
- **⚡ Velocidad**: Estándar
- **📝 Nota**: Funcionalidad básica sin optimizaciones

## 🛠️ Scripts de Configuración y Utilidades

### ⚙️ **Configuración**

#### `npm run setup:security`
- **📁 Archivo**: `src/scripts/setup-security.ts`
- **🎯 Uso**: Configuración interactiva de preguntas de seguridad
- **✅ Funcionalidad**: Guía paso a paso para configurar `SECURITY_QUESTIONS` en `.env`

### 🧹 **Mantenimiento**

#### `npm run cleanup`
- **📁 Archivo**: `src/scripts/cleanup.ts`
- **🎯 Uso**: Limpieza de archivos temporales y capturas HTML
- **✅ Funcionalidad**: Elimina `html-captures/`, archivos temporales, logs

#### `npm run clean`
- **🎯 Uso**: Limpieza básica de archivos de compilación
- **✅ Funcionalidad**: Elimina `dist/`, `html-captures/`, archivos HTML

## 🌐 Scripts de Browser

### 🔧 **Gestión de Browser**

#### `npm run browser:status`
- **📁 Archivo**: `src/scripts/browser-status.ts`
- **🎯 Uso**: Verificar estado del navegador
- **✅ Funcionalidad**: Muestra procesos de navegador activos

#### `npm run browser:close`
- **📁 Archivo**: `src/scripts/browser-close.ts`
- **🎯 Uso**: Cerrar navegadores huérfanos
- **✅ Funcionalidad**: Mata procesos de navegador que quedaron abiertos

### 🔄 **Sistema Persistente (Experimental)**

#### `npm run daemon:start`
- **📁 Archivo**: `src/scripts/browser-daemon.ts`
- **🎯 Uso**: Iniciar daemon de navegador persistente
- **⚠️ Estado**: Experimental, puede tener problemas

#### `npm run daemon:stop`
- **🎯 Uso**: Detener daemon de navegador
- **✅ Funcionalidad**: Mata procesos del daemon

#### `npm run persistent:status`
- **📁 Archivo**: `src/scripts/persistent-status.ts`
- **🎯 Uso**: Estado del sistema persistente
- **✅ Funcionalidad**: Verifica conexiones persistentes

#### `npm run persistent:close`
- **📁 Archivo**: `src/scripts/persistent-close.ts`
- **🎯 Uso**: Cerrar conexiones persistentes
- **✅ Funcionalidad**: Limpia conexiones del sistema persistente

## 🧪 Scripts de Testing

#### `npm run test`
- **📁 Archivo**: `src/scripts/test-optimized-login.ts`
- **🎯 Uso**: Test de login optimizado
- **✅ Funcionalidad**: Verifica proceso de autenticación

#### `npm run test:debug`
- **🎯 Uso**: Test con debug habilitado
- **✅ Funcionalidad**: Test con logging detallado

#### `npm run test:production`
- **🎯 Uso**: Test en modo producción
- **✅ Funcionalidad**: Test con configuración de producción

## 📋 Resumen de Comandos por Uso

### 🎯 **Para Uso Normal (Recomendado)**
```bash
npm run transactions:direct    # ⭐ MÁS RECOMENDADO
npm run transactions:working   # Completo y detallado
npm run transactions:optimized # Máxima velocidad
```

### ⚡ **Para Uso Rápido**
```bash
npm run transactions:simple   # Si no hay preguntas de seguridad
npm run transactions:turbo    # Ultra-rápido (riesgoso)
```

### 🛠️ **Para Configuración**
```bash
npm run setup:security       # Configurar preguntas
npm run cleanup              # Limpiar archivos
```

### 🔧 **Para Mantenimiento**
```bash
npm run browser:status       # Ver navegadores
npm run browser:close        # Cerrar navegadores
npm run test                 # Probar login
```

---

## 💡 **Consejos de Uso**

1. **Primera vez**: Ejecuta `npm run setup:security` para configurar preguntas
2. **Uso diario**: Usa `npm run transactions:direct` (más confiable)
3. **Si hay problemas**: Usa `npm run browser:close` y reintenta
4. **Velocidad máxima**: Usa `npm run transactions:optimized`
5. **Debug**: Revisa archivos en `html-captures/` si hay errores

## ⚠️ **Notas Importantes**

- **Todos los scripts** tienen timeouts inteligentes y no se cuelgan
- **Scripts eliminados**: Se han removido versiones experimentales y de debug
- **Mantenimiento**: Solo se mantienen scripts estables y funcionales
- **Recomendación**: Usar `transactions:direct` como primera opción