import { Page } from 'playwright';
import { Transaction, ScrapingResult } from '../types/index';
import { HTMLSaver } from '../../../shared/utils/html-saver';
import { StrategicLogger } from '../../../shared/utils/strategic-logger';

export class TransactionsScraper {
  private htmlSaver: HTMLSaver;
  private logger = StrategicLogger.getInstance().createComponentLogger('TransactionsScraper');

  constructor() {
    this.htmlSaver = new HTMLSaver();
    this.logger.debug('TransactionsScraper instance created');
  }

  async scrapeTransactions(page: Page, accountUrl?: string): Promise<ScrapingResult<Transaction>> {
    const scrapeOperationId = this.logger.startOperation('scrape_transactions');
    this.logger.info('Starting advanced transaction scraping');
    
    try {
      // Si se proporciona una URL específica de cuenta, navegar a ella
      if (accountUrl) {
        const navId = this.logger.startOperation('navigation');
        this.logger.info(`Navigating to: ${accountUrl}`);
        await page.goto(accountUrl, { 
          waitUntil: 'networkidle',
          timeout: 15000 
        });
        await page.waitForTimeout(2000);
        this.logger.endOperation(navId);
      }

      // Guardar HTML para análisis
      await this.htmlSaver.saveHTML(page, 'transactions-scraping-start.html');
      
      const pageTitle = await page.title();
      const currentUrl = page.url();
      
      this.logger.info('Transaction page loaded', {
        title: pageTitle,
        url: currentUrl
      });

      // Verificar si hay mensaje de "no hay movimientos"
      const noMovementsMessage = await this.checkForNoMovementsMessage(page);
      if (noMovementsMessage) {
        this.logger.warn('No movements message detected for selected period');
        this.logger.endOperation(scrapeOperationId);
        return {
          success: true,
          data: [],
          timestamp: new Date(),
          message: 'No hay movimientos en el período seleccionado'
        };
      }

      // PASO 1: Buscar tablas principales de transacciones
      const analysisId = this.logger.startOperation('table_analysis');
      this.logger.info('STEP 1: Analyzing table structure');
      
      const tableAnalysis = await this.analyzeTransactionTables(page);
      this.logger.endOperation(analysisId);
      
      if (tableAnalysis.tables.length === 0) {
        this.logger.warn('No transaction tables found, trying alternative extraction');
        const result = await this.alternativeDataExtraction(page);
        this.logger.endOperation(scrapeOperationId);
        return result;
      }

      this.logger.data('Table analysis completed', {
        tablesFound: tableAnalysis.tables.length,
        tables: tableAnalysis.tables.map(t => ({
          rows: t.rowCount,
          columns: t.columnCount,
          hasTransactionData: t.containsTransactionData
        }))
      });

      // PASO 2: Extraer transacciones de las tablas identificadas
      const extractionId = this.logger.startOperation('data_extraction');
      this.logger.info('STEP 2: Extracting transaction data');
      
      const transactions = await this.extractTransactionsFromTables(page, tableAnalysis);
      this.logger.endOperation(extractionId);

      // PASO 3: Extraer información adicional (saldos, resúmenes)
      const summaryId = this.logger.startOperation('account_summary');
      this.logger.info('STEP 3: Extracting balance information');
      
      const accountSummary = await this.extractAccountSummary(page);
      this.logger.endOperation(summaryId);

      // Resumen de extracción
      this.logger.success('Transaction extraction completed', {
        transactionsFound: transactions.length,
        currentBalance: accountSummary.currentBalance,
        previousBalance: accountSummary.previousBalance
      });
      
      if (transactions.length > 0 && StrategicLogger.getInstance().getConfig().level >= 4) { // DEBUG level
        this.logger.data('Extracted transactions preview', {
          first3Transactions: transactions.slice(0, 3).map(t => ({
            date: t.date,
            description: t.description.substring(0, 50) + '...',
            amount: t.amount,
            type: t.type,
            balance: t.balance
          }))
        });
      }
      
      this.logger.endOperation(scrapeOperationId);
      
      return {
        success: true,
        data: transactions,
        timestamp: new Date(),
        metadata: {
          accountSummary,
          tablesFound: tableAnalysis.tables.length,
          pageTitle,
          currentUrl
        }
      };

    } catch (error: any) {
      this.logger.error('Error in transaction scraping', error);
      await this.htmlSaver.saveHTML(page, 'transactions-error.html');
      this.logger.endOperation(scrapeOperationId);
      
      return {
        success: false,
        error: error.message || 'Error desconocido',
        timestamp: new Date()
      };
    }
  }

