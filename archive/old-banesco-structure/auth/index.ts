/**
 * Banesco Authentication Module
 * 
 * This module provides comprehensive authentication functionality for Banesco
 * online banking using Playwright browser automation.
 */

export { BanescoAuth } from './banesco-auth';
export { SecurityQuestionsHandler } from './security-handler';
export type { 
  BanescoCredentials, 
  BanescoLoginResult, 
  BanescoAuthConfig,
  SecurityQuestion 
} from './types';
export { BANESCO_URLS } from './types'; 