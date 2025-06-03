# 🏦 Banker Venezuela - Optimized Banking Scraper

<div align="center">

![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Playwright](https://img.shields.io/badge/Playwright-45ba4b?style=for-the-badge&logo=playwright&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)

[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](https://choosealicense.com/licenses/mit/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)
[![Performance](https://img.shields.io/badge/Performance-Optimized-brightgreen.svg)](#-características-principales)
[![Architecture](https://img.shields.io/badge/Architecture-Consolidated-orange.svg)](#-arquitectura)

**Sistema consolidado y optimizado para scraping de datos bancarios venezolanos**

*Scraper eficiente con session persistence, smart timeouts y manejo inteligente de cookies*

[Características](#-características-principales) • [Instalación](#-instalación) • [Uso](#-uso-rápido) • [CLI](#-cli) • [API](#-api) • [Contribuir](#-contribución)

</div>

---

## 🚀 **Características Principales**

### ⚡ **Performance Optimizada**
- **Session Persistence**: Login instantáneo reutilizando sesiones válidas
- **Smart Cookies**: Evita preguntas de seguridad manteniendo cookies como navegador normal
- **Smart Timeouts**: Esperas basadas en eventos DOM reales (30-60ms vs 2-3s)
- **Browser Persistente**: Reutilización de instancias para máximo rendimiento

### 🧠 **Inteligencia Integrada**
- **Detección Automática**: Manejo inteligente de modales y conexiones activas
- **Context-Aware Logging**: Logs adaptativos según ambiente (production/development/debug)
- **Manejo de Errores**: Recuperación automática de fallos comunes
- **Reintentos Inteligentes**: Lógica adaptativa de retry

### 🏗️ **Arquitectura Consolidada**
- **Un Solo Login**: `OptimizedLogin` consolida las mejores características
- **Utilidades Core**: Solo las utilidades esenciales y probadas
- **API Limpia**: Interfaz simple y consistente
- **Modular**: Fácil extensión para nuevos bancos

## 🎯 **Bancos Soportados**

### ✅ **Banesco**
- **Login Optimizado**: Usuario → (opcional preguntas de seguridad) → Contraseña
- **Session Persistence**: Evita preguntas de seguridad en logins sucesivos
- **Scraping Completo**: Cuentas y transacciones
- **Performance**: ~78% más rápido que implementaciones tradicionales

## 🚀 **Instalación**

### **Prerrequisitos**
```bash
Node.js >= 18
npm >= 8
```

### **Instalación Rápida**
```bash
# Clonar y configurar
git clone <repository-url>
cd banker-venezuela
npm install

# Configurar credenciales
cp env.example .env
# Editar .env con tus credenciales
```

### **Configuración de Variables**
```env
# Credenciales Banesco
BANESCO_USERNAME=tu_cedula_sin_puntos
BANESCO_PASSWORD=tu_clave_internet

# Preguntas de seguridad (formato: "palabra:respuesta,palabra2:respuesta2")
SECURITY_QUESTIONS="anime:SNK,libro:Bible,color:azul"
```

## 📋 **Uso Rápido**

### **Usando la nueva CLI**
```bash
# Ver información de cuentas
banker bank accounts

# Obtener movimientos de cuenta
banker bank transactions

# Método alternativo para transacciones (cuando el método principal falla)
banker bank fix-transactions

# Ver todos los comandos disponibles
banker --help
```

### **Comandos Tradicionales**
```bash
# Ejecutar scraper completo
npm run start

# Probar login optimizado
npm run dev
```

### **Salida Esperada**
```
🚀 BANESCO SCRAPER OPTIMIZADO
=============================

🔐 PASO 1: Autenticación optimizada...
🚀 Session restaurada - ¡login instantáneo!
✅ Autenticación exitosa!

🏦 PASO 3: Extrayendo información de cuentas...
✅ Cuentas encontradas: 1
   1. 4471059167868 (corriente)

🧭 PASO 4: Navegando a transacciones...
✅ Navegación exitosa

💳 PASO 5: Extrayendo transacciones...
✅ Transacciones encontradas: 15

🎉 ¡SCRAPING COMPLETADO EXITOSAMENTE!
```

## 💻 **CLI**

El proyecto ahora incluye una CLI completa para manejar todas las operaciones. Ver [CLI.md](CLI.md) para documentación detallada.

### **Comandos Principales**

```bash
# Operaciones bancarias
banker bank accounts               # Ver cuentas
banker bank transactions           # Ver transacciones
banker bank transactions --days=7  # Últimos 7 días
banker bank setup-security         # Configurar seguridad

# Gestión del navegador
banker browser status              # Ver estado
banker browser close               # Cerrar navegador

# Gestión del daemon
banker daemon start                # Iniciar daemon
banker daemon start --headless     # Iniciar sin UI
banker daemon stop                 # Detener daemon

# Utilidades
banker utils clean                 # Limpiar archivos temporales
banker utils html-viewer           # Ver capturas HTML
```

## 🔧 **API**

### **Uso Básico**
```typescript
import { BanescScraper } from './src/index';

// Crear scraper
const scraper = new BanescScraper(false); // headless: false para debug

// Scraping completo (recomendado)
const result = await scraper.scrapeAllData();

// Solo cuentas
const accounts = await scraper.scrapeAccountsOnly();

// Solo transacciones
const transactions = await scraper.scrapeTransactionsOnly();
```

### **OptimizedLogin Directo**
```typescript
import { OptimizedLogin } from './src/banks/banesco/auth/optimized-login';

const login = new OptimizedLogin(credentials, false);

// Login con session persistence
const result = await login.login();

if (result.success) {
  const page = await login.getAuthenticatedPage();
  // Usar página autenticada...
}
```

### **Session Management**
```typescript
import { SessionManager } from './src/shared/utils/session-manager';

const sessionManager = SessionManager.getInstance();

// Listar sesiones activas
const sessions = await sessionManager.listSessions();

// Limpiar sesiones antiguas
await sessionManager.clearAllSessions();
```

## 🎯 **Características Técnicas**

### **Smart Cookie Management**
- **Headers Optimizados**: Simula navegador real para maximizar cookies
- **Session Persistence**: 24h de validez por defecto
- **Auto-Validation**: Verificación automática de sesiones
- **Graceful Fallback**: Login fresh si sesión inválida

### **Performance Metrics**
```
Métrica                 | Antes  | Después | Mejora
------------------------|--------|---------|--------
Tiempo de Login         | 38s    | 5-10s   | 75%+
Detección de Elementos  | 2-3s   | 30-60ms | 98%
Login con Session       | 38s    | 0.5-2s  | 95%+
Uso de Memoria          | Alto   | Opt.    | 50%
```

### **Strategic Logging System**
- **Context-Aware**: Se adapta según `NODE_ENV`
- **6 Niveles**: SILENT, ERROR, WARN, INFO, DEBUG, TRACE
- **Fitness Scoring**: Evaluación automática de performance (0-100%)
- **Production Ready**: Logs mínimos en producción

## 🏗️ **Arquitectura**

### **Estructura Consolidada**
```
src/
├── index.ts                             # Punto de entrada principal
├── banks/banesco/
│   ├── auth/
│   │   ├── optimized-login.ts          # Login consolidado optimizado
│   │   └── security-questions.ts       # Manejo de preguntas
│   ├── scrapers/
│   │   ├── accounts.ts                 # Scraping de cuentas
│   │   └── transactions.ts             # Scraping de transacciones
│   └── types/index.ts                  # Tipos específicos
├── shared/
│   ├── utils/
│   │   ├── smart-waiter.ts            # Esperas inteligentes
│   │   ├── strategic-logger.ts         # Sistema de logging
│   │   ├── session-manager.ts          # Gestión de sesiones
│   │   ├── browser-server.ts           # Browser persistente
│   │   └── html-saver.ts              # Debug HTML
│   └── types/index.ts                  # Tipos compartidos
└── scripts/
    ├── test-optimized-login.ts         # Test principal
    └── demo-strategic-logging.ts       # Demo de logging
```

### **Ventajas de la Consolidación**
- **Menos Complejidad**: Un solo login en lugar de 3
- **Mejor Mantenimiento**: Código consolidado y probado
- **Performance**: Solo utilidades esenciales
- **Claridad**: API simple y consistente

## 🔒 **Seguridad**

### **Gestión de Credenciales**
- **Variables de Entorno**: Credenciales nunca en código
- **Hash de Sesiones**: IDs no reversibles para archivos de sesión
- **Expiración Automática**: Sesiones expiran en 24h por defecto
- **Logging Seguro**: Credenciales nunca en logs

### **Session Security**
- **Almacenamiento Local**: Sessions solo en `.sessions/` local
- **Auto-Cleanup**: Limpieza automática de sesiones expiradas
- **Isolation**: Contextos aislados por ejecución

## 🧪 **Testing y Debug**

### **Tests Disponibles**
```bash
# Test completo del sistema
npm run test

# Test con debug completo
npm run test:debug

# Test modo producción (logs mínimos)
npm run test:production

# Demo del sistema de logging
npm run demo:logging
```

### **HTML Debug**
- **Captures Automáticos**: Cada paso se guarda en `html-captures/`
- **Viewer Incluido**: `npm run html-viewer` para revisar capturas
- **Error Analysis**: HTML guardado en caso de fallos

### **Cleanup Tools**
```bash
# Limpiar archivos temporales
npm run clean

# Consolidar proyecto (eliminar archivos obsoletos)
npm run consolidate

# Cleanup completo
npm run cleanup
```

## 🚀 **Próximas Características**

- [ ] **Banco de Venezuela (BOV)** - Usando misma arquitectura optimizada
- [ ] **Mercantil Bank** - Q2 2024
- [ ] **Provincial** - Q2 2024
- [ ] **API REST** - Q3 2024
- [ ] **Dashboard Web** - Q3 2024

## 🤝 **Contribución**

1. Fork el proyecto
2. Crear feature branch (`git checkout -b feature/mejora`)
3. Commit cambios (`git commit -am 'Add: nueva característica'`)
4. Push branch (`git push origin feature/mejora`)
5. Crear Pull Request

### **Áreas de Contribución**
- 🚀 Optimizaciones de performance adicionales
- 🏦 Soporte para nuevos bancos
- 🧠 Mejoras en detección inteligente
- 📊 Métricas y analytics avanzados

## 📄 **Licencia**

MIT License - ver [LICENSE](LICENSE) para detalles.

## ⚠️ **Disclaimer**

Este proyecto es para fines educativos y automatización personal. Asegúrate de cumplir con los términos de servicio de tu banco y leyes locales.

---

**🎯 Optimized Edition** - Sistema consolidado para máximo rendimiento y simplicidad 

## 🚀 Scripts Disponibles

### 🎯 **Transacciones (Recomendados)**
```bash
npm run transactions:direct    # ⭐ MÁS RECOMENDADO - Single browser, manejo inteligente
npm run transactions:working   # Versión completa y detallada  
npm run transactions:optimized # Máxima velocidad y rendimiento
npm run transactions:fixed     # Versión corregida iframe/portal
```

### ⚡ **Transacciones por Velocidad** 
```bash
npm run transactions:simple    # Ultra-rápido, evita preguntas seguridad
npm run transactions:fast      # Optimizado con sistema persistente
npm run transactions:turbo     # Timeouts agresivos 5s (riesgoso)
npm run transactions          # Script básico original
```

### 🛠️ **Configuración y Utilidades**
```bash
npm run setup:security        # Configurar preguntas de seguridad
npm run cleanup               # Limpiar archivos temporales  
npm run clean                 # Limpiar compilación
```

### 🌐 **Gestión de Browser**
```bash
npm run browser:status        # Ver estado navegadores
npm run browser:close         # Cerrar navegadores huérfanos
npm run daemon:start          # Daemon persistente (experimental)
npm run daemon:stop           # Detener daemon
```

### 🧪 **Testing**
```bash
npm run test                  # Test login optimizado
npm run test:debug            # Test con debug
npm run test:production       # Test modo producción
```

> 📖 **Ver guía completa**: `SCRIPTS_GUIDE.md` para detalles de cada script 

## 🧪 **Solución de Problemas**

Si experimentas problemas con la extracción de transacciones, prueba las siguientes soluciones:

### **Método Alternativo**
```bash
# Usar método alternativo para acceder a transacciones
banker bank fix-transactions

# Método alternativo con manejo automático de preguntas de seguridad
banker bank secure-transactions
```

### **Herramientas de Diagnóstico**
```bash
# Verificar conexión con el banco
banker diagnostic network

# Verificar certificado SSL
banker diagnostic ssl

# Verificar configuración del navegador
banker diagnostic browser
```

### **Limpieza del Sistema**
```bash
# Limpiar archivos temporales
banker utils clean

# Limpiar sistema completo (sesiones, navegadores, archivos)
banker utils cleanup
```

## ✨ **Nueva Funcionalidad: Extracción de Transacciones Banesco**

**Extrae automáticamente las transacciones más recientes de tu cuenta Banesco** con detección inteligente de sistema no disponible.

### 🚀 **Uso Rápido**

```bash
# 1. Configurar credenciales
cp env.example .env
# Editar .env con tus datos

# 2. Extraer transacciones
npm run extract
```

### 📊 **Resultado**
- ✅ **Autenticación automática** con manejo de preguntas de seguridad
- 🚫 **Detección de sistema no disponible** ("En estos momentos no podemos...")
- 📈 **Últimas transacciones** con fecha, descripción, monto y saldo
- 💾 **Archivo JSON** con todas las transacciones extraídas
- 🎯 **Información de cuenta** (saldo actual, número de cuenta)

### 🔧 **Uso Programático**

```typescript
import { extractBanescoTransactions } from './src/banesco/extract-transactions';

const result = await extractBanescoTransactions({
  headless: true,
  limit: 20 // Últimas 20 transacciones
});

if (result.success) {
  console.log(`Extraídas ${result.totalCount} transacciones`);
  console.log(`Saldo actual: ${result.accountInfo?.balance}`);
  result.transactions.forEach(tx => {
    console.log(`${tx.date}: ${tx.description} - ${tx.amount}`);
  });
}
```

## 🔒 **Configuración**

Crea un archivo `.env` con tus credenciales:

```env
BANESCO_USERNAME=tu_usuario
BANESCO_PASSWORD=tu_contraseña
SECURITY_QUESTIONS=palabra_clave1:respuesta1,palabra_clave2:respuesta2
```

### 🛡️ **Preguntas de Seguridad**

El sistema mapea automáticamente las preguntas de seguridad usando palabras clave:

```env
# Ejemplos de configuración
SECURITY_QUESTIONS=anime:Naruto,mascota:Firulais,novio:NombrePersona,conocio:CiudadNombre
```

## 🎯 **Características Principales**

### ✅ **Sistema de Disponibilidad Inteligente**
- **Detección automática** de mensajes "En estos momentos no podemos"
- **Manejo de iframe CAU** con múltiples selectores
- **Parada temprana** si el sistema no está disponible
- **Mensajes claros** de estado del sistema

### 🔐 **Autenticación Robusta**
- **Session persistence** para evitar logins repetidos
- **Mapeo dinámico** de preguntas de seguridad
- **Manejo de errores** detallado con códigos específicos
- **Timeouts inteligentes** sin bloqueos innecesarios

### 📊 **Extracción de Transacciones**
- **Análisis de tablas** automático para encontrar datos
- **Procesamiento de múltiples formatos** de fecha y monto
- **Extracción de metadatos** (saldos, números de cuenta)
- **Manejo de paginación** para obtener más transacciones
- **Validación de datos** y limpieza automática

### 🚀 **Rendimiento Optimizado**
- **Headless mode** para ejecución rápida en producción
- **Smart waits** sin timeouts innecesarios
- **Navegación inteligente** hacia páginas de movimientos
- **Limpieza automática** de recursos del navegador

## 📝 **Scripts Disponibles**

```bash
npm run extract        # Extraer transacciones de Banesco
npm run dev           # Ejecutar CLI principal
npm run build         # Compilar TypeScript
npm run clean         # Limpiar archivos temporales
```

## 🔍 **Solución de Problemas**

### Sistema No Disponible
```
🚫 Sistema Banesco no disponible
📝 Mensaje: En estos momentos no podemos procesar su solicitud
```
**Solución**: El sistema detectó que Banesco está en mantenimiento. Reintenta en 15-30 minutos.

### Error de Autenticación
```
❌ Error de autenticación
📝 Credenciales incorrectas o preguntas de seguridad faltantes
```
**Solución**: 
1. Verifica credenciales en `.env`
2. Agrega respuestas para todas las preguntas de seguridad
3. Verifica que las palabras clave coincidan con las preguntas

### No Se Encontraron Transacciones
```
✅ Extracción exitosa pero 0 transacciones
📝 No hay movimientos en el período seleccionado
```
**Solución**: Normal si no hay transacciones recientes. El sistema probó múltiples períodos automáticamente.

## 🏗️ **Arquitectura**

```
src/banesco/
├── auth/
│   ├── banesco-auth.ts          # Clase principal de autenticación
│   ├── security-handler.ts      # Manejo de preguntas de seguridad
│   └── types.ts                 # Tipos TypeScript
├── extract-transactions.ts      # 🆕 Extractor principal de transacciones
└── README.md                   # Documentación específica

src/banks/banesco/
├── scrapers/
│   ├── transactions.ts         # Scraper de transacciones
│   └── accounts.ts            # Navegación a cuentas
└── types/
    └── index.ts               # Tipos de datos bancarios
```

## 🤝 **Contribuir**

1. **Fork** el proyecto
2. **Crea** una rama: `git checkout -b feature/nueva-funcionalidad`
3. **Commit** cambios: `git commit -am 'Agregar nueva funcionalidad'`
4. **Push** a la rama: `git push origin feature/nueva-funcionalidad`
5. **Abre** un Pull Request

## 📄 **Licencia**

MIT © [Daniel Sanchez](https://github.com/danicanod)

---

## 🎯 **Próximas Funcionalidades**

- 🏦 **Soporte para más bancos** (Banco de Venezuela, Mercantil)
- 📱 **API REST** para integración con aplicaciones
- 📊 **Dashboard web** para visualización de datos
- 🔔 **Notificaciones** de nuevas transacciones
- 💾 **Base de datos** para historial de transacciones 