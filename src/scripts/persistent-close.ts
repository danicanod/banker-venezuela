#!/usr/bin/env tsx

import { PersistentBrowserServer } from '../shared/utils/browser-server';

async function closePersistentBrowser() {
  try {
    const server = PersistentBrowserServer.getInstance();
    await server.close();
    console.log('Persistent browser closed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error closing persistent browser:', error);
    process.exit(1);
  }
}

closePersistentBrowser(); 