  private async checkForNoMovementsMessage(page: Page): Promise<boolean> {
    try {
      const pageContent = await page.content();
      
      const noMovementsPatterns = [
        'no posee movimientos',
        'No posee movimientos',
        'NO POSEE MOVIMIENTOS',
        'no hay movimientos',
        'no existen movimientos',
        'sin movimientos',
        'no se encontraron movimientos',
        'no hay registros',
        'sin registros para mostrar'
      ];

      const hasNoMovements = noMovementsPatterns.some(pattern => 
        pageContent.includes(pattern)
      );

      if (hasNoMovements) {
        this.logger.warn('Detected "no movements" message');
        
        // Buscar elementos específicos con estos mensajes
        const messageElements = await page.$$eval('*', elements => {
          return elements
            .map(el => el.textContent?.trim() || '')
            .filter(text => 
              text.toLowerCase().includes('no posee movimientos') ||
              text.toLowerCase().includes('no hay movimientos') ||
              text.toLowerCase().includes('sin movimientos')
            )
            .slice(0, 3);
        });

        if (messageElements.length > 0) {
          this.logger.data('Found no-movement messages', { messages: messageElements });
        }
      }

      return hasNoMovements;
      
    } catch (error) {
      this.logger.warn('Error checking for no-movements messages', error);
      return false;
    }
  }

  private async analyzeTransactionTables(page: Page): Promise<{
    tables: Array<{
      index: number;
      rowCount: number;
      columnCount: number;
      headerTexts: string[];
      containsTransactionData: boolean;
      selector: string;
    }>;
  }> {
    const tables = await page.$$eval('table', (tables) => {
      return tables.map((table, index) => {
        const rows = Array.from(table.rows);
        const headerRow = rows[0];
        const headerTexts = headerRow ? 
          Array.from(headerRow.cells).map(cell => cell.textContent?.trim() || '') : 
          [];
        
        const allText = table.textContent?.toLowerCase() || '';
        
        // Determinar si es una tabla de transacciones
        const transactionKeywords = [
          'fecha', 'date',
          'descripcion', 'descripción', 'description',
          'monto', 'amount', 'importe',
          'saldo', 'balance',
          'debito', 'débito', 'debit',
          'credito', 'crédito', 'credit',
          'referencia', 'reference', 'ref',
          'movimiento', 'movement'
        ];
        
        const containsTransactionData = transactionKeywords.some(keyword => 
          allText.includes(keyword)
        ) && rows.length > 1; // Más de una fila (header + data)

        return {
          index,
          rowCount: rows.length,
          columnCount: headerRow?.cells.length || 0,
          headerTexts,
          containsTransactionData,
          selector: `table:nth-of-type(${index + 1})`
        };
      });
    });

    const transactionTables = tables.filter(table => table.containsTransactionData);
    
    console.log(`📋 Análisis de tablas:`);
    console.log(`   🔍 Total de tablas: ${tables.length}`);
    console.log(`   ✅ Tablas de transacciones: ${transactionTables.length}`);
    
    transactionTables.forEach((table) => {
      console.log(`\n   📊 Tabla ${table.index + 1}:`);
      console.log(`      📏 Dimensiones: ${table.rowCount} filas × ${table.columnCount} columnas`);
      console.log(`      📝 Headers: [${table.headerTexts.join(', ')}]`);
    });

    return { tables: transactionTables };
  }

