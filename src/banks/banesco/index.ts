/**
 * Banesco Bank Scraper
 * 
 * Complete Playwright-based scraper for Banco Universal Banesco
 * 
 * Features:
 * - Authentication with username, password, and security questions
 * - Transaction scraping with flexible table analysis
 * - Comprehensive logging and debugging
 * - Session management and error handling
 * - Export functionality for transactions and sessions
 */

// Main scraper classes
export { BanescoScraper, createBanescoScraper, quickScrape } from './scrapers/banesco-scraper';
export { BanescoAuth } from './auth/banesco-auth';
export { BanescoTransactionsScraper } from './scrapers/transactions';

// Types and interfaces
export type {
  BanescoCredentials,
  BanescoLoginResult,
  BanescoAuthConfig,
  BanescoScrapingConfig,
  BanescAccount,
  BanescTransaction,
  Account,
  Transaction,
  LoginResult,
  ScrapingResult,
  BrowserConfig
} from './types';

export {
  BANESCO_URLS,
  BANESCO_CONFIG
} from './types';

// Export scraping result interfaces
export type {
  BanescoScrapingSession
} from './scrapers/banesco-scraper';

export type {
  BanescoScrapingResult
} from './types';

// Default export for convenience
import { BanescoScraper } from './scrapers/banesco-scraper';
export default BanescoScraper; 