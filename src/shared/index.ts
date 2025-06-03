// Shared base classes and types for all bank implementations

// Base classes
export { BaseBankAuth } from './base-bank-auth';
export { BaseBankScraper } from './base-bank-scraper';

// Base types
export type {
  BaseBankAuthConfig,
  BaseBankLoginResult,
  BaseBankCredentials,
  BaseBankScrapingConfig,
  BaseBankScrapingResult
} from './types';

// Re-export all shared types for convenience
export * from './types'; 