  private async extractTransactionsFromTables(page: Page, tableAnalysis: any): Promise<Transaction[]> {
    const allTransactions: Transaction[] = [];

    for (const tableInfo of tableAnalysis.tables) {
      console.log(`\n🔍 Extrayendo datos de tabla ${tableInfo.index + 1}...`);
      console.log(`📊 Headers: [${tableInfo.headerTexts.join(', ')}]`);
      console.log(`📏 ${tableInfo.rowCount} filas × ${tableInfo.columnCount} columnas`);
      
      try {
        // Usar un enfoque más robusto para extraer datos de la tabla
        const tableData = await page.evaluate((tableIndex: number) => {
          // Obtener todas las tablas
          const tables = document.querySelectorAll('table');
          const table = tables[tableIndex] as HTMLTableElement;
          
          if (!table) {
            console.log(`❌ No se encontró tabla en índice ${tableIndex}`);
            return { headers: [], rows: [], debug: 'table_not_found' };
          }

          const rows = Array.from(table.rows);
          
          if (rows.length === 0) {
            return { headers: [], rows: [], debug: 'no_rows' };
          }
          
          // Extraer headers desde la primera fila
          const firstRow = rows[0];
          const headers = firstRow ? 
            Array.from(firstRow.cells).map(cell => cell.textContent?.trim() || '') : 
            [];
          
          // Extraer filas de datos (saltando header)
          const dataRows = [];
          for (let i = 1; i < rows.length; i++) {
            const row = rows[i];
            const cells = Array.from(row.cells).map(cell => {
              const text = cell.textContent?.trim() || '';
              return text;
            });
            
            // Solo incluir filas que tengan contenido significativo
            if (cells.some(cell => cell.length > 0)) {
              dataRows.push(cells);
            }
          }
          
          return { 
            headers, 
            rows: dataRows,
            debug: `table_${tableIndex}_processed`,
            tableRowCount: rows.length,
            headerCount: headers.length
          };
        }, tableInfo.index);

        console.log(`📋 Headers extraídos: [${tableData.headers.join(', ')}]`);
        console.log(`📊 Filas de datos extraídas: ${tableData.rows.length}`);
        console.log(`🔍 Debug info: ${tableData.debug}, tabla tenía ${tableData.tableRowCount} filas, ${tableData.headerCount} headers`);

        // Si no hay headers, intentar detectarlos desde los datos
        let finalHeaders = tableData.headers;
        if (finalHeaders.length === 0 || finalHeaders.every(h => h === '')) {
          console.log(`⚠️  Headers vacíos, usando headers predeterminados de Banesco`);
          finalHeaders = ['Fecha', 'Descripción', 'Referencia', 'Monto', 'D/C', 'Saldo'];
        }

        if (tableData.rows.length > 0) {
          console.log(`🔍 Primera fila de muestra: [${tableData.rows[0].join(' | ')}]`);
          
          // Procesar las transacciones en Node.js context
          const tableTransactions = this.processRawTableData(finalHeaders, tableData.rows, tableInfo.index);
          
          if (tableTransactions.length > 0) {
            allTransactions.push(...tableTransactions);
            console.log(`   ✅ Procesadas ${tableTransactions.length} transacciones exitosamente`);
            
            // Mostrar las primeras 3 transacciones como muestra
            console.log(`\n   💳 MUESTRA DE TRANSACCIONES PROCESADAS:`);
            tableTransactions.slice(0, 3).forEach((tx, idx) => {
              console.log(`      ${idx + 1}. 📅 ${tx.date}`);
              console.log(`         📝 ${tx.description}`);
              console.log(`         💰 ${tx.amount.toFixed(2)} (${tx.type})`);
              console.log(`         📊 Saldo: ${tx.balance?.toFixed(2) || 'N/A'}`);
              if (tx.reference) {
                console.log(`         🔢 Ref: ${tx.reference}`);
              }
            });
            
            if (tableTransactions.length > 3) {
              console.log(`      ... y ${tableTransactions.length - 3} transacciones más`);
            }
          } else {
            console.log(`   ⚠️  No se pudieron procesar transacciones de esta tabla`);
          }
        } else {
          console.log(`   ⚠️  No se extrajeron filas de datos de esta tabla`);
        }
        
      } catch (error) {
        console.log(`   ❌ Error extrayendo tabla ${tableInfo.index + 1}:`, error);
      }
    }

    // Manejo de paginación - buscar botón "Siguiente"
    if (allTransactions.length > 0) {
      console.log(`\n📄 Verificando paginación...`);
      const hasMorePages = await this.checkAndNavigateToNextPage(page);
      
      if (hasMorePages) {
        console.log(`🔄 Página siguiente encontrada, extrayendo transacciones adicionales...`);
        
        // Analizar y extraer transacciones de la siguiente página
        const nextPageAnalysis = await this.analyzeTransactionTables(page);
        const nextPageTransactions = await this.extractTransactionsFromTables(page, nextPageAnalysis);
        
        if (nextPageTransactions.length > 0) {
          allTransactions.push(...nextPageTransactions);
          console.log(`➕ Agregadas ${nextPageTransactions.length} transacciones de página siguiente`);
        }
      } else {
        console.log(`📋 No hay más páginas - extracción completa`);
      }
    }

    // Postprocesamiento y validación
    const validTransactions = allTransactions
      .filter(t => t && (t.date || t.description))
      .map((t, index) => ({
        ...t,
        id: t.id || `tx_${index + 1}`,
        reference: t.reference || `REF_${Date.now()}_${index + 1}`
      }));

    console.log(`\n🎯 TOTAL DE TRANSACCIONES VÁLIDAS: ${validTransactions.length}`);
    return validTransactions;
  }

