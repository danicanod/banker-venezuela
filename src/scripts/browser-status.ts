#!/usr/bin/env tsx

import { BrowserManager } from '../shared/utils/browser';

async function checkBrowserStatus() {
  try {
    const isActive = BrowserManager.isActive();
    const stats = BrowserManager.getStats();
    
    console.log('Browser status:', isActive ? 'Running' : 'Not running');
    console.log('Instance count:', stats.instanceCount);
    process.exit(0);
  } catch (error) {
    console.error('Error checking browser status:', error);
    process.exit(1);
  }
}

checkBrowserStatus(); 