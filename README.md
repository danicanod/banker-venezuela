# 🏦 Multi-Bank Scraper

<div align="center">

![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Playwright](https://img.shields.io/badge/Playwright-45ba4b?style=for-the-badge&logo=playwright&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)

[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](https://choosealicense.com/licenses/mit/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)
[![Performance](https://img.shields.io/badge/Performance-60%25_Faster-brightgreen.svg)](#-características-técnicas)
[![Architecture](https://img.shields.io/badge/Architecture-Modular-orange.svg)](#-arquitectura-multi-banco)

**Sistema modular y escalable para scraping de datos bancarios venezolanos**

*Automatiza la extracción de cuentas y transacciones con arquitectura enterprise-ready*

[Características](#-características-técnicas) • [Instalación](#-instalación-y-configuración) • [Uso](#-uso) • [Roadmap](#-roadmap) • [Contribuir](#-contribución)

</div>

---

## 🚀 **Highlights**

- ⚡ **60% más rápido** que soluciones tradicionales
- 🏗️ **Arquitectura modular** lista para múltiples bancos
- 🔒 **Seguridad robusta** sin persistencia de credenciales
- 🎯 **Manejo inteligente** de modales y reconexiones
- 📊 **Debug completo** con HTML captures
- 🔄 **Browser persistente** para máximo rendimiento

## 🏗️ Arquitectura Multi-Banco

Este proyecto está diseñado para soportar múltiples bancos con una arquitectura escalable:

```
src/
├── shared/             # Utilidades y tipos compartidos
│   ├── types/          # Interfaces base para todos los bancos
│   └── utils/          # Browser manager, HTML saver, etc.
└── banks/              # Implementaciones específicas por banco
    └── banesco/        # Implementación de Banesco
        ├── auth/       # Sistema de autenticación
        ├── scrapers/   # Scrapers de datos específicos
        └── types/      # Tipos específicos de Banesco
```

## 🎯 Bancos Soportados

### ✅ Banesco
- **Estado**: Completamente funcional
- **Características**:
  - Autenticación completa (usuario → preguntas de seguridad → contraseña)
  - Detección y manejo de modales de conexión activa
  - Extracción de cuentas bancarias
  - Scraping de transacciones
  - Performance optimizada (60% más rápido)

### 🚧 Futuros Bancos
La arquitectura está preparada para agregar fácilmente:
- **Banco de Venezuela (BOV)**
- **Mercantil**
- **Provincial**
- **Otros bancos venezolanos**

## 🚀 Instalación y Configuración

### Prerrequisitos
```bash
Node.js >= 18
npm >= 8
```

### Instalación
```bash
# Clonar repositorio
git clone <repository-url>
cd banesco-scraper

# Instalar dependencias
npm install

# Configurar variables de entorno
cp env.example .env
```

### Configuración de Variables de Entorno
```bash
# .env
BANESCO_USERNAME=tu_cedula_sin_puntos
BANESCO_PASSWORD=tu_clave_internet

# Formato: "palabra_clave1:respuesta1,palabra_clave2:respuesta2"
SECURITY_QUESTIONS="anime:SNK,libro:Bible,color:azul"
```

## 📋 Uso

### Scripts Principales
```bash
# Compilar TypeScript
npm run build

# Ejecutar scraper completo de Banesco
npm run accounts

# Limpiar archivos compilados
npm run clean

# Recompilar completamente
npm run rebuild
```

### Scripts de Browser
```bash
# Ver estado del browser persistente
npm run browser:status

# Cerrar browser persistente
npm run browser:close
```

### Scripts de Desarrollo
```bash
# Modo desarrollo con recarga automática
npm run dev

# Visualizador de HTML capturado
npm run html-viewer
```

## 🔧 API de Programación

### Uso Básico
```typescript
import { BanescScraper } from './src/index';

const scraper = new BanescScraper(false); // headless: false para debug

// Scraping completo
const result = await scraper.scrapeAllData();

// Solo cuentas
const accounts = await scraper.scrapeAccountsOnly();

// Solo transacciones
const transactions = await scraper.scrapeTransactionsOnly();
```

### Extendiendo para Nuevos Bancos
```typescript
// 1. Crear estructura de directorios
src/banks/nuevo-banco/
├── auth/
├── scrapers/
└── types/

// 2. Implementar interfaces base
export class NuevoBancoScraper implements BankScraper {
  async login(): Promise<LoginResult> { /* ... */ }
  async scrapeAccounts(): Promise<ScrapingResult<BankAccount>> { /* ... */ }
  async scrapeTransactions(): Promise<ScrapingResult<BankTransaction>> { /* ... */ }
  async close(): Promise<void> { /* ... */ }
}
```

## 🎯 Características Técnicas

### Performance Optimizada
- **Browser Persistente**: Reutilización de instancias de navegador
- **Bloqueo Inteligente**: No carga recursos innecesarios (imágenes, fonts, analytics)
- **Smart Timeouts**: Esperas basadas en DOM en lugar de timeouts fijos
- **Resultado**: 60% más rápido (de ~38s a ~15s)

### Robustez
- **Manejo de Modales**: Detección automática de popups de "conexión activa"
- **Reintentos Inteligentes**: Lógica de retry para casos comunes
- **Gestión de Sesiones**: Prevención de logins duplicados
- **Debugging Completo**: Captura HTML en cada paso para análisis

### Escalabilidad
- **Tipos Compartidos**: Base común para todos los bancos
- **Utilidades Reutilizables**: Browser manager, HTML saver, etc.
- **Configuración por Banco**: Settings específicos por institución
- **Arquitectura Modular**: Fácil agregar nuevos bancos

## 🛠️ Desarrollo

### Estructura de Tipos
```typescript
// Tipos base compartidos
interface BankAccount {
  accountNumber: string;
  accountType: string;
  balance: number;
  currency: string;
  status: string;
}

interface BankTransaction {
  date: string;
  description: string;
  amount: number;
  type: 'debit' | 'credit';
  balance: number;
}
```

### Debug y Troubleshooting
- **HTML Captures**: Cada paso se guarda en `html-captures/`
- **Console Logs**: Detallados con emojis para fácil identificación
- **Performance Metrics**: Tiempos de ejecución reportados
- **Error Handling**: Manejo graceful de errores con contexto

### Herramientas de Desarrollo
```bash
# Viewer HTML para debug
npm run html-viewer

# Limpiar archivos temporales
npm run clean

# Browser status para desarrollo
npm run browser:status
```

## 📊 Resultados Esperados

### Banesco - Datos Extraídos
```typescript
{
  accounts: [
    {
      accountNumber: "4471059167868",
      accountType: "corriente",
      balance: 0,
      currency: "VES",
      status: "active"
    }
  ],
  transactions: [
    {
      date: "2024-01-15",
      description: "Transferencia recibida",
      amount: 1500.00,
      type: "credit",
      balance: 2500.00
    }
  ]
}
```

## 🔒 Seguridad

- **Variables de Entorno**: Credenciales nunca en código
- **Session Management**: Sesiones temporales sin persistencia de cookies
- **Browser Isolation**: Contextos aislados por ejecución
- **No Logging**: Credenciales nunca se registran en logs

## 📈 Roadmap

- [ ] **Banco de Venezuela (BOV)** - Q2 2024
- [ ] **Mercantil** - Q2 2024  
- [ ] **Provincial** - Q3 2024
- [ ] **API REST** - Q3 2024
- [ ] **Dashboard Web** - Q4 2024
- [ ] **Scheduled Jobs** - Q4 2024

## 🤝 Contribución

1. Fork el proyecto
2. Crear feature branch (`git checkout -b feature/nuevo-banco`)
3. Commit cambios (`git commit -am 'Add: soporte para BOV'`)
4. Push branch (`git push origin feature/nuevo-banco`)
5. Crear Pull Request

## 📄 Licencia

MIT License - ver `LICENSE` para detalles.

## ⚠️ Disclaimer

Este proyecto es solo para fines educativos y de automatización personal. Asegúrate de cumplir con los términos de servicio de tu banco. 