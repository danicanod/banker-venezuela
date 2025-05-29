import { Page } from 'playwright';
import { Account, ScrapingResult } from '../types/index';
import { HTMLSaver } from '../../../shared/utils/html-saver';

export class AccountsScraper {
  private htmlSaver: HTMLSaver;

  constructor() {
    this.htmlSaver = new HTMLSaver();
  }

  async scrapeAccounts(page: Page): Promise<ScrapingResult<Account>> {
    console.log('🏦 Iniciando scraping de cuentas...');
    
    try {
      // Guardar HTML actual para análisis
      await this.htmlSaver.saveHTML(page, 'accounts-scraping-start.html');
      
      // Verificar que estamos en la página correcta
      const pageTitle = await page.title();
      const pageContent = await page.content();
      
      if (!pageContent.includes('Banesco') || pageContent.includes('Login')) {
        return {
          success: false,
          error: 'No se está en la página bancaria correcta',
          timestamp: new Date()
        };
      }

      console.log(`📄 Página actual: ${pageTitle}`);
      
      // Buscar enlaces o elementos que contengan información de cuentas
      const accountLinks = await page.$$eval('a', links => {
        return links
          .map(link => ({
            text: link.textContent?.trim() || '',
            href: link.href || '',
            innerHTML: link.innerHTML
          }))
          .filter(link => 
            link.text.includes('cuenta') || 
            link.text.includes('Cuenta') ||
            link.text.includes('CUENTA') ||
            link.href.includes('cuenta') ||
            link.href.includes('Cuenta') ||
            link.href.includes('MovimientosCuenta')
          );
      });

      console.log(`🔗 Enlaces de cuentas encontrados: ${accountLinks.length}`);
      
      if (accountLinks.length > 0) {
        accountLinks.forEach((link, index) => {
          console.log(`   ${index + 1}. ${link.text} → ${link.href}`);
        });
      }

      // Buscar elementos que contengan información de balance o números de cuenta
      const accountElements = await page.$$eval('*', elements => {
        const accountInfo: any[] = [];
        
        elements.forEach(el => {
          const text = el.textContent?.trim() || '';
          
          // Buscar patrones de números de cuenta (típicamente largos)
          const accountNumberPattern = /\b\d{10,20}\b/g;
          const balancePattern = /\b\d{1,3}(?:\.\d{3})*(?:,\d{2})?\s*(?:Bs|BsF|Bolívares?)?\b/gi;
          
          const accountMatches = text.match(accountNumberPattern);
          const balanceMatches = text.match(balancePattern);
          
          if (accountMatches || balanceMatches) {
            accountInfo.push({
              element: el.tagName,
              text: text,
              accountNumbers: accountMatches,
              balances: balanceMatches,
              className: el.className,
              id: el.id
            });
          }
        });
        
        return accountInfo.slice(0, 20); // Limitar a 20 para evitar spam
      });

      console.log(`📊 Elementos con información bancaria: ${accountElements.length}`);
      
      if (accountElements.length > 0) {
        accountElements.forEach((element, index) => {
          console.log(`   ${index + 1}. ${element.element}: ${element.text.substring(0, 100)}...`);
          if (element.accountNumbers) {
            console.log(`      Números de cuenta: ${element.accountNumbers.join(', ')}`);
          }
          if (element.balances) {
            console.log(`      Balances: ${element.balances.join(', ')}`);
          }
        });
      }

      // Por ahora, crear cuentas de ejemplo basadas en los datos encontrados
      const accounts: Account[] = [];
      
      // Si encontramos enlaces de cuentas, crear entradas básicas
      accountLinks.forEach((link, index) => {
        accounts.push({
          accountNumber: `LINK_${index + 1}`,
          accountType: this.extractAccountType(link.text),
          balance: 0, // Se obtendrá en el scraping de transacciones
          currency: 'VES',
          status: 'active'
        });
      });

      // Si no se encontraron enlaces pero hay elementos con números de cuenta
      if (accounts.length === 0 && accountElements.length > 0) {
        accountElements.forEach((element, index) => {
          if (element.accountNumbers) {
            element.accountNumbers.forEach((accountNumber: string) => {
              accounts.push({
                accountNumber: accountNumber,
                accountType: 'unknown',
                balance: 0,
                currency: 'VES',
                status: 'active'
              });
            });
          }
        });
      }

      console.log(`✅ Cuentas extraídas: ${accounts.length}`);
      
      return {
        success: true,
        data: accounts,
        timestamp: new Date()
      };

    } catch (error: any) {
      console.error('❌ Error en scraping de cuentas:', error);
      return {
        success: false,
        error: error.message || 'Error desconocido',
        timestamp: new Date()
      };
    }
  }

  private extractAccountType(text: string): string {
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes('corriente')) return 'corriente';
    if (lowerText.includes('ahorro')) return 'ahorro';
    if (lowerText.includes('credito') || lowerText.includes('crédito')) return 'credito';
    if (lowerText.includes('tarjeta')) return 'tarjeta';
    
    return 'unknown';
  }

  async getFirstAccountLink(page: Page): Promise<string | null> {
    console.log('🔍 Buscando primer enlace de cuenta...');
    
    try {
      const firstAccountLink = await page.$eval('a[href*="MovimientosCuenta"], a[href*="cuenta"], a[href*="Cuenta"]', 
        (link: HTMLAnchorElement) => link.href
      );
      
      console.log(`🎯 Primer enlace de cuenta: ${firstAccountLink}`);
      return firstAccountLink;
      
    } catch (error) {
      console.log('⚠️  No se encontró enlace directo de cuenta');
      return null;
    }
  }
}