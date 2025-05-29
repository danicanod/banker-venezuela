import { Page } from 'playwright';
import { Transaction, ScrapingResult } from '../types/index';
import { HTMLSaver } from '../../../shared/utils/html-saver';

export class TransactionsScraper {
  private htmlSaver: HTMLSaver;

  constructor() {
    this.htmlSaver = new HTMLSaver();
  }

  async scrapeTransactions(page: Page, accountUrl?: string): Promise<ScrapingResult<Transaction>> {
    console.log('💳 Iniciando scraping de transacciones...');
    
    try {
      // Si se proporciona una URL específica de cuenta, navegar a ella
      if (accountUrl) {
        console.log(`🔗 Navegando a: ${accountUrl}`);
        await page.goto(accountUrl, { 
          waitUntil: 'networkidle',
          timeout: 15000 
        });
        await page.waitForTimeout(2000);
      }

      // Guardar HTML para análisis
      await this.htmlSaver.saveHTML(page, 'transactions-scraping-start.html');
      
      const pageTitle = await page.title();
      const pageContent = await page.content();
      
      console.log(`📄 Página de transacciones: ${pageTitle}`);

      // Buscar tablas que puedan contener transacciones
      const transactionTables = await page.$$eval('table', tables => {
        return tables.map(table => ({
          innerHTML: table.innerHTML,
          textContent: table.textContent?.trim() || '',
          className: table.className,
          id: table.id,
          rowCount: table.rows.length,
          columnCount: table.rows[0]?.cells.length || 0
        })).filter(table => 
          table.textContent.includes('fecha') ||
          table.textContent.includes('Fecha') ||
          table.textContent.includes('FECHA') ||
          table.textContent.includes('saldo') ||
          table.textContent.includes('Saldo') ||
          table.textContent.includes('SALDO') ||
          table.textContent.includes('débito') ||
          table.textContent.includes('crédito') ||
          table.textContent.includes('movimiento') ||
          table.rowCount > 3 // Tablas con más de 3 filas podrían ser de transacciones
        );
      });

      console.log(`📋 Tablas de transacciones encontradas: ${transactionTables.length}`);

      if (transactionTables.length > 0) {
        transactionTables.forEach((table, index) => {
          console.log(`   ${index + 1}. Tabla con ${table.rowCount} filas y ${table.columnCount} columnas`);
          console.log(`      Contenido: ${table.textContent.substring(0, 200)}...`);
        });
      }

      // Buscar filas que contengan datos de transacciones
      const transactionRows = await page.$$eval('tr', rows => {
        return rows.map(row => {
          const cells = Array.from(row.cells).map(cell => cell.textContent?.trim() || '');
          const rowText = cells.join(' ').toLowerCase();
          
          // Buscar patrones de fecha
          const datePattern = /\b\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}\b/;
          const amountPattern = /\b\d{1,3}(?:\.\d{3})*(?:,\d{2})?\b/;
          
          const hasDate = datePattern.test(rowText);
          const hasAmount = amountPattern.test(rowText);
          
          if (hasDate && hasAmount && cells.length >= 3) {
            return {
              cells: cells,
              rowText: rowText,
              hasDate: hasDate,
              hasAmount: hasAmount
            };
          }
          return null;
        }).filter(row => row !== null);
      });

      console.log(`📊 Filas con datos de transacciones: ${transactionRows.length}`);

      // Convertir filas a objetos Transaction
      const transactions: Transaction[] = [];
      
      transactionRows.forEach((row, index) => {
        if (row && row.cells.length >= 3) {
          const transaction = this.parseTransactionRow(row.cells, index);
          if (transaction) {
            transactions.push(transaction);
          }
        }
      });

      // Si no se encontraron transacciones en tablas, buscar en divs o spans
      if (transactions.length === 0) {
        console.log('🔍 Buscando transacciones en otros elementos...');
        
        const otherElements = await page.$$eval('div, span, p', elements => {
          return elements.map(el => el.textContent?.trim() || '')
            .filter(text => {
              const lowerText = text.toLowerCase();
              return (lowerText.includes('fecha') || lowerText.includes('saldo') || 
                      lowerText.includes('débito') || lowerText.includes('crédito')) &&
                     text.length > 50 && text.length < 500;
            })
            .slice(0, 10); // Limitar resultados
        });

        console.log(`📄 Elementos con información bancaria: ${otherElements.length}`);
        otherElements.forEach((text, index) => {
          console.log(`   ${index + 1}. ${text.substring(0, 100)}...`);
        });
      }

      console.log(`✅ Transacciones extraídas: ${transactions.length}`);
      
      return {
        success: true,
        data: transactions,
        timestamp: new Date()
      };

    } catch (error: any) {
      console.error('❌ Error en scraping de transacciones:', error);
      return {
        success: false,
        error: error.message || 'Error desconocido',
        timestamp: new Date()
      };
    }
  }

  private parseTransactionRow(cells: string[], index: number): Transaction | null {
    try {
      // Intentar identificar patrones comunes en las celdas
      let date = '';
      let description = '';
      let reference = '';
      let amount = 0;
      let type: 'debit' | 'credit' = 'debit';
      let balance = 0;

      // Buscar fecha en las primeras celdas
      for (let i = 0; i < Math.min(3, cells.length); i++) {
        const dateMatch = cells[i].match(/\b\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}\b/);
        if (dateMatch) {
          date = this.standardizeDate(dateMatch[0]);
          break;
        }
      }

      // Buscar descripción (celda con más texto)
      let maxLength = 0;
      for (let i = 0; i < cells.length; i++) {
        if (cells[i].length > maxLength && !cells[i].match(/^\d+([,\.]\d+)*$/)) {
          maxLength = cells[i].length;
          description = cells[i];
        }
      }

      // Buscar montos
      const amounts: number[] = [];
      cells.forEach(cell => {
        const amountMatch = cell.match(/\b(\d{1,3}(?:\.\d{3})*(?:,\d{2})?)\b/);
        if (amountMatch) {
          const parsedAmount = this.parseAmount(amountMatch[1]);
          amounts.push(parsedAmount);
        }
      });

      // Asignar montos basado en el número encontrado
      if (amounts.length >= 1) {
        balance = amounts[amounts.length - 1]; // El último suele ser el saldo
      }
      if (amounts.length >= 2) {
        // El penúltimo suele ser el monto de la transacción
        amount = amounts[amounts.length - 2];
        // Por ahora asignar como crédito, se puede refinar con más lógica
        type = 'credit';
      }

      // Generar referencia básica
      reference = `REF-${index + 1}`;

      // Validar que tenemos datos mínimos
      if (!date && !description) {
        return null;
      }

      return {
        date: date || new Date().toISOString().split('T')[0],
        description: description || 'Transacción sin descripción',
        reference: reference,
        amount: amount,
        type: type,
        balance: balance
      };

    } catch (error) {
      console.log(`⚠️  Error parseando fila ${index}:`, error);
      return null;
    }
  }

  private standardizeDate(dateStr: string): string {
    try {
      // Convertir diferentes formatos de fecha a YYYY-MM-DD
      const parts = dateStr.split(/[\/\-\.]/);
      
      if (parts.length === 3) {
        let day = parseInt(parts[0]);
        let month = parseInt(parts[1]);
        let year = parseInt(parts[2]);
        
        // Ajustar año si es de 2 dígitos
        if (year < 100) {
          year += year < 50 ? 2000 : 1900;
        }
        
        // Formato ISO
        return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
      }
      
      return dateStr;
    } catch (error) {
      return dateStr;
    }
  }

  private parseAmount(amountStr: string): number {
    try {
      // Convertir formato venezolano (1.234.567,89) a número
      const cleanAmount = amountStr
        .replace(/\./g, '') // Remover separadores de miles
        .replace(',', '.'); // Convertir coma decimal a punto
      
      return parseFloat(cleanAmount) || 0;
    } catch (error) {
      return 0;
    }
  }

  async clickFirstTransactionLink(page: Page): Promise<boolean> {
    console.log('🔍 Buscando primer enlace de transacciones...');
    
    try {
      // Buscar enlaces que puedan llevar a transacciones
      const transactionSelectors = [
        'a[href*="MovimientosCuenta"]',
        'a[href*="Movimientos"]',
        'a[href*="movimientos"]',
        'a[href*="transacciones"]',
        'a[href*="Transacciones"]',
        'a:has-text("cuenta")',
        'a:has-text("Cuenta")',
        'a:has-text("movimientos")',
        'a:has-text("Movimientos")'
      ];

      for (const selector of transactionSelectors) {
        try {
          const link = await page.$(selector);
          if (link) {
            console.log(`✅ Haciendo clic en enlace: ${selector}`);
            await link.click();
            await page.waitForTimeout(3000);
            return true;
          }
        } catch (e) {
          // Continue trying other selectors
        }
      }

      console.log('⚠️  No se encontró enlace de transacciones');
      return false;

    } catch (error) {
      console.log('❌ Error buscando enlace de transacciones:', error);
      return false;
    }
  }
} 