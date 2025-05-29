#!/usr/bin/env tsx

import { config } from 'dotenv';
import { chromium, Browser, Page } from 'playwright';

config();

// Configuración ultra silenciosa
process.env.NODE_ENV = 'production';
const originalLog = console.log;
console.log = (...args: any[]) => {
  const msg = args.join(' ');
  if (msg.includes('💰') || msg.includes('⚡') || msg.includes('✅') || msg.includes('❌')) {
    originalLog(...args);
  }
};

async function simpleTransactions() {
  originalLog('⚡ TRANSACCIONES SIMPLE');
  originalLog('====================\n');

  let browser: Browser | null = null;
  let page: Page | null = null;
  const start = Date.now();

  try {
    const username = process.env.BANESCO_USERNAME;
    const password = process.env.BANESCO_PASSWORD;

    if (!username || !password) {
      originalLog('❌ Credenciales no configuradas');
      return;
    }

    // Iniciar navegador con timeout agresivo
    originalLog('🚀 Iniciando navegador...');
    browser = await chromium.launch({ 
      headless: true,
      timeout: 10000
    });

    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      locale: 'es-VE',
      timezoneId: 'America/Caracas'
    });

    page = await context.newPage();
    
    // Timeout global agresivo
    page.setDefaultTimeout(8000);
    page.setDefaultNavigationTimeout(8000);

    originalLog('🔐 Navegando a login...');
    await page.goto('https://www.banesconline.com/mantis/Website/Login.aspx', {
      waitUntil: 'domcontentloaded',
      timeout: 8000
    });

    originalLog('📋 Accediendo al formulario...');
    
    // Esperar iframe con timeout reducido
    const iframe = await page.waitForSelector('iframe#ctl00_cp_frmAplicacion', { 
      timeout: 6000 
    });
    
    if (!iframe) {
      throw new Error('No se encontró iframe de login');
    }

    const frame = await iframe.contentFrame();
    if (!frame) {
      throw new Error('No se pudo acceder al contenido del iframe');
    }

    // Login rápido
    originalLog('👤 Ingresando usuario...');
    await frame.waitForSelector('input[name="txtUsuario"]', { timeout: 5000 });
    await frame.fill('input[name="txtUsuario"]', username);
    await frame.click('input[name="bAceptar"]');

    // Esperar por password field O preguntas de seguridad
    originalLog('🔑 Esperando siguiente paso...');
    
    try {
      // Intentar encontrar campo de password primero (es más rápido)
      await frame.waitForSelector('input[name="txtClave"]', { timeout: 3000 });
      originalLog('💨 Campo de password encontrado (sin preguntas de seguridad)');
      
      await frame.fill('input[name="txtClave"]', password);
      await frame.click('input[name="bAceptar"]');
      
    } catch (e) {
      originalLog('🛡️ Detectadas preguntas de seguridad - abortando');
      originalLog('💡 Usa el comando completo: npm run transactions');
      return;
    }

    // Verificar login exitoso
    originalLog('✅ Verificando login...');
    await page.waitForURL('**/mantis/Website/Home.aspx', { timeout: 5000 });

    originalLog('💳 Navegando a movimientos...');
    await page.goto('https://www.banesconline.com/Mantis/WebSite/consultamovimientoscuenta/movimientoscuenta.aspx', {
      timeout: 8000
    });

    // Buscar tabla de transacciones de forma simple
    originalLog('📊 Extrayendo datos...');
    
    const tables = await page.$$('table');
    let transactions = 0;
    
    for (const table of tables) {
      const rows = await table.$$('tr');
      if (rows.length > 5) { // Probable tabla de transacciones
        transactions = Math.max(transactions, rows.length - 1); // -1 por header
      }
    }

    const elapsed = Math.round((Date.now() - start) / 1000);
    
    if (transactions > 0) {
      originalLog(`✅ Completado en ${elapsed}s`);
      originalLog(`💰 ${transactions} transacciones encontradas`);
    } else {
      originalLog(`⚠️  No se encontraron transacciones (${elapsed}s)`);
    }

  } catch (error: any) {
    const elapsed = Math.round((Date.now() - start) / 1000);
    originalLog(`❌ Error (${elapsed}s): ${error.message}`);
    
    if (error.message.includes('timeout')) {
      originalLog('💡 El banco está lento. Intenta: npm run transactions');
    }
  } finally {
    if (browser) {
      await browser.close();
    }
  }

  originalLog('✅ Finalizado\n');
  process.exit(0);
}

simpleTransactions(); 