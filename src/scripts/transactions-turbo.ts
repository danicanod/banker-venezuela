#!/usr/bin/env tsx

import { config } from 'dotenv';
import { chromium, Browser, Page } from 'playwright';

config();

async function turboTransactions() {
  console.log('🚀 TRANSACCIONES TURBO');
  console.log('=====================\n');

  let browser: Browser | null = null;
  const start = Date.now();

  try {
    const username = process.env.BANESCO_USERNAME;
    const password = process.env.BANESCO_PASSWORD;
    const securityQuestions = process.env.SECURITY_QUESTIONS;

    if (!username || !password) {
      console.log('❌ Credenciales no configuradas');
      return;
    }

    console.log('⚡ Navegador turbo...');
    browser = await chromium.launch({ 
      headless: true,
      timeout: 10000
    });

    const page = await browser.newPage();
    
    // Timeouts ultra agresivos
    page.setDefaultTimeout(5000);
    page.setDefaultNavigationTimeout(8000);

    await page.goto('https://www.banesconline.com/mantis/Website/Login.aspx');

    console.log('🔐 Login rápido...');
    const iframe = await page.waitForSelector('iframe#ctl00_cp_frmAplicacion', { timeout: 5000 });
    const frame = await iframe.contentFrame();
    
    if (!frame) {
      throw new Error('No se pudo acceder al iframe');
    }

    // Usuario
    await frame.fill('input[name="txtUsuario"]', username);
    await frame.click('input[name="bAceptar"]');

    console.log('⚡ Detectando...');
    
    // Esperar UN SEGUNDO y luego verificar qué aparece
    await page.waitForTimeout(1000);

    const hasPassword = await frame.$('input[name="txtClave"]');
    
    if (hasPassword) {
      console.log('🔑 Password directo');
      await frame.fill('input[name="txtClave"]', password);
      await frame.click('input[name="bAceptar"]');
    } else {
      console.log('🛡️ Preguntas detectadas');
      
      if (!securityQuestions) {
        console.log('❌ Sin configuración de preguntas');
        return;
      }

      await fastSecurityQuestions(frame, securityQuestions);
    }

    // Verificación rápida
    console.log('✅ Verificando...');
    try {
      await page.waitForURL('**/Home.aspx', { timeout: 5000 });
    } catch (e) {
      // Continuar si no redirige
    }

    console.log('💳 Transacciones...');
    await page.goto('https://www.banesconline.com/Mantis/WebSite/consultamovimientoscuenta/movimientoscuenta.aspx');

    console.log('📊 Extrayendo...');
    await page.waitForSelector('table', { timeout: 5000 });
    
    const count = await page.evaluate(() => {
      const tables = document.querySelectorAll('table');
      let max = 0;
      tables.forEach(table => {
        const rows = table.querySelectorAll('tr');
        if (rows.length > max) max = rows.length;
      });
      return Math.max(0, max - 1); // -1 por header
    });

    const elapsed = Math.round((Date.now() - start) / 1000);
    console.log(`✅ ${elapsed}s | ${count} transacciones`);

  } catch (error: any) {
    const elapsed = Math.round((Date.now() - start) / 1000);
    console.log(`❌ ${elapsed}s | ${error.message}`);
  } finally {
    if (browser) await browser.close();
  }

  process.exit(0);
}

async function fastSecurityQuestions(frame: any, securityQuestions: string): Promise<void> {
  const questions = securityQuestions.split(',').reduce((map: any, pair: string) => {
    const [key, val] = pair.split(':');
    if (key && val) map[key.trim().toLowerCase()] = val.trim();
    return map;
  }, {});

  const elements = ['lblPrimeraP', 'lblSegundaP', 'lblTerceraP', 'lblCuartaP'];
  const inputs = ['txtPrimeraR', 'txtSegundaR', 'txtTerceraR', 'txtCuartaR'];

  let answered = 0;

  for (let i = 0; i < elements.length; i++) {
    try {
      const label = await frame.$(`#${elements[i]}`);
      if (!label) continue;

      const text = await label.textContent();
      if (!text) continue;

      const normalized = text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      
      for (const [keyword, answer] of Object.entries(questions)) {
        const normalizedKeyword = keyword.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        
        if (normalized.includes(normalizedKeyword)) {
          const input = await frame.$(`#${inputs[i]}`);
          if (input) {
            await input.fill(answer as string);
            answered++;
            console.log(`✅ ${keyword}: ${answer}`);
            break;
          }
        }
      }
    } catch (e) {
      // Continuar
    }
  }

  if (answered > 0) {
    console.log('📤 Enviando...');
    await frame.click('input[name="bAceptar"]');
  }
}

turboTransactions(); 