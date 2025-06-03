#!/usr/bin/env tsx

/**
 * Banesco Transaction Extractor
 * 
 * Extrae las transacciones más recientes de tu cuenta Banesco
 * con autenticación automática y manejo de sistema no disponible
 */

import dotenv from 'dotenv';
import { BanescoAuth } from './auth/banesco-auth';
import { TransactionsScraper } from '../banks/banesco/scrapers/transactions';
import { AccountsScraper } from '../banks/banesco/scrapers/accounts';
import type { BanescoCredentials } from './auth/types';
import type { Transaction } from '../banks/banesco/types';

// Load environment variables
dotenv.config();

interface TransactionResult {
  success: boolean;
  transactions: Transaction[];
  totalCount: number;
  message: string;
  error?: string;
  accountInfo?: {
    balance?: number;
    accountNumber?: string;
  };
}

class BanescoTransactionExtractor {
  private auth: BanescoAuth;
  private transactionsScraper: TransactionsScraper;
  private accountsScraper: AccountsScraper;

  constructor(credentials: BanescoCredentials, headless: boolean = true) {
    this.auth = new BanescoAuth(credentials, {
      headless,
      timeout: 90000,
      debug: false,
      saveSession: true
    });
    
    this.transactionsScraper = new TransactionsScraper();
    this.accountsScraper = new AccountsScraper();
  }

  async extractRecentTransactions(): Promise<TransactionResult> {
    console.log('🚀 Iniciando extracción de transacciones de Banesco');
    console.log('================================================');

    try {
      // Paso 1: Autenticación
      console.log('🔐 PASO 1: Autenticando en Banesco...');
      const loginResult = await this.auth.login();

      if (loginResult.error === 'SYSTEM_UNAVAILABLE') {
        return {
          success: false,
          transactions: [],
          totalCount: 0,
          message: 'Sistema Banesco no disponible',
          error: loginResult.message
        };
      }

      if (!loginResult.success) {
        return {
          success: false,
          transactions: [],
          totalCount: 0,
          message: 'Error de autenticación',
          error: loginResult.message
        };
      }

      console.log('✅ Autenticación exitosa');
      
      // Paso 2: Navegar a cuentas/movimientos
      console.log('\n🏦 PASO 2: Navegando a movimientos de cuenta...');
      const page = this.auth.getPage();
      if (!page) {
        throw new Error('No se pudo obtener acceso a la página');
      }

      // Intentar navegar a detalles de cuenta con transacciones
      const accountNavSuccess = await this.accountsScraper.navigateToAccountDetails(page);
      
      if (!accountNavSuccess) {
        console.log('⚠️  No se pudo navegar automáticamente - intentando extracción desde página actual');
      }

      // Paso 3: Extraer transacciones
      console.log('\n📊 PASO 3: Extrayendo transacciones...');
      const currentUrl = page.url();
      console.log(`📍 Extrayendo desde: ${currentUrl}`);

      const extractionResult = await this.transactionsScraper.scrapeTransactions(page);

      if (!extractionResult.success) {
        return {
          success: false,
          transactions: [],
          totalCount: 0,
          message: 'Error extrayendo transacciones',
          error: extractionResult.error
        };
      }

      const transactions = extractionResult.data || [];
      const metadata = extractionResult.metadata;

      console.log(`\n🎉 EXTRACCIÓN COMPLETA!`);
      console.log(`📈 Transacciones encontradas: ${transactions.length}`);
      
      if (metadata?.accountSummary) {
        console.log(`💰 Saldo actual: ${metadata.accountSummary.currentBalance?.toFixed(2) || 'N/A'}`);
        console.log(`🏦 Cuenta: ${metadata.accountSummary.accountNumber || 'N/A'}`);
      }

      return {
        success: true,
        transactions,
        totalCount: transactions.length,
        message: `Se extrajeron ${transactions.length} transacciones exitosamente`,
        accountInfo: {
          balance: metadata?.accountSummary?.currentBalance,
          accountNumber: metadata?.accountSummary?.accountNumber
        }
      };

    } catch (error: any) {
      console.error('💥 Error durante la extracción:', error);
      return {
        success: false,
        transactions: [],
        totalCount: 0,
        message: 'Error inesperado durante la extracción',
        error: error.message
      };
    } finally {
      await this.auth.close();
    }
  }

  async close() {
    await this.auth.close();
  }
}