  private processRawTableData(headers: string[], rows: string[][], tableIndex: number): Transaction[] {
    if (rows.length === 0) return [];

    console.log(`\n🔧 Procesando tabla ${tableIndex + 1} con ${rows.length} filas...`);
    
    // Mapear headers a índices
    const fechaIdx = headers.findIndex(h => h.toLowerCase().includes('fecha'));
    const descripcionIdx = headers.findIndex(h => h.toLowerCase().includes('descripción'));
    const referenciaIdx = headers.findIndex(h => h.toLowerCase().includes('referencia'));
    const montoIdx = headers.findIndex(h => h.toLowerCase().includes('monto'));
    const dcIdx = headers.findIndex(h => h.toLowerCase().includes('d/c'));
    const saldoIdx = headers.findIndex(h => h.toLowerCase().includes('saldo'));
    
    console.log(`🗺️  Mapeo de columnas: fecha=${fechaIdx}, descripción=${descripcionIdx}, referencia=${referenciaIdx}, monto=${montoIdx}, d/c=${dcIdx}, saldo=${saldoIdx}`);

    const transactions: Transaction[] = [];

    rows.forEach((row, rowIndex) => {
      try {
        const fecha = fechaIdx >= 0 ? row[fechaIdx] : row[0] || '';
        const descripcion = descripcionIdx >= 0 ? row[descripcionIdx] : row[1] || '';
        const referencia = referenciaIdx >= 0 ? row[referenciaIdx] : row[2] || '';
        const montoStr = montoIdx >= 0 ? row[montoIdx] : row[3] || '';
        const dcStr = dcIdx >= 0 ? row[dcIdx] : row[4] || '';
        const saldoStr = saldoIdx >= 0 ? row[saldoIdx] : row[5] || '';
        
        // Validar que tenemos datos mínimos
        if (!fecha || !descripcion) {
          console.log(`⚠️  Fila ${rowIndex + 1} omitida: sin fecha o descripción`);
          return;
        }

        const transaction: Transaction = {
          id: `tx_${tableIndex}_${rowIndex + 1}`,
          date: this.standardizeDate(fecha),
          description: descripcion,
          amount: this.parseAmountString(montoStr),
          type: this.determineTransactionType(dcStr),
          balance: this.parseAmountString(saldoStr),
          reference: referencia || `REF_${Date.now()}_${rowIndex + 1}`
        };

        transactions.push(transaction);
        
      } catch (error) {
        console.log(`⚠️  Error procesando fila ${rowIndex + 1}:`, error);
      }
    });

    console.log(`✅ Procesadas ${transactions.length} transacciones de ${rows.length} filas`);
    return transactions;
  }

