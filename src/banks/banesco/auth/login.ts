import { Page, Frame } from 'playwright';
import { BanescCredentials, LoginResult } from '../types/index';
import { BrowserManager } from '../../../shared/utils/browser';
import { HTMLSaver } from '../../../shared/utils/html-saver';
import { SecurityQuestionsHandler } from './security-questions';

export class BanescLogin {
  private browserManager: BrowserManager;
  private htmlSaver: HTMLSaver;
  private securityHandler: SecurityQuestionsHandler;
  private credentials: BanescCredentials;
  private authenticatedPage: Page | null = null;
  private isLoggedIn: boolean = false;

  constructor(credentials: BanescCredentials, headless: boolean = false) {
    this.credentials = credentials;
    this.browserManager = new BrowserManager({ headless });
    this.htmlSaver = new HTMLSaver();
    this.securityHandler = new SecurityQuestionsHandler(credentials.securityQuestions);
  }

  private async handleModals(frame: Frame): Promise<boolean> {
    console.log('🔍 Verificando modales...');
    
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
            console.log(`⚠️  Modal encontrado: ${selector}`);
            console.log(`📄 Contenido: ${modalText.substring(0, 100)}...`);
            
            // DETECTAR MODAL DE CONEXIÓN ACTIVA
            if (modalText.includes('conexión activa') || 
                modalText.includes('Hemos detectado que existe una conexión activa') ||
                modalText.includes('acceda a la Banca por internet nuevamente')) {
              
              console.log('🔄 Modal de conexión activa detectado - Presionando Aceptar...');
              
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
                    console.log(`✅ Presionando Aceptar: ${btnSelector}`);
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
                  console.log(`✅ Cerrando modal con: ${btnSelector}`);
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
      
      console.log('ℹ️  No se encontraron modales activos');
      return false;
      
    } catch (error) {
      console.log('⚠️  Error verificando modales:', error);
      return false;
    }
  }

