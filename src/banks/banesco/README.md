# 🏦 Banesco Bank Scraper

Comprehensive Playwright-based scraper for Banesco online banking in Venezuela.

## 📁 Structure

```
src/banks/banesco/
├── auth/
│   ├── banesco-auth.ts      # Main authentication class
│   ├── security-questions.ts # Security questions handler
│   └── optimized-login.ts   # Optimized login flow
├── scrapers/
│   └── transactions.ts      # Transaction extraction
├── types/
│   └── index.ts            # TypeScript definitions
├── examples/
│   └── basic-usage.ts      # Usage examples
├── index.ts               # Main exports
└── README.md             # This file
```

## 🚀 Quick Start

### Installation

```bash
npm install playwright
npx playwright install chromium
```

### Basic Usage

```typescript
import { BanescoAuth } from './src/banks/banesco';

const auth = new BanescoAuth({
  username: 'your_username',
  password: 'your_password',
  securityQuestions: 'madre:maria,colegio:central,mascota:firulais'
});

const result = await auth.login();

if (result.success) {
  console.log('✅ Authentication successful!');
  const page = auth.getPage();
  // Perform banking operations...
} else {
  console.error('❌ Authentication failed:', result.message);
}

await auth.close();
```

## 🔐 Security Questions Configuration

Security questions are configured as keyword:answer pairs:

```typescript
const securityQuestions = [
  'madre:maria',           // Keyword: "madre", Answer: "maria"
  'colegio:san jose',      // Keyword: "colegio", Answer: "san jose"
  'mascota:firulais',      // Keyword: "mascota", Answer: "firulais"
  'color:azul',            // Keyword: "color", Answer: "azul"
  'ciudad:caracas'         // Keyword: "ciudad", Answer: "caracas"
].join(',');
```

### Common Keywords

- **madre** - matches "¿Cuál es el nombre de tu madre?"
- **padre** - matches "¿Cuál es el nombre de tu padre?"
- **colegio** - matches "¿En qué colegio estudiaste?"
- **mascota** - matches "¿Cuál es el nombre de tu mascota?"
- **color** - matches "¿Cuál es tu color favorito?"
- **ciudad** - matches "¿En qué ciudad naciste?"

## ⚙️ Configuration Options

```typescript
interface BanescoAuthConfig {
  headless?: boolean;      // Default: false
  timeout?: number;        // Default: 30000ms
  saveSession?: boolean;   // Default: true
  debug?: boolean;        // Default: false
}
```

### Debug Mode

Enable debug mode to pause at key points:

```typescript
const auth = new BanescoAuth(credentials, {
  headless: false,  // Show browser
  debug: true,      // Enable debug pauses
  timeout: 120000   // Longer timeout for debugging
});
```

## 📝 Environment Variables

```bash
# .env file
BANESCO_USERNAME=your_username
BANESCO_PASSWORD=your_password
BANESCO_SECURITY_QUESTIONS="madre:maria,colegio:central,mascota:firulais"
```

## 🔧 API Reference

### BanescoAuth Class

#### Constructor
```typescript
new BanescoAuth(credentials: BanescoCredentials, config?: BanescoAuthConfig)
```

#### Methods
- `login()` - Authenticate with Banesco
- `getPage()` - Get authenticated Playwright page
- `isLoggedIn()` - Check authentication status
- `getCurrentUrl()` - Get current page URL
- `getLogContent()` - Get debug logs
- `exportLogs(path)` - Export logs to file
- `close()` - Cleanup resources

### Types

```typescript
interface BanescoCredentials {
  username: string;
  password: string;
  securityQuestions: string;
}

interface BanescoLoginResult {
  success: boolean;
  message: string;
  sessionValid: boolean;
  error?: string;
  systemMessage?: string;
}
```

## 📊 Error Handling

The scraper provides detailed error information:

```typescript
const result = await auth.login();

if (!result.success) {
  console.log('Login failed:', result.message);
  
  if (result.error) {
    console.log('Error details:', result.error);
  }
  
  // Handle different scenarios
  if (result.message.includes('security questions')) {
    console.log('💡 Check your security questions configuration');
  } else if (result.message.includes('timeout')) {
    console.log('💡 Try increasing the timeout value');
  } else if (result.message.includes('System')) {
    console.log('💡 Banesco system might be temporarily unavailable');
  }
}
```

## 🔗 Integration

This scraper is part of the unified banking framework:

```typescript
// Import from main package
import { BankScraper } from '../../../index';

// Or import directly
import { BanescoAuth } from './src/banks/banesco';
```

## 🏷️ Examples

See `examples/basic-usage.ts` for comprehensive usage examples:

- Basic authentication
- Debug mode
- Retry logic
- Error handling
- Production configuration

## 📄 Logging

All operations are logged with timestamps:

```typescript
// Get log content
const logs = auth.getLogContent();

// Export logs to file
auth.exportLogs('banesco-session.log');
```

Log files are automatically created as `debug-banesco-{timestamp}.log`.

## 🛡️ Security Notes

- Never commit credentials to version control
- Use environment variables for sensitive data
- Enable headless mode in production
- Regularly update security questions
- Monitor for Banesco website changes

## 📋 TODO

- [ ] Add transaction scraping
- [ ] Implement balance checking
- [ ] Add account information extraction
- [ ] Create scheduled scraping
- [ ] Add notification system

## 🤝 Contributing

When contributing to the Banesco scraper:

1. Follow the existing code style
2. Add comprehensive logging
3. Test with real Banesco accounts
4. Update documentation
5. Add error handling for edge cases

## 📞 Support

For issues specific to Banesco:

1. Check log files for detailed errors
2. Verify credentials and security questions
3. Test with debug mode enabled
4. Check if Banesco website structure changed 