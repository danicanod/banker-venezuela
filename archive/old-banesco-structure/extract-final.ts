#!/usr/bin/env tsx

/**
 * Banesco Final Transaction Extractor
 * 
 * Versión final que maneja correctamente la selección de período
 */

import dotenv from 'dotenv';
import { BanescoAuth } from './auth/banesco-auth';
import { TransactionsScraper } from '../banks/banesco/scrapers/transactions';
import type { BanescoCredentials } from './auth/types';
import fs from 'fs';

// Load environment variables
dotenv.config();

async function finalExtractTransactions() {
  console.log('🎯 EXTRACTOR FINAL DE TRANSACCIONES BANESCO');
  console.log('==========================================');
  console.log('🔧 Estrategia específica para selección de período\n');

  if (!process.env.BANESCO_USERNAME || !process.env.BANESCO_PASSWORD) {
    console.error('❌ Faltan credenciales en .env');
    process.exit(1);
  }

  const credentials: BanescoCredentials = {
    username: process.env.BANESCO_USERNAME,
    password: process.env.BANESCO_PASSWORD,
    securityQuestions: process.env.SECURITY_QUESTIONS
  };

  const auth = new BanescoAuth(credentials, {
    headless: false, // Cambiar a false para ver qué pasa
    timeout: 60000,
    debug: false,
    saveSession: true
  });

  const scraper = new TransactionsScraper();
  
  try {
    // Paso 1: Autenticar
    console.log('🔐 PASO 1: Autenticando...');
    const loginResult = await auth.login();

    if (!loginResult.success) {
      console.error('❌ Error de autenticación:', loginResult.message);
      return;
    }

    console.log('✅ Autenticado exitosamente');
    
    // Paso 2: Obtener página autenticada
    const page = auth.getPage();
    if (!page) {
      throw new Error('No se pudo obtener la página');
    }

    // Paso 3: Navegar directamente a movimientos
    console.log('\n🎯 PASO 2: Navegando a movimientos...');
    
    // Navegar a la página de movimientos
    await page.goto('https://www.banesconline.com/Mantis/WebSite/consultamovimientoscuenta/movimientoscuenta.aspx', {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });
    
    console.log('📍 Navegado a:', page.url());
    
    // Esperar más tiempo para que la página se cargue completamente
    console.log('⏳ Esperando que la página se cargue completamente...');
    await page.waitForTimeout(5000);
    
    // Capturar HTML inicial
    const initialHtml = await page.content();
    fs.writeFileSync('./html-captures/initial-movements-page.html', initialHtml);
    console.log('💾 HTML inicial guardado: initial-movements-page.html');
    
    // Esperar por elementos específicos que indican que la página está cargada
    console.log('🔍 Esperando elementos de la página...');
    try {
      await page.waitForSelector('body', { timeout: 10000 });
      console.log('✅ Body encontrado');
      
      // Esperar más tiempo para JavaScript
      await page.waitForTimeout(3000);
      
      // Capturar HTML después de carga
      const loadedHtml = await page.content();
      fs.writeFileSync('./html-captures/loaded-movements-page.html', loadedHtml);
      console.log('💾 HTML cargado guardado: loaded-movements-page.html');
      
      // Verificar si hay iframes
      const iframes = await page.$$('iframe');
      console.log(`🖼️  Encontrados ${iframes.length} iframes`);
      
      for (let i = 0; i < iframes.length; i++) {
        const iframe = iframes[i];
        const src = await iframe.getAttribute('src');
        const title = await iframe.getAttribute('title');
        console.log(`   📄 Iframe ${i + 1}: src="${src}", title="${title}"`);
        
        // Si hay un iframe principal, capturar su contenido también
        if (src && !src.includes('CAU')) {
          try {
            const frame = await iframe.contentFrame();
            if (frame) {
              const iframeHtml = await frame.content();
              fs.writeFileSync(`./html-captures/iframe-${i + 1}-content.html`, iframeHtml);
              console.log(`💾 Contenido iframe ${i + 1} guardado`);
            }
          } catch (e) {
            console.log(`⚠️  No se pudo acceder al iframe ${i + 1}`);
          }
        }
      }
      
    } catch (e) {
      console.log('⚠️  Error esperando elementos:', e);
    }

    // Paso 4: Estrategia inteligente para encontrar transacciones
    console.log('\n📅 PASO 3: Buscando transacciones por período...');
    
    // Definir períodos en orden de prioridad (más reciente primero)
    const periodPriority = [
      { value: 'PeriodoDia', name: 'Día', description: 'Transacciones de hoy' },
      { value: 'PeriodoDiaAnterior', name: 'Día anterior', description: 'Transacciones de ayer' },
      { value: 'PeriodoMes', name: 'Mes', description: 'Transacciones del mes actual' },
      { value: 'PeriodoMesAnterior', name: 'Mes anterior', description: 'Transacciones del mes pasado' }
    ];
    
    let transactionsFound = false;
    let finalResult = null;
    
    for (const period of periodPriority) {
      console.log(`\n🔍 Probando período: ${period.name} (${period.description})`);
      
      try {
        // Esperar que la página cargue completamente
        await page.waitForTimeout(2000);
        
        // Paso 1: Seleccionar la cuenta si no se ha hecho
        await selectAccount(page);
        
        // Paso 2: Configurar el período
        const periodConfigured = await configurePeriod(page, period);
        
        if (!periodConfigured) {
          console.log(`⚠️  No se pudo configurar período ${period.name}, continuando...`);
          continue;
        }
        
        // Paso 3: Hacer clic en "Consultar"
        const consultarSuccess = await clickConsultar(page);
        
        if (!consultarSuccess) {
          console.log(`⚠️  No se pudo hacer clic en "Consultar" para ${period.name}`);
          continue;
        }
        
        // Paso 4: Esperar carga de resultados
        console.log('⏳ Esperando carga de transacciones...');
        await page.waitForTimeout(5000);
        
        // Paso 5: Intentar extraer transacciones
        console.log(`📊 Extrayendo transacciones para ${period.name}...`);
        const result = await scraper.scrapeTransactions(page);
        
        if (result.success && result.data && result.data.length > 0) {
          console.log(`\n🎉 ¡ÉXITO! Encontradas ${result.data.length} transacciones en ${period.name}`);
          transactionsFound = true;
          finalResult = result;
          break;
        } else {
          console.log(`❌ No se encontraron transacciones en ${period.name}`);
          console.log(`📝 Razón: ${result.error || result.message || 'Sin datos'}`);
        }
        
      } catch (e: any) {
        console.log(`⚠️  Error procesando ${period.name}: ${e.message}`);
      }
    }
    
    // Mostrar resultados finales
    if (transactionsFound && finalResult && finalResult.data) {
      console.log(`\n🎉 ¡TRANSACCIONES ENCONTRADAS!`);
      console.log('================================');
      
      // Mostrar resumen
      const metadata = finalResult.metadata;
      if (metadata?.accountSummary) {
        console.log(`💰 Saldo actual: ${metadata.accountSummary.currentBalance?.toFixed(2) || 'N/A'}`);
      }
      
      // Mostrar primeras transacciones
      console.log('\n📋 ÚLTIMAS TRANSACCIONES:');
      console.log('========================');
      
      finalResult.data.slice(0, 10).forEach((tx, idx) => {
        console.log(`\n${idx + 1}. 📅 ${tx.date}`);
        console.log(`   📝 ${tx.description}`);
        console.log(`   💰 ${tx.amount.toFixed(2)} (${tx.type === 'debit' ? '🔴 Débito' : '🟢 Crédito'})`);
        console.log(`   📊 Saldo: ${tx.balance?.toFixed(2) || 'N/A'}`);
        if (tx.reference) {
          console.log(`   🔢 Ref: ${tx.reference}`);
        }
      });

      if (finalResult.data.length > 10) {
        console.log(`\n... y ${finalResult.data.length - 10} transacciones más`);
      }
      
      // Guardar en JSON
      const filename = `banesco-transactions-final-${new Date().toISOString().split('T')[0]}.json`;
      const fs = await import('fs');
      fs.writeFileSync(filename, JSON.stringify({
        extractedAt: new Date().toISOString(),
        totalTransactions: finalResult.data.length,
        accountSummary: metadata?.accountSummary,
        transactions: finalResult.data
      }, null, 2));
      
      console.log(`\n💾 Transacciones guardadas en: ${filename}`);
      
    } else {
      console.log('\n❌ NO SE ENCONTRARON TRANSACCIONES EN NINGÚN PERÍODO');
      console.log('🔍 Se probaron todos los períodos disponibles');
      
      // Tomar screenshot para debug
      try {
        const screenshot = `debug-no-transactions-${Date.now()}.png`;
        await page.screenshot({ path: screenshot, fullPage: true });
        console.log(`📸 Screenshot guardado: ${screenshot}`);
      } catch (e: any) {
        console.log('⚠️  No se pudo tomar screenshot');
      }
    }

  } catch (error) {
    console.error('💥 Error:', error);
  } finally {
    console.log('\n⏸️  Presiona Enter para cerrar el navegador...');
    await new Promise(resolve => process.stdin.once('data', resolve));
    await auth.close();
  }
}

