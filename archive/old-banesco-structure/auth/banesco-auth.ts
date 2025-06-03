/**
 * Banesco Authentication with Playwright
 * 
 * This module provides authentication functionality for Banesco online banking
 * using Playwright browser automation with session persistence and smart handling
 * of security questions.
 */

import { Browser, Page, Frame, chromium } from 'playwright';
import type { BanescoCredentials, BanescoLoginResult, BanescoAuthConfig } from './types';
import { BANESCO_URLS } from './types';
import { SecurityQuestionsHandler } from './security-handler';
import { writeFileSync, appendFileSync, existsSync } from 'fs';

export class BanescoAuth {
  private browser: Browser | null = null;
  private page: Page | null = null;
  private credentials: BanescoCredentials;
  private config: Required<BanescoAuthConfig>;
  private securityHandler: SecurityQuestionsHandler;
  private isAuthenticated: boolean = false;
  private logFile: string;

  constructor(credentials: BanescoCredentials, config: BanescoAuthConfig = {}) {
    this.credentials = credentials;
    this.config = {
      headless: config.headless ?? false,
      timeout: config.timeout ?? 30000,
      saveSession: config.saveSession ?? true,
      debug: config.debug ?? false
    };
    
    // Setup log file FIRST
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    this.logFile = `debug-banesco-${timestamp}.log`;
    
    // Then pass logging function to SecurityQuestionsHandler
    this.securityHandler = new SecurityQuestionsHandler(
      credentials.securityQuestions,
      (message: string) => this.log(message)
    );
    
    this.log(`🏦 Banesco Auth initialized for user: ${credentials.username.substring(0, 3)}***`);
    
    if (this.config.debug) {
      this.log('🐛 Debug mode enabled - Playwright debugger will pause at key points');
    }
  }

