#!/usr/bin/env tsx

import { BanescScraper } from '../index';
import { BankTransaction, ScrapingResult } from '../shared/types';
import { config } from 'dotenv';

config();

// Configurar modo silencioso para logs del sistema
process.env.NODE_ENV = 'production';

// Type guard para verificar si es un ScrapingResult válido
function isValidScrapingResult(result: any): result is ScrapingResult<BankTransaction> {
  return result && typeof result === 'object' && 'success' in result && 'data' in result;
}

async function scrapeTransactions() {
  console.log('💳 SCRAPING DE TRANSACCIONES BANCARIAS');
  console.log('======================================\n');

  const startTime = Date.now();
  
  try {
    const scraper = new BanescScraper();
    
    console.log('🔐 Autenticando...');
    const result = await scraper.scrapeTransactionsOnly();
    
    const elapsed = Math.round((Date.now() - startTime) / 1000);
    
    if (result.success && isValidScrapingResult(result) && result.data) {
      const transactions: BankTransaction[] = result.data;
      
      console.log(`✅ Completado en ${elapsed}s\n`);
      
      if (transactions.length === 0) {
        console.log('📭 No se encontraron transacciones');
        console.log('💡 Prueba con períodos más amplios o verifica que la cuenta tenga actividad');
        return;
      }

      // Mostrar resumen rápido
      const credits = transactions.filter(tx => tx.type === 'credit');
      const debits = transactions.filter(tx => tx.type === 'debit');
      const totalCredits = credits.reduce((sum, tx) => sum + tx.amount, 0);
      const totalDebits = debits.reduce((sum, tx) => sum + tx.amount, 0);

      console.log('📊 RESUMEN');
      console.log('==========');
      console.log(`💳 Total: ${transactions.length} transacciones`);
      console.log(`💚 Créditos: ${credits.length} (+${totalCredits.toFixed(2)})`);
      console.log(`💸 Débitos: ${debits.length} (-${totalDebits.toFixed(2)})`);
      console.log(`📈 Balance neto: ${(totalCredits - totalDebits).toFixed(2)}`);
      
      if (result.metadata?.accountSummary?.currentBalance) {
        console.log(`💰 Saldo actual: ${result.metadata.accountSummary.currentBalance.toFixed(2)}`);
      }

      // Mostrar últimas transacciones
      console.log('\n💳 ÚLTIMAS TRANSACCIONES');
      console.log('========================');
      
      const recent = transactions.slice(0, 8);
      recent.forEach((tx, index) => {
        const amount = tx.type === 'credit' ? `+${tx.amount.toFixed(2)}` : `-${tx.amount.toFixed(2)}`;
        const desc = tx.description.length > 45 ? 
          tx.description.substring(0, 45) + '...' : 
          tx.description.padEnd(45);
        
        console.log(`${(index + 1).toString().padStart(2)}. ${tx.date} | ${desc} | ${amount.padStart(12)}`);
      });
      
      if (transactions.length > 8) {
        console.log(`\n... y ${transactions.length - 8} transacciones más`);
      }

      // Información adicional si está disponible
      if (result.metadata?.tablesFound) {
        console.log(`\n🔍 Analizadas ${result.metadata.tablesFound} tablas de datos`);
      }
      
    } else {
      console.log(`❌ Error después de ${elapsed}s`);
      console.log(`📝 ${result.error || 'Error desconocido'}`);
      console.log('\n💡 Soluciones:');
      console.log('   • Verificar credenciales en archivo .env');
      console.log('   • Comprobar conexión a internet');
      console.log('   • Revisar html-captures/ para detalles del error');
    }

  } catch (error: any) {
    const elapsed = Math.round((Date.now() - startTime) / 1000);
    console.log(`💥 Error crítico después de ${elapsed}s`);
    console.log(`❌ ${error.message}`);
    
    if (error.message.includes('timeout')) {
      console.log('💡 El banco puede estar lento. Intenta de nuevo en unos minutos.');
    } else if (error.message.includes('credentials')) {
      console.log('💡 Verifica las credenciales en tu archivo .env');
    }
  }

  console.log('\n✅ Finalizado');
  process.exit(0);
}

// Banner inicial
console.log('🚀 Banker Venezuela - Transacciones\n');

scrapeTransactions(); 