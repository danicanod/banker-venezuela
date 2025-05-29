// Shared types for all bank implementations
export * from './base';

// Re-export for backward compatibility and convenience
export type {
  BankCredentials as BanescCredentials,
  BankAccount as Account,
  BankTransaction as Transaction,
  LoginResult,
  ScrapingResult,
  BrowserConfig
} from './base'; 