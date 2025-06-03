# 🏦 BNC Bank Scraper v2.0

Enterprise-grade Playwright-based scraper for BNC online banking with abstract base class architecture and 3-step authentication.

## 🏗️ Architecture

Built on the new abstract base class system for maximum code reuse and consistency:

```typescript
// Extends base authentication class
export class BncAuth extends BaseBankAuth<BncCredentials, BncAuthConfig, BncLoginResult>

// Extends base scraper class  
export class BncTransactionsScraper extends BaseBankScraper<BncTransaction, BncScrapingConfig, BncScrapingResult>

// Unified main scraper API
export class BncScraper
```

## 📁 Structure

```
src/banks/bnc/
├── auth/
│   └── bnc-auth.ts         # Authentication implementation (388 lines)
├── scrapers/
│   ├── bnc-scraper.ts      # Main scraper with unified API
│   └── transactions.ts     # Transaction scraper (313 lines)
├── types/
│   └── index.ts           # Bank-specific types extending base types
├── examples/
│   └── basic-usage.ts     # Usage examples with new APIs
├── index.ts              # Consistent exports
└── README.md            # This documentation
```

## 🚀 Quick Start

### Simple Usage with Factory Function

```typescript
import { quickScrape } from './src/banks/bnc';

// One-liner for quick transactions
const transactions = await quickScrape({
  id: 'V12345678',
  card: '1234567890123456',
  password: 'your_password'
}, { debug: true });

console.log(`Found ${transactions.length} transactions`);
```

### Full Session Control

```typescript
import { BncScraper, createBncScraper } from './src/banks/bnc';

// Factory method
const scraper = createBncScraper({
  id: 'V12345678',
  card: '1234567890123456', 
  password: 'your_password'
}, { debug: true });

// Full scraping session
const session = await scraper.scrapeAll();
console.log(`Authentication: ${session.authResult.success}`);
console.log(`Transactions: ${session.transactionResults[0].data?.length}`);

// Individual operations
await scraper.authenticate();
const transactions = await scraper.scrapeTransactions(); 
```

### Direct Class Usage

```typescript
import { BncAuth, BncTransactionsScraper } from './src/banks/bnc';

// Authentication only
const auth = new BncAuth({
  id: 'V12345678',
  card: '1234567890123456',
  password: 'your_password'
}, { debug: true });

const result = await auth.login();
if (result.success) {
  console.log('✅ Authentication successful!');
  
  // Use authenticated page for scraping
  const scraper = new BncTransactionsScraper(auth.getPage()!, { debug: true });
  const transactions = await scraper.scrapeTransactions();
}

await auth.close();
```

## 🔐 3-Step Authentication Process

BNC uses a unique 3-step authentication that our base class handles elegantly:

1. **Card Number**: Enter your BNC card number  
2. **User ID**: Enter your cédula de identidad
3. **Password**: Enter your online banking password

```typescript
interface BncCredentials extends BaseBankCredentials {
  id: string;        // Cédula de identidad (V12345678)
  card: string;      // BNC card number (16 digits)
  password: string;  // Online banking password
}
```

## 🏦 Multi-Account Support

BNC scraper automatically detects and processes all account types:

- **VES_1109**: Venezuelan Bolívar savings accounts
- **USD_0816**: US Dollar accounts (standard type)
- **USD_0801**: US Dollar accounts (alternative type)

Each account type is handled with specific filtering and processing logic.

## ⚙️ Configuration Options

### Authentication Configuration
```typescript
interface BncAuthConfig extends BaseBankAuthConfig {
  headless?: boolean;      // Default: false
  timeout?: number;        // Default: 30000ms
  debug?: boolean;         // Default: false
  saveSession?: boolean;   // Default: true
  retries?: number;        // Default: 3
}
```

### Scraping Configuration
```typescript
interface BncScrapingConfig extends BaseBankScrapingConfig {
  debug?: boolean;              // Default: false
  timeout?: number;             // Default: 30000ms
  waitBetweenActions?: number;  // Default: 1000ms
  retries?: number;             // Default: 3
  saveHtml?: boolean;           // Default: false
  accountTypes?: string[];      // Filter specific account types
}
```

### Debug Mode

Enable comprehensive debugging with unified logging:

```typescript
const scraper = new BncScraper(credentials, {
  headless: false,   // Show browser window
  debug: true,       // Enable debug logging + pauses
  timeout: 120000,   // Extended timeout for manual inspection
  saveHtml: true     // Save HTML captures for analysis
});
```

## 📝 Environment Variables

```bash
# .env file
BNC_ID=V12345678
BNC_CARD=1234567890123456
BNC_PASSWORD=your_password

# Optional debugging
DEBUG=true
HEADLESS=false
```

## 🔧 Unified API Reference

All BNC classes follow the same API pattern as other banks in the system:

### Main Scraper API

```typescript
class BncScraper {
  // Authentication
  async authenticate(): Promise<BncLoginResult>
  async isAuthenticated(): Promise<boolean>
  
  // Scraping operations
  async scrapeAll(): Promise<BncScrapingSession>
  async scrapeTransactions(): Promise<BncScrapingResult>
  
  // Session management
  getPage(): Page | undefined
  async exportSession(session: BncScrapingSession): Promise<void>
  async close(): Promise<void>
}
```