  private determineTransactionType(dcValue: string): 'debit' | 'credit' {
    const lowerDC = dcValue.toLowerCase().trim();
    
    // Detectar créditos explícitos
    if (lowerDC.includes('c') || lowerDC.includes('crédito') || lowerDC.includes('credit') || lowerDC === '+') {
      return 'credit';
    }
    
    // Detectar débitos explícitos
    if (lowerDC.includes('d') || lowerDC.includes('débito') || lowerDC.includes('debit') || lowerDC === '-') {
      return 'debit';
    }
    
    // Si no está claro, usar débito por defecto (es más común)
    return 'debit';
  }

  private async checkAndNavigateToNextPage(page: Page): Promise<boolean> {
    try {
      // Buscar mensaje de paginación
      const paginationMessage = await page.textContent('body');
      const hasPagination = paginationMessage?.includes('Para consultar el resto de sus operaciones presione el botón Siguiente') || false;
      
      if (!hasPagination) {
        console.log(`📄 No se detectó mensaje de paginación`);
        return false;
      }

      console.log(`📄 Detectado mensaje de paginación: "Para consultar el resto de sus operaciones presione el botón Siguiente"`);

      // Buscar botón "Siguiente"
      const nextButtonSelectors = [
        'input[value*="Siguiente"]',
        'button:has-text("Siguiente")',
        'a:has-text("Siguiente")',
        'input[type="submit"][value*="Siguiente"]',
        'input[type="button"][value*="Siguiente"]'
      ];

      for (const selector of nextButtonSelectors) {
        try {
          const nextButton = await page.$(selector);
          if (nextButton) {
            console.log(`🔘 Botón "Siguiente" encontrado: ${selector}`);
            
            // Hacer clic en el botón siguiente
            await nextButton.click();
            console.log(`🔄 Navegando a página siguiente...`);
            
            // Esperar a que cargue la nueva página
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(3000);
            
            // Guardar HTML de la nueva página
            await this.htmlSaver.saveHTML(page, `transactions-page-next-${Date.now()}.html`);
            
            return true;
          }
        } catch (e) {
          // Continuar probando otros selectores
        }
      }

      console.log(`⚠️  No se encontró botón "Siguiente" funcional`);
      return false;

    } catch (error) {
      console.log(`❌ Error verificando paginación:`, error);
      return false;
    }
  }

