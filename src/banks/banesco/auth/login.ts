import { Page, Frame } from 'playwright';
import { BanescCredentials, LoginResult } from '../types/index';
import { PersistentBrowserServer } from '../../../shared/utils/browser-server';
import { HTMLSaver } from '../../../shared/utils/html-saver';
import { SecurityQuestionsHandler } from './security-questions';
import { StrategicLogger } from '../../../shared/utils/strategic-logger';

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
      // Esperar un poco para que aparezcan los modales
      await frame.waitForTimeout(500);
      
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
                    await frame.waitForTimeout(1000);
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
                  await frame.waitForTimeout(500);
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

  private async waitForElementWithSmartTimeout(frame: Frame, selector: string, description: string = '', maxTimeout = 10000): Promise<any> {
    const operationId = this.logger.startOperation(`wait_element_${description || 'unknown'}`);
    this.logger.trace(`Waiting for element: ${selector}`, { 
      selector, 
      description, 
      timeout: maxTimeout 
    });
    
    try {
      // Esperar a que el DOM esté listo
      await frame.waitForLoadState('domcontentloaded', { timeout: 5000 });
      
      // Esperar el elemento específico
      const element = await frame.waitForSelector(selector, { 
        timeout: maxTimeout,
        state: 'visible'
      });
      
      if (element) {
        // Verificar que sea interactuable
        await element.waitForElementState('stable', { timeout: 2000 });
        this.logger.success(`Element found and stable: ${selector}`);
        this.logger.endOperation(operationId);
        return element;
      }
      
    } catch (error) {
      this.logger.error(`Element not found: ${selector}`, error);
      this.logger.endOperation(operationId);
      throw new Error(`Element ${selector} not found in ${maxTimeout}ms`);
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

      // PASO 1: Navegar a la página de login
      const navigationId = this.logger.startOperation('navigation');
      this.logger.info('Navigating to Login.aspx');
      
      await page.goto('https://www.banesconline.com/mantis/Website/Login.aspx', { 
        waitUntil: 'domcontentloaded',
        timeout: 15000 
      });
      
      // Esperar a que el iframe esté disponible
      await page.waitForSelector('iframe#ctl00_cp_frmAplicacion', { timeout: 10000 });
      await this.htmlSaver.saveHTML(page, 'login-step1-container.html');
      this.logger.endOperation(navigationId);

      // PASO 2: Acceder al iframe
      this.logger.info('Accessing iframe');
      const iframeElement = await page.waitForSelector('iframe#ctl00_cp_frmAplicacion', { 
        timeout: 10000,
        state: 'attached'
      });
      
      const frame = await iframeElement.contentFrame();
      if (!frame) {
        throw new Error('No se pudo acceder al iframe');
      }
      
      await frame.waitForLoadState('domcontentloaded');
      await this.htmlSaver.saveFrameHTML(frame, 'login-step2-iframe.html');

      await this.handleModals(frame);

      // PASO 3: Llenar usuario
      const usernameId = this.logger.startOperation('username_input');
      this.logger.info('Step 1: Filling username');
      
      const usernameInput = await this.waitForElementWithSmartTimeout(frame, 'input[name="txtUsuario"]', 'usuario');
      await usernameInput.fill(this.credentials.username);
      await frame.waitForTimeout(300); // Tiempo mínimo para que se registre el cambio
      await this.htmlSaver.saveFrameHTML(frame, 'login-step3-username-filled.html');
      this.logger.endOperation(usernameId);

      // PASO 4: Enviar usuario
      this.logger.info('Submitting username');
      try {
        const submitButton = await this.waitForElementWithSmartTimeout(frame, 'input[name="bAceptar"]', 'botón de envío');
        await submitButton.click();
      } catch (e) {
        this.logger.info('Using JavaScript');
        await frame.evaluate(() => {
          const form = document.querySelector('form');
          if (form) form.submit();
        });
      }
      
      await frame.waitForTimeout(2000);
      await this.htmlSaver.saveFrameHTML(frame, 'login-step4-after-username.html');
      const activeConnectionDetected = await this.handleModals(frame);

      // Si se detectó modal de conexión activa, esperar y reintentar
      if (activeConnectionDetected) {
        this.logger.info('Active connection handled, waiting before continuing');
        await frame.waitForTimeout(3000); // Esperar 3 segundos antes de continuar
        
        // Verificar si necesitamos reintroducir el usuario
        try {
          const userField = await frame.$('input[name="txtUsuario"]');
          if (userField) {
            const userValue = await userField.inputValue();
            if (!userValue || userValue !== this.credentials.username) {
              this.logger.info('Re-filling username after modal');
              await userField.fill(this.credentials.username);
              await frame.waitForTimeout(500);
              
              // Reenviar
              const submitButton = await this.waitForElementWithSmartTimeout(frame, 'input[name="bAceptar"]', 'botón de envío');
              await submitButton.click();
              await frame.waitForTimeout(2000);
              await this.htmlSaver.saveFrameHTML(frame, 'login-step4b-after-retry.html');
            }
          }
        } catch (e) {
          this.logger.info('No need to re-fill username after modal');
        }
      }

      // PASO 5: Verificar y manejar preguntas de seguridad
      this.logger.info('Step 2: Verifying security questions');
      
      let securityQuestionsHandled = false;
      try {
        const firstQuestionLabel = await frame.$('#lblPrimeraP');
        if (firstQuestionLabel) {
          this.logger.info('Security questions found, answering');
          securityQuestionsHandled = await this.securityHandler.handleSecurityQuestions(frame);
          
          if (securityQuestionsHandled) {
            await this.htmlSaver.saveFrameHTML(frame, 'login-step5-security-filled.html');
            
            // Enviar respuestas de seguridad
            this.logger.info('Submitting security answers');
            const securitySubmit = await this.waitForElementWithSmartTimeout(frame, 'input[name="bAceptar"]', 'botón de envío');
            await securitySubmit.click();
            
            await frame.waitForTimeout(2000);
            await this.htmlSaver.saveFrameHTML(frame, 'login-step6-after-security.html');
            await this.handleModals(frame);

            // VERIFICAR SI YA ESTAMOS EN EL ÁREA BANCARIA DESPUÉS DE LAS PREGUNTAS
            this.logger.info('Verifying if we are in the banking area after questions');
            
            try {
              await page.waitForTimeout(2000);
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

      // PASO 6: Buscar y llenar campo de clave (solo si no estamos ya autenticados)
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
          const passwordInput = await this.waitForElementWithSmartTimeout(frame, selector, 'contraseña');
          this.logger.info(`Password field found: ${selector}`);
          this.logger.info('Filling password');
          await passwordInput.fill(this.credentials.password);
          await frame.waitForTimeout(300);
          await this.htmlSaver.saveFrameHTML(frame, 'login-step7-password-filled.html');
          
          // Buscar botón de envío
          const passwordSubmit = await this.waitForElementWithSmartTimeout(frame, 'input[type="submit"], input[name="bAceptar"], button[type="submit"]', 'botón de envío');
          await passwordSubmit.click();
          
          await frame.waitForTimeout(2000);
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

      // PASO 7: Verificar que llegamos al área bancaria (página principal)
      this.logger.info('Step 4: Verifying banking area access');
      
      // Esperar a que se complete la navegación después del login
      try {
        await page.waitForLoadState('domcontentloaded', { timeout: 10000 });
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
              
              await page.waitForTimeout(2000);
              
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