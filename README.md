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

[Características](#-características-principales) • [Instalación](#-instalación) • [Uso](#-uso-rápido) • [API](#-api) • [Contribuir](#-contribución)

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

### **Comandos Principales**
```bash
# Ejecutar scraper completo
npm run accounts

# Test del sistema optimizado
npm run test

# Test con máximo detalle para debug
npm run test:debug

# Test con logs mínimos (producción)
npm run test:production
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