  private async extractAccountSummary(page: Page): Promise<{
    currentBalance: number | null;
    previousBalance: number | null;
    accountNumber: string | null;
    accountType: string | null;
  }> {
    try {
      const summary = await page.evaluate(() => {
        const allText = document.body.textContent || '';
        
        // Buscar patrones de saldo
        const balancePatterns = [
          /saldo\s+actual[:\s]+([0-9.,]+)/gi,
          /saldo[:\s]+([0-9.,]+)/gi,
          /balance[:\s]+([0-9.,]+)/gi,
          /total[:\s]+([0-9.,]+)/gi
        ];
        
        const balanceMatches: string[] = [];
        
        for (const pattern of balancePatterns) {
          const matches = Array.from(allText.matchAll(pattern));
          if (matches.length > 0) {
            balanceMatches.push(matches[0][1]);
            if (matches.length > 1) {
              balanceMatches.push(matches[1][1]);
            }
            break;
          }
        }
        
        // Buscar número de cuenta
        const accountPatterns = [
          /cuenta[:\s]+(\d{10,20})/gi,
          /account[:\s]+(\d{10,20})/gi,
          /número[:\s]+(\d{10,20})/gi
        ];
        
        let accountNumber: string | null = null;
        for (const pattern of accountPatterns) {
          const match = pattern.exec(allText);
          if (match) {
            accountNumber = match[1];
            break;
          }
        }
        
        return {
          balanceMatches,
          accountNumber,
          accountType: null // Se puede implementar detección del tipo
        };
      });
      
      // Procesar los montos en Node.js donde tenemos acceso a parseAmountString
      const currentBalance = summary.balanceMatches.length > 0 ? 
        this.parseAmountString(summary.balanceMatches[0]) : null;
      const previousBalance = summary.balanceMatches.length > 1 ? 
        this.parseAmountString(summary.balanceMatches[1]) : null;
      
      return {
        currentBalance,
        previousBalance,
        accountNumber: summary.accountNumber,
        accountType: summary.accountType
      };
      
    } catch (error) {
      console.log('⚠️  Error extrayendo resumen de cuenta:', error);
      return {
        currentBalance: null,
        previousBalance: null,
        accountNumber: null,
        accountType: null
      };
    }
  }