/**
 * Seleccionar cuenta si no se ha hecho
 */
async function selectAccount(page: any): Promise<boolean> {
  try {
    const accountSelectors = [
      'select[name*="cuenta"]',
      'select[name*="Cuenta"]',
      'select[id*="cuenta"]',
      'select[id*="Cuenta"]',
      '#ddlCuentas',
      'select'
    ];
    
    for (const selector of accountSelectors) {
      try {
        const selectElement = await page.$(selector);
        if (selectElement) {
          // Verificar si ya hay una cuenta seleccionada
          const selectedValue = await page.$eval(selector, (el: any) => el.value);
          if (selectedValue && selectedValue !== '' && selectedValue !== '0') {
            console.log('✅ Cuenta ya seleccionada');
            return true;
          }
          
          // Obtener las opciones de cuenta disponibles
          const options = await page.$$eval(`${selector} option`, (opts: any) => 
            opts.map((opt: any) => ({ 
              value: opt.value, 
              text: opt.textContent || '' 
            }))
          );
          
          // Seleccionar la primera cuenta válida
          const validAccount = options.find((opt: any) => 
            opt.value && opt.value !== '' && opt.value !== '0' && 
            !opt.text.toLowerCase().includes('seleccione')
          );
          
          if (validAccount) {
            console.log(`🎯 Seleccionando cuenta: ${validAccount.text}`);
            await page.selectOption(selector, validAccount.value);
            await page.waitForTimeout(1000);
            return true;
          }
        }
      } catch (e: any) {
        // Continuar con el siguiente selector
      }
    }
    
    return false;
  } catch (e: any) {
    console.log('⚠️  Error seleccionando cuenta:', e.message);
    return false;
  }
}

