#!/usr/bin/env tsx

import { config } from 'dotenv';
import { chromium, Browser, Page } from 'playwright';

config();

// Modo silencioso
process.env.NODE_ENV = 'production';

async function directTransactions() {
  console.log('🎯 TRANSACCIONES DIRECTAS');
  console.log('========================\n');

  let browser: Browser | null = null;
  let page: Page | null = null;
  const start = Date.now();

  try {
    const username = process.env.BANESCO_USERNAME;
    const password = process.env.BANESCO_PASSWORD;
    const securityQuestions = process.env.SECURITY_QUESTIONS;

    if (!username || !password) {
      console.log('❌ Credenciales no configuradas en .env');
      return;
    }

    console.log('🚀 Iniciando navegador único...');
    browser = await chromium.launch({ 
      headless: true, // Modo headless para uso regular
      timeout: 15000
    });

    // UN SOLO CONTEXTO, UNA SOLA PÁGINA
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      locale: 'es-VE',
      timezoneId: 'America/Caracas'
    });

    page = await context.newPage();
    
    // Timeouts más agresivos para velocidad
    page.setDefaultTimeout(8000);
    page.setDefaultNavigationTimeout(10000);

    console.log('🔐 Navegando a login...');
    await page.goto('https://www.banesconline.com/mantis/Website/Login.aspx', {
      waitUntil: 'domcontentloaded'
    });

    console.log('📋 Accediendo al iframe...');
    const iframe = await page.waitForSelector('iframe#ctl00_cp_frmAplicacion');
    const frame = await iframe.contentFrame();
    
    if (!frame) {
      throw new Error('No se pudo acceder al iframe');
    }

    // PASO 1: Usuario
    console.log('👤 Ingresando usuario...');
    await frame.waitForSelector('input[name="txtUsuario"]', { timeout: 8000 });
    await frame.fill('input[name="txtUsuario"]', username);
    await frame.click('input[name="bAceptar"]');

    // Espera breve para que se procese el usuario
    await page.waitForTimeout(1500);

    // PASO 2: Detectar qué sigue (password o preguntas)
    console.log('🔍 Detectando siguiente paso...');
    
    try {
      // Intentar password primero con timeout reducido
      await frame.waitForSelector('input[name="txtClave"]', { timeout: 3000 });
      console.log('🔑 Campo de password detectado');
      
      await frame.fill('input[name="txtClave"]', password);
      await frame.click('input[name="bAceptar"]');
      
    } catch (e) {
      // Si no hay password, deben ser preguntas de seguridad
      console.log('🛡️ Preguntas de seguridad detectadas');
      
      if (!securityQuestions) {
        console.log('❌ No hay preguntas configuradas en SECURITY_QUESTIONS');
        console.log('💡 Ejecuta: npm run setup:security');
        return;
      }

      const success = await handleSecurityQuestions(frame, securityQuestions);
      if (!success) {
        console.log('❌ Error manejando preguntas de seguridad');
        return;
      }
    }

    // PASO 3: Verificar y continuar después de autenticación
    console.log('✅ Verificando autenticación...');
    
    // Esperar un momento para que se procese
    await page.waitForTimeout(5000);
    
    // Re-obtener iframe después de las preguntas de seguridad
    const authIframe = await page.waitForSelector('iframe#ctl00_cp_frmAplicacion');
    const authFrame = await authIframe.contentFrame();
    
    if (!authFrame) {
      throw new Error('Frame perdido después de las preguntas de seguridad');
    }

    // Verificar si necesitamos configurar contraseña DNA
    const dnaPasswordField = await authFrame.$('input[name="txtClave"]');
    const dnaAcceptButton = await authFrame.$('input[name="bAceptar"]');
    
    if (dnaPasswordField && dnaAcceptButton) {
      console.log('🔐 Configurando contraseña DNA...');
      
      // Usar la misma contraseña para DNA
      await authFrame.fill('input[name="txtClave"]', password);
      
      // Marcar checkbox de equipo frecuente si existe
      const frequentDeviceCheckbox = await authFrame.$('input[name="CBMachine"]');
      if (frequentDeviceCheckbox) {
        console.log('✅ Marcando equipo de uso frecuente...');
        await frequentDeviceCheckbox.check();
      }
      
      console.log('📤 Enviando configuración DNA...');
      await authFrame.click('input[name="bAceptar"]');
      await page.waitForTimeout(8000);
    }

    // Esperar redirección al portal principal
    console.log('⏳ Esperando acceso al portal principal...');
    await page.waitForTimeout(5000);

    // Verificar si llegamos al portal o necesitamos navegar
    let portalReady = false;
    for (let attempt = 1; attempt <= 10; attempt++) {
      console.log(`🔄 Verificando portal ${attempt}/10...`);
      
      try {
        const currentIframe = await page.waitForSelector('iframe#ctl00_cp_frmAplicacion', { timeout: 5000 });
        const currentFrame = await currentIframe.contentFrame();
        
        if (currentFrame) {
          // Verificar si ya no estamos en páginas de login/configuración
          const isLoginPage = await currentFrame.$('input[name="txtUsuario"]') || 
                             await currentFrame.$('input[name="txtClave"]') ||
                             await currentFrame.$('#lblPrimeraP');
          
          if (!isLoginPage) {
            console.log('✅ Portal principal accesible');
            portalReady = true;
            break;
          } else {
            // Si aún estamos en login, intentar continuar
            const continueBtn = await currentFrame.$('input[name="bAceptar"]');
            if (continueBtn) {
              console.log('   🔘 Haciendo clic en continuar...');
              await continueBtn.click();
              await page.waitForTimeout(3000);
            }
          }
        }
      } catch (e) {
        console.log(`   ⚠️ Intento ${attempt} falló, reintentando...`);
      }
      
      await page.waitForTimeout(2000);
    }

    if (!portalReady) {
      throw new Error('No se pudo acceder al portal principal después de múltiples intentos');
    }

    // PASO 4: Navegar a transacciones dentro del portal
    console.log('💳 Buscando navegación a transacciones...');
    
    const portalIframe = await page.waitForSelector('iframe#ctl00_cp_frmAplicacion');
    const portalFrame = await portalIframe.contentFrame();
    
    if (!portalFrame) {
      throw new Error('No se pudo acceder al frame del portal');
    }

    // Intentar navegar directamente a la URL de transacciones dentro del iframe
    console.log('🎯 Navegando a transacciones...');
    
    try {
      // Navegar dentro del iframe a la página de transacciones
      await portalFrame.goto('https://www.banesconline.com/Mantis/WebSite/consultamovimientoscuenta/movimientoscuenta.aspx');
      await page.waitForTimeout(5000);
    } catch (e) {
      console.log('⚠️ Navegación directa falló, intentando método alternativo...');
      
      // Buscar enlaces en el portal
      const transactionLinks = await portalFrame.$$eval('a', links => {
        return links
          .map(link => ({
            href: link.href,
            text: link.textContent?.trim() || ''
          }))
          .filter(link => 
            link.text.toLowerCase().includes('movimiento') ||
            link.text.toLowerCase().includes('consulta') ||
            link.text.toLowerCase().includes('transaccion') ||
            link.href.includes('movimiento')
          );
      });

      if (transactionLinks.length > 0) {
        console.log(`🔗 Haciendo clic en: ${transactionLinks[0].text}`);
        const linkElement = await portalFrame.$(`a[href*="${transactionLinks[0].href.split('/').pop()}"]`);
        if (linkElement) {
          await linkElement.click();
          await page.waitForTimeout(5000);
        }
      } else {
        console.log('⚠️ No se encontraron enlaces de transacciones, probando navegación genérica...');
      }
    }

    // PASO 5: Extraer datos
    console.log('📊 Extrayendo transacciones...');
    
    // Buscar la tabla específica de transacciones dentro del iframe
    const transactionData = await portalFrame.evaluate(() => {
      const transactionTable = document.querySelector('table.DefGV');
      let transactions: any[] = [];
      
      if (transactionTable) {
        const rows = Array.from(transactionTable.querySelectorAll('tbody tr'));
        
        for (const row of rows) {
          const cells = Array.from(row.querySelectorAll('td'));
          
          if (cells.length >= 6) { // Fecha, Descripción, Referencia, Monto, D/C, Saldo
            const date = cells[0]?.textContent?.trim() || '';
            const description = cells[1]?.textContent?.trim() || '';
            const reference = cells[2]?.textContent?.trim() || '';
            const amount = cells[3]?.textContent?.trim() || '';
            const type = cells[4]?.textContent?.trim() || '';
            const balance = cells[5]?.textContent?.trim() || '';
            
            if (date && description) {
              transactions.push({
                date,
                description,
                reference,
                amount,
                type,
                balance
              });
            }
          }
        }
      } else {
        // Si no hay tabla DefGV, buscar cualquier tabla con datos que parezcan transacciones
        const allTables = Array.from(document.querySelectorAll('table'));
        
        for (const table of allTables) {
          const rows = Array.from(table.querySelectorAll('tr'));
          
          for (const row of rows) {
            const cells = Array.from(row.querySelectorAll('td, th'));
            
            if (cells.length >= 4) { // Al menos fecha, descripción, monto, saldo
              const date = cells[0]?.textContent?.trim() || '';
              const description = cells[1]?.textContent?.trim() || '';
              const amount = cells[2]?.textContent?.trim() || '';
              const balance = cells[3]?.textContent?.trim() || '';
              
              // Verificar si parece una transacción (fecha con formato DD/MM/AAAA)
              if (date.match(/\d{2}\/\d{2}\/\d{4}/) && description && amount) {
                transactions.push({
                  date,
                  description,
                  reference: '',
                  amount,
                  type: amount.includes('-') ? '-' : '+',
                  balance
                });
              }
            }
          }
          
          if (transactions.length > 0) break;
        }
      }
      
      return transactions;
    });

    const elapsed = Math.round((Date.now() - start) / 1000);
    
    console.log(`✅ Completado en ${elapsed}s`);
    console.log(`💰 ${transactionData.length} transacciones encontradas\n`);

    if (transactionData.length > 0) {
      console.log('💳 TRANSACCIONES ENCONTRADAS:');
      console.log('==============================');
      
      transactionData.forEach((tx, i) => {
        const typeSymbol = tx.type === '+' ? '📈' : '📉';
        console.log(`${i+1}. ${tx.date} | ${tx.description} | ${typeSymbol} ${tx.amount} | Saldo: ${tx.balance}`);
      });
    } else {
      console.log('⚠️  No se encontraron transacciones en este período');
    }

  } catch (error: any) {
    const elapsed = Math.round((Date.now() - start) / 1000);
    console.log(`❌ Error (${elapsed}s): ${error.message}`);
  } finally {
    if (browser) {
      console.log('🔴 Cerrando navegador...');
      await browser.close();
    }
  }

  console.log('\n✅ Finalizado');
  process.exit(0);
}

