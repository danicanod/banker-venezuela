# Banesco Authentication Debug Examples

This guide shows different ways to use the Playwright debugger with the Banesco authentication module.

## 🚀 Quick Start - Running Debug Tests

### Method 1: Using the Dedicated Debug Script

```bash
# With your real credentials
BANESCO_USERNAME=your_user BANESCO_PASSWORD=your_pass tsx src/banesco/debug.ts

# With security questions
BANESCO_USERNAME=user BANESCO_PASSWORD=pass BANESCO_SECURITY_QUESTIONS="madre:maria,mascota:firulais" tsx src/banesco/debug.ts
```

### Method 2: Using the Test Script (Safe - No Real Credentials)

```bash
# Run the debug test with fake credentials to see debug flow
tsx test-debug.ts
```

### Method 3: Programmatic Debug Usage

```typescript
import { BanescoAuth } from './src/banesco';

const auth = new BanescoAuth({
  username: 'your_username',
  password: 'your_password',
  securityQuestions: 'madre:maria,mascota:firulais'
}, {
  headless: false,  // Must be false for debugging
  debug: true,      // Enable debug pauses
  timeout: 120000   // Extended timeout
});

await auth.login(); // Will pause at each debug point
```

## 🎯 Debug Pause Points

When debug mode is enabled, the authentication process will pause at these strategic points:

### 1. **Browser Initialization**
- **When**: After browser is launched and configured
- **What to inspect**: Browser settings, viewport, headers
- **Tip**: Verify browser is configured correctly

### 2. **Login Page Loaded**
- **When**: After navigating to Banesco login page
- **What to inspect**: Page content, network requests, cookies
- **Tip**: Check if page loaded correctly and no blocking elements

### 3. **Login Iframe Ready**
- **When**: After iframe is found and accessible
- **What to inspect**: Iframe content, form elements
- **Tip**: Verify iframe loaded and login form is present

### 4. **Username Entered**
- **When**: After username is filled in the form
- **What to inspect**: Username field value, form validation
- **Tip**: Check if username was entered correctly

### 5. **Modals Handled**
- **When**: After processing any connection/warning modals
- **What to inspect**: Modal states, any remaining popups
- **Tip**: Ensure no blocking modals remain

### 6. **Security Questions Detection**
- **When**: Before and after handling security questions
- **What to inspect**: Question text, answer matching, field filling
- **Tip**: Verify questions are detected and answered correctly

### 7. **Password Entered**
- **When**: After password is entered and form submitted
- **What to inspect**: Form submission, network activity
- **Tip**: Check if form was submitted correctly

### 8. **Login Verification**
- **When**: During login success/failure verification
- **What to inspect**: Page URL changes, success indicators
- **Tip**: Verify login result detection logic

### 9. **Error States**
- **When**: Whenever an error occurs
- **What to inspect**: Error conditions, page state, console logs
- **Tip**: Analyze what caused the error

## 🔍 What to Inspect at Each Pause

### Browser Developer Tools
- **Console**: Check for JavaScript errors or warnings
- **Network**: Monitor HTTP requests and responses
- **Elements**: Inspect DOM structure and form fields
- **Application**: Check cookies, localStorage, sessionStorage

### Playwright Inspector Features
- **Resume**: Continue to next pause point
- **Step Over**: Execute line by line
- **Console**: Run JavaScript commands in page context
- **Selector**: Generate selectors for elements

### Common Debugging Scenarios

#### Security Questions Not Working
```javascript
// Run in browser console while paused at security questions
console.log('Security questions found:');
['#lblPrimeraP', '#lblSegundaP', '#lblTerceraP', '#lblCuartaP'].forEach(sel => {
  const el = document.querySelector(sel);
  if (el) console.log(sel, ':', el.textContent);
});
```

#### Form Fields Not Filling
```javascript
// Check if fields are available and enabled
const username = document.querySelector('#txtUsuario');
const password = document.querySelector('#txtClave');
console.log('Username field:', username, 'visible:', username?.offsetParent !== null);
console.log('Password field:', password, 'visible:', password?.offsetParent !== null);
```

#### Login Success Detection
```javascript
// Check current URL and page indicators
console.log('Current URL:', window.location.href);
console.log('Page title:', document.title);
console.log('Menu elements:', document.querySelectorAll('[id*="menu"]').length);
```

## 🛠️ Advanced Debug Techniques

### Custom Pause Points
You can add custom pause points in your code:

```typescript
const auth = new BanescoAuth(credentials, { debug: true });
const result = await auth.login();

if (result.success) {
  const page = auth.getPage();
  if (page) {
    // Custom pause to inspect authenticated state
    await page.pause();
    
    // Take screenshot for analysis
    await page.screenshot({ path: 'auth-state.png' });
  }
}
```

### Environment-Based Debug Control
```bash
# Enable debug only when needed
DEBUG=true tsx your-script.ts

# Or in your code:
const debug = process.env.DEBUG === 'true';
const auth = new BanescoAuth(credentials, { debug });
```

### Conditional Debug Pauses
```typescript
// Only pause on specific conditions
if (this.config.debug && this.shouldPauseHere) {
  await this.page.pause();
}
```

## 📸 Auto-Generated Debug Assets

The debug system automatically captures:

- **Success Screenshots**: `debug-banesco-success-[timestamp].png`
- **Error Screenshots**: `debug-banesco-error-[timestamp].png`
- **Crash Screenshots**: `debug-banesco-crash-[timestamp].png`

## 🎮 Debug Controls Reference

| Action | Method | Description |
|--------|--------|-------------|
| **Continue** | Click "Resume" | Continue to next pause point |
| **Step Through** | Use step controls | Execute code line by line |
| **Inspect Element** | Right-click → Inspect | Open dev tools for element |
| **Run Console** | Open Console tab | Execute JavaScript commands |
| **Take Screenshot** | `await page.screenshot()` | Capture current state |
| **Get Page Info** | `console.log(location.href)` | Check current page details |

## 🚨 Troubleshooting Debug Issues

### Browser Not Opening
- Ensure `headless: false` is set
- Check if display is available (for headless environments)
- Verify Playwright is installed: `npx playwright install chromium`

### Debug Not Pausing
- Verify `debug: true` is set in config
- Check console output for debug messages
- Ensure page is available before pause calls

### Inspector Not Opening
- Check if Playwright Inspector is blocked by security settings
- Try running with `PWDEBUG=1` environment variable
- Ensure browser has access to open new windows

## 💡 Pro Tips

1. **Use Extended Timeouts**: Set longer timeouts during debugging
2. **Save Screenshots**: Capture important states for analysis
3. **Check Network Tab**: Monitor all HTTP requests/responses
4. **Inspect Cookies**: Verify session management
5. **Console Logging**: Add temporary logs for debugging
6. **Test with Fake Data**: Use test credentials to safely debug flow

## 🔄 Example Debug Session Flow

```bash
# 1. Start debug session
tsx src/banesco/debug.ts

# 2. Inspector opens at first pause
# → Inspect browser initialization

# 3. Click "Resume" to continue
# → Login page loads, inspect page content

# 4. Click "Resume" again
# → Iframe ready, inspect form elements

# 5. Continue through each step
# → Username entry, modals, security questions, password, verification

# 6. Final pause for authenticated state
# → Inspect successful login page
```

This debug system gives you complete visibility into the authentication process! 🎉 