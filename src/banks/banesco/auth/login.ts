import { Page, Frame } from 'playwright';
import { BanescCredentials, LoginResult } from '../types/index';
import { PersistentBrowserServer } from '../../../shared/utils/browser-server';
import { HTMLSaver } from '../../../shared/utils/html-saver';
import { SecurityQuestionsHandler } from './security-questions';
import { StrategicLogger } from '../../../shared/utils/strategic-logger';
import { SmartWaiter } from '../../../shared/utils/smart-waiter';

export class BanescLogin {
  private browserServer: PersistentBrowserServer;
  private htmlSaver: HTMLSaver;
  private securityHandler: SecurityQuestionsHandler;
  private credentials: BanescCredentials;
  private authenticatedPage: Page | null = null;
  private isLoggedIn: boolean = false;
  private logger = StrategicLogger.getInstance().createComponentLogger('BanescLogin');

  constructor(credentials: BanescCredentials, headless: boolean = false) {
    this.credentials = credentials;
    this.browserServer = PersistentBrowserServer.getInstance({ headless });
    this.htmlSaver = new HTMLSaver();
    this.securityHandler = new SecurityQuestionsHandler(credentials.securityQuestions);
    
    this.logger.debug('BanescLogin instance created', { 
      username: credentials.username.substring(0, 3) + '***',
      headless 
    });
  }

  private async handleModals(frame: Frame): Promise<boolean> {
    this.logger.trace('Starting modal verification');
    
    try {
      // Espera inteligente para que aparezcan los modales
      await SmartWaiter.smartDelay(200, 'modal detection');
      
      const modalSelectors = [
        '.swal2-container',
        '.swal2-modal', 
        '.swal2-popup',
        'div[class*="swal"]',
        '.modal',
        '.popup',
        'div[style*="display: block"]'
      ];
      
      for (const selector of modalSelectors) {
        try {
          const modal = await frame.$(selector);
          if (modal) {
            const modalText = await modal.textContent() || '';
            this.logger.info(`Modal detected: ${selector}`, {
              selector,
              content: modalText.substring(0, 100) + '...'
            });
            
            // DETECTAR MODAL DE CONEXIÓN ACTIVA
            if (modalText.includes('conexión activa') || 
                modalText.includes('Hemos detectado que existe una conexión activa') ||
                modalText.includes('acceda a la Banca por internet nuevamente')) {
              
              this.logger.warn('Active connection modal detected - accepting');
              
              const acceptButtons = [
                'button:has-text("Aceptar")',
                'button:has-text("ACEPTAR")',
                'button:has-text("Continuar")',
                'button:has-text("OK")',
                '.swal2-confirm',
                'input[value="Aceptar"]',
                'input[value="ACEPTAR"]'
              ];
              
              for (const btnSelector of acceptButtons) {
                try {
                  const button = await frame.$(btnSelector);
                  if (button) {
                    this.logger.success(`Accepting active connection modal`, { button: btnSelector });
                    await button.click();
                    await SmartWaiter.smartDelay(500, 'modal action processing');
                    return true; // Retornar que se manejó el modal de conexión activa
                  }
                } catch (e) {
                  // Continue trying other selectors
                }
              }
            }
            
            // OTROS MODALES GENERALES
            const closeButtons = [
              '.swal2-confirm',
              '.swal2-close',
              'button[class*="confirm"]',
              'button:has-text("Aceptar")',
              'button:has-text("Continuar")',
              'button:has-text("OK")',
              'button:has-text("Cerrar")'
            ];
            
            for (const btnSelector of closeButtons) {
              try {
                const button = await frame.$(btnSelector);
                if (button) {
                  this.logger.info(`Closing modal`, { button: btnSelector });
                  await button.click();
                  await SmartWaiter.smartDelay(300, 'modal close processing');
                  return false; // Modal general cerrado
                }
              } catch (e) {
                // Continue trying other selectors
              }
            }
          }
        } catch (e) {
          // Continue checking other modal selectors
        }
      }
      
      this.logger.trace('No active modals found');
      return false;
      
    } catch (error) {
      this.logger.warn('Error checking modals', error);
      return false;
    }
  }

