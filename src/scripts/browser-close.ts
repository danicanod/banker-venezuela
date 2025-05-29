#!/usr/bin/env tsx

import { BrowserManager } from '../shared/utils/browser';

async function closeBrowser() {
  try {
    await BrowserManager.forceClose();
    console.log('Browser closed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error closing browser:', error);
    process.exit(1);
  }
}

closeBrowser(); 