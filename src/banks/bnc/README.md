# 🏦 BNC Bank Scraper

Comprehensive Playwright-based scraper for BNC online banking in Venezuela with 3-step authentication support.

## 📁 Structure

```
src/banks/bnc/
├── auth/
│   └── bnc-auth.ts         # Main authentication class
├── scrapers/
│   ├── bnc-scraper.ts      # Main scraper class  
│   └── transactions.ts     # Transaction extraction
├── types/
│   └── index.ts           # TypeScript definitions
├── examples/
│   └── basic-usage.ts     # Usage examples
├── index.ts              # Main exports
└── README.md            # This file
```

## 🚀 Quick Start

### Installation

```bash
npm install playwright
npx playwright install chromium
```

### Basic Usage

```typescript
import { BncAuth } from './src/banks/bnc';

const auth = new BncAuth({
  id: 'your_cedula',
  card: 'your_card_number',
  password: 'your_password'
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

## 🔐 3-Step Authentication Process

BNC uses a unique 3-step authentication:

1. **Card Number**: Enter your BNC card number
2. **User ID**: Enter your cédula de identidad 
3. **Password**: Enter your online banking password

```typescript
const credentials: BncCredentials = {
  id: 'V12345678',           // Cédula de identidad
  card: '1234567890123456',  // BNC card number
  password: 'your_password'  // Online banking password
};
```

## 🏦 Multi-Account Support

BNC scraper supports multiple account types:

- **VES 1109**: Venezuelan Bolívar accounts
- **USD 0816**: US Dollar accounts (type 1)
- **USD 0801**: US Dollar accounts (type 2)

## ⚙️ Configuration Options

```typescript
interface BncAuthConfig {
  headless?: boolean;      // Default: false
  timeout?: number;        // Default: 30000ms
  retries?: number;        // Default: 3
  debug?: boolean;         // Default: false
  saveSession?: boolean;   // Default: true
}
```

### Debug Mode

Enable debug mode to pause at key points:

```typescript
const auth = new BncAuth(credentials, {
  headless: false,  // Show browser
  debug: true,      // Enable debug pauses
  timeout: 120000,  // Longer timeout for debugging
  retries: 1        // Single attempt for debugging
});
```

## 📝 Environment Variables

```bash
# .env file
BNC_ID=V12345678
BNC_CARD=1234567890123456
BNC_PASSWORD=your_password
```

## 🔧 API Reference

### BncAuth Class

#### Constructor
```typescript
new BncAuth(credentials: BncCredentials, config?: BncAuthConfig)
```

#### Methods
- `login()` - Authenticate with BNC
- `getPage()` - Get authenticated Playwright page
- `isLoggedIn()` - Check authentication status
- `getCurrentUrl()` - Get current page URL
- `getLogContent()` - Get debug logs
- `exportLogs(path)` - Export logs to file
- `close()` - Cleanup resources

### Types

```typescript
interface BncCredentials {
  id: string;        // Cédula de identidad
  card: string;      // BNC card number
  password: string;  // Online banking password
}

interface BncLoginResult {
  success: boolean;
  message: string;
  sessionValid: boolean;
  userInfo?: {
    id: string;
    cardNumber: string;
  };
  error?: string;
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
  if (result.message.includes('Card')) {
    console.log('💡 Verify your card number is correct');
  } else if (result.message.includes('ID')) {
    console.log('💡 Verify your user ID (cédula) is correct');
  } else if (result.message.includes('password')) {
    console.log('💡 Verify your password is correct');
  } else if (result.message.includes('Max retries')) {
    console.log('💡 BNC might be experiencing issues, try again later');
  }
}
```

## 🔗 Integration

This scraper is part of the unified banking framework:

```typescript
// Import from main package
import { BankScraper } from '../../../index';

// Or import directly
import { BncAuth } from './src/banks/bnc';
```

## 🏷️ Examples

See `examples/basic-usage.ts` for comprehensive usage examples:

- Basic 3-step authentication
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
auth.exportLogs('bnc-session.log');
```

Log files are automatically created as `debug-bnc-{timestamp}.log`.

## 🔄 Retry Logic

Built-in retry mechanism handles temporary failures:

```typescript
const auth = new BncAuth(credentials, {
  retries: 3,    // Retry up to 3 times
  timeout: 45000 // 45 seconds per attempt
});
```

## 🛡️ Security Notes

- Never commit credentials to version control
- Use environment variables for sensitive data
- Enable headless mode in production
- Monitor for BNC website changes
- Validate card numbers and IDs before use

## 📋 TODO

- [ ] Add balance checking functionality
- [ ] Implement account information extraction
- [ ] Create scheduled scraping
- [ ] Add notification system
- [ ] Support for additional account types

## 🤝 Contributing

When contributing to the BNC scraper:

1. Follow the existing code style
2. Add comprehensive logging
3. Test with real BNC accounts
4. Update documentation
5. Add error handling for edge cases

## 📞 Support

For issues specific to BNC:

1. Check log files for detailed errors
2. Verify credentials (card, ID, password)
3. Test with debug mode enabled
4. Check if BNC website structure changed
5. Ensure all 3 authentication steps work individually 