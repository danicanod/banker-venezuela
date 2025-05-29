#!/usr/bin/env tsx

import { config } from 'dotenv';
import { chromium, Browser, Page } from 'playwright';

config();

async function optimizedTransactions() {
  console.log('🎯 TRANSACCIONES OPTIMIZADAS');
  console.log('============================\n');

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

    console.log('🚀 Iniciando navegador...');
    browser = await chromium.launch({ 
      headless: true,
      timeout: 30000
    });

    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      locale: 'es-VE',
      timezoneId: 'America/Caracas'
    });

    page = await context.newPage();
    page.setDefaultTimeout(20000);

    // PASO 1: Login con iframe
    console.log('🔐 Navegando a login...');
    await page.goto('https://www.banesconline.com/mantis/Website/Login.aspx');

    console.log('📋 Accediendo al iframe...');
    const iframe = await page.waitForSelector('iframe#ctl00_cp_frmAplicacion');
    const frame = await iframe.contentFrame();
    
    if (!frame) {
      throw new Error('No se pudo acceder al iframe');
    }

    // Enviar usuario
    console.log('👤 Enviando usuario...');
    await frame.waitForSelector('input[name="txtUsuario"]');
    await frame.fill('input[name="txtUsuario"]', username);
    await frame.click('input[name="bAceptar"]');
    await page.waitForTimeout(5000);

    // Manejar paso 2 (password o preguntas)
    console.log('🔍 Detectando segundo paso...');
    const newIframe = await page.waitForSelector('iframe#ctl00_cp_frmAplicacion');
    const newFrame = await newIframe.contentFrame();
    
    if (!newFrame) {
      throw new Error('Frame perdido después del usuario');
    }

    const hasPassword = await newFrame.$('input[name="txtClave"]');
    const hasFirstQuestion = await newFrame.$('#lblPrimeraP');

    if (hasPassword) {
      console.log('🔑 Enviando password...');
      await newFrame.fill('input[name="txtClave"]', password);
      await newFrame.click('input[name="bAceptar"]');
      
    } else if (hasFirstQuestion) {
      console.log('🛡️ Respondiendo preguntas de seguridad...');
      
      if (!securityQuestions) {
        console.log('❌ No hay preguntas configuradas en SECURITY_QUESTIONS');
        return;
      }

      const success = await handleSecurityQuestions(newFrame, securityQuestions);
      if (!success) {
        console.log('❌ Error en preguntas de seguridad');
        return;
      }
    } else {
      throw new Error('No se detectó password ni preguntas después del usuario');
    }

    // PASO 3: Esperar redirección al portal (optimizado)
    console.log('✅ Esperando redirección al portal...');
    await page.waitForTimeout(10000); // Dar más tiempo para preguntas de seguridad

    // VERIFICACIÓN ÚNICA (no loop)
    const currentUrl = page.url();
    console.log(`📍 URL después de autenticación: ${currentUrl}`);
    
    if (currentUrl.includes('Default.aspx')) {
      console.log('🎉 ¡Llegamos al portal principal!');
    } else {
      console.log('⚠️ Aún en página de login, intentando navegación directa...');
      
      // Intentar navegación directa al portal
      try {
        await page.goto('https://www.banesconline.com/mantis/Website/Default.aspx', { timeout: 10000 });
        const newUrl = page.url();
        if (newUrl.includes('Default.aspx')) {
          console.log('✅ Navegación directa al portal exitosa');
        } else {
          throw new Error('No se pudo acceder al portal principal');
        }
      } catch (e) {
        throw new Error('Falló navegación directa al portal');
      }
    }

    // PASO 4: Ir a transacciones
    console.log('💳 Navegando a transacciones...');
    await page.goto('https://www.banesconline.com/Mantis/WebSite/consultamovimientoscuenta/movimientoscuenta.aspx');
    await page.waitForSelector('body', { timeout: 15000 });
    await page.waitForTimeout(3000);

    // PASO 5: Seleccionar cuenta y consultar
    console.log('🎯 Seleccionando cuenta...');
    
    const accountDropdown = await page.$('select[name*="ddlCuenta"]');
    if (accountDropdown) {
      const options = await page.evaluate(() => {
        const select = document.querySelector('select[name*="ddlCuenta"]') as HTMLSelectElement;
        if (select) {
          return Array.from(select.options).map(opt => ({
            value: opt.value,
            text: opt.text
          }));
        }
        return [];
      });
      
      console.log(`📋 ${options.length} cuentas disponibles`);
      
      if (options.length > 1) {
        console.log(`🎯 Seleccionando: ${options[1].text}`);
        await page.selectOption('select[name*="ddlCuenta"]', options[1].value);
        await page.waitForTimeout(1000);
        
        // Hacer clic en Consultar
        const consultarButton = await page.$('input[value="Consultar"]');
        if (consultarButton) {
          console.log('🔘 Consultando transacciones...');
          await consultarButton.click();
          await page.waitForTimeout(5000);
        }
      }
    }

    // PASO 6: Extraer transacciones
    console.log('📊 Extrayendo transacciones...');
    
    const transactionData = await page.evaluate(() => {
      const transactionTable = document.querySelector('table.DefGV');
      let transactions: any[] = [];
      
      if (transactionTable) {
        const rows = Array.from(transactionTable.querySelectorAll('tbody tr'));
        
        for (const row of rows) {
          const cells = Array.from(row.querySelectorAll('td'));
          
          if (cells.length >= 6) {
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
      }
      
      return transactions;
    });

    const elapsed = Math.round((Date.now() - start) / 1000);
    console.log(`\n🎉 ¡ÉXITO! Completado en ${elapsed}s`);
    console.log(`💰 ${transactionData.length} transacciones encontradas\n`);

    if (transactionData.length > 0) {
      console.log('💳 TRANSACCIONES ENCONTRADAS:');
      console.log('==============================');
      
      transactionData.forEach((tx, i) => {
        const typeSymbol = tx.type === '+' ? '📈' : '📉';
        console.log(`${i+1}. ${tx.date} | ${tx.description} | ${typeSymbol} ${tx.amount} | Saldo: ${tx.balance}`);
      });
    } else {
      console.log('ℹ️  No se encontraron transacciones en este período');
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
  
  const pairs = securityQuestions.split(',');
  for (const pair of pairs) {
    const [keyword, answer] = pair.split(':');
    if (keyword && answer) {
      questionMap[keyword.trim().toLowerCase()] = answer.trim();
    }
  }

  const questionElements = [
    { labelId: 'lblPrimeraP', inputId: 'txtPrimeraR' },
    { labelId: 'lblSegundaP', inputId: 'txtSegundaR' },
    { labelId: 'lblTerceraP', inputId: 'txtTerceraR' },
    { labelId: 'lblCuartaP', inputId: 'txtCuartaR' }
  ];

  let answered = 0;

  for (const element of questionElements) {
    try {
      const label = await frame.waitForSelector(`#${element.labelId}`, { 
        timeout: 2000,
        state: 'visible' 
      });
      
      if (!label) continue;

      const questionText = await label.textContent();
      if (!questionText) continue;

      console.log(`❓ ${questionText}`);

      const normalizedQuestion = questionText.toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
      
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
          answered++;
          console.log(`✅ Respondida: ${answer}`);
        }
      } else {
        console.log(`❌ No se encontró respuesta para esta pregunta`);
      }
    } catch (e) {
      continue;
    }
  }

  if (answered > 0) {
    console.log('📤 Enviando respuestas...');
    await frame.click('input[name="bAceptar"]');
    await frame.waitForTimeout(3000);
    return true;
  }

  return false;
}

optimizedTransactions(); 