async function handleSecurityQuestions(frame: any, securityQuestions: string): Promise<boolean> {
  const questionMap: { [key: string]: string } = {};
  
  // Parsear preguntas
  const pairs = securityQuestions.split(',');
  for (const pair of pairs) {
    const [keyword, answer] = pair.split(':');
    if (keyword && answer) {
      questionMap[keyword.trim().toLowerCase()] = answer.trim();
    }
  }

  console.log(`🗂️  ${Object.keys(questionMap).length} respuestas configuradas`);

  // Buscar preguntas con timeout reducido
  const questionElements = [
    { labelId: 'lblPrimeraP', inputId: 'txtPrimeraR' },
    { labelId: 'lblSegundaP', inputId: 'txtSegundaR' },
    { labelId: 'lblTerceraP', inputId: 'txtTerceraR' },
    { labelId: 'lblCuartaP', inputId: 'txtCuartaR' }
  ];

  let answered = 0;

  for (const element of questionElements) {
    try {
      // Timeout muy reducido para elementos que no existen
      const label = await frame.waitForSelector(`#${element.labelId}`, { 
        timeout: 2000,
        state: 'visible' 
      });
      
      if (!label) continue;

      const questionText = await label.textContent();
      if (!questionText) continue;

      console.log(`❓ ${questionText}`);

      // Buscar respuesta más eficientemente
      const normalizedQuestion = questionText.toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, ''); // Remover acentos
      
      let answer = null;

      for (const [keyword, response] of Object.entries(questionMap)) {
        const normalizedKeyword = keyword.toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '');
          
        if (normalizedQuestion.includes(normalizedKeyword)) {
          answer = response;
          break;
        }
      }

      if (answer) {
        const input = await frame.waitForSelector(`#${element.inputId}`, { 
          timeout: 2000,
          state: 'visible' 
        });
        
        if (input) {
          await input.fill(answer);
          // Espera mínima para que se registre la respuesta
          await frame.waitForTimeout(200);
          answered++;
          console.log(`✅ Respondida: ${answer}`);
        }
      } else {
        console.log(`❌ No se encontró respuesta para esta pregunta`);
      }
    } catch (e) {
      // Continuar con la siguiente pregunta sin delay
      continue;
    }
  }

  if (answered > 0) {
    console.log('📤 Enviando respuestas...');
    await frame.click('input[name="bAceptar"]');
    // Espera breve para que se procese el envío
    await frame.waitForTimeout(1000);
    return true;
  }

  return false;
}

directTransactions(); 