# Banesco Authentication Module

A comprehensive Playwright-based authentication module for Banesco online banking in Venezuela.

## Features

- ✅ **Playwright Integration**: Full browser automation using Playwright
- 🛡️ **Security Questions Handling**: Automatic handling of Banesco security questions
- 🔐 **Session Management**: Smart session handling and persistence
- 🌐 **Cross-platform**: Works on Linux, macOS, and Windows
- 📱 **Responsive**: Handles various screen sizes and browser configurations
- 🚀 **Production Ready**: Robust error handling and logging

## Installation

This module is part of the main banker-venezuela package and uses Playwright:

```bash
npm install playwright
npx playwright install chromium
```

## Quick Start

### Basic Authentication

```typescript
import { BanescoAuth } from './src/banesco';

const auth = new BanescoAuth({
  username: 'your_username',
  password: 'your_password',
  securityQuestions: 'madre:maria,colegio:central,mascota:firulais'
});

const result = await auth.login();

if (result.success) {
  console.log('✅ Authentication successful!');
  
  // Get the authenticated page for further operations
  const page = auth.getPage();
  
  // Perform banking operations...
  
} else {
  console.error('❌ Authentication failed:', result.message);
}

// Always cleanup resources
await auth.close();
```

### Advanced Configuration

```typescript
import { BanescoAuth, BanescoAuthConfig } from './src/banesco';

const config: BanescoAuthConfig = {
  headless: false,        // Set to true for production
  timeout: 45000,         // 45 seconds timeout
  saveSession: true       // Enable session persistence
};

const auth = new BanescoAuth({
  username: process.env.BANESCO_USERNAME!,
  password: process.env.BANESCO_PASSWORD!,
  securityQuestions: process.env.BANESCO_SECURITY_QUESTIONS
}, config);

try {
  const result = await auth.login();
  
  if (result.success) {
    console.log('🎉 Logged in successfully!');
    
    // Check if user is authenticated
    console.log('Authenticated:', auth.isLoggedIn());
    
    // Get current URL
    const url = await auth.getCurrentUrl();
    console.log('Current URL:', url);
    
    // Your banking operations here...
    
  } else {
    console.error('Login failed:', result.error);
  }
  
} catch (error) {
  console.error('Unexpected error:', error);
} finally {
  await auth.close();
}
```

## Security Questions Configuration

Security questions are configured as a comma-separated string of keyword:answer pairs:

```typescript
const securityQuestions = [
  'madre:maria',           // Keyword: "madre", Answer: "maria"
  'colegio:san jose',      // Keyword: "colegio", Answer: "san jose"
  'mascota:firulais',      // Keyword: "mascota", Answer: "firulais"
  'color:azul',            // Keyword: "color", Answer: "azul"
  'ciudad:caracas'         // Keyword: "ciudad", Answer: "caracas"
].join(',');

const auth = new BanescoAuth({
  username: 'your_username',
  password: 'your_password',
  securityQuestions
});
```

### Common Security Question Keywords

The system automatically normalizes text (removes accents, converts to lowercase), so these keywords will match various question formats:

- **madre** - matches "¿Cuál es el nombre de tu madre?", "Nombre de su madre", etc.
- **padre** - matches "¿Cuál es el nombre de tu padre?", "Primer nombre de su padre", etc.
- **colegio** - matches "¿En qué colegio estudiaste?", "Nombre de su colegio", etc.
- **mascota** - matches "¿Cuál es el nombre de tu mascota?", "Primera mascota", etc.
- **color** - matches "¿Cuál es tu color favorito?", "Color preferido", etc.
- **ciudad** - matches "¿En qué ciudad naciste?", "Ciudad de nacimiento", etc.
- **libro** - matches "¿Cuál es tu libro favorito?", "Libro preferido", etc.
- **pelicula** - matches "¿Cuál es tu película favorita?", "Película preferida", etc.

## Error Handling

The authentication module provides detailed error information:

