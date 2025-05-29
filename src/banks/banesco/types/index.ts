// Tipos centralizados para el scraper de Banesco

import { 
  BankCredentials, 
  BankAccount, 
  BankTransaction, 
  LoginResult, 
  ScrapingResult, 
  BrowserConfig,
  BankConfig 
} from '../../../shared/types';

// Re-export base types for convenience
export type {
  BankAccount as Account,
  BankTransaction as Transaction,
  LoginResult,
  ScrapingResult,
  BrowserConfig
} from '../../../shared/types';

// Banesco-specific credentials with required security questions
export interface BanescCredentials {
  username: string;
  password: string;
  securityQuestions: string; // Required for Banesco
}

// Banesco-specific extensions
export interface BanescAccount extends BankAccount {
  bankName: 'Banesco';
}

export interface BanescTransaction extends BankTransaction {
  bankName?: 'Banesco';
}

export interface BanescSecurityQuestion {
  question: string;
  answer: string;
  fieldName: string;
}

// Banesco configuration
export const BANESCO_CONFIG: BankConfig = {
  name: 'Banesco',
  code: 'banesco',
  baseUrl: 'https://www.banesconline.com',
  loginUrl: 'https://www.banesconline.com/mantis/Website/Login.aspx',
  supportedFeatures: ['accounts', 'transactions', 'security-questions'],
  locale: 'es-VE',
  timezone: 'America/Caracas'
};

export interface SecurityQuestionMap {
  [keyword: string]: string;
} 