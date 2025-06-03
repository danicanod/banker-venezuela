# �� Banker Venezuela - Enterprise Banking Scraper

<div align="center">

![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Playwright](https://img.shields.io/badge/Playwright-45ba4b?style=for-the-badge&logo=playwright&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)

[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](https://choosealicense.com/licenses/mit/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)
[![Architecture](https://img.shields.io/badge/Architecture-Abstract_Base_Classes-blue.svg)](#-arquitectura)
[![Performance](https://img.shields.io/badge/Performance-Optimized-brightgreen.svg)](#-características-principales)

**Sistema empresarial con arquitectura base abstracta para scraping bancario venezolano**

*Implementación robusta con clases base, template method pattern y APIs unificadas*

[Características](#-características-principales) • [Arquitectura](#-arquitectura) • [Instalación](#-instalación) • [Uso](#-uso-rápido) • [API](#-api) • [CLI](#-cli)

</div>

---

## 🚀 **Características Principales**

### 🏗️ **Arquitectura Base Abstracta**
- **BaseBankAuth**: Clase base para autenticación con template method pattern
- **BaseBankScraper**: Clase base para scraping con funcionalidad común extraída
- **APIs Unificadas**: Interfaz idéntica entre todos los bancos
- **Extensibilidad**: Template claro para agregar nuevos bancos

### ⚡ **Performance Optimizada**
- **Code Reduction**: 30% menos código total, 46% reducción en scrapers
- **Zero Duplication**: 100% eliminación de código duplicado
- **Smart Waits**: Esperas inteligentes basadas en elementos DOM
- **Retry Logic**: Lógica de reintentos unificada y configurable

### 🧠 **Funcionalidad Inteligente**
- **Logging Unificado**: Sistema de logging consistente con timestamps
- **Debug Features**: Playwright Inspector integration y pause points
- **Error Handling**: Manejo de errores estandarizado
- **Session Management**: Gestión de sesiones y cleanup automático

### 🔧 **Developer Experience**
- **TypeScript First**: Tipado completo con generics
- **Template Method**: Patrón de diseño para extensión limpia
- **Consistent APIs**: Métodos idénticos entre bancos
- **Comprehensive Docs**: Documentación completa y ejemplos

## 🎯 **Bancos Soportados**

### ✅ **BNC (Banco Nacional de Crédito)**
- **3-Step Authentication**: Card → ID → Password con retry logic
- **Multi-Account Support**: VES_1109, USD_0816, USD_0801
- **Transaction Filtering**: Filtrado por cuenta específica
- **Detail Expansion**: Expansión automática de detalles de transacciones

### ✅ **Banesco**
- **Security Questions**: Manejo inteligente de preguntas de seguridad
- **Iframe Navigation**: Navegación compleja en iframes
- **Flexible Table Analysis**: Análisis adaptativo de estructuras de tabla
- **Alternative Extraction**: Métodos de extracción alternativos

## 🏗️ **Arquitectura**

### **📊 Base Class Hierarchy**
```typescript
// Authentication Base
export abstract class BaseBankAuth<TCredentials, TConfig, TLoginResult> {
  // 424 lines of common functionality
  abstract performBankSpecificLogin(): Promise<boolean>
  abstract verifyLoginSuccess(): Promise<boolean>
}

// Scraping Base  
export abstract class BaseBankScraper<TTransaction, TConfig, TResult> {
  // 370 lines of common functionality
  abstract scrapeTransactions(): Promise<TResult>
  abstract parseTransactionData(rawData: any[]): TTransaction[]
}
```

### **🏦 Bank Implementations**
```typescript
// BNC Implementation
export class BncAuth extends BaseBankAuth<BncCredentials, BncAuthConfig, BncLoginResult>
export class BncTransactionsScraper extends BaseBankScraper<BncTransaction, BncScrapingConfig, BncScrapingResult>
export class BncScraper // Main scraper with unified API

// Banesco Implementation  
export class BanescoAuth extends BaseBankAuth<BanescoCredentials, BanescoAuthConfig, BanescoLoginResult>
export class BanescoTransactionsScraper extends BaseBankScraper<BanescTransaction, BanescoScrapingConfig, BanescoScrapingResult>
export class BanescoScraper // Main scraper with unified API
```

### **📁 Unified Structure**
```bash
src/banks/{banco}/
├── auth/{banco}-auth.ts           # Authentication implementation
├── scrapers/
│   ├── {banco}-scraper.ts         # Main scraper class
│   └── transactions.ts            # Transaction scraper
├── types/index.ts                 # Bank-specific types
├── examples/basic-usage.ts        # Usage examples
├── index.ts                       # Consistent exports
└── README.md                      # Bank documentation
```

## 🚀 **Instalación**

### **Prerrequisitos**
```bash
Node.js >= 18
npm >= 8
```

### **Instalación Rápida**
```bash
# Clonar repositorio
git clone https://github.com/danicanod/banker-venezuela.git
cd banker-venezuela
npm install

# Configurar credenciales
cp env.example .env
# Editar .env con tus credenciales
```

### **Configuración de Variables**
```env
# Credenciales BNC
BNC_ID=V12345678
BNC_CARD=1234567890123456
BNC_PASSWORD=tu_password

# Credenciales Banesco
BANESCO_USERNAME=tu_cedula_sin_puntos
BANESCO_PASSWORD=tu_clave_internet
SECURITY_QUESTIONS="anime:SNK,libro:Bible,color:azul"
```

## 📋 **Uso Rápido**

### **BNC Quick Start**
```typescript
import { BncScraper, quickScrape } from './src/banks/bnc';

// Quick scrape (recomendado para uso simple)
const transactions = await quickScrape({
  id: 'V12345678',
  card: '1234567890123456', 
  password: 'tu_password'
}, { debug: true });

// Full session control
const scraper = new BncScraper(credentials, { debug: true });
const session = await scraper.scrapeAll();
console.log(`Found ${session.transactionResults[0].data?.length} transactions`);
```

### **Banesco Quick Start**
```typescript
import { BanescoScraper, quickScrape } from './src/banks/banesco';

// Quick scrape
const transactions = await quickScrape({
  username: 'V12345678',
  password: 'tu_password',
  securityQuestions: 'anime:SNK,libro:Bible'
}, { debug: true });

// Full session control
const scraper = new BanescoScraper(credentials, { debug: true });
const session = await scraper.scrapeAll();
```

### **Unified API Usage**
```typescript
// Both banks have identical main scraper APIs:

// Authentication
await scraper.authenticate()
await scraper.isAuthenticated()

// Scraping  
await scraper.scrapeAll()          // Full session
await scraper.scrapeTransactions() // Transactions only

// Session Management
scraper.getPage()                  // Get authenticated page
scraper.exportSession(session)     // Export session data
await scraper.close()              // Cleanup
```

## 💻 **CLI**

Comprehensive CLI for all banking operations:

```bash
# Install CLI globally
npm run build
npm link

# Bank operations
banker bnc login
banker bnc transactions  
banker banesco login
banker banesco transactions

# Quick operations
banker quick-bnc
banker quick-banesco

# Development
banker --help
```

Ver [CLI.md](CLI.md) para documentación completa.

## 🔧 **API Reference**

### **Base Classes**
```typescript
// Authentication base class
import { BaseBankAuth } from './src/shared';

// Scraping base class  
import { BaseBankScraper } from './src/shared';

// Shared types
import type { 
  BaseBankAuthConfig,
  BaseBankLoginResult,
  BaseBankScrapingConfig,
  BaseBankScrapingResult 
} from './src/shared/types';
```

### **Bank-Specific APIs**
```typescript
// BNC
import { 
  BncScraper, 
  BncAuth, 
  BncTransactionsScraper,
  createBncScraper,
  quickScrape 
} from './src/banks/bnc';

// Banesco
import { 
  BanescoScraper,
  BanescoAuth, 
  BanescoTransactionsScraper,
  createBanescoScraper,
  quickScrape 
} from './src/banks/banesco';
```

### **Configuration Options**
```typescript
// Authentication config
interface BankAuthConfig extends BaseBankAuthConfig {
  headless?: boolean;     // Default: false
  timeout?: number;       // Default: 30000ms  
  debug?: boolean;        // Default: false
  saveSession?: boolean;  // Default: true
}

// Scraping config
interface BankScrapingConfig extends BaseBankScrapingConfig {
  debug?: boolean;              // Default: false
  timeout?: number;             // Default: 30000ms
  waitBetweenActions?: number;  // Default: 1000ms
  retries?: number;             // Default: 3
  saveHtml?: boolean;           // Default: false
}
```

## 📊 **Performance Metrics**

### **Code Reduction Achieved**
| Component | Before | After | Reduction |
|-----------|--------|-------|-----------|
| BNC Transactions | 421 lines | 313 lines | **26% reduction** |
| Banesco Transactions | 794 lines | 430 lines | **46% reduction** |
| Duplicate Code | ~300 lines | 0 lines | **100% elimination** |
| Total Codebase | - | - | **30% overall reduction** |

### **Architecture Benefits**
- ✅ **Maintainability**: Single source of truth for common functionality
- ✅ **Consistency**: Identical APIs across all banks
- ✅ **Extensibility**: Clear template for adding new banks
- ✅ **Testing**: Unified testing patterns
- ✅ **Debugging**: Consistent debug experience

## 📚 **Documentation**

- 📖 **[Base Class Summary](BASE_CLASS_SUMMARY.md)** - Arquitectura detallada
- 🔧 **[CLI Guide](CLI.md)** - Documentación completa de CLI
- 🏦 **[BNC README](src/banks/bnc/README.md)** - Documentación específica BNC
- 🏦 **[Banesco README](src/banks/banesco/README.md)** - Documentación específica Banesco
- 📈 **[Migration Guide](MIGRATION_SUMMARY.md)** - Guía de migración
- ⚡ **[Smart Waits](SMART_WAITS_EXAMPLE.md)** - Ejemplos de esperas inteligentes

## 🧪 **Development**

### **Adding a New Bank**
```typescript
// 1. Create bank types extending base types
interface NewBankCredentials extends BaseBankCredentials {
  // Bank-specific credentials
}

// 2. Implement authentication
class NewBankAuth extends BaseBankAuth<NewBankCredentials, NewBankAuthConfig, NewBankLoginResult> {
  protected async performBankSpecificLogin(): Promise<boolean> {
    // Bank-specific login logic
  }
}

// 3. Implement scraper  
class NewBankTransactionsScraper extends BaseBankScraper<NewBankTransaction, NewBankScrapingConfig, NewBankScrapingResult> {
  async scrapeTransactions(): Promise<NewBankScrapingResult> {
    // Bank-specific scraping logic
  }
}

// 4. Create main scraper
class NewBankScraper {
  // Unified API following the template
}
```

### **Testing**
```bash
# Run type checking
npm run type-check

# Test specific bank
npx ts-node src/banks/bnc/examples/basic-usage.ts
npx ts-node src/banks/banesco/examples/basic-usage.ts
```

## 🤝 **Contribución**

1. Fork del repositorio
2. Crear feature branch (`git checkout -b feature/nueva-funcionalidad`)
3. Seguir el patrón de base classes existente
4. Commit con mensajes descriptivos
5. Push a la branch (`git push origin feature/nueva-funcionalidad`)
6. Crear Pull Request

### **Coding Standards**
- ✅ TypeScript strict mode
- ✅ Extend base classes cuando sea aplicable
- ✅ Mantener APIs consistentes entre bancos
- ✅ Documentar métodos públicos
- ✅ Incluir ejemplos de uso

## 📄 **Licencia**

MIT License - ver [LICENSE](LICENSE) para detalles.

## 🔗 **Enlaces**

- 📊 **[Repositorio](https://github.com/danicanod/banker-venezuela)**
- 📋 **[Issues](https://github.com/danicanod/banker-venezuela/issues)**
- 📋 **[Pull Requests](https://github.com/danicanod/banker-venezuela/pulls)**

---

<div align="center">

**Hecho con ❤️ para la comunidad venezolana**

*Scraping bancario profesional con arquitectura empresarial*

</div> 