  private async alternativeDataExtraction(page: Page): Promise<ScrapingResult<Transaction>> {
    console.log('🔄 Intentando extracción alternativa de datos...');
    
    try {
      // Buscar elementos con información de transacciones fuera de tablas
      const transactionData = await page.$$eval('div, span, p', elements => {
        const transactions: any[] = [];
        
        // Helper function injected into page context
        const parseAmountString = (amountStr: string): number => {
          if (!amountStr || typeof amountStr !== 'string') return 0;
          
          const cleaned = amountStr.replace(/[^\d,.-]/g, '');
          
          if (cleaned.includes(',') && cleaned.lastIndexOf(',') > cleaned.lastIndexOf('.')) {
            const parts = cleaned.split(',');
            const integerPart = parts[0].replace(/\./g, '');
            const decimalPart = parts[1] || '00';
            return parseFloat(`${integerPart}.${decimalPart}`);
          }
          
          const withoutCommas = cleaned.replace(/,/g, '');
          const parsed = parseFloat(withoutCommas);
          
          return isNaN(parsed) ? 0 : parsed;
        };
        
        elements.forEach((el, index) => {
          const text = el.textContent?.trim() || '';
          
          // Buscar patrones de transacciones en texto libre
          const datePattern = /\b\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}\b/;
          const amountPattern = /\b\d{1,3}(?:\.\d{3})*(?:,\d{2})?\b/;
          
          if (text.length > 30 && text.length < 500 && 
              datePattern.test(text) && amountPattern.test(text)) {
            
            const dateMatch = text.match(datePattern);
            const amountMatches = Array.from(text.matchAll(new RegExp(amountPattern.source, 'g')));
            
            if (dateMatch && amountMatches.length > 0) {
              transactions.push({
                id: `alt_${index}`,
                date: dateMatch[0],
                description: text.substring(0, 100),
                amount: parseAmountString(amountMatches[0][0]),
                type: 'unknown',
                reference: `ALT_${index}`,
                balance: amountMatches.length > 1 ? 
                  parseAmountString(amountMatches[amountMatches.length - 1][0]) : null
              });
            }
          }
        });
        
        return transactions.slice(0, 10); // Limitar a 10 resultados
      });

      console.log(`📄 Extracción alternativa: ${transactionData.length} posibles transacciones`);
      
      return {
        success: true,
        data: transactionData,
        timestamp: new Date(),
        message: 'Datos extraídos usando método alternativo'
      };
      
    } catch (error: any) {
      return {
        success: false,
        error: `Error en extracción alternativa: ${error.message}`,
        timestamp: new Date()
      };
    }
  }

  // Métodos auxiliares - ahora privados al servidor, no inyectados en página
  private mapTableColumns(headerTexts: string[]): { [key: string]: number } {
    const mapping: { [key: string]: number } = {};
    
    headerTexts.forEach((header, index) => {
      const lowerHeader = header.toLowerCase();
      
      if (lowerHeader.includes('fecha') || lowerHeader.includes('date')) {
        mapping.date = index;
      } else if (lowerHeader.includes('descripcion') || lowerHeader.includes('description') || 
                 lowerHeader.includes('concepto') || lowerHeader.includes('detalle')) {
        mapping.description = index;
      } else if (lowerHeader.includes('monto') || lowerHeader.includes('amount') || 
                 lowerHeader.includes('importe')) {
        mapping.amount = index;
      } else if (lowerHeader.includes('saldo') || lowerHeader.includes('balance')) {
        mapping.balance = index;
      } else if (lowerHeader.includes('d/c') || lowerHeader === 'd/c') {
        mapping.dc = index;
      } else if (lowerHeader.includes('debito') || lowerHeader.includes('debit')) {
        mapping.debit = index;
      } else if (lowerHeader.includes('credito') || lowerHeader.includes('credit')) {
        mapping.credit = index;
      } else if (lowerHeader.includes('referencia') || lowerHeader.includes('reference') ||
                 lowerHeader.includes('ref')) {
        mapping.reference = index;
      }
    });
    
    return mapping;
  }

  private parseAmountString(amountStr: string): number {
    if (!amountStr || typeof amountStr !== 'string') return 0;
    
    // Limpiar el string y extraer números
    let cleaned = amountStr.replace(/[^\d,.-]/g, '');
    
    // Detectar si es un monto negativo (común en débitos)
    const isNegative = amountStr.includes('-');
    
    // Manejar formato venezolano: 1.234.567,89
    if (cleaned.includes(',') && cleaned.lastIndexOf(',') > cleaned.lastIndexOf('.')) {
      const parts = cleaned.split(',');
      const integerPart = parts[0].replace(/\./g, ''); // Remover puntos de miles
      const decimalPart = parts[1] || '00';
      const result = parseFloat(`${integerPart}.${decimalPart}`);
      return isNegative ? -Math.abs(result) : result;
    }
    
    // Manejar formato americano: 1,234,567.89
    if (cleaned.includes(',') && cleaned.lastIndexOf('.') > cleaned.lastIndexOf(',')) {
      const withoutCommas = cleaned.replace(/,/g, '');
      const result = parseFloat(withoutCommas);
      return isNegative ? -Math.abs(result) : Math.abs(result);
    }
    
    // Solo números con punto decimal
    const withoutCommas = cleaned.replace(/,/g, '');
    const parsed = parseFloat(withoutCommas);
    const result = isNaN(parsed) ? 0 : parsed;
    
    return isNegative ? -Math.abs(result) : result;
  }

  private standardizeDate(dateStr: string): string {
    if (!dateStr) return '';
    
    // Limpiar la fecha
    const cleaned = dateStr.trim();
    
    // Detectar formato DD/MM/YYYY (formato Banesco)
    const ddmmyyyyMatch = cleaned.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (ddmmyyyyMatch) {
      const [, day, month, year] = ddmmyyyyMatch;
      return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
    }
    
    // Detectar formato DD-MM-YYYY
    const ddmmyyyyDashMatch = cleaned.match(/(\d{1,2})-(\d{1,2})-(\d{4})/);
    if (ddmmyyyyDashMatch) {
      const [, day, month, year] = ddmmyyyyDashMatch;
      return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
    }
    
    // Si no coincide con ningún patrón, devolver tal como está
    return cleaned;
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