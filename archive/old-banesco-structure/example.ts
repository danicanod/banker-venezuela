/**
 * Banesco Authentication Example
 * 
 * This example demonstrates how to use the Banesco authentication module
 * with Playwright for automated login to Banesco online banking.
 */

import { BanescoAuth } from './auth/index';
import type { BanescoCredentials, BanescoAuthConfig } from './auth/types';

async function authenticateWithBanesco() {
  // Configuration for Banesco authentication
  const credentials: BanescoCredentials = {
    username: process.env.BANESCO_USERNAME || 'your_username',
    password: process.env.BANESCO_PASSWORD || 'your_password',
    securityQuestions: process.env.BANESCO_SECURITY_QUESTIONS || 'madre:maria,colegio:central,mascota:firulais'
  };

  const config: BanescoAuthConfig = {
    headless: process.env.NODE_ENV === 'production', // Headless in production
    timeout: 45000, // 45 seconds timeout
    saveSession: true, // Enable session persistence
    debug: process.env.DEBUG === 'true' // Enable debug mode with PLAYWRIGHT_DEBUG=true
  };

  // Create authentication instance
  const auth = new BanescoAuth(credentials, config);

  try {
    console.log('🚀 Starting Banesco authentication...');
    
    if (config.debug) {
      console.log('🐛 Debug mode enabled!');
      console.log('💡 The browser will pause at key points for debugging.');
      console.log('💡 Use Playwright Inspector to step through the process.');
      console.log('💡 Set HEADED=true to see the browser window.');
    }
    
    // Perform login
    const result = await auth.login();
    
    if (result.success) {
      console.log('🎉 Authentication successful!');
      console.log('Message:', result.message);
      console.log('Session valid:', result.sessionValid);
      
      // Get the authenticated page
      const page = auth.getPage();
      
      if (page) {
        console.log('📄 Authenticated page available');
        
        // Check current status
        console.log('🔐 Is logged in:', auth.isLoggedIn());
        
        // Get current URL
        const currentUrl = await auth.getCurrentUrl();
        console.log('🌐 Current URL:', currentUrl);
        
        // Example: Wait for user dashboard or main menu
        try {
          await page.waitForSelector('[id*="menu"], .dashboard, .main-content', {
            timeout: 10000
          });
          console.log('✅ Dashboard/menu loaded successfully');
        } catch (waitError) {
          console.log('⚠️  Dashboard elements not found, but login was successful');
        }
        
        // Here you can perform additional banking operations
        // Example: Navigate to accounts, get balances, etc.
        
        console.log('💡 You can now perform banking operations using the authenticated page');
        
        // Example of taking a screenshot for debugging
        if (!config.headless) {
          await page.screenshot({ 
            path: 'banesco-authenticated.png',
            fullPage: true 
          });
          console.log('📸 Screenshot saved as banesco-authenticated.png');
        }
        
      } else {
        console.log('❌ Could not get authenticated page');
      }
      
    } else {
      console.error('❌ Authentication failed');
      console.error('Message:', result.message);
      
      if (result.error) {
        console.error('Error details:', result.error);
      }
      
      // Provide helpful tips based on error type
      if (result.message.includes('security questions')) {
        console.log('\n💡 Tip: Check your security questions configuration');
        console.log('Format: "keyword1:answer1,keyword2:answer2"');
        console.log('Example: "madre:maria,colegio:central,mascota:firulais"');
      } else if (result.message.includes('timeout')) {
        console.log('\n💡 Tip: Try increasing the timeout value or check your internet connection');
      } else if (result.message.includes('iframe')) {
        console.log('\n💡 Tip: Banesco might be experiencing technical issues');
      }
    }
    
  } catch (error) {
    console.error('💥 Unexpected error during authentication:', error);
  } finally {
    // Always cleanup resources
    console.log('🧹 Cleaning up resources...');
    await auth.close();
    console.log('✅ Cleanup completed');
  }
}

