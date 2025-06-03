# Banesco Authentication Navigation Flow

This document explains the improved authentication flow that properly handles navigation between different stages of the Banesco login process.

## 🔄 Authentication Flow Overview

The Banesco authentication process involves multiple page navigations and form submissions:

```
1. Load Login Page
   ↓
2. Enter Username 
   ↓
3. Submit Username Form → Navigation
   ↓
4. Security Questions Page (if required)
   ↓
5. Submit Security Questions → Navigation
   ↓
6. Password Entry Page
   ↓
7. Submit Password → Final Login
```

## 📋 Detailed Step-by-Step Process

### Step 1: Initial Page Load
- Navigate to Banesco login page
- Wait for login iframe to be ready
- **Debug Pause**: "Login iframe ready - about to start login process"

### Step 2: Username Entry
- Find and fill username field (`#txtUsuario`)
- Trigger blur event for validation
- **Debug Pause**: "Username entered - ready to handle modals"

### Step 3: Handle Connection Modals
- Look for and dismiss any connection/warning modals
- Check for buttons: `#btnSiModal`, `#btnAceptarModal`, etc.

### Step 4: Submit Username Form
- **NEW**: Submit username to proceed to next stage
- Look for continue buttons: `#btnContinuar`, `#btnSiguiente`, etc.
- Fallback: Press Enter on username field
- Wait for navigation/page change
- **Debug Pause**: "Username submitted - checking for security questions"

### Step 5: Security Questions Detection & Handling
- Check for security question elements
- If found:
  - Parse and answer security questions
  - **Debug Pause**: "Security questions detected - about to handle them"
  - Submit security questions form
  - **Debug Pause**: "Security questions submitted - ready for password"
- If not found:
  - **Debug Pause**: "No security questions - proceeding to password entry"

### Step 6: Submit Security Questions Form (if present)
- **NEW**: Submit security questions to proceed to password page
- Look for submit buttons: `#btnContinuar`, `#btnSubmitPreguntas`, etc.
- Fallback: Press Enter on last filled question field
- Wait for navigation to password page

### Step 7: Password Entry
- **IMPROVED**: Wait longer for password field after navigation
- Find password field (`#txtClave`)
- Verify field is visible and enabled
- Fill password and submit form
- **Debug Pause**: "Password entered and form submitted - waiting for response"

### Step 8: Login Verification
- Check for successful login indicators
- Verify URL changes or success elements
- **Debug Pause**: "Login completed successfully" or "Login process failed"

## 🆕 Key Improvements Made

### Navigation Handling
- **Added**: `submitUsernameForm()` method for proper username submission
- **Added**: `submitSecurityQuestionsForm()` method for security questions submission
- **Improved**: Better waiting and navigation detection

### Form Submission Logic
```typescript
// Old approach (missing navigation)
enterUsername() → checkSecurityQuestions() → enterPassword()

// New approach (proper navigation)
enterUsername() → submitUsernameForm() → checkSecurityQuestions() → 
submitSecurityQuestionsForm() → enterPassword()
```

### Debug Visibility
- More granular debug pause points
- Better error detection and handling
- Clearer step-by-step progress tracking

## 🎯 Debug Pause Points (Updated)

| Step | Debug Message | What to Inspect |
|------|---------------|-----------------|
| 1 | "Login iframe ready - about to start login process" | Iframe content, form elements |
| 2 | "Username entered - ready to handle modals" | Username field value, validation |
| 3 | "Username submitted - checking for security questions" | Navigation success, page change |
| 4 | "Security questions detected - about to handle them" | Question text, answer matching |
| 5 | "Security questions submitted - ready for password" | Navigation to password page |
| 6 | "No security questions - proceeding to password entry" | Direct path to password |
| 7 | "Password entered and form submitted - waiting for response" | Final form submission |
| 8 | "Login completed successfully" | Success indicators |
| 9 | "Login process failed - check page state" | Error analysis |

## 🔧 Button Selectors Used

### Username Form Submission
```typescript
const submitSelectors = [
  '#btnContinuar',
  '#btnSiguiente', 
  '#btnNext',
  'input[type="submit"]',
  'button[type="submit"]',
  '.btn-primary'
];
```

### Security Questions Form Submission
```typescript
const submitSelectors = [
  '#btnContinuar',
  '#btnSiguiente',
  '#btnNext', 
  '#btnSubmitPreguntas',
  'input[type="submit"]',
  'button[type="submit"]',
  '.btn-primary'
];
```

### Password Form Submission
```typescript
const submitSelectors = [
  '#btnEntrar',
  '#btnSubmit', 
  '#btnLogin',
  'input[type="submit"]'
];
```

## 🚨 Common Issues Resolved

### Issue: "Target page, context or browser has been closed"
- **Cause**: Missing navigation between form steps
- **Solution**: Added proper form submission methods
- **Prevention**: Wait for navigation completion before proceeding

### Issue: "Password field not found"
- **Cause**: Trying to access password field before navigation
- **Solution**: Submit username/security questions first
- **Prevention**: Proper step sequencing with navigation waits

### Issue: "Security questions not appearing"
- **Cause**: Username form not submitted
- **Solution**: Explicit username form submission
- **Prevention**: Check for form submission success

## 🎮 Testing the New Flow

### With Debug Mode
```bash
tsx test-debug.ts
```

### With Real Credentials
```bash
BANESCO_USERNAME=user BANESCO_PASSWORD=pass tsx src/banesco/debug.ts
```

### Programmatic Usage
```typescript
const auth = new BanescoAuth(credentials, {
  debug: true,  // See all navigation steps
  headless: false,  // Watch the process
  timeout: 120000   // Allow time for manual inspection
});

await auth.login();
```

## 💡 Pro Tips for Debugging Navigation

1. **Watch Network Tab**: Monitor form submissions and redirects
2. **Check URL Changes**: Verify navigation between steps
3. **Inspect Form Elements**: Ensure buttons are clickable
4. **Monitor Console**: Look for JavaScript errors during navigation
5. **Use Longer Timeouts**: Allow time for page loads between steps

This improved flow now properly handles the multi-step Banesco authentication process! 🎉 