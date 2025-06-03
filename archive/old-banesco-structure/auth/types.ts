/**
 * Banesco Authentication Types
 * 
 * This module defines the types and interfaces used for Banesco authentication
 * using Playwright for browser automation.
 */

export interface BanescoCredentials {
  /** Banesco username/client ID */
  username: string;
  /** Banesco password */
  password: string;
  /** Security questions in format: "keyword1:answer1,keyword2:answer2" */
  securityQuestions?: string;
}

export interface BanescoLoginResult {
  /** Whether the login was successful */
  success: boolean;
  /** Result message describing the outcome */
  message: string;
  /** Whether the session is valid and authenticated */
  sessionValid: boolean;
  /** Optional error details if login failed */
  error?: string;
  /** Optional system message for system unavailable messages */
  systemMessage?: string;
}

export interface BanescoAuthConfig {
  /** Whether to run browser in headless mode */
  headless?: boolean;
  /** Navigation timeout in milliseconds */
  timeout?: number;
  /** Whether to save session cookies for future logins */
  saveSession?: boolean;
  /** Enable debug mode with pause points for Playwright debugger */
  debug?: boolean;
}

export interface SecurityQuestion {
  /** The question text as displayed by Banesco */
  question: string;
  /** The answer to provide */
  answer: string;
  /** The input field name/ID for this question */
  fieldName: string;
}

/** Banesco-specific URLs and endpoints */
export const BANESCO_URLS = {
  BASE: 'https://www.banesconline.com',
  LOGIN: 'https://www.banesconline.com/mantis/Website/Login.aspx',
  IFRAME_SELECTOR: 'iframe#ctl00_cp_frmAplicacion'
} as const; 