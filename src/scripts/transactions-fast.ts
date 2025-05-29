#!/usr/bin/env tsx

import { OptimizedLogin } from '../banks/banesco/auth/optimized-login';
import { TransactionsScraper } from '../banks/banesco/scrapers/transactions';
import { BankTransaction } from '../shared/types';
import { config } from 'dotenv';

config();

// Modo ultra silencioso - configurar antes de importar cualquier cosa
process.env.NODE_ENV = 'production';
process.env.LOG_LEVEL = '0'; // Solo errores críticos
process.env.SILENT_MODE = 'true';

// Suprimir warnings y otros outputs
const originalConsoleLog = console.log;
const originalConsoleWarn = console.warn;
const originalConsoleInfo = console.info;

// Solo permitir nuestra salida
console.log = (...args: any[]) => {
  const message = args.join(' ');
  if (message.includes('⚡') || message.includes('🔐') || message.includes('💳') || 
      message.includes('✅') || message.includes('❌') || message.includes('📊')) {
    originalConsoleLog(...args);
  }
};

console.warn = () => {}; // Silenciar warnings
console.info = () => {}; // Silenciar info

async function fastTransactions() {
  console.log('⚡ TRANSACCIONES RÁPIDAS');
  console.log('=======================\n');

  const start = Date.now();

  try {
    // Verificar credenciales
    const username = process.env.BANESCO_USERNAME;
    const password = process.env.BANESCO_PASSWORD;
    const securityQuestions = process.env.SECURITY_QUESTIONS || process.env.BANESCO_SECURITY_QUESTIONS;

    if (!username || !password) {
      console.log('❌ Credenciales no configuradas en .env');
      console.log('💡 Verifica que tengas BANESCO_USERNAME y BANESCO_PASSWORD en tu .env');
      return;
    }

    if (!securityQuestions) {
      console.log('⚠️  Sin preguntas de seguridad configuradas');
      console.log('💡 Agrega SECURITY_QUESTIONS="keyword:answer,keyword2:answer2" en tu .env');
    }

    const credentials = {
      username,
      password,
      securityQuestions: securityQuestions || ''
    };

    // Login directo
    process.stdout.write('🔐 Login... ');
    const login = new OptimizedLogin(credentials, true); // headless mode
    const loginResult = await login.login();
    
    if (!loginResult.success) {
      console.log('❌');
      console.log(`Error: ${loginResult.message}`);
      return;
    }
    console.log('✅');

    // Obtener página
    const page = await login.getAuthenticatedPage();
    if (!page) {
      console.log('❌ No se pudo obtener página autenticada');
      return;
    }

    // Scraping directo
    process.stdout.write('💳 Extrayendo... ');
    const scraper = new TransactionsScraper();
    
    // Intentar URL directa de movimientos
    const directUrl = 'https://www.banesconline.com/Mantis/WebSite/consultamovimientoscuenta/movimientoscuenta.aspx';
    
    const result = await scraper.scrapeTransactions(page, directUrl);
    
    const elapsed = Math.round((Date.now() - start) / 1000);
    
    if (result.success && result.data && result.data.length > 0) {
      console.log(`✅ (${elapsed}s)\n`);
      
      const tx = result.data as BankTransaction[];
      const credits = tx.filter(t => t.type === 'credit');
      const debits = tx.filter(t => t.type === 'debit');
      
      console.log(`📊 ${tx.length} transacciones encontradas`);
      console.log(`💚 ${credits.length} créditos | 💸 ${debits.length} débitos\n`);
      
      // Mostrar últimas 5 solamente
      console.log('💳 ÚLTIMAS TRANSACCIONES');
      console.log('========================');
      tx.slice(0, 5).forEach((t, i) => {
        const amount = t.type === 'credit' ? `+${t.amount}` : `-${t.amount}`;
        console.log(`${i+1}. ${t.date} | ${t.description.substring(0, 35)} | ${amount}`);
      });
      
      if (tx.length > 5) {
        console.log(`... y ${tx.length - 5} más`);
      }
      
    } else {
      console.log(`❌ (${elapsed}s)`);
      console.log(result.error || 'No se encontraron transacciones');
    }

    await login.close();

  } catch (error: any) {
    const elapsed = Math.round((Date.now() - start) / 1000);
    console.log(`❌ Error (${elapsed}s)`);
    console.log(error.message);
  } finally {
    // Restaurar console original
    console.log = originalConsoleLog;
    console.warn = originalConsoleWarn;
    console.info = originalConsoleInfo;
  }

  console.log('\n✅ Finalizado');
  process.exit(0);
}

fastTransactions(); 