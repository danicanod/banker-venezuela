#!/usr/bin/env tsx

/**
 * Banesco Authentication Debug Script
 * 
 * This script provides an easy way to debug the Banesco authentication
 * process using Playwright's built-in debugger.
 * 
 * Usage:
 *   npm run dev src/banesco/debug.ts
 *   
 * Or with environment variables:
 *   BANESCO_USERNAME=user BANESCO_PASSWORD=pass tsx src/banesco/debug.ts
 */

import { BanescoAuth } from './auth/banesco-auth';
import type { BanescoCredentials } from './auth/types';

async function main() {
  console.log('🐛 Banesco Authentication Debugger');
  console.log('===================================');
  console.log('🎯 This script will pause at key authentication steps');
  console.log('💡 Use Playwright Inspector to examine the page state');
  console.log('⏯️  Click "Resume" to continue to the next pause point\n');

  // Validate credentials
  if (!process.env.BANESCO_USERNAME || !process.env.BANESCO_PASSWORD) {
    console.error('❌ Missing required environment variables:');
    console.error('   BANESCO_USERNAME - Your Banesco username');
    console.error('   BANESCO_PASSWORD - Your Banesco password');
    console.error('   BANESCO_SECURITY_QUESTIONS - Security questions (optional)');
    console.error('\nExample:');
    console.error('   BANESCO_USERNAME=myuser BANESCO_PASSWORD=mypass tsx src/banesco/debug.ts');
    process.exit(1);
  }

  const credentials: BanescoCredentials = {
    username: process.env.BANESCO_USERNAME,
    password: process.env.BANESCO_PASSWORD,
    securityQuestions: process.env.BANESCO_SECURITY_QUESTIONS
  };

  const auth = new BanescoAuth(credentials, {
    headless: false,  // Always visible for debugging
    timeout: 180000,  // 3 minutes timeout
    debug: true,      // Enable all debug pauses
    saveSession: false // Don't save session during debugging
  });

  try {
    console.log('🚀 Starting debug authentication...\n');
    
    const startTime = Date.now();
    const result = await auth.login();
    const endTime = Date.now();
    const duration = Math.round((endTime - startTime) / 1000);
    
    console.log(`\n⏱️  Debug session completed in ${duration} seconds`);
    
    if (result.success) {
      console.log('🎉 Authentication successful!');
      console.log('✅ Session is valid and authenticated');
      
      const page = auth.getPage();
      if (page) {
        console.log('\n📄 Authenticated page is available');
        console.log('🌐 Current URL:', await page.url());
        
        // Take a final screenshot
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const screenshotPath = `debug-banesco-success-${timestamp}.png`;
        
        await page.screenshot({ 
          path: screenshotPath,
          fullPage: true 
        });
        
        console.log(`📸 Success screenshot saved: ${screenshotPath}`);
        
        // Optional: Pause to examine the authenticated state
        console.log('\n🔍 Final pause to examine authenticated state...');
        console.log('💡 You can now inspect the logged-in page');
        console.log('💡 Press "Resume" when you\'re done examining');
        await page.pause();
      }
      
    } else {
      console.error('❌ Authentication failed!');
      console.error('📝 Error message:', result.message);
      
      if (result.error) {
        console.error('🔍 Error details:', result.error);
      }
      
      // Take error screenshot
      const page = auth.getPage();
      if (page) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const screenshotPath = `debug-banesco-error-${timestamp}.png`;
        
        await page.screenshot({ 
          path: screenshotPath,
          fullPage: true 
        });
        
        console.log(`📸 Error screenshot saved: ${screenshotPath}`);
      }
    }
    
  } catch (error) {
    console.error('\n💥 Debug session error:', error);
    
    // Take crash screenshot
    const page = auth.getPage();
    if (page) {
      try {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const screenshotPath = `debug-banesco-crash-${timestamp}.png`;
        
        await page.screenshot({ 
          path: screenshotPath,
          fullPage: true 
        });
        
        console.log(`📸 Crash screenshot saved: ${screenshotPath}`);
      } catch (screenshotError) {
        console.error('Failed to take crash screenshot:', screenshotError);
      }
    }
    
  } finally {
    console.log('\n🧹 Cleaning up debug session...');
    
    // Get log information before closing
    const logFile = auth.getLogFile();
    console.log(`📄 Session logs saved to: ${logFile}`);
    
    // Export logs with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const exportPath = `debug-banesco-exported-${timestamp}.log`;
    const exported = auth.exportLogs(exportPath);
    
    if (exported) {
      console.log(`📤 Logs exported to: ${exportPath}`);
      console.log('💡 You can share this log file for debugging assistance');
    }
    
    // Keep browser open a bit longer for final inspection
    console.log('⏳ Browser will close in 10 seconds...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    await auth.close();
    console.log('✅ Debug session cleanup completed');
    
    // Show final log summary
    console.log('\n📊 Debug Session Summary:');
    console.log(`📄 Primary log: ${logFile}`);
    if (exported) {
      console.log(`📤 Exported log: ${exportPath}`);
    }
    console.log('💡 Use these logs to analyze the authentication flow');
  }
}

// Handle script interruption
process.on('SIGINT', async () => {
  console.log('\n\n⚠️  Debug session interrupted');
  console.log('🧹 Cleaning up...');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n\n⚠️  Debug session terminated');
  console.log('🧹 Cleaning up...');
  process.exit(0);
});

// Run the debug session
main()
  .then(() => {
    console.log('\n🏁 Debug script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Debug script failed:', error);
    process.exit(1);
  }); 