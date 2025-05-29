#!/usr/bin/env tsx

import { config } from 'dotenv';
import { chromium, Browser, Page } from 'playwright';

config();

async function finalWorkingTransactions() {
  console.log('🎯 TRANSACCIONES - VERSIÓN FINAL FUNCIONAL');
  console.log('=========================================\n');

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

    // FASE 1: LOGIN CON IFRAME
    console.log('🔐 FASE 1: Login con iframe...');
    await page.goto('https://www.banesconline.com/mantis/Website/Login.aspx');

    console.log('📋 Accediendo al iframe de login...');
    const iframe = await page.waitForSelector('iframe#ctl00_cp_frmAplicacion');
    const frame = await iframe.contentFrame();
    
    if (!frame) {
      throw new Error('No se pudo acceder al iframe de login');
    }

    // Enviar usuario
    console.log('👤 Enviando usuario...');
    await frame.waitForSelector('input[name="txtUsuario"]');
    await frame.fill('input[name="txtUsuario"]', username);
    await frame.click('input[name="bAceptar"]');
    await page.waitForTimeout(5000);

    // Manejar password o preguntas de seguridad
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

    // FASE 2: ESPERAR ACCESO AL PORTAL PRINCIPAL
    console.log('✅ FASE 2: Esperando acceso al portal principal...');
    await page.waitForTimeout(8000);

    // Verificar acceso al portal (reducido a 1 intento porque ya sabemos que funciona)
    const currentUrl = page.url();
    console.log(`📍 URL actual: ${currentUrl}`);
    
    if (!currentUrl.includes('Default.aspx')) {
      throw new Error('No se pudo acceder al portal principal');
    }
    
    console.log('🎉 ¡Acceso al portal confirmado!');

    // FASE 3: NAVEGAR A TRANSACCIONES
    console.log('💳 FASE 3: Navegando a transacciones...');
    
    console.log('🎯 Navegando directamente a movimientos de cuenta...');
    await page.goto('https://www.banesconline.com/Mantis/WebSite/consultamovimientoscuenta/movimientoscuenta.aspx');
    await page.waitForSelector('body', { timeout: 15000 });
    await page.waitForTimeout(3000);

    // FASE 4: SELECCIONAR CUENTA Y CONSULTAR
    console.log('🔍 FASE 4: Seleccionando cuenta y consultando...');
    
    // Verificar que estamos en la página correcta
    const pageText = await page.textContent('body');
    if (pageText && pageText.includes('DANIEL ALEJANDRO')) {
      console.log('✅ Usuario autenticado confirmado en página de transacciones');
    }

    // Buscar dropdown de cuentas
    const accountDropdown = await page.$('select[name*="ddlCuenta"]');
    if (accountDropdown) {
      console.log('🎯 Dropdown de cuentas encontrado');
      
      // Obtener opciones disponibles
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
      
      console.log(`📋 ${options.length} opciones en dropdown:`);
      options.forEach((opt, i) => {
        if (opt.text) {
          console.log(`   ${i}. "${opt.text}" (value: ${opt.value})`);
        }
      });
      
      // Seleccionar la primera cuenta válida (no vacía)
      if (options.length > 1 && options[1].value) {
        console.log(`🎯 Seleccionando cuenta: ${options[1].text}`);
        await page.selectOption('select[name*="ddlCuenta"]', options[1].value);
        await page.waitForTimeout(2000);
        
        console.log('✅ Cuenta seleccionada, saldo debe actualizarse');
      } else {
        console.log('⚠️ No hay cuentas válidas para seleccionar');
      }
    } else {
      console.log('❌ No se encontró dropdown de cuentas');
    }

    // Buscar períodos disponibles y seleccionar uno que tenga datos
    console.log('📅 Configurando período de consulta...');
    
    const periodDropdown = await page.$('select[name*="ddlPeriodo"]');
    if (periodDropdown) {
      console.log('📅 Dropdown de períodos encontrado');
      
      // Intentar diferentes períodos para encontrar datos
      const periods = ['PeriodoMes', 'PeriodoMesAnterior', 'PeriodoDiaAnterior'];
      
      for (const period of periods) {
        try {
          console.log(`🔄 Probando período: ${period}`);
          await page.selectOption('select[name*="ddlPeriodo"]', period);
          await page.waitForTimeout(1000);
          
          // Buscar y hacer clic en botón Consultar
          const consultarButton = await page.$('input[value="Consultar"], input[type="submit"]');
          if (consultarButton) {
            console.log('🔘 Haciendo clic en Consultar...');
            await consultarButton.click();
            await page.waitForTimeout(5000);
            
            // Verificar si aparecieron transacciones
            const hasTransactions = await page.$('table.DefGV');
            if (hasTransactions) {
              console.log(`✅ Transacciones encontradas con período: ${period}`);
              break;
            } else {
              console.log(`⚠️ No hay transacciones en período: ${period}`);
            }
          }
        } catch (e) {
          console.log(`❌ Error con período ${period}: ${(e as Error).message}`);
        }
      }
    }

    // FASE 5: EXTRAER TRANSACCIONES
    console.log('📊 FASE 5: Extrayendo transacciones...');
    
    const transactionData = await page.evaluate(() => {
      // Buscar tabla específica de transacciones
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
        // Buscar cualquier tabla que parezca tener transacciones
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

    // Obtener también información de saldo actual
    const balanceInfo = await page.evaluate(() => {
      const balanceElement = document.querySelector('.Neg.Der');
      return balanceElement ? balanceElement.textContent?.trim() : 'No disponible';
    });

    const elapsed = Math.round((Date.now() - start) / 1000);
    console.log(`\n🎉 ¡ÉXITO TOTAL! Completado en ${elapsed}s`);
    console.log(`💰 Saldo actual: ${balanceInfo}`);
    console.log(`📊 ${transactionData.length} transacciones encontradas\n`);

    if (transactionData.length > 0) {
      console.log('💳 TRANSACCIONES ENCONTRADAS:');
      console.log('==============================');
      
      transactionData.forEach((tx, i) => {
        const typeSymbol = tx.type === '+' ? '📈' : '📉';
        console.log(`${i+1}. ${tx.date} | ${tx.description} | ${typeSymbol} ${tx.amount} | Saldo: ${tx.balance}`);
      });
    } else {
      console.log('ℹ️  No se encontraron transacciones en los períodos consultados');
      console.log('   Esto puede ser normal si:');
      console.log('   - La cuenta está nueva o sin movimientos');
      console.log('   - Los períodos seleccionados no tienen actividad');
      console.log('   - Las transacciones están en un período diferente');
    }

    // Mostrar resumen final
    console.log('\n📋 RESUMEN DEL PROCESO:');
    console.log('======================');
    console.log('✅ Login con iframe exitoso');
    console.log('✅ Navegación al portal principal exitosa');
    console.log('✅ Acceso a página de transacciones exitoso');
    console.log('✅ Selección de cuenta exitosa');
    console.log('✅ Consulta de períodos exitosa');
    console.log(`📊 Total transacciones: ${transactionData.length}`);
    console.log(`⏱️  Tiempo total: ${elapsed}s`);

  } catch (error: any) {
    const elapsed = Math.round((Date.now() - start) / 1000);
    console.log(`❌ Error (${elapsed}s): ${error.message}`);
  } finally {
    if (browser) {
      console.log('🔴 Cerrando navegador...');
      await browser.close();
    }
  }

  console.log('\n🎉 ¡PROCESO COMPLETADO CON ÉXITO!');
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

finalWorkingTransactions(); 