  private async waitForElementWithSmartTimeout(frame: Frame, selector: string, description: string = '', maxTimeout = 10000): Promise<any> {
    console.log(`⏳ Esperando elemento: ${selector} ${description ? `(${description})` : ''}`);
    
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
        console.log(`✅ Elemento encontrado y estable: ${selector}`);
        return element;
      }
      
    } catch (error) {
      console.log(`⚠️  Elemento no encontrado: ${selector} - ${error}`);
      throw new Error(`Elemento ${selector} no encontrado en ${maxTimeout}ms`);
    }
  }

  async login(): Promise<LoginResult> {
    // Si ya estamos logueados, no hacer login de nuevo
    if (this.isLoggedIn && this.authenticatedPage) {
      console.log('✅ Ya hay una sesión activa, reutilizando...');
      return {
        success: true,
        message: 'Sesión activa reutilizada',
        sessionValid: true
      };
    }

    console.log('🚀 Iniciando proceso de login a Banesco...');
    console.log(`👤 Usuario: ${this.credentials.username.substring(0, 2)}***`);

    try {
      await this.browserManager.launch();
      const page = await this.browserManager.newPage();

      // PASO 1: Navegar a la página de login
      console.log('🌐 Navegando a Login.aspx...');
      await page.goto('https://www.banesconline.com/mantis/Website/Login.aspx', { 
        waitUntil: 'domcontentloaded',
        timeout: 15000 
      });
      
      // Esperar a que el iframe esté disponible
      await page.waitForSelector('iframe#ctl00_cp_frmAplicacion', { timeout: 10000 });
      await this.htmlSaver.saveHTML(page, 'login-step1-container.html');

      // PASO 2: Acceder al iframe
      console.log('🔎 Accediendo al iframe...');
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
      console.log('👤 Paso 1: Llenando usuario...');
      const usernameInput = await this.waitForElementWithSmartTimeout(frame, 'input[name="txtUsuario"]', 'usuario');
      await usernameInput.fill(this.credentials.username);
      await frame.waitForTimeout(300); // Tiempo mínimo para que se registre el cambio
      await this.htmlSaver.saveFrameHTML(frame, 'login-step3-username-filled.html');

      // PASO 4: Enviar usuario
      console.log('📤 Enviando usuario...');
      try {
        const submitButton = await this.waitForElementWithSmartTimeout(frame, 'input[name="bAceptar"]', 'botón de envío');
        await submitButton.click();
      } catch (e) {
        console.log('🔄 Usando JavaScript...');
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
        console.log('🔄 Modal de conexión activa manejado, esperando antes de continuar...');
        await frame.waitForTimeout(3000); // Esperar 3 segundos antes de continuar
        
        // Verificar si necesitamos reintroducir el usuario
        try {
          const userField = await frame.$('input[name="txtUsuario"]');
          if (userField) {
            const userValue = await userField.inputValue();
            if (!userValue || userValue !== this.credentials.username) {
              console.log('🔄 Rellenando usuario después del modal...');
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
          console.log('ℹ️  No fue necesario rellenar usuario después del modal');
        }
      }

      // PASO 5: Verificar y manejar preguntas de seguridad
      console.log('🔍 Paso 2: Verificando preguntas de seguridad...');
      
      let securityQuestionsHandled = false;
      try {
        const firstQuestionLabel = await frame.$('#lblPrimeraP');
        if (firstQuestionLabel) {
          console.log('🔐 Encontradas preguntas de seguridad, respondiendo...');
          securityQuestionsHandled = await this.securityHandler.handleSecurityQuestions(frame);
          
          if (securityQuestionsHandled) {
            await this.htmlSaver.saveFrameHTML(frame, 'login-step5-security-filled.html');
            
            // Enviar respuestas de seguridad
            console.log('📤 Enviando respuestas de seguridad...');
            const securitySubmit = await this.waitForElementWithSmartTimeout(frame, 'input[name="bAceptar"]', 'botón de envío');
            await securitySubmit.click();
            
            await frame.waitForTimeout(2000);
            await this.htmlSaver.saveFrameHTML(frame, 'login-step6-after-security.html');
            await this.handleModals(frame);

            // VERIFICAR SI YA ESTAMOS EN EL ÁREA BANCARIA DESPUÉS DE LAS PREGUNTAS
            console.log('🔍 Verificando si ya estamos en el área bancaria después de las preguntas...');
            
            try {
              await page.waitForTimeout(2000);
              const currentUrl = page.url();
              const pageTitle = await page.title();
              const pageContent = await page.content();
              
              console.log(`🔗 URL después de preguntas: ${currentUrl}`);
              console.log(`📄 Título después de preguntas: ${pageTitle}`);
              
              // Si ya estamos en una página de Banesco que no es login, hemos terminado
              if (pageContent.includes('Banesco') && !pageContent.includes('Login') && 
                  (currentUrl.includes('index.aspx') || currentUrl.includes('default.aspx') || 
                   pageTitle.includes('BanescOnline') || pageContent.includes('Bienvenido'))) {
                
                console.log(`✅ ¡Ya estamos en el área bancaria después de las preguntas!`);
                await this.htmlSaver.saveHTML(page, 'login-SUCCESS-after-security.html');
                
                // Guardar la página autenticada
                this.authenticatedPage = page;
                this.isLoggedIn = true;
                
                return {
                  success: true,
                  message: 'Login exitoso - Acceso directo después de preguntas de seguridad',
                  sessionValid: true
                };
              }
            } catch (e) {
              console.log('ℹ️  Error verificando área bancaria después de preguntas, continuando...');
            }
          }
        } else {
          console.log('ℹ️  No se encontraron preguntas de seguridad en este paso');
        }
      } catch (e) {
        console.log('ℹ️  Error buscando preguntas de seguridad, continuando...');
      }

      // PASO 6: Buscar y llenar campo de clave (solo si no estamos ya autenticados)
      console.log('🔍 Paso 3: Buscando campo de clave...');
      
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
          console.log(`🔒 Campo de clave encontrado: ${selector}`);
          console.log('🔒 Llenando contraseña...');
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
        console.log('ℹ️  No se encontró campo de contraseña, verificando si ya estamos autenticados...');
      }

      // PASO 7: Verificar que llegamos al área bancaria (página principal)
      console.log('🏦 Paso 4: Verificando acceso al área bancaria...');
      
      // Esperar a que se complete la navegación después del login
      try {
        await page.waitForLoadState('domcontentloaded', { timeout: 10000 });
      } catch (e) {
        console.log('ℹ️  Timeout esperando DOM, continuando...');
      }
      
      try {
        // Verificar el estado actual de la página
        const currentUrl = page.url();
        const pageTitle = await page.title();
        const pageContent = await page.content();
        
        console.log(`🔗 URL actual: ${currentUrl}`);
        console.log(`📄 Título actual: ${pageTitle}`);
        
        // Verificar si estamos en una página de Banesco y no en login
        if (pageContent.includes('Banesco') && !pageContent.includes('Login')) {
          console.log(`✅ ¡Login exitoso! Ya estamos en el área bancaria`);
          await this.htmlSaver.saveHTML(page, 'login-SUCCESS-area-bancaria.html');
          
          // Guardar la página autenticada
          this.authenticatedPage = page;
          this.isLoggedIn = true;
          
          return {
            success: true,
            message: 'Login exitoso - Acceso completo al área bancaria',
            sessionValid: true
          };
        } else {
          // Si no estamos en el área bancaria, intentar navegar al index
          console.log('⚠️  No se detectó área bancaria, intentando navegar...');
          
          const indexUrls = [
            'https://www.banesconline.com/Mantis/WebSite/index.aspx',
            'https://www.banesconline.com/mantis/Website/index.aspx'
          ];
          
          for (const url of indexUrls) {
            try {
              console.log(`🔗 Intentando: ${url}`);
              await page.goto(url, { 
                waitUntil: 'networkidle',
                timeout: 10000 
              });
              
              await page.waitForTimeout(2000);
              
              const newPageTitle = await page.title();
              const newPageContent = await page.content();
              
              if (newPageContent.includes('Banesco') && !newPageContent.includes('Login')) {
                console.log(`✅ ¡Login exitoso! Accedido a: ${url}`);
                console.log(`📄 Título: ${newPageTitle}`);
                await this.htmlSaver.saveHTML(page, 'login-SUCCESS-index-banco.html');
                
                // Guardar la página autenticada
                this.authenticatedPage = page;
                this.isLoggedIn = true;
                
                return {
                  success: true,
                  message: 'Login exitoso - Acceso completo al área bancaria',
                  sessionValid: true
                };
              }
              
            } catch (e: any) {
              console.log(`❌ Error con ${url}: ${e.message || e}`);
            }
          }
        }
        
      } catch (e: any) {
        console.log(`❌ Error verificando área bancaria: ${e.message || e}`);
      }

      return {
        success: false,
        message: 'Login parcial - No se pudo verificar acceso completo',
        sessionValid: false
      };

    } catch (error: any) {
      console.error('❌ Error en el proceso de login:', error);
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
      console.log('✅ Retornando página ya autenticada');
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
    await this.browserManager.close();
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