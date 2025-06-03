/**
 * BNC Bank Scraper
 * 
 * Complete Playwright-based scraper for Banco Nacional de Crédito (BNC)
 * 
 * Features:
 * - Authentication with card number, ID, and password
 * - Transaction scraping for multiple accounts (VES, USD)
 * - Comprehensive logging and debugging
 * - Session management and error handling
 * - Export functionality for transactions and sessions
 */

// Main scraper classes
export { BncScraper, createBncScraper, quickScrape } from './scrapers/bnc-scraper';
export { BncAuth } from './auth/bnc-auth';
export { BncTransactionsScraper } from './scrapers/transactions';

// Types and interfaces
export type {
  BncCredentials,
  BncLoginResult,
  BncAuthConfig,
  BncAccount,
  BncTransaction,
  Account,
  Transaction,
  LoginResult,
  ScrapingResult,
  BrowserConfig
} from './types';

export {
  BncAccountType,
  BNC_URLS,
  BNC_SELECTORS,
  BNC_CONFIG
} from './types';

// Export scraping result interfaces
export type {
  BncScrapingSession
} from './scrapers/bnc-scraper';

export type {
  BncScrapingResult
} from './types';

// Default export for convenience
import { BncScraper } from './scrapers/bnc-scraper';
export default BncScraper; 