// Example with error handling and retry logic
async function authenticateWithRetry(maxRetries: number = 3) {
  const credentials: BanescoCredentials = {
    username: process.env.BANESCO_USERNAME || 'your_username',
    password: process.env.BANESCO_PASSWORD || 'your_password',
    securityQuestions: process.env.BANESCO_SECURITY_QUESTIONS
  };

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    console.log(`🔄 Authentication attempt ${attempt}/${maxRetries}`);
    
    const auth = new BanescoAuth(credentials, {
      headless: true,
      timeout: 30000 + (attempt * 10000), // Increase timeout with each retry
      saveSession: true
    });

    try {
      const result = await auth.login();
      
      if (result.success) {
        console.log(`✅ Authentication successful on attempt ${attempt}`);
        
        // Use the authenticated session
        const page = auth.getPage();
        if (page) {
          // Perform your banking operations here
          console.log('🏦 Ready for banking operations');
        }
        
        await auth.close();
        return true; // Success
      } else {
        console.log(`❌ Attempt ${attempt} failed:`, result.message);
        await auth.close();
        
        if (attempt < maxRetries) {
          console.log(`⏳ Waiting before retry...`);
          await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
        }
      }
      
    } catch (error) {
      console.error(`💥 Attempt ${attempt} error:`, error);
      await auth.close();
      
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
  }
  
  console.error(`❌ All ${maxRetries} authentication attempts failed`);
  return false;
}

// Example with debug mode enabled for Playwright debugging
async function authenticateWithDebug() {
  console.log('🐛 Starting Banesco authentication with DEBUG mode');
  console.log('================================');
  console.log('💡 This will pause at key points for debugging');
  console.log('💡 Use Playwright Inspector to step through the process');
  console.log('💡 Continue execution by clicking "Resume" in the debugger\n');

  const credentials: BanescoCredentials = {
    username: process.env.BANESCO_USERNAME || 'your_username',
    password: process.env.BANESCO_PASSWORD || 'your_password',
    securityQuestions: process.env.BANESCO_SECURITY_QUESTIONS || 'madre:maria,colegio:central,mascota:firulais'
  };

  const config: BanescoAuthConfig = {
    headless: false, // Always visible in debug mode
    timeout: 120000, // Longer timeout for debugging
    saveSession: true,
    debug: true // Enable debug pauses
  };

  const auth = new BanescoAuth(credentials, config);

  try {
    const result = await auth.login();
    
    if (result.success) {
      console.log('🎉 Debug authentication completed successfully!');
      
      const page = auth.getPage();
      if (page) {
        console.log('📄 Authenticated page available for further debugging');
        console.log('💡 You can now inspect the authenticated state');
        
        // Take a screenshot for reference
        await page.screenshot({ 
          path: 'debug-banesco-authenticated.png',
          fullPage: true 
        });
        console.log('📸 Debug screenshot saved as debug-banesco-authenticated.png');
      }
    } else {
      console.error('❌ Debug authentication failed:', result.message);
      
      // Take a screenshot of the error state
      const page = auth.getPage();
      if (page) {
        await page.screenshot({ 
          path: 'debug-banesco-error.png',
          fullPage: true 
        });
        console.log('📸 Error state screenshot saved as debug-banesco-error.png');
      }
    }
    
  } catch (error) {
    console.error('💥 Debug authentication error:', error);
  } finally {
    // In debug mode, you might want to keep the browser open longer
    console.log('🔍 Debug session completed. Browser will close in 5 seconds...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    await auth.close();
  }
}

// Run the example if this file is executed directly
if (require.main === module) {
  console.log('🏦 Banesco Authentication Example');
  console.log('================================\n');
  
  // Check if credentials are provided
  if (!process.env.BANESCO_USERNAME || !process.env.BANESCO_PASSWORD) {
    console.log('⚠️  Please set environment variables:');
    console.log('   BANESCO_USERNAME=your_username');
    console.log('   BANESCO_PASSWORD=your_password');
    console.log('   BANESCO_SECURITY_QUESTIONS="madre:maria,colegio:central"');
    console.log('\nOr update the credentials in this example file.');
    process.exit(1);
  }
  
  // Run the authentication example
  authenticateWithBanesco()
    .then(() => {
      console.log('\n🏁 Example completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Example failed:', error);
      process.exit(1);
    });
}

export { authenticateWithBanesco, authenticateWithRetry, authenticateWithDebug }; 