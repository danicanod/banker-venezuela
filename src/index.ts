import { config } from 'dotenv';
import { BanescLogin } from './banks/banesco/auth/login';
import { AccountsScraper } from './banks/banesco/scrapers/accounts';
import { TransactionsScraper } from './banks/banesco/scrapers/transactions';
import { BanescCredentials, Transaction } from './banks/banesco/types/index';

config();

export class BanescScraper {
  private login: BanescLogin;
  private accountsScraper: AccountsScraper;
  private transactionsScraper: TransactionsScraper;

  constructor(headless: boolean = false) {
    // Validar credenciales
    const username = process.env.BANESCO_USERNAME || '';
    const password = process.env.BANESCO_PASSWORD || '';
    const securityQuestions = process.env.SECURITY_QUESTIONS || '';

    if (!username || !password) {
      throw new Error('❌ Faltan credenciales BANESCO_USERNAME y BANESCO_PASSWORD en .env');
    }

    if (!securityQuestions) {
      throw new Error('❌ Falta SECURITY_QUESTIONS en .env');
    }

    const credentials: BanescCredentials = {
      username,
      password,
      securityQuestions
    };

    this.login = new BanescLogin(credentials, headless);
    this.accountsScraper = new AccountsScraper();
    this.transactionsScraper = new TransactionsScraper();
  }

  async scrapeAllData() {
    console.log('🚀 INICIANDO SCRAPER COMPLETO DE BANESCO');
    console.log('==========================================');

    try {
      // PASO 1: Autenticación
      console.log('\n🔐 PASO 1: Autenticación...');
      const loginResult = await this.login.login();
      
      if (!loginResult.success) {
        console.error('❌ Error en autenticación:', loginResult.message);
        return {
          success: false,
          error: loginResult.message
        };
      }

      console.log('✅ Autenticación exitosa!');

      // PASO 2: Obtener página autenticada
      console.log('\n📄 PASO 2: Obteniendo página autenticada...');
      const page = await this.login.getAuthenticatedPage();
      
      if (!page) {
        console.error('❌ No se pudo obtener página autenticada');
        return {
          success: false,
          error: 'No se pudo obtener página autenticada'
        };
      }

      // PASO 3: Scraping de cuentas
      console.log('\n🏦 PASO 3: Extrayendo información de cuentas...');
      const accountsResult = await this.accountsScraper.scrapeAccounts(page);
      
      if (!accountsResult.success) {
        console.error('❌ Error en scraping de cuentas:', accountsResult.error);
      } else {
        console.log(`✅ Cuentas encontradas: ${accountsResult.data?.length || 0}`);
        if (accountsResult.data && accountsResult.data.length > 0) {
          accountsResult.data.forEach((account, index) => {
            console.log(`   ${index + 1}. ${account.accountNumber} (${account.accountType})`);
          });
        }
      }

      // PASO 4: Intentar acceder a transacciones de la primera cuenta
      console.log('\n💳 PASO 4: Extrayendo transacciones...');
      
      // Intentar hacer clic en el primer enlace de cuenta
      const clickedTransactionLink = await this.transactionsScraper.clickFirstTransactionLink(page);
      
      if (clickedTransactionLink) {
        console.log('✅ Navegación a transacciones exitosa');
      } else {
        console.log('⚠️  No se pudo navegar automáticamente a transacciones');
      }

      // Hacer scraping de transacciones en la página actual
      const transactionsResult = await this.transactionsScraper.scrapeTransactions(page);
      
      if (!transactionsResult.success) {
        console.error('❌ Error en scraping de transacciones:', transactionsResult.error);
      } else {
        console.log(`✅ Transacciones encontradas: ${transactionsResult.data?.length || 0}`);
        if (transactionsResult.data && transactionsResult.data.length > 0) {
          console.log('\n📊 TRANSACCIONES RECIENTES:');
          transactionsResult.data.slice(0, 5).forEach((transaction, index) => {
            console.log(`   ${index + 1}. ${transaction.date} - ${transaction.description}`);
            const amountDisplay = transaction.type === 'credit' ? `+${transaction.amount}` : `-${transaction.amount}`;
            console.log(`      ${amountDisplay} | Saldo: ${transaction.balance}`);
          });
        }
      }

      // PASO 5: Resultado final
      console.log('\n📈 RESUMEN FINAL:');
      console.log('==================');
      console.log(`🔐 Autenticación: ${loginResult.success ? '✅ Exitosa' : '❌ Fallida'}`);
      console.log(`🏦 Cuentas: ${accountsResult.success ? `✅ ${accountsResult.data?.length || 0} encontradas` : '❌ Error'}`);
      console.log(`💳 Transacciones: ${transactionsResult.success ? `✅ ${transactionsResult.data?.length || 0} encontradas` : '❌ Error'}`);

      return {
        success: true,
        data: {
          accounts: accountsResult.data || [],
          transactions: transactionsResult.data || []
        },
        timestamp: new Date()
      };

    } catch (error: any) {
      console.error('❌ Error general en scraping:', error);
      return {
        success: false,
        error: error.message || 'Error desconocido'
      };
    } finally {
      // Cerrar navegador
      console.log('\n🧹 Cerrando navegador...');
      await this.login.close();
    }
  }

  async scrapeAccountsOnly() {
    console.log('🏦 SCRAPING SOLO DE CUENTAS');
    
    try {
      const loginResult = await this.login.login();
      if (!loginResult.success) {
        return { success: false, error: loginResult.message };
      }

      const page = await this.login.getAuthenticatedPage();
      if (!page) {
        return { success: false, error: 'No se pudo obtener página autenticada' };
      }

      const result = await this.accountsScraper.scrapeAccounts(page);
      return result;

    } catch (error: any) {
      return { success: false, error: error.message };
    } finally {
      await this.login.close();
    }
  }

  async scrapeTransactionsOnly(accountUrl?: string) {
    console.log('💳 SCRAPING SOLO DE TRANSACCIONES');
    
    try {
      const loginResult = await this.login.login();
      if (!loginResult.success) {
        return { success: false, error: loginResult.message };
      }

      const page = await this.login.getAuthenticatedPage();
      if (!page) {
        return { success: false, error: 'No se pudo obtener página autenticada' };
      }

      const result = await this.transactionsScraper.scrapeTransactions(page, accountUrl);
      return result;

    } catch (error: any) {
      return { success: false, error: error.message };
    } finally {
      await this.login.close();
    }
  }
}

// Función principal para ejecutar el scraper
async function main() {
  console.log('🎯 BANESCO SCRAPER - VERSIÓN ESTRUCTURADA');
  console.log('==========================================\n');

  const scraper = new BanescScraper(false); // headless: false para desarrollo
  
  const result = await scraper.scrapeAllData();
  
  if (result.success) {
    console.log('\n🎉 ¡SCRAPING COMPLETADO EXITOSAMENTE!');
  } else {
    console.log('\n❌ SCRAPING FALLÓ:', result.error);
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  main().catch(console.error);
}

export default BanescScraper;