  async login(): Promise<LoginResult> {
    const loginOperationId = this.logger.startOperation('login');
    
    // Si ya estamos logueados, no hacer login de nuevo
    if (this.isLoggedIn && this.authenticatedPage) {
      this.logger.info('Active session found, reusing');
      this.logger.endOperation(loginOperationId);
      return {
        success: true,
        message: 'Sesión activa reutilizada',
        sessionValid: true
      };
    }

    this.logger.info('Starting Banesco login process', { 
      username: this.credentials.username.substring(0, 2) + '***' 
    });

    try {
      await this.browserServer.start();
      const page = await this.browserServer.newPage();

      // PASO 1: Navegar a la página de login con espera inteligente
      const navigationId = this.logger.startOperation('navigation');
      this.logger.info('Navigating to Login.aspx');
      
      await page.goto('https://www.banesconline.com/mantis/Website/Login.aspx', { 
        waitUntil: 'domcontentloaded',
        timeout: 15000 
      });
      
      // Esperar inteligente a que el iframe esté disponible
      const frame = await SmartWaiter.waitForIframeReady(page, 'iframe#ctl00_cp_frmAplicacion', {
        description: 'login iframe'
      });
      
      await this.htmlSaver.saveHTML(page, 'login-step1-container.html');
      await this.htmlSaver.saveFrameHTML(frame, 'login-step2-iframe.html');
      this.logger.endOperation(navigationId);

      await this.handleModals(frame);

      // PASO 2: Llenar usuario con espera inteligente
      const usernameId = this.logger.startOperation('username_input');
      this.logger.info('Step 1: Filling username');
      
      const usernameInput = await SmartWaiter.waitForElementReady(frame, 'input[name="txtUsuario"]', {
        description: 'username input'
      });
      
      await usernameInput.fill(this.credentials.username);
      await SmartWaiter.smartDelay(200, 'username registration');
      await this.htmlSaver.saveFrameHTML(frame, 'login-step3-username-filled.html');
      this.logger.endOperation(usernameId);

      // PASO 3: Enviar usuario con manejo inteligente
      this.logger.info('Submitting username');
      try {
        const submitButton = await SmartWaiter.waitForElementReady(frame, 'input[name="bAceptar"]', {
          description: 'submit button'
        });
        await submitButton.click();
      } catch (e) {
        this.logger.info('Using JavaScript submit fallback');
        await frame.evaluate(() => {
          const form = document.querySelector('form');
          if (form) form.submit();
        });
      }
      
      // Esperar a que la página procese la entrada del usuario
      await SmartWaiter.waitForDOMReady(frame, { 
        timeout: 8000, 
        description: 'after username submission' 
      });
      
      await this.htmlSaver.saveFrameHTML(frame, 'login-step4-after-username.html');
      const activeConnectionDetected = await this.handleModals(frame);

      // Si se detectó modal de conexión activa, manejar re-entrada
      if (activeConnectionDetected) {
        this.logger.info('Active connection handled, re-checking username field');
        
        // Verificar si necesitamos reintroducir el usuario con espera inteligente
        try {
          const userField = await frame.$('input[name="txtUsuario"]');
          if (userField) {
            const userValue = await userField.inputValue();
            if (!userValue || userValue !== this.credentials.username) {
              this.logger.info('Re-filling username after modal');
              await userField.fill(this.credentials.username);
              await SmartWaiter.smartDelay(200, 'username re-registration');
              
              // Reenviar
              const submitButton = await SmartWaiter.waitForElementReady(frame, 'input[name="bAceptar"]', {
                description: 'submit button retry'
              });
              await submitButton.click();
              await SmartWaiter.waitForDOMReady(frame, { 
                timeout: 6000, 
                description: 'after username retry' 
              });
              await this.htmlSaver.saveFrameHTML(frame, 'login-step4b-after-retry.html');
            }
          }
        } catch (e) {
          this.logger.info('No need to re-fill username after modal');
        }
      }

      // PASO 4: Verificar y manejar preguntas de seguridad con esperas inteligentes
      this.logger.info('Step 2: Verifying security questions');
      
      let securityQuestionsHandled = false;
      try {
        // Esperar a que aparezcan las preguntas de seguridad si existen
        const firstQuestionLabel = await frame.waitForSelector('#lblPrimeraP', { 
          timeout: 5000,
          state: 'visible' 
        }).catch(() => null);
        
        if (firstQuestionLabel) {
          this.logger.info('Security questions found, answering');
          securityQuestionsHandled = await this.securityHandler.handleSecurityQuestions(frame);
          
          if (securityQuestionsHandled) {
            await this.htmlSaver.saveFrameHTML(frame, 'login-step5-security-filled.html');
            
            // Enviar respuestas de seguridad con espera inteligente
            this.logger.info('Submitting security answers');
            const securitySubmit = await SmartWaiter.waitForElementReady(frame, 'input[name="bAceptar"]', {
              description: 'security submit button'
            });
            await securitySubmit.click();
            
            await SmartWaiter.waitForDOMReady(frame, { 
              timeout: 8000, 
              description: 'after security submission' 
            });
            await this.htmlSaver.saveFrameHTML(frame, 'login-step6-after-security.html');
            await this.handleModals(frame);

            // VERIFICAR SI YA ESTAMOS EN EL ÁREA BANCARIA DESPUÉS DE LAS PREGUNTAS
            this.logger.info('Verifying if we are in the banking area after questions');
            
            try {
              await SmartWaiter.smartDelay(1000, 'banking area verification');
              const currentUrl = page.url();
              const pageTitle = await page.title();
              const pageContent = await page.content();
              
              this.logger.info('URL after questions', { url: currentUrl });
              this.logger.info('Title after questions', { title: pageTitle });
              
              // Si ya estamos en una página de Banesco que no es login, hemos terminado
              if (pageContent.includes('Banesco') && !pageContent.includes('Login') && 
                  (currentUrl.includes('index.aspx') || currentUrl.includes('default.aspx') || 
                   pageTitle.includes('BanescOnline') || pageContent.includes('Bienvenido'))) {
                
                this.logger.info('We are in the banking area after questions');
                await this.htmlSaver.saveHTML(page, 'login-SUCCESS-after-security.html');
                
                // Guardar la página autenticada
                this.authenticatedPage = page;
                this.isLoggedIn = true;
                
                this.logger.endOperation(loginOperationId);
                return {
                  success: true,
                  message: 'Login exitoso - Acceso directo después de preguntas de seguridad',
                  sessionValid: true
                };
              }
            } catch (e) {
              this.logger.info('Error verifying banking area after questions, continuing');
            }
          }
        } else {
          this.logger.info('No security questions found in this step');
        }
      } catch (e) {
        this.logger.info('Error finding security questions, continuing');
      }

      // PASO 5: Buscar y llenar campo de clave con esperas inteligentes
      this.logger.info('Step 3: Finding password field');
      
      let passwordHandled = false;
      const passwordSelectors = [
        'input[name="txtClave"]',
        'input[name="txtPassword"]', 
        'input[name="txtContrasena"]',
        'input[type="password"]'
      ];
      
      for (const selector of passwordSelectors) {
        try {
          const passwordInput = await SmartWaiter.waitForElementReady(frame, selector, {
            timeout: 5000,
            description: 'password field'
          });
          
          this.logger.info(`Password field found: ${selector}`);
          this.logger.info('Filling password');
          await passwordInput.fill(this.credentials.password);
          await SmartWaiter.smartDelay(200, 'password registration');
          await this.htmlSaver.saveFrameHTML(frame, 'login-step7-password-filled.html');
          
          // Buscar botón de envío con espera inteligente
          const passwordSubmit = await SmartWaiter.waitForElementReady(frame, 'input[type="submit"], input[name="bAceptar"], button[type="submit"]', {
            description: 'password submit button'
          });
          await passwordSubmit.click();
          
          await SmartWaiter.waitForDOMReady(frame, { 
            timeout: 8000, 
            description: 'after password submission' 
          });
          await this.htmlSaver.saveFrameHTML(frame, 'login-step8-after-password.html');
          await this.handleModals(frame);
          
          passwordHandled = true;
          break;
          
        } catch (e) {
          // Continue trying other selectors
        }
      }

      // Si no se encontró campo de clave, puede que ya estemos autenticados
      if (!passwordHandled) {
        this.logger.info('No password field found, checking if already authenticated');
      }

      // PASO 6: Verificar que llegamos al área bancaria con espera inteligente
      this.logger.info('Step 4: Verifying banking area access');
      
      // Esperar a que se complete la navegación después del login
      try {
        await SmartWaiter.waitForDOMReady(page, { 
          timeout: 10000, 
          description: 'banking area load' 
        });
      } catch (e) {
        this.logger.info('Timeout waiting for DOM, continuing');
      }
      
      try {
        // Verificar el estado actual de la página
        const currentUrl = page.url();
        const pageTitle = await page.title();
        const pageContent = await page.content();
        
        this.logger.info('Current URL', { url: currentUrl });
        this.logger.info('Current title', { title: pageTitle });
        
        // Verificar si estamos en una página de Banesco y no en login
        if (pageContent.includes('Banesco') && !pageContent.includes('Login')) {
          this.logger.info('Login successful! We are in the banking area');
          await this.htmlSaver.saveHTML(page, 'login-SUCCESS-area-bancaria.html');
          
          // Guardar la página autenticada
          this.authenticatedPage = page;
          this.isLoggedIn = true;
          
          this.logger.endOperation(loginOperationId);
          return {
            success: true,
            message: 'Login exitoso - Acceso completo al área bancaria',
            sessionValid: true
          };
        } else {
          // Si no estamos en el área bancaria, intentar navegar al index
          this.logger.info('No banking area detected, trying to navigate');
          
          const indexUrls = [
            'https://www.banesconline.com/Mantis/WebSite/index.aspx',
            'https://www.banesconline.com/mantis/Website/index.aspx'
          ];
          
          for (const url of indexUrls) {
            try {
              this.logger.info(`Trying: ${url}`);
              await page.goto(url, { 
                waitUntil: 'networkidle',
                timeout: 10000 
              });
              
              await SmartWaiter.smartDelay(1000, 'index page verification');
              
              const newPageTitle = await page.title();
              const newPageContent = await page.content();
              
              if (newPageContent.includes('Banesco') && !newPageContent.includes('Login')) {
                this.logger.info(`Login successful! Accessed: ${url}`);
                this.logger.info('Title', { title: newPageTitle });
                await this.htmlSaver.saveHTML(page, 'login-SUCCESS-index-banco.html');
                
                // Guardar la página autenticada
                this.authenticatedPage = page;
                this.isLoggedIn = true;
                
                this.logger.endOperation(loginOperationId);
                return {
                  success: true,
                  message: 'Login exitoso - Acceso completo al área bancaria',
                  sessionValid: true
                };
              }
              
            } catch (e: any) {
              this.logger.error(`Error with ${url}: ${e.message || e}`);
            }
          }
        }
        
      } catch (e: any) {
        this.logger.error('Error verifying banking area', e.message || e);
      }

      this.logger.endOperation(loginOperationId);
      return {
        success: false,
        message: 'Login parcial - No se pudo verificar acceso completo',
        sessionValid: false
      };

    } catch (error: any) {
      this.logger.error('Error in login process', error);
      this.logger.endOperation(loginOperationId);
      return {
        success: false,
        message: `Error durante el login: ${error.message || error}`,
        sessionValid: false
      };
    }
  }

  async getAuthenticatedPage(): Promise<Page | null> {
    // Si ya tenemos una página autenticada, devolverla
    if (this.isLoggedIn && this.authenticatedPage) {
      this.logger.info('Returning already authenticated page');
      return this.authenticatedPage;
    }
    
    // Si no hay sesión, hacer login primero
    const loginResult = await this.login();
    
    if (loginResult.success && this.authenticatedPage) {
      return this.authenticatedPage;
    }
    
    return null;
  }

  async close(): Promise<void> {
    this.isLoggedIn = false;
    this.authenticatedPage = null;
    await this.browserServer.close();
  }

  // Método para verificar si hay sesión activa
  isAuthenticated(): boolean {
    return this.isLoggedIn && this.authenticatedPage !== null;
  }

  // Método para obtener la URL actual de la página autenticada
  async getCurrentUrl(): Promise<string | null> {
    if (this.authenticatedPage) {
      return this.authenticatedPage.url();
    }
    return null;
  }
} 