  /**
   * Log message to console and file
   */
  private log(message: string): void {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${message}`;
    
    console.log(message);
    
    try {
      appendFileSync(this.logFile, logEntry + '\n');
    } catch (error) {
      // Fallback if file writing fails
      console.warn('Failed to write to log file:', error);
    }
  }

  /**
   * Wait for element to be ready (visible and enabled)
   */
  private async waitForElementReady(frame: Frame, selector: string, timeout: number = 10000): Promise<boolean> {
    try {
      // Wait for element to exist
      await frame.waitForSelector(selector, { timeout });
      
      // Wait for element to be visible and enabled
      await frame.waitForFunction(
        (sel) => {
          const element = document.querySelector(sel) as HTMLElement;
          return element && 
                 element.offsetParent !== null && // visible
                 !element.hasAttribute('disabled'); // enabled
        },
        selector,
        { timeout }
      );
      
      return true;
    } catch (error) {
      this.log(`⚠️  Element not ready: ${selector} - ${error}`);
      return false;
    }
  }

  /**
   * Wait for navigation completion by checking for new content
   */
  private async waitForNavigation(frame: Frame, expectedSelectors: string[] = [], timeout: number = 15000): Promise<boolean> {
    try {
      this.log('⏳ Waiting for navigation to complete...');
      
      // First try immediate check - maybe elements are already there
      for (const selector of expectedSelectors) {
        try {
          const element = await frame.$(selector);
          if (element && await element.isVisible()) {
            this.log(`✅ Navigation detected: found ${selector} immediately`);
            return true;
          }
        } catch (e) {
          // Continue checking
        }
      }
      
      // If not immediate, wait for any of the expected selectors to appear
      if (expectedSelectors.length > 0) {
        this.log(`🔍 Waiting for any of: ${expectedSelectors.join(', ')}`);
        
        try {
          await Promise.race(
            expectedSelectors.map(selector => 
              frame.waitForSelector(selector, { timeout })
            )
          );
          this.log('✅ Navigation detected: new content appeared');
          return true;
        } catch (raceError) {
          this.log(`⚠️  None of expected elements appeared: ${raceError}`);
        }
      }
      
      // Fallback: wait for load state change
      try {
        await frame.waitForLoadState('domcontentloaded', { timeout: 5000 });
        this.log('✅ Navigation completed: DOM loaded');
        return true;
      } catch (loadError) {
        this.log(`⚠️  Load state timeout: ${loadError}`);
      }
      
      // Final fallback: check if we're on a different page by checking current elements
      this.log('🔍 Final check: analyzing current page state...');
      
      // Count total interactive elements - if page changed, count should be different
      const currentElements = await frame.$$('input, button, select, textarea, a[href]');
      this.log(`📊 Found ${currentElements.length} interactive elements on current page`);
      
      if (currentElements.length > 0) {
        this.log('✅ Navigation assumed successful - page has interactive content');
        return true;
      }
      
      return false;
      
    } catch (error) {
      this.log(`⚠️  Navigation timeout: ${error}`);
      return false;
    }
  }

  /**
   * Pause execution for debugging with Playwright debugger
   * Only pauses if debug mode is enabled
   */
  private async debugPause(message: string): Promise<void> {
    if (this.config.debug && this.page) {
      this.log(`🐛 DEBUG PAUSE: ${message}`);
      this.log('💡 Use Playwright Inspector to debug. Continue execution when ready.');
      await this.page.pause();
    }
  }

  /**
   * Check for Banesco system unavailable messages
   */
  private async checkSystemAvailability(): Promise<{ available: boolean; message?: string }> {
    if (!this.page) return { available: true };

    try {
      this.log('🔍 Checking Banesco system availability...');
      
      // Check for CAU iframe (system messages)
      const cauIframes = [
        'iframe[title="CAU"]',
        'iframe[name="CAU"]', 
        'iframe[id*="CAU"]',
        'iframe[src*="CAU"]'
      ];
      
      for (const selector of cauIframes) {
        try {
          const iframeElement = await this.page.$(selector);
          if (iframeElement) {
            this.log(`🔍 Found CAU iframe: ${selector}`);
            
            const cauFrame = await iframeElement.contentFrame();
            if (cauFrame) {
              // Check for system unavailable messages
              const unavailableMessages = [
                'En estos momentos no podemos',
                'Sistema no disponible',
                'Servicio temporalmente suspendido',
                'Mantenimiento programado',
                'Sistema en mantenimiento',
                'No disponible temporalmente',
                'Fuera de servicio'
              ];
              
              for (const message of unavailableMessages) {
                try {
                  // Use textContent to search for the message
                  const bodyText = await cauFrame.textContent('body') || '';
                  if (bodyText.toLowerCase().includes(message.toLowerCase())) {
                    this.log(`❌ System unavailable message detected: "${message}"`);
                    this.log(`📄 Full message: ${bodyText.substring(0, 200)}...`);
                    
                    return {
                      available: false,
                      message: bodyText.trim()
                    };
                  }
                } catch (e) {
                  // Message not found, continue
                }
              }
              
              // Check for any error-like content in CAU frame
              try {
                const bodyText = await cauFrame.textContent('body') || '';
                if (bodyText.length > 10) {
                  this.log(`ℹ️  CAU frame content: ${bodyText.substring(0, 100)}...`);
                  
                  // If it contains error keywords, consider it unavailable
                  const errorKeywords = ['error', 'no podemos', 'no disponible', 'suspendido', 'mantenimiento'];
                  const hasErrorKeyword = errorKeywords.some(keyword => 
                    bodyText.toLowerCase().includes(keyword)
                  );
                  
                  if (hasErrorKeyword) {
                    return {
                      available: false,
                      message: bodyText.trim()
                    };
                  }
                }
              } catch (e) {
                // Could not read frame content
              }
            }
          }
        } catch (e) {
          // iframe not found or not accessible
        }
      }
      
      // Check main page for system messages
      const pageText = await this.page.textContent('body') || '';
      const systemUnavailableKeywords = [
        'en estos momentos no podemos',
        'sistema no disponible', 
        'servicio suspendido',
        'mantenimiento'
      ];
      
      for (const keyword of systemUnavailableKeywords) {
        if (pageText.toLowerCase().includes(keyword)) {
          this.log(`❌ System unavailable detected in main page: "${keyword}"`);
          return {
            available: false,
            message: `Sistema no disponible: ${keyword}`
          };
        }
      }
      
      this.log('✅ Banesco system appears to be available');
      return { available: true };
      
    } catch (error) {
      this.log(`⚠️  Error checking system availability: ${error}`);
      return { available: true }; // Assume available if we can't check
    }
  }

  /**
   * Authenticate with Banesco using Playwright
   */
  async login(): Promise<BanescoLoginResult> {
    this.log('🚀 Starting Banesco authentication process...');
    
    let maxRetries = 2; // Permitir hasta 2 reintentos por modal de conexión activa
    let attempt = 1;
    
    while (attempt <= maxRetries) {
      try {
        this.log(`🔄 Login attempt ${attempt}/${maxRetries}`);
        
        // Initialize browser if not already done
        if (!this.browser || !this.page) {
          await this.initializeBrowser();
        }
        
        if (!this.page) {
          throw new Error('Failed to initialize browser page');
        }

        await this.debugPause('Browser initialized - ready to navigate to login page');

        // Navigate to login page
        this.log('🌐 Navigating to Banesco login page...');
        await this.page.goto(BANESCO_URLS.LOGIN, { 
          waitUntil: 'domcontentloaded',
          timeout: this.config.timeout 
        });

        // Check system availability immediately after page load
        const systemStatus = await this.checkSystemAvailability();
        if (!systemStatus.available) {
          this.log('🚫 Banesco system is currently unavailable');
          
          await this.debugPause('System unavailable - check CAU iframe message');
          
          return {
            success: false,
            message: `Sistema Banesco no disponible: ${systemStatus.message}`,
            sessionValid: false,
            error: 'SYSTEM_UNAVAILABLE',
            systemMessage: systemStatus.message
          };
        }

        await this.debugPause('Login page loaded and system available - ready to find iframe');

        // Wait for and get the login iframe
        this.log('🖼️  Waiting for login iframe...');
        const frame = await this.waitForLoginIframe();
        
        if (!frame) {
          throw new Error('Login iframe not found or not accessible');
        }

        // Check for connection modals immediately after iframe is ready
        await this.handleConnectionModal(frame);

        await this.debugPause('Login iframe ready - about to start login process');

        const loginSuccess = await this.performLogin(frame);
        
        if (loginSuccess) {
          this.isAuthenticated = true;
          this.log('🎉 Banesco authentication successful!');
          
          await this.debugPause('Login completed successfully - authenticated page ready');
          
          return {
            success: true,
            message: 'Authentication successful',
            sessionValid: true
          };
        } else {
          await this.debugPause('Login process failed - check page state');
          
          return {
            success: false,
            message: 'Authentication failed during login process',
            sessionValid: false,
            error: 'Login process returned false'
          };
        }

      } catch (error: any) {
        if (error.message === 'RESTART_LOGIN_REQUIRED') {
          this.log(`🔄 Connection modal detected - restarting login (attempt ${attempt}/${maxRetries})`);
          
          // Close current browser and start fresh
          if (this.browser) {
            await this.browser.close();
            this.browser = null;
            this.page = null;
          }
          
          attempt++;
          
          if (attempt <= maxRetries) {
            this.log('⏳ Waiting before restart...');
            await new Promise(resolve => setTimeout(resolve, 3000));
            continue; // Retry login
          } else {
            this.log('❌ Max retries reached for connection modal handling');
            return {
              success: false,
              message: 'Max retries reached for active connection handling',
              sessionValid: false,
              error: 'CONNECTION_MODAL_MAX_RETRIES'
            };
          }
        }
        
        this.log(`💥 Banesco authentication error: ${error.message || error}`);
        
        await this.debugPause(`Error occurred: ${error.message} - inspect page state`);
        
        return {
          success: false,
          message: `Authentication failed: ${error.message}`,
          sessionValid: false,
          error: error.message
        };
      }
    }
    
    // This should never be reached, but just in case
    return {
      success: false,
      message: 'Unexpected end of login attempts',
      sessionValid: false,
      error: 'UNEXPECTED_END'
    };
  }

  /**
   * Initialize Playwright browser and page
   */
  private async initializeBrowser(): Promise<void> {
    this.log('🌐 Initializing browser...');
    
    this.browser = await chromium.launch({
      headless: this.config.headless,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu'
      ]
    });

    const context = await this.browser.newContext({
      viewport: { width: 1366, height: 768 },
      userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      extraHTTPHeaders: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      }
    });

    this.page = await context.newPage();
    
    // Set default timeout
    this.page.setDefaultTimeout(this.config.timeout);
    
    if (this.config.debug) {
      this.log('🐛 Browser initialized in debug mode');
      this.log(`📱 Viewport: 1366x768, Headless: ${this.config.headless}`);
      this.log(`⏱️  Timeout: ${this.config.timeout}ms`);
      this.log(`📄 Log file: ${this.logFile}`);
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
      // Step 1: Enter username and submit to get to security questions
      this.log('👤 Entering username...');
      await this.enterUsername(frame);
      
      await this.debugPause('Username entered - ready to handle modals');

      // Step 2: Handle any connection modals
      await this.handleConnectionModal(frame);
      
      // Step 3: Submit username to proceed to security questions page
      this.log('🔄 Submitting username to proceed...');
      await this.submitUsernameForm(frame);
      
      await this.debugPause('Username submitted - checking for security questions');

      // Step 4: Check for and handle security questions
      const hasSecurityQuestions = await this.checkForSecurityQuestions(frame);
      
      if (hasSecurityQuestions) {
        this.log('🛡️  Security questions detected');
        
        await this.debugPause('Security questions detected - about to handle them');
        
        const securityHandled = await this.securityHandler.handleSecurityQuestions(frame);
        
        if (!securityHandled) {
          this.log('❌ Failed to handle security questions');
          
          await this.debugPause('Security questions handling failed - check answers');
          
          return false;
        }
        
        // Step 5: Submit security questions to proceed to password page
        this.log('🔄 Submitting security questions to proceed...');
        
        await this.debugPause('Security questions filled - ready to submit form');
        
        await this.submitSecurityQuestionsForm(frame);
        
        await this.debugPause('Security questions submitted - ready for password');
      } else {
        this.log('✅ No security questions required');
        
        await this.debugPause('No security questions - proceeding to password entry');
      }

      // Step 6: Enter password
      this.log('🔑 Entering password...');
      await this.enterPassword(frame);
      
      await this.debugPause('Password entered and form submitted - waiting for response');

      // Step 7: Verify login success
      return await this.verifyLoginSuccess();

    } catch (error) {
      this.log(`❌ Login process failed: ${error}`);
      
      await this.debugPause(`Login process error: ${error} - inspect current state`);
      
      return false;
    }
  }

  /**
   * Enter username in the login form
   */
  private async enterUsername(frame: Frame): Promise<void> {
    const usernameSelector = '#txtUsuario';
    
    try {
      const isReady = await this.waitForElementReady(frame, usernameSelector);
      if (!isReady) {
        throw new Error('Username field not ready');
      }
      
      const usernameField = await frame.$(usernameSelector);
      
      if (!usernameField) {
        throw new Error('Username field not found');
      }

      await usernameField.click();
      await usernameField.fill(this.credentials.username);
      
      // Trigger blur event to validate username and wait for any validation
      await frame.evaluate(`document.querySelector('${usernameSelector}').blur()`);
      
      // Wait for any validation or UI changes
      await frame.waitForFunction(
        (selector) => {
          const element = document.querySelector(selector) as HTMLInputElement;
          return element && element.value.length > 0;
        },
        usernameSelector,
        { timeout: 5000 }
      );
      
      this.log('✅ Username entered successfully');
      
    } catch (error) {
      this.log(`❌ Failed to enter username: ${error}`);
      throw error;
    }
  }

  /**
   * Submit username form to proceed to security questions
   */
  private async submitUsernameForm(frame: Frame): Promise<void> {
    try {
      this.log('🔄 Attempting to submit username form...');
      
      // Look for submit button or continue button after username entry
      const submitSelectors = [
        '#btnContinuar',
        '#btnSiguiente', 
        '#btnNext',
        'input[type="submit"]',
        'button[type="submit"]',
        '.btn-primary'
      ];
      
      // Use fast method - try immediate first, wait as fallback
      const buttonClicked = await this.findAndClickSubmitButtonFast(frame, 'username', submitSelectors);
      
      if (!buttonClicked) {
        // Try pressing Enter on username field as fallback
        this.log('⌨️  No submit button found, pressing Enter on username field');
        const usernameField = await frame.$('#txtUsuario');
        if (usernameField) {
          await usernameField.press('Enter');
        }
      }
      
      // Wait a moment for page response
      await frame.waitForTimeout(2000);
      
      // Check for modals that might appear after form submission
      await this.handleConnectionModal(frame);
      
      // Wait for navigation by looking for expected elements (security questions or password field)
      const expectedElements = [
        '#lblPrimeraP',    // Security questions
        '#lblSegundaP',
        '#txtClave',       // Password field (if no security questions)
        '.security-questions', // Alternative security questions container
        '.password-form'   // Alternative password form
      ];
      
      const navigationSuccess = await this.waitForNavigation(frame, expectedElements);
      
      if (navigationSuccess) {
        this.log('✅ Username form submitted successfully');
        
        // Check for modals again after navigation
        await this.handleConnectionModal(frame);
      } else {
        this.log('⚠️  Username form submitted but navigation unclear');
      }
      
    } catch (error) {
      this.log(`❌ Failed to submit username form: ${error}`);
      // Don't throw error as this might not be critical
    }
  }

  /**
   * Handle connection modal if it appears
   */
  private async handleConnectionModal(frame: Frame): Promise<void> {
    try {
      this.log('🔍 Checking for connection modals...');
      
      // Wait a moment for any modals to appear
      await frame.waitForTimeout(1000);
      
      // Strategy 1: Check for "conexión activa" modal by text content
      const activeConnectionTexts = [
        'conexión activa',
        'existe una conexión activa',
        'Hemos detectado que existe una conexión activa',
        'para continuar presione "Aceptar"'
      ];
      
      for (const text of activeConnectionTexts) {
        try {
          const bodyContent = await frame.textContent('body') || '';
          if (bodyContent.toLowerCase().includes(text.toLowerCase())) {
            this.log(`🚨 Active connection modal detected: "${text}"`);
            
            // Look for "Aceptar" button specifically
            const acceptSelectors = [
              'button:has-text("Aceptar")',
              'input[value="Aceptar"]',
              'input[value*="Aceptar"]',
              '#btnAceptar',
              '#btnAceptarModal',
              '.modal button:has-text("Aceptar")',
              'button[onclick*="Aceptar"]'
            ];
            
            let modalHandled = false;
            
            for (const selector of acceptSelectors) {
              try {
                const acceptButton = await frame.$(selector);
                if (acceptButton && await acceptButton.isVisible()) {
                  this.log(`🔘 Clicking "Aceptar" button: ${selector}`);
                  await acceptButton.click();
                  modalHandled = true;
                  
                  // Wait for modal to close and page to potentially reload
                  await frame.waitForTimeout(3000);
                  this.log('✅ Active connection modal handled - session will restart');
                  
                  // Return special flag to indicate we need to restart login
                  throw new Error('RESTART_LOGIN_REQUIRED');
                }
              } catch (e) {
                // Continue trying other selectors
              }
            }
            
            if (!modalHandled) {
              this.log('⚠️  Found active connection text but no "Aceptar" button');
            }
            
            return; // Exit after handling active connection modal
          }
        } catch (e) {
          // Continue checking other texts
        }
      }
      
      // Strategy 2: Check for general modal buttons (fallback)
      const generalModalSelectors = [
        '#btnSiModal',
        '#btnAceptarModal', 
        '#btnOkModal',
        'button[id*="Modal"]',
        '.modal-dialog button',
        '.modal-content button',
        'button:has-text("Si")',
        'button:has-text("OK")',
        'button:has-text("Continuar")'
      ];
      
      // Quick check - no long timeouts, just see if they exist immediately
      for (const selector of generalModalSelectors) {
        try {
          const button = await frame.$(selector);
          if (button && await button.isVisible() && await button.isEnabled()) {
            const buttonText = await button.textContent() || '';
            this.log(`🔘 Clicking general modal button: ${selector} - "${buttonText}"`);
            await button.click();
            
            // Wait for modal to disappear
            await frame.waitForSelector(selector, {
              state: 'hidden',
              timeout: 3000
            }).catch(() => {
              // Modal might not disappear cleanly, that's ok
            });
            
            this.log('✅ General modal handled successfully');
            return; // Exit after handling first modal
          }
        } catch (e) {
          // Continue to next selector
        }
      }
      
      this.log('ℹ️  No modals detected');
      
    } catch (error) {
      // Modal handling is optional, don't fail login for this
      this.log(`⚠️  Error during modal handling: ${error}`);
    }
  }

  /**
   * Check if security questions are present
   */
  private async checkForSecurityQuestions(frame: Frame): Promise<boolean> {
    try {
      // Check for common security question elements
      const securitySelectors = [
        '#lblPrimeraP',
        '#lblSegundaP', 
        '#lblTerceraP',
        '#lblCuartaP'
      ];
      
      for (const selector of securitySelectors) {
        try {
          const element = await frame.waitForSelector(selector, {
            timeout: 3000,
            state: 'visible'
          });
          
          if (element) {
            this.log(`🔍 Security question found: ${selector}`);
            return true;
          }
        } catch (e) {
          // Continue checking other selectors
        }
      }
      
      this.log('🔍 No security questions detected');
      return false;
      
    } catch (error) {
      this.log(`⚠️  Error checking for security questions: ${error}`);
      return false;
    }
  }

  /**
   * Enter password in the login form
   */
  private async enterPassword(frame: Frame): Promise<void> {
    const passwordSelector = '#txtClave';
    
    try {
      // Wait longer for password field since it appears after navigation
      this.log('⏳ Waiting for password field to appear...');
      const passwordReady = await this.waitForElementReady(frame, passwordSelector, 20000);
      
      if (!passwordReady) {
        // Alternative password selectors to try
        const alternativeSelectors = [
          '#password', '#txtPassword', '#clave', 
          'input[type="password"]', '[name="password"]'
        ];
        
        this.log('🔍 Password field not ready, trying alternative selectors...');
        for (const selector of alternativeSelectors) {
          const altReady = await this.waitForElementReady(frame, selector, 5000);
          if (altReady) {
            this.log(`✅ Found alternative password field: ${selector}`);
            // Update selector for this session
            await this.enterPasswordWithSelector(frame, selector);
            return;
          }
        }
        
        throw new Error('Password field not found with any selector');
      }
      
      await this.enterPasswordWithSelector(frame, passwordSelector);
      
    } catch (error) {
      this.log(`❌ Failed to enter password: ${error}`);
      throw error;
    }
  }

  /**
   * Enter password with specific selector
   */
  private async enterPasswordWithSelector(frame: Frame, selector: string): Promise<void> {
    const passwordField = await frame.$(selector);
    
    if (!passwordField) {
      throw new Error(`Password field not found: ${selector}`);
    }

    // Ensure field is visible and ready
    const isVisible = await passwordField.isVisible();
    const isEnabled = await passwordField.isEnabled();
    
    if (!isVisible) {
      throw new Error('Password field is not visible');
    }
    
    if (!isEnabled) {
      throw new Error('Password field is not enabled');
    }

    this.log(`🔑 Password field found and ready: ${selector}`);
    await passwordField.click();
    await passwordField.fill(this.credentials.password);
    
    // Verify password was entered
    const fieldValue = await passwordField.inputValue();
    if (fieldValue.length === 0) {
      throw new Error('Password was not entered in field');
    }
    
    this.log(`✅ Password entered successfully (${fieldValue.length} characters)`);
    
    // Wait a moment before submitting
    await frame.waitForTimeout(1000);
    
    // Submit the form
    await this.submitPasswordForm(frame);
  }

  /**
   * Submit password form
   */
  private async submitPasswordForm(frame: Frame): Promise<void> {
    const submitSelectors = [
      '#btnEntrar', '#btnSubmit', '#btnLogin', 
      'input[type="submit"]', 'button[type="submit"]',
      '[id*="entrar"]', '[id*="login"]'
    ];
    
    // Try immediate buttons first
    for (const selector of submitSelectors) {
      try {
        const button = await frame.$(selector);
        if (button && await button.isVisible() && await button.isEnabled()) {
          this.log(`🔘 Clicking password submit button: ${selector}`);
          await button.click();
          this.log('✅ Password form submitted');
          return;
        }
      } catch (e) {
        // Continue to next selector
      }
    }
    
    // Fallback: try submitting via Enter key
    this.log('⌨️  No submit button found, pressing Enter on password field');
    const passwordField = await frame.$('#txtClave, #password, input[type="password"]');
    if (passwordField) {
      await passwordField.press('Enter');
      this.log('✅ Password form submitted via Enter');
    } else {
      this.log('⚠️  Could not submit password form');
    }
  }

  /**
   * Submit security questions form to proceed to password page
   */
  private async submitSecurityQuestionsForm(frame: Frame): Promise<void> {
    try {
      this.log('🔄 Attempting to submit security questions form...');
      
      // Look for submit button after security questions
      const submitSelectors = [
        '#btnContinuar',
        '#btnSiguiente',
        '#btnNext', 
        '#btnSubmitPreguntas',
        'input[type="submit"]',
        'button[type="submit"]',
        '.btn-primary',
        '[id*="continuar"]',
        '[id*="siguiente"]',
        '[value*="continuar"]',
        '[value*="siguiente"]',
        '[value*="aceptar"]'
      ];
      
      // Use fast method - try immediate first, wait as fallback
      const buttonClicked = await this.findAndClickSubmitButtonFast(frame, 'security questions', submitSelectors);
      
      if (!buttonClicked) {
        // Try pressing Enter on the last filled security question field
        this.log('⌨️  No submit button worked, trying Enter on security question fields...');
        const questionInputs = ['#txtCuartaR', '#txtTerceraR', '#txtSegundaR', '#txtPrimeraR'];
        
        for (const inputSelector of questionInputs) {
          try {
            const input = await frame.$(inputSelector);
            if (input && await input.isVisible()) {
              const value = await input.inputValue();
              if (value.length > 0) { // Only press Enter if field has content
                this.log(`   ⌨️  Pressing Enter on filled field: ${inputSelector} (value: "${value}")`);
                await input.press('Enter');
                break;
              } else {
                this.log(`   ⏭️  Field ${inputSelector} is empty, skipping...`);
              }
            }
          } catch (e) {
            this.log(`   ❌ Error with input ${inputSelector}: ${e}`);
            // Continue to next input
          }
        }
      }
      
      // Wait for navigation to password page with specific elements
      const passwordPageElements = [
        '#txtClave',           // Main password field
        '#password',           // Alternative password field
        'input[type="password"]', // Generic password input
        '[id*="clave"]',       // Spanish password variations
        '[id*="password"]'     // English password variations
      ];
      
      this.log('⏳ Waiting for navigation to password page...');
      const navigationSuccess = await this.waitForNavigation(frame, passwordPageElements, 20000);
      
      if (navigationSuccess) {
        this.log('✅ Security questions form submitted successfully - password page ready');
      } else {
        this.log('⚠️  Security questions submitted but password page not detected');
        
        // Additional diagnostic
        this.log('🔍 Checking current page state...');
        await this.diagnoseCurrentPageState(frame);
      }
      
    } catch (error) {
      this.log(`❌ Failed to submit security questions form: ${error}`);
      // Don't throw error as this might not be critical
    }
  }

  /**
   * Diagnose current page state for debugging
   */
  private async diagnoseCurrentPageState(frame: Frame): Promise<void> {
    try {
      // Check for common elements that indicate page state
      const indicators = [
        { selector: '#txtClave', meaning: 'Password page' },
        { selector: '#lblPrimeraP', meaning: 'Security questions page' },
        { selector: '#txtUsuario', meaning: 'Username page' },
        { selector: '[id*="menu"]', meaning: 'Main menu/dashboard' },
        { selector: '.error', meaning: 'Error page' },
        { selector: '[id*="error"]', meaning: 'Error indicator' }
      ];
      
      for (const indicator of indicators) {
        try {
          const element = await frame.$(indicator.selector);
          if (element && await element.isVisible()) {
            this.log(`🔍 Page indicator found: ${indicator.meaning} (${indicator.selector})`);
          }
        } catch (e) {
          // Element not found, continue
        }
      }
      
      // Check URL if available
      try {
        const url = frame.url();
        this.log(`🌐 Current frame URL: ${url}`);
      } catch (e) {
        this.log('🌐 Cannot access frame URL');
      }
      
    } catch (error) {
      this.log(`❌ Error during page diagnosis: ${error}`);
    }
  }

  /**
   * Verify if login was successful
   */
  private async verifyLoginSuccess(): Promise<boolean> {
    if (!this.page) return false;

    try {
      this.log('🔍 Verifying login success...');
      
      // Wait for navigation or specific success indicators
      await this.page.waitForTimeout(3000);
      
      const currentUrl = this.page.url();
      this.log(`📍 Current URL: ${currentUrl}`);
      
      // Check for successful login indicators - IMPROVED
      const successUrlPatterns = [
        'Default.aspx',     // ✅ Main Banesco page
        'menu',
        'principal', 
        'home',
        'dashboard',
        'main',
        'MainPage',
        'inicio'
      ];
      
      const urlBasedSuccess = successUrlPatterns.some(pattern => 
        currentUrl.toLowerCase().includes(pattern.toLowerCase())
      );
      
      if (urlBasedSuccess) {
        this.log('✅ Login verification successful by URL pattern');
        return true;
      }
      
      // Additional check: look for specific elements that indicate successful login
      const successSelectors = [
        '[id*="menu"]', '[id*="usuario"]', '.user-info',
        '[id*="welcome"]', '[id*="bienvenido"]', 
        '[class*="menu"]', '[class*="navigation"]',
        'a[href*="logout"]', 'a[href*="salir"]',
        '.main-menu', '.top-menu', '#mainMenu'
      ];
      
      this.log('🔍 Checking for success elements...');
      for (const selector of successSelectors) {
        try {
          const element = await this.page.waitForSelector(selector, { timeout: 2000 });
          if (element && await element.isVisible()) {
            this.log(`✅ Login verified by success element: ${selector}`);
            return true;
          }
        } catch (e) {
          // Continue checking other selectors
        }
      }
      
      // Check page title for success indicators
      const pageTitle = await this.page.title();
      this.log(`📄 Page title: "${pageTitle}"`);
      
      const successTitlePatterns = [
        'banesco online', 'banca online', 'menu principal', 
        'inicio', 'principal', 'dashboard', 'home'
      ];
      
      const titleBasedSuccess = successTitlePatterns.some(pattern =>
        pageTitle.toLowerCase().includes(pattern.toLowerCase())
      );
      
      if (titleBasedSuccess) {
        this.log('✅ Login verified by page title');
        return true;
      }
      
      // Check if we're NOT on the login page anymore
      const loginIndicators = ['txtUsuario', 'txtClave', 'login', 'acceso'];
      let isStillOnLoginPage = false;
      
      for (const indicator of loginIndicators) {
        try {
          const element = await this.page.$(`[id*="${indicator}"], [name*="${indicator}"]`);
          if (element && await element.isVisible()) {
            isStillOnLoginPage = true;
            break;
          }
        } catch (e) {
          // Element not found, continue
        }
      }
      
      if (!isStillOnLoginPage && currentUrl !== 'about:blank') {
        this.log('✅ Login verified - no longer on login page');
        return true;
      }
      
      this.log('❌ Login verification failed - still appears to be on login/error page');
      
      // Final diagnostic
      this.log('🔍 Final page diagnosis:');
      this.log(`   📍 URL: ${currentUrl}`);
      this.log(`   📄 Title: ${pageTitle}`);
      
      // Take screenshot for manual verification
      try {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const screenshotPath = `login-verification-${timestamp}.png`;
        await this.page.screenshot({ 
          path: screenshotPath,
          fullPage: true 
        });
        this.log(`📸 Screenshot saved for manual verification: ${screenshotPath}`);
      } catch (screenshotError) {
        this.log(`❌ Failed to take screenshot: ${screenshotError}`);
      }
      
      return false;
      
    } catch (error) {
      this.log(`❌ Error during login verification: ${error}`);
      return false;
    }
  }

  /**
   * Get the authenticated page for further operations
   */
  getPage(): Page | null {
    return this.isAuthenticated ? this.page : null;
  }

  /**
   * Check if currently authenticated
   */
  isLoggedIn(): boolean {
    return this.isAuthenticated;
  }

  /**
   * Get current page URL
   */
  async getCurrentUrl(): Promise<string | null> {
    return this.page ? this.page.url() : null;
  }

  /**
   * Get log file path
   */
  getLogFile(): string {
    return this.logFile;
  }

  /**
   * Get log content
   */
  getLogContent(): string {
    try {
      if (existsSync(this.logFile)) {
        const fs = require('fs');
        return fs.readFileSync(this.logFile, 'utf-8');
      }
      return 'Log file not found';
    } catch (error) {
      return `Error reading log file: ${error}`;
    }
  }

  /**
   * Export logs to a specific file
   */
  exportLogs(targetPath: string): boolean {
    try {
      const content = this.getLogContent();
      writeFileSync(targetPath, content);
      this.log(`📤 Logs exported to: ${targetPath}`);
      return true;
    } catch (error) {
      this.log(`❌ Failed to export logs: ${error}`);
      return false;
    }
  }

  /**
   * Close browser and cleanup resources
   */
  async close(): Promise<void> {
    try {
      if (this.page) {
        await this.page.close();
        this.page = null;
      }
      
      if (this.browser) {
        await this.browser.close();
        this.browser = null;
      }
      
      this.isAuthenticated = false;
      this.log('🧹 Browser resources cleaned up');
      this.log(`📄 Debug session log saved to: ${this.logFile}`);
      
    } catch (error) {
      this.log(`⚠️  Error during cleanup: ${error}`);
    }
  }

  /**
   * Find and click submit button efficiently - try immediate first, then wait as fallback
   */
  private async findAndClickSubmitButtonFast(frame: Frame, buttonType: string, selectors: string[]): Promise<boolean> {
    this.log(`🔍 Searching for ${buttonType} submit button...`);
    
    // FIRST: Try to find immediately available buttons (no timeout)
    for (const selector of selectors) {
      try {
        const elements = await frame.$$(selector);
        
        if (elements.length > 0) {
          this.log(`🎯 Found immediate ${buttonType} button: ${selector} (${elements.length} elements)`);
          
          for (let i = 0; i < elements.length; i++) {
            const element = elements[i];
            
            try {
              const isVisible = await element.isVisible();
              const isEnabled = await element.isEnabled();
              
              if (isVisible && isEnabled) {
                const text = await element.textContent() || '';
                this.log(`🔘 Clicking immediate ${buttonType} button: ${selector} - "${text.trim()}"`);
                await element.click();
                this.log(`✅ ${buttonType} button clicked successfully`);
                return true;
              }
            } catch (elementError) {
              // Try next element
            }
          }
        }
      } catch (selectorError) {
        // Try next selector
      }
    }
    
    // FALLBACK: If no immediate buttons found, wait for them (rare case)
    this.log(`⏳ No immediate ${buttonType} buttons found, waiting as fallback...`);
    
    for (const selector of selectors) {
      try {
        const buttonReady = await this.waitForElementReady(frame, selector, 3000);
        if (buttonReady) {
          const button = await frame.$(selector);
          if (button) {
            this.log(`🔘 Clicking waited ${buttonType} button: ${selector}`);
            await button.click();
            this.log(`✅ ${buttonType} button clicked successfully (after wait)`);
            return true;
          }
        }
      } catch (e) {
        // Continue to next selector
      }
    }
    
    this.log(`❌ No viable ${buttonType} submit button found`);
    return false;
  }
} 