/**
 * Configurar período específico
 */
async function configurePeriod(page: any, period: any): Promise<boolean> {
  try {
    console.log(`🔧 Configurando período: ${period.value}`);
    
    // Buscar el select de períodos
    const periodSelectors = [
      '#ctl00_cp_ddlPeriodo',
      'select[name*="Periodo"]',
      'select[id*="Periodo"]',
      'select[name*="periodo"]',
      'select[id*="periodo"]'
    ];
    
    for (const selector of periodSelectors) {
      try {
        const selectElement = await page.$(selector);
        if (selectElement) {
          console.log(`📋 Encontrado selector de período: ${selector}`);
          
          // Verificar que la opción existe
          const options = await page.$$eval(`${selector} option`, (opts: any) => 
            opts.map((opt: any) => ({ 
              value: opt.value, 
              text: opt.textContent || '' 
            }))
          );
          
          const targetOption = options.find((opt: any) => opt.value === period.value);
          
          if (targetOption) {
            console.log(`🎯 Seleccionando opción: ${targetOption.text} (${targetOption.value})`);
            await page.selectOption(selector, period.value);
            await page.waitForTimeout(1000);
            
            // Verificar que se seleccionó correctamente
            const selectedValue = await page.$eval(selector, (el: any) => el.value);
            if (selectedValue === period.value) {
              console.log(`✅ Período ${period.name} configurado correctamente`);
              return true;
            } else {
              console.log(`⚠️  Error: se seleccionó ${selectedValue} en lugar de ${period.value}`);
            }
          } else {
            console.log(`⚠️  Opción ${period.value} no encontrada`);
            console.log('📋 Opciones disponibles:');
            options.forEach((opt: any, idx: number) => {
              console.log(`   ${idx + 1}. ${opt.text} (${opt.value})`);
            });
          }
        }
      } catch (e: any) {
        // Continuar con el siguiente selector
      }
    }
    
    return false;
  } catch (e: any) {
    console.log(`⚠️  Error configurando período ${period.name}:`, e.message);
    return false;
  }
}

/**
 * Hacer clic en botón "Consultar"
 */
async function clickConsultar(page: any): Promise<boolean> {
  try {
    console.log('🔍 Buscando botón "Consultar"...');
    
    const consultarSelectors = [
      'input[value="Consultar"]',
      'input[value*="Consultar"]',
      'button:has-text("Consultar")',
      '#btnConsultar',
      'input[type="submit"]',
      '[id*="Consultar"]'
    ];
    
    for (const selector of consultarSelectors) {
      try {
        const button = await page.$(selector);
        if (button && await button.isVisible() && await button.isEnabled()) {
          console.log(`🔘 Clickeando botón: ${selector}`);
          await button.click();
          console.log('✅ Botón "Consultar" clickeado');
          return true;
        }
      } catch (e: any) {
        // Continuar
      }
    }
    
    console.log('⚠️  No se encontró botón "Consultar" válido');
    return false;
  } catch (e: any) {
    console.log('⚠️  Error haciendo clic en "Consultar":', e.message);
    return false;
  }
}

// Ejecutar
finalExtractTransactions()
  .then(() => {
    console.log('\n✅ Extracción completada');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Error fatal:', error);
    process.exit(1);
  }); 