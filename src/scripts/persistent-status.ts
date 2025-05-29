#!/usr/bin/env tsx

import { PersistentBrowserServer } from '../shared/utils/browser-server';

async function checkPersistentStatus() {
  try {
    const server = PersistentBrowserServer.getInstance();
    const status = server.getStatus();
    
    console.log('Persistent Browser Status:');
    console.log('- Active:', status.isActive);
    console.log('- Last used:', status.lastUsed.toISOString());
    console.log('- Uptime:', Math.round(status.uptime / 1000), 'seconds');
    console.log('- Request stats:', status.requestStats.slice(0, 5)); // Top 5 domains
    
    process.exit(0);
  } catch (error) {
    console.error('Error checking persistent browser status:', error);
    process.exit(1);
  }
}

checkPersistentStatus(); 