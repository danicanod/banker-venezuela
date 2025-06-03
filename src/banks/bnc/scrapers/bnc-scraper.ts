/**
 * BNC Main Scraper with Playwright
 * 
 * This module provides the main scraping functionality for BNC online banking,
 * integrating authentication and transaction extraction in a unified interface.
 */

import { Browser, Page, chromium } from 'playwright';
import { BncAuth } from '../auth/bnc-auth';
import { BncTransactionsScraper } from './transactions';
import type { 
  BncCredentials, 
  BncAuthConfig, 
  BncScrapingConfig, 
  BncLoginResult, 
  BncScrapingResult,
  BncTransaction 
} from '../types';

export interface BncScrapingSession {
  authResult: BncLoginResult;
  transactionResults: BncScrapingResult[];
  browser?: Browser;
  page?: Page;
}

export interface BncFullScrapingConfig extends BncAuthConfig, BncScrapingConfig {
  authenticateFirst?: boolean;  // Default: true
  closeAfterScraping?: boolean; // Default: true
}

export class BncScraper {
  private credentials: BncCredentials;
  private config: BncFullScrapingConfig;
  private auth?: BncAuth;
  private browser?: Browser;
  private page?: Page;

  constructor(credentials: BncCredentials, config: BncFullScrapingConfig = {}) {
    this.credentials = credentials;
    this.config = {
      authenticateFirst: true,
      closeAfterScraping: true,
      ...config
    };
  }

  /**
   * Perform complete scraping: authentication + transactions
   */
  async scrapeAll(): Promise<BncScrapingSession> {
    console.log('🚀 Starting BNC complete scraping session...');
    
    const session: BncScrapingSession = {
      authResult: { success: false, message: '', sessionValid: false },
      transactionResults: []
    };

    try {
      // Step 1: Authentication (if enabled)
      if (this.config.authenticateFirst) {
        console.log('🔐 Starting authentication...');
        session.authResult = await this.authenticate();
        
        if (!session.authResult.success) {
          throw new Error(`Authentication failed: ${session.authResult.message}`);
        }
        
        console.log('✅ Authentication successful');
      }

      // Step 2: Transaction scraping
      if (this.page && session.authResult.success) {
        console.log('📊 Starting transaction scraping...');
        
        const transactionScraper = new BncTransactionsScraper(this.page, this.config);
        const transactionResult = await transactionScraper.scrapeTransactions();
        
        session.transactionResults.push(transactionResult);
        
        console.log(`✅ Transaction scraping completed: ${transactionResult.data?.length || 0} transactions`);
      }

      // Store browser and page references
      session.browser = this.browser;
      session.page = this.page;

      // Clean up if configured
      if (this.config.closeAfterScraping) {
        await this.close();
        console.log('🧹 Session cleaned up');
      }

      console.log('🎉 BNC scraping session completed successfully');
      return session;

    } catch (error: any) {
      console.error(`💥 BNC scraping session failed: ${error.message}`);
      
      // Ensure cleanup on error
      await this.close();
      
      // Update session with error
      session.authResult = {
        success: false,
        message: error.message,
        sessionValid: false,
        error: error.message
      };

      return session;
    }
  }

  /**
   * Authenticate with BNC
   */
  async authenticate(): Promise<BncLoginResult> {
    try {
      this.auth = new BncAuth(this.credentials, this.config);
      const result = await this.auth.login();
      
      if (result.success) {
        this.page = this.auth.getPage() || undefined;
        // Store browser reference (access private property through type assertion)
        this.browser = (this.auth as any).browser;
      }
      
      return result;
      
    } catch (error: any) {
      return {
        success: false,
        message: error.message,
        sessionValid: false,
        error: error.message
      };
    }
  }

  /**
   * Scrape transactions only (requires existing authentication)
   */
  async scrapeTransactions(): Promise<BncScrapingResult> {
    if (!this.page) {
      throw new Error('No authenticated page available. Call authenticate() first.');
    }

    const scraper = new BncTransactionsScraper(this.page, this.config);
    return await scraper.scrapeTransactions();
  }

  /**
   * Get current authenticated page
   */
  getPage(): Page | null {
    return this.page || null;
  }

  /**
   * Get current browser instance
   */
  getBrowser(): Browser | null {
    return this.browser || null;
  }

  /**
   * Check if authenticated
   */
  isAuthenticated(): boolean {
    return this.auth?.isLoggedIn() || false;
  }

  /**
   * Export session data to file
   */
  exportSession(session: BncScrapingSession, filename?: string): string {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const defaultFilename = `bnc-session-${timestamp}.json`;
      const exportFilename = filename || defaultFilename;
      
      // Prepare export data (exclude browser/page references)
      const exportData = {
        bank: 'BNC',
        exported: new Date().toISOString(),
        session: {
          authResult: session.authResult,
          transactionResults: session.transactionResults,
          totalTransactions: session.transactionResults.reduce(
            (sum, result) => sum + (result.data?.length || 0), 0
          )
        }
      };
      
      const fs = require('fs');
      fs.writeFileSync(exportFilename, JSON.stringify(exportData, null, 2));
      console.log(`📤 Session exported to: ${exportFilename}`);
      
      return exportFilename;
      
    } catch (error) {
      console.error(`❌ Failed to export session: ${error}`);
      throw error;
    }
  }

  /**
   * Close browser and cleanup resources
   */
  async close(): Promise<void> {
    try {
      if (this.auth) {
        await this.auth.close();
      }
      
      if (this.browser) {
        await this.browser.close();
      }
      
      this.page = undefined;
      this.browser = undefined;
      this.auth = undefined;
      
    } catch (error) {
      console.warn(`⚠️  Error during cleanup: ${error}`);
    }
  }
}

/**
 * Factory function to create BNC scraper
 */
export function createBncScraper(
  credentials: BncCredentials, 
  config?: BncFullScrapingConfig
): BncScraper {
  return new BncScraper(credentials, config);
}

/**
 * Quick scraping function for simple use cases
 */
export async function quickScrape(
  credentials: BncCredentials,
  config?: Partial<BncFullScrapingConfig>
): Promise<BncTransaction[]> {
  const scraper = createBncScraper(credentials, config);
  
  try {
    const session = await scraper.scrapeAll();
    
    // Combine all transactions from all results
    const allTransactions: BncTransaction[] = [];
    session.transactionResults.forEach(result => {
      if (result.data) {
        allTransactions.push(...result.data);
      }
    });
    
    return allTransactions;
    
  } catch (error) {
    console.error(`💥 Quick scrape failed: ${error}`);
    throw error;
  } finally {
    await scraper.close();
  }
} 