### Factory Functions

```typescript
// Quick scrape function
async function quickScrape(
  credentials: BncCredentials, 
  config?: BncScrapingConfig
): Promise<BncTransaction[]>

// Scraper factory
function createBncScraper(
  credentials: BncCredentials,
  config?: BncAuthConfig
): BncScraper
```

### Base Class Methods (Inherited)

From `BaseBankAuth`:
```typescript
// Template method pattern
async login(): Promise<BncLoginResult>
protected async performBankSpecificLogin(): Promise<boolean>
protected async verifyLoginSuccess(): Promise<boolean>

// Common utilities
protected async waitForElement(selector: string): Promise<ElementHandle>
protected async waitForNavigation(): Promise<void>
protected log(message: string, level?: LogLevel): void
```

From `BaseBankScraper`:
```typescript
// Template method pattern  
abstract async scrapeTransactions(): Promise<BncScrapingResult>
abstract parseTransactionData(rawData: any[]): BncTransaction[]

// Common utilities
protected async waitForTableLoad(): Promise<void>
protected async extractTableData(): Promise<any[]>
protected parseAmount(amountStr: string): number
protected parseDate(dateStr: string): Date | null
```

## 📊 Performance & Code Reduction

### Architecture Benefits
- **26% code reduction** in transaction scraper (421 → 313 lines)
- **100% elimination** of duplicate authentication code
- **Unified error handling** and logging
- **Consistent API** with other banks
- **Template method pattern** for clean extension

### Smart Features
- **Intelligent element waiting** with DOM event detection
- **Automatic retry logic** with exponential backoff
- **Session management** with cleanup
- **Debug HTML captures** for troubleshooting
- **Transaction detail expansion** for complete data

## 📊 Error Handling

Enhanced error handling with base class standardization:

```typescript
const result = await scraper.authenticate();

if (!result.success) {
  console.log('Authentication failed:', result.message);
  
  // Standardized error codes from base class
  switch (result.error) {
    case 'INVALID_CARD':
      console.log('💡 Verify your card number (16 digits)');
      break;
    case 'INVALID_ID':
      console.log('💡 Verify your cédula format (V12345678)');
      break;
    case 'INVALID_PASSWORD':
      console.log('💡 Verify your online banking password');
      break;
    case 'MAX_RETRIES_EXCEEDED':
      console.log('💡 BNC might be experiencing issues');
      break;
    case 'NAVIGATION_FAILED':
      console.log('💡 Check internet connection');
      break;
  }
}
```

## 🧪 Testing & Development

### Running Examples

```bash
# Basic usage example
npx ts-node src/banks/bnc/examples/basic-usage.ts

# Debug mode
DEBUG=true npx ts-node src/banks/bnc/examples/basic-usage.ts

# Test authentication only
npx ts-node -e "
import { BncAuth } from './src/banks/bnc';
const auth = new BncAuth(process.env, { debug: true });
auth.login().then(r => console.log(r));
"
```

### Development Guidelines

When extending or modifying BNC functionality:

1. **Follow base class patterns** - Extend `BaseBankAuth`/`BaseBankScraper`
2. **Maintain unified APIs** - Keep methods consistent with Banesco
3. **Use template methods** - Override abstract methods, call super for common logic
4. **Add comprehensive logging** - Use inherited logging methods
5. **Test with debug mode** - Always test with `debug: true` first

## 🔗 Integration with Base System

This scraper seamlessly integrates with the unified banking framework:

```typescript
// Import from main package
import { BncScraper, BanescoScraper } from './src';

// Both scrapers have identical APIs
const bncScraper = new BncScraper(bncCredentials);
const banescoScraper = new BanescoScraper(banescoCredentials);

// Identical method calls
await bncScraper.authenticate();
await banescoScraper.authenticate();

// Identical scraping calls  
const bncTransactions = await bncScraper.scrapeTransactions();
const banescoTransactions = await banescoScraper.scrapeTransactions();
```

## 🏷️ Migration from v1.x

If upgrading from the old BNC implementation:

```typescript
// Old way (v1.x)
import { BncAuth } from './old-bnc-auth';
const auth = new BncAuth(credentials);
const result = await auth.performLogin();

// New way (v2.0) - Unified API
import { BncScraper } from './src/banks/bnc';
const scraper = new BncScraper(credentials);
const result = await scraper.authenticate();

// Or use quick scrape
import { quickScrape } from './src/banks/bnc';
const transactions = await quickScrape(credentials);
```

## 📚 Documentation

- 📖 **[Base Class Architecture](../../../BASE_CLASS_SUMMARY.md)** - Complete architecture overview
- 🏦 **[Banesco README](../banesco/README.md)** - Sister implementation
- 🔧 **[CLI Guide](../../../CLI.md)** - Command line interface
- ⚡ **[Smart Waits](../../../SMART_WAITS_EXAMPLE.md)** - Performance examples

---

**Part of the Banker Venezuela enterprise banking system with abstract base class architecture.** 