// Función principal de extracción
export async function extractBanescoTransactions(options: {
  credentials?: BanescoCredentials;
  headless?: boolean;
  limit?: number;
} = {}): Promise<TransactionResult> {
  
  // Usar credenciales del .env si no se proporcionan
  const credentials = options.credentials || {
    username: process.env.BANESCO_USERNAME || '',
    password: process.env.BANESCO_PASSWORD || '',
    securityQuestions: process.env.SECURITY_QUESTIONS || ''
  };

  if (!credentials.username || !credentials.password) {
    return {
      success: false,
      transactions: [],
      totalCount: 0,
      message: 'Credenciales faltantes',
      error: 'Se requieren BANESCO_USERNAME y BANESCO_PASSWORD en el archivo .env'
    };
  }

  const extractor = new BanescoTransactionExtractor(credentials, options.headless);
  const result = await extractor.extractRecentTransactions();

  // Limitar resultados si se especifica
  if (options.limit && result.transactions.length > options.limit) {
    result.transactions = result.transactions.slice(0, options.limit);
    result.message += ` (limitado a ${options.limit} transacciones)`;
  }

  return result;
}

// Script principal si se ejecuta directamente
async function main() {
  console.log('💳 EXTRACTOR DE TRANSACCIONES BANESCO');
  console.log('====================================');
  console.log('📄 Cargando credenciales desde .env...\n');

  if (!process.env.BANESCO_USERNAME || !process.env.BANESCO_PASSWORD) {
    console.error('❌ Faltan credenciales en el archivo .env:');
    console.error('   BANESCO_USERNAME=tu_usuario');
    console.error('   BANESCO_PASSWORD=tu_contraseña');
    console.error('   SECURITY_QUESTIONS=keyword:answer,keyword2:answer2');
    console.error('');
    console.error('💡 Crea o edita tu archivo .env con las credenciales correctas');
    process.exit(1);
  }

  const startTime = Date.now();
  
  try {
    const result = await extractBanescoTransactions({
      headless: true,
      limit: 20 // Últimas 20 transacciones
    });

    const duration = Math.round((Date.now() - startTime) / 1000);

    console.log(`\n📊 RESULTADOS (${duration}s):`);
    console.log('=================');
    console.log(`✅ Éxito: ${result.success}`);
    console.log(`📈 Transacciones: ${result.totalCount}`);
    console.log(`📝 Mensaje: ${result.message}`);
    
    if (result.error) {
      console.log(`❌ Error: ${result.error}`);
    }

    if (result.accountInfo) {
      console.log(`💰 Saldo: ${result.accountInfo.balance?.toFixed(2) || 'N/A'}`);
      console.log(`🏦 Cuenta: ${result.accountInfo.accountNumber || 'N/A'}`);
    }

    if (result.success && result.transactions.length > 0) {
      console.log('\n📋 ÚLTIMAS TRANSACCIONES:');
      console.log('=========================');
      
      result.transactions.slice(0, 10).forEach((tx, idx) => {
        console.log(`\n${idx + 1}. 📅 ${tx.date}`);
        console.log(`   📝 ${tx.description}`);
        console.log(`   💰 ${tx.amount.toFixed(2)} (${tx.type === 'debit' ? '🔴 Débito' : '🟢 Crédito'})`);
        console.log(`   📊 Saldo: ${tx.balance?.toFixed(2) || 'N/A'}`);
        if (tx.reference) {
          console.log(`   🔢 Ref: ${tx.reference}`);
        }
      });

      if (result.transactions.length > 10) {
        console.log(`\n... y ${result.transactions.length - 10} transacciones más`);
      }

      // Guardar en archivo JSON
      const filename = `banesco-transactions-${new Date().toISOString().split('T')[0]}.json`;
      const fs = await import('fs');
      fs.writeFileSync(filename, JSON.stringify({
        extractedAt: new Date().toISOString(),
        totalTransactions: result.transactions.length,
        accountInfo: result.accountInfo,
        transactions: result.transactions
      }, null, 2));
      
      console.log(`\n💾 Transacciones guardadas en: ${filename}`);
    }

    console.log('\n🎉 Extracción completada exitosamente!');
    
  } catch (error) {
    const duration = Math.round((Date.now() - startTime) / 1000);
    console.error(`\n💥 Error después de ${duration}s:`, error);
    process.exit(1);
  }
}

// Ejecutar main automáticamente cuando se ejecute el script
main().catch((error) => {
  console.error('💥 Error ejecutando el extractor:', error);
  process.exit(1);
});

export { BanescoTransactionExtractor }; 