```typescript
const result = await auth.login();

if (!result.success) {
  console.log('Login failed:', result.message);
  
  if (result.error) {
    console.log('Error details:', result.error);
  }
  
  // Handle different error scenarios
  if (result.message.includes('security questions')) {
    console.log('💡 Tip: Check your security questions configuration');
  } else if (result.message.includes('timeout')) {
    console.log('💡 Tip: Try increasing the timeout value');
  } else if (result.message.includes('iframe')) {
    console.log('💡 Tip: Banesco might be experiencing issues');
  }
}
```

## Environment Variables

For production use, store credentials as environment variables:

```bash
# .env file
BANESCO_USERNAME=your_username
BANESCO_PASSWORD=your_password
BANESCO_SECURITY_QUESTIONS="madre:maria,colegio:central,mascota:firulais"
```

```typescript
import dotenv from 'dotenv';
dotenv.config();

const auth = new BanescoAuth({
  username: process.env.BANESCO_USERNAME!,
  password: process.env.BANESCO_PASSWORD!,
  securityQuestions: process.env.BANESCO_SECURITY_QUESTIONS
});
```

## Production Deployment

For production environments:

```typescript
const auth = new BanescoAuth(credentials, {
  headless: true,          // Always use headless in production
  timeout: 60000,          // Increase timeout for slower connections
  saveSession: true        // Enable session persistence
});

// Add proper error handling and logging
const result = await auth.login();

if (result.success) {
  // Log successful authentication
  console.log(`User ${credentials.username.substring(0, 3)}*** authenticated successfully`);
} else {
  // Log authentication failure (without sensitive data)
  console.error(`Authentication failed for user ${credentials.username.substring(0, 3)}***:`, result.message);
}
```

## Debugging

For debugging purposes, you can run with headless mode disabled:

```typescript
const auth = new BanescoAuth(credentials, {
  headless: false,  // See what's happening in the browser
  timeout: 120000   // Increase timeout for manual inspection
});
```

### Playwright Debugger Integration

The module includes built-in support for Playwright's debugger with strategic pause points:

```typescript
const auth = new BanescoAuth(credentials, {
  headless: false,    // Must be false for debugging
  timeout: 120000,    // Longer timeout for debugging
  debug: true         // Enable debug pauses
});

const result = await auth.login();
```

#### Debug Mode Features

When `debug: true` is enabled:

- ✅ **Strategic Pauses**: The browser will pause at key points in the authentication process
- 🔍 **Playwright Inspector**: Use the built-in inspector to examine page state
- 📸 **Auto Screenshots**: Error states are automatically captured
- 🕒 **Extended Timeouts**: Longer timeouts to accommodate debugging

#### Debug Pause Points

The authentication process will pause at these strategic points:

1. **Browser Initialization** - After browser setup, before navigation
2. **Login Page Loaded** - After navigating to Banesco login page
3. **Iframe Ready** - When the login iframe is accessible
4. **Username Entered** - After entering username, before form submission
5. **Username Submitted** - After submitting username form, checking for security questions
6. **Security Questions** - Before and after handling security questions (if present)
7. **Security Questions Submitted** - After submitting security questions (if present)
8. **Password Entry** - Before entering password on final login page
9. **Login Complete** - After successful authentication
10. **Error States** - On any errors for inspection

#### Using the Debugger

1. **Enable Debug Mode**:
   ```bash
   export DEBUG=true
   export HEADED=true  # Optional: see browser window
   ```

2. **Run with Environment Variables**:
   ```bash
   DEBUG=true HEADED=true npm run dev
   ```

3. **Or Programmatically**:
   ```typescript
   import { authenticateWithDebug } from './src/banesco/example';
   
   // This function has debug mode pre-configured
   await authenticateWithDebug();
   ```

4. **Debug Controls**:
   - **Continue**: Click "Resume" in Playwright Inspector
   - **Step Through**: Use the step controls in the inspector
   - **Inspect Elements**: Use browser dev tools while paused
   - **Console Commands**: Run JavaScript in the console while paused

#### Debug Tips

- **Network Tab**: Monitor network requests during authentication
- **Element Inspection**: Examine form fields and iframe content
- **Console Logging**: Check for JavaScript errors or warnings
- **Security Questions**: Verify question text matching and answers
- **Session State**: Inspect cookies and local storage
- **Error Analysis**: Screenshot and logs are saved automatically

