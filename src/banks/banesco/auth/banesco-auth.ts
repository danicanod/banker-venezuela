/**
 * Banesco Authentication with Playwright
 * 
 * This module provides authentication functionality for Banesco online banking
 * using the abstract BaseBankAuth class with Banesco-specific implementation
 * of security questions, iframe handling, and modal management.
 */
import { SecurityQuestionsHandler } from './security-questions';
import { BaseBankAuth } from '../../../shared/base-bank-auth';
import { Frame } from 'playwright';
import {
  BanescoCredentials,
  BanescoLoginResult,
  BanescoAuthConfig,
  BANESCO_URLS
} from '../types';

export class BanescoAuth extends BaseBankAuth<
  BanescoCredentials, 
  BanescoAuthConfig, 
  BanescoLoginResult
> {
  private securityHandler: SecurityQuestionsHandler;

  constructor(credentials: BanescoCredentials, config: BanescoAuthConfig = {}) {
    super('Banesco', credentials, config);
    
    this.securityHandler = new SecurityQuestionsHandler(
      credentials.securityQuestions
    );
  }

  /**
   * Get default configuration with Banesco-specific defaults
   */
  protected getDefaultConfig(config: BanescoAuthConfig): Required<BanescoAuthConfig> {
    return {
      headless: false,
      timeout: 30000,
      debug: false,
      saveSession: true,
      ...config
    } as Required<BanescoAuthConfig>;
  }

  /**
   * Get user identifier for logging (safe/truncated)
   */
  protected getUserIdentifier(): string {
    return this.credentials.username.substring(0, 3);
  }

  /**
   * Get the Banesco login URL
   */
  protected getLoginUrl(): string {
    return BANESCO_URLS.LOGIN;
  }

  /**
   * Perform Banesco-specific login with iframe handling
   */
  protected async performBankSpecificLogin(): Promise<boolean> {
    try {
      // Wait for the login iframe to be available
      this.log('🔍 Waiting for login iframe...');
      const frame = await this.waitForLoginIframe();
      
      if (!frame) {
        throw new Error('Could not access login iframe');
      }

      await this.debugPause('Login iframe ready - ready to start authentication');

      // Perform the login process within the iframe
      const loginSuccess = await this.performLogin(frame);
      
      if (loginSuccess) {
        return await this.verifyLoginSuccess();
      }
      
      return false;

    } catch (error) {
      this.log(`❌ Bank-specific login failed: ${error}`);
      return false;
    }
  }

  /**
   * Wait for the login iframe to be available
   */
  private async waitForLoginIframe(): Promise<Frame | null> {
    if (!this.page) return null;

    try {
      // Wait for iframe element
      await this.page.waitForSelector(BANESCO_URLS.IFRAME_SELECTOR, {
        timeout: this.config.timeout
      });

      // Get the iframe
      const iframeElement = await this.page.$(BANESCO_URLS.IFRAME_SELECTOR);
      if (!iframeElement) {
        throw new Error('Iframe element not found');
      }

      // Get the frame content
      const frame = await iframeElement.contentFrame();
      if (!frame) {
        throw new Error('Could not access iframe content');
      }

      // Wait for frame to be ready
      await frame.waitForLoadState('domcontentloaded');
      
      this.log('✅ Login iframe ready');
      return frame;

    } catch (error) {
      this.log(`❌ Failed to access login iframe: ${error}`);
      return null;
    }
  }

  /**
   * Perform the login process within the iframe
   */
  private async performLogin(frame: Frame): Promise<boolean> {
    this.log('🔐 Starting login process...');

    try {
      // Step 1: Enter username
      this.log('👤 Entering username...');
      await this.enterUsername(frame);
      
      await this.debugPause('Username entered - ready to check for security questions');

      // Step 2: Check for security questions
      this.log('❓ Checking for security questions...');
      const hasSecurityQuestions = await this.checkForSecurityQuestions(frame);
      
      if (hasSecurityQuestions) {
        await this.debugPause('Security questions handled - ready to enter password');
      } else {
        await this.debugPause('No security questions - ready to enter password');
      }

      // Step 3: Enter password
      this.log('🔑 Entering password...');
      await this.enterPassword(frame);
      
      await this.debugPause('Password entered - ready to submit form');

      // Step 4: Submit form
      this.log('🔄 Submitting login form...');
      await this.submitLoginForm(frame);

      this.log('✅ Login form submitted successfully');
      return true;

    } catch (error) {
      this.log(`❌ Login process failed: ${error}`);
      return false;
    }
  }

  /**
   * Enter username in the iframe
   */
  private async enterUsername(frame: Frame): Promise<void> {
    const usernameReady = await this.waitForElementReadyOnFrame(frame, '#ctl00_cp_ddpControles_txtloginname');
    
    if (!usernameReady) {
      throw new Error('Username field not ready');
    }

    await frame.fill('#ctl00_cp_ddpControles_txtloginname', this.credentials.username);
    this.log('✅ Username entered successfully');
  }

  /**
   * Check for and handle security questions
   */
  private async checkForSecurityQuestions(frame: Frame): Promise<boolean> {
    try {
      // Check if security question field exists
      const securityField = await frame.$('#ctl00_cp_ddpControles_txtpreguntasecreta');
      
      if (!securityField) {
        this.log('ℹ️  No security questions detected');
        return false;
      }

      // Security question found - handle it
      this.log('🔒 Security question detected, handling...');
      
      const answered = await this.securityHandler.handleSecurityQuestions(frame);
      
      if (answered) {
        this.log('✅ Security question answered successfully');
        return true;
      } else {
        throw new Error('Failed to answer security question');
      }

    } catch (error) {
      this.log(`⚠️  Security question handling error: ${error}`);
      // Continue without failing completely
      return false;
    }
  }

  /**
   * Enter password in the iframe
   */
  private async enterPassword(frame: Frame): Promise<void> {
    const passwordReady = await this.waitForElementReadyOnFrame(frame, '#ctl00_cp_ddpControles_txtclave');
    
    if (!passwordReady) {
      throw new Error('Password field not ready');
    }

    // Clear the field first and then type with a small delay
    await frame.fill('#ctl00_cp_ddpControles_txtclave', '');
    await frame.type('#ctl00_cp_ddpControles_txtclave', this.credentials.password, { delay: 100 });
    this.log('✅ Password entered successfully');
  }

  /**
   * Submit the login form
   */
  private async submitLoginForm(frame: Frame): Promise<void> {
    const submitReady = await this.waitForElementReadyOnFrame(frame, '#ctl00_cp_ddpControles_btnAcceder');
    
    if (!submitReady) {
      throw new Error('Submit button not ready');
    }

    // Click the submit button and wait for navigation
    await Promise.all([
      frame.click('#ctl00_cp_ddpControles_btnAcceder'),
      frame.waitForLoadState('domcontentloaded', { timeout: this.config.timeout })
    ]);
    
    this.log('✅ Login form submitted');
  }

  /**
   * Verify if login was successful using Banesco-specific indicators
   */
  protected async verifyLoginSuccess(): Promise<boolean> {
    if (!this.page) return false;

    try {
      this.log('🔍 Verifying login success...');
      
      // Wait a moment for page to load
      await this.page.waitForTimeout(3000);
      
      const currentUrl = this.page.url();
      this.log(`📍 Current URL: ${currentUrl}`);
      
      // Check for successful login indicators
      const successUrlPatterns = [
        'default.aspx',
        'Principal.aspx',
        'Dashboard',
        'Home'
      ];
      
      const urlBasedSuccess = successUrlPatterns.some(pattern => 
        currentUrl.toLowerCase().includes(pattern.toLowerCase())
      );
      
      if (urlBasedSuccess) {
        this.log('✅ Login verification successful by URL pattern');
        return true;
      }
      
      // Check for system availability iframe (Banesco-specific)
      try {
        const systemIframe = await this.page.$('#ctl00_cp_frmCAU');
        if (systemIframe) {
          const systemFrame = await systemIframe.contentFrame();
          if (systemFrame) {
            const systemStatus = await systemFrame.$('.StatusSystemOK, .available');
            if (systemStatus) {
              this.log('✅ Login verified by system status iframe');
              return true;
            }
          }
        }
      } catch (e) {
        // Continue with other checks
      }
      
      // Check if we're no longer on login page
      const isStillOnLoginPage = await this.page.$(BANESCO_URLS.IFRAME_SELECTOR);
      if (!isStillOnLoginPage) {
        this.log('✅ Login verified - no longer on login page');
        return true;
      }
      
      this.log('❌ Login verification failed - still appears to be on login page');
      return false;
      
    } catch (error) {
      this.log(`❌ Error during login verification: ${error}`);
      return false;
    }
  }

  /**
   * Create Banesco-specific success result
   */
  protected createSuccessResult(): BanescoLoginResult {
    return {
      success: true,
      message: 'Authentication successful',
      sessionValid: true,
      systemMessage: 'Banesco online banking session established'
    };
  }

  /**
   * Create Banesco-specific failure result
   */
  protected createFailureResult(message: string): BanescoLoginResult {
    return {
      success: false,
      message,
      sessionValid: false,
      error: message,
      systemMessage: 'Authentication failed'
    };
  }

  /**
   * Get credentials for logging purposes (safe)
   */
  getCredentials(): { username: string } {
    return { username: this.credentials.username };
  }
} 