#### Example Debug Session

```typescript
import { BanescoAuth } from './src/banesco';

const auth = new BanescoAuth({
  username: process.env.BANESCO_USERNAME!,
  password: process.env.BANESCO_PASSWORD!,
  securityQuestions: process.env.BANESCO_SECURITY_QUESTIONS
}, {
  headless: false,
  debug: true,
  timeout: 180000  // 3 minutes for thorough debugging
});

// The browser will pause at each step for inspection
const result = await auth.login();

if (result.success) {
  const page = auth.getPage();
  
  // You can continue debugging the authenticated state
  if (page) {
    await page.pause(); // Manual pause for further inspection
  }
}

await auth.close();
```

## API Reference

### `BanescoAuth`

Main authentication class.

#### Constructor

```typescript
constructor(credentials: BanescoCredentials, config?: BanescoAuthConfig)
```

#### Methods

- `login(): Promise<BanescoLoginResult>` - Perform authentication
- `getPage(): Page | null` - Get authenticated Playwright page
- `isLoggedIn(): boolean` - Check if currently authenticated
- `getCurrentUrl(): Promise<string | null>` - Get current page URL
- `close(): Promise<void>` - Close browser and cleanup resources

### Types

```typescript
interface BanescoCredentials {
  username: string;
  password: string;
  securityQuestions?: string;
}

interface BanescoLoginResult {
  success: boolean;
  message: string;
  sessionValid: boolean;
  error?: string;
}

interface BanescoAuthConfig {
  headless?: boolean;     // Default: false
  timeout?: number;       // Default: 30000ms
  saveSession?: boolean;  // Default: true
  debug?: boolean;        // Default: false - Enable Playwright debugger pauses
}
```

## Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/my-new-feature`
3. Commit your changes: `git commit -am 'Add some feature'`
4. Push to the branch: `git push origin feature/my-new-feature`
5. Submit a pull request

## License

MIT License - see the LICENSE file for details.

## Support

If you encounter issues:

1. Check your security questions configuration
2. Verify your Banesco credentials
3. Ensure Playwright is properly installed: `npx playwright install chromium`
4. Check Banesco's website availability
5. Open an issue with detailed error information (without sensitive data)

## 🚫 System Availability Detection

The authentication module automatically detects when Banesco's system is unavailable or under maintenance.

### CAU Iframe Detection

Banesco shows system messages in a special iframe with `title="CAU"`. Common messages include:
- "En estos momentos no podemos"
- "Sistema no disponible"
- "Servicio temporalmente suspendido"
- "Mantenimiento programado"

### Automatic Handling

When system unavailable is detected:

```typescript
const result = await auth.login();

if (result.error === 'SYSTEM_UNAVAILABLE') {
  console.log('Banesco system is currently unavailable');
  console.log('Message:', result.message);
  console.log('System message:', result.systemMessage);
  
  // Handle gracefully - maybe retry later
  setTimeout(() => {
    // Retry authentication
  }, 30 * 60 * 1000); // Wait 30 minutes
}
```

### Testing System Availability

Use the dedicated test script:

```bash
npx tsx src/banesco/test-system-availability.ts
```

This script specifically tests:
- CAU iframe detection
- System message parsing
- Proper error classification
- Debug logging for inspection

### Return Values

When system is unavailable:
```typescript
{
  success: false,
  message: "Sistema Banesco no disponible: [system message]",
  sessionValid: false,
  error: "SYSTEM_UNAVAILABLE",
  systemMessage: "[full system message content]"
}
```

When system is available:
- Normal login process continues
- No special handling needed

### Example Playwright Code

If you see this in Playwright recordings:
```javascript
await page.locator('iframe[title="CAU"]').contentFrame().getByText('En estos momentos no podemos').click();
```

The module now automatically detects and handles this scenario without manual intervention.

---

**⚠️ Security Notice**: Never commit credentials to version control. Always use environment variables or secure credential management systems in production. 