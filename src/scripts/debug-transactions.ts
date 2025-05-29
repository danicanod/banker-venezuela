import { config } from 'dotenv';
import { BanescLogin } from '../banks/banesco/auth/login';
import { AccountsScraper } from '../banks/banesco/scrapers/accounts';
import { BanescCredentials } from '../banks/banesco/types/index';

config();

async function debugTransactions() {
  console.log('🐛 DEBUG: Extracción directa de transacciones');
  console.log('============================================\n');

  let login: BanescLogin | null = null;

  try {
    // Validar credenciales
    const username = process.env.BANESCO_USERNAME || '';
    const password = process.env.BANESCO_PASSWORD || '';
    const securityQuestions = process.env.SECURITY_QUESTIONS || '';

    if (!username || !password || !securityQuestions) {
      throw new Error('❌ Faltan credenciales en .env');
    }

    const credentials: BanescCredentials = {
      username,
      password,
      securityQuestions
    };

    // Inicializar componentes
    login = new BanescLogin(credentials, false);
    const accountsScraper = new AccountsScraper();

    console.log('🔐 Realizando login...');
    const loginResult = await login.login();
    
    if (!loginResult.success) {
      console.error('❌ Error en login:', loginResult.message);
      return;
    }
    console.log('✅ Login exitoso!');

    console.log('🏦 Navegando a cuenta con mes anterior...');
    const page = await login.getAuthenticatedPage();
    if (!page) {
      console.error('❌ No se pudo obtener página autenticada');
      return;
    }

    const navigationSuccess = await accountsScraper.navigateToAccountDetails(page);
    if (!navigationSuccess) {
      console.error('❌ No se pudo navegar a los detalles de la cuenta');
      return;
    }
    console.log('✅ Navegación exitosa!');

    console.log('\n🔍 EXTRAYENDO DATOS DE TABLA DIRECTAMENTE...');
    
    // Buscar todas las tablas y sus datos
    const allTablesData = await page.evaluate(() => {
      const tables = Array.from(document.querySelectorAll('table'));
      
      return tables.map((table, index) => {
        const rows = Array.from(table.rows);
        const tableText = table.textContent?.toLowerCase() || '';
        
        // Verificar si contiene palabras clave de transacciones
        const hasTransactionKeywords = ['fecha', 'descripcion', 'monto', 'saldo'].some(keyword => 
          tableText.includes(keyword)
        );
        
        const headers = rows[0] ? 
          Array.from(rows[0].cells).map(cell => cell.textContent?.trim() || '') : 
          [];
        
        const dataRows = [];
        for (let i = 1; i < rows.length; i++) {
          const row = rows[i];
          const cells = Array.from(row.cells).map(cell => cell.textContent?.trim() || '');
          if (cells.some(cell => cell.length > 0)) { // Solo filas con contenido
            dataRows.push(cells);
          }
        }
        
        return {
          index,
          rowCount: rows.length,
          columnCount: rows[0]?.cells.length || 0,
          headers,
          dataRows,
          hasTransactionKeywords,
          firstRowSample: dataRows[0] || [],
          textSample: tableText.substring(0, 100)
        };
      });
    });

    console.log(`📊 Total de tablas encontradas: ${allTablesData.length}`);
    
    // Filtrar tablas que parecen contener transacciones
    const transactionTables = allTablesData.filter(table => 
      table.hasTransactionKeywords && 
      table.dataRows.length > 0 &&
      table.headers.length >= 4
    );

    console.log(`\n✅ Tablas con transacciones: ${transactionTables.length}`);

    transactionTables.forEach((table, idx) => {
      console.log(`\n📋 TABLA ${idx + 1} (Índice ${table.index}):`);
      console.log(`   📏 Dimensiones: ${table.rowCount} filas × ${table.columnCount} columnas`);
      console.log(`   📝 Headers: [${table.headers.join(', ')}]`);
      console.log(`   📊 Filas de datos: ${table.dataRows.length}`);
      console.log(`   📄 Muestra de texto: ${table.textSample}...`);
      
      if (table.dataRows.length > 0) {
        console.log(`   🔍 Primera fila de datos: [${table.firstRowSample.join(' | ')}]`);
        
        // Mostrar las primeras 5 transacciones
        console.log(`\n   💳 PRIMERAS 5 TRANSACCIONES:`);
        table.dataRows.slice(0, 5).forEach((row, rowIdx) => {
          console.log(`      ${rowIdx + 1}. [${row.join(' | ')}]`);
        });

        // Si hay muchas transacciones, mostrar el total
        if (table.dataRows.length > 5) {
          console.log(`   ... y ${table.dataRows.length - 5} transacciones más`);
        }
      }
    });

    // Buscar específicamente la tabla con headers de transacciones perfectos
    const perfectTable = transactionTables.find(table => 
      table.headers.some(h => h.toLowerCase().includes('fecha')) &&
      table.headers.some(h => h.toLowerCase().includes('descripción')) &&
      table.headers.some(h => h.toLowerCase().includes('monto')) &&
      table.headers.some(h => h.toLowerCase().includes('saldo'))
    );

    if (perfectTable) {
      console.log(`\n🎯 TABLA PERFECTA ENCONTRADA (Índice ${perfectTable.index}):`);
      console.log(`   📋 Headers: [${perfectTable.headers.join(', ')}]`);
      console.log(`   📊 Total de transacciones: ${perfectTable.dataRows.length}`);
      
      if (perfectTable.dataRows.length > 0) {
        console.log(`\n   🏆 TODAS LAS TRANSACCIONES EXTRAÍDAS:`);
        perfectTable.dataRows.forEach((row, idx) => {
          // Parsear cada fila como transacción
          const fecha = row[0] || '';
          const descripcion = row[1] || '';
          const referencia = row[2] || '';
          const monto = row[3] || '';
          const dc = row[4] || '';
          const saldo = row[5] || '';
          
          console.log(`\n      💳 Transacción ${idx + 1}:`);
          console.log(`         📅 Fecha: ${fecha}`);
          console.log(`         📝 Descripción: ${descripcion}`);
          console.log(`         🔢 Referencia: ${referencia}`);
          console.log(`         💰 Monto: ${monto}`);
          console.log(`         ↕️  D/C: ${dc}`);
          console.log(`         📊 Saldo: ${saldo}`);
        });
      }
    }

    // Verificar si hay paginación
    const paginationInfo = await page.evaluate(() => {
      const bodyText = document.body.textContent || '';
      const hasPagination = bodyText.includes('Para consultar el resto de sus operaciones presione el botón Siguiente');
      
      // Buscar botones de siguiente
      const nextButtons = Array.from(document.querySelectorAll('input, button, a')).filter(el => {
        const text = el.textContent?.toLowerCase() || '';
        const value = (el as HTMLInputElement).value?.toLowerCase() || '';
        return text.includes('siguiente') || value.includes('siguiente');
      });
      
      return {
        hasPagination,
        nextButtonsCount: nextButtons.length,
        nextButtonsText: nextButtons.map(btn => ({
          tagName: btn.tagName,
          text: btn.textContent?.trim(),
          value: (btn as HTMLInputElement).value
        }))
      };
    });

    console.log(`\n📄 INFORMACIÓN DE PAGINACIÓN:`);
    console.log(`   🔍 Tiene paginación: ${paginationInfo.hasPagination}`);
    console.log(`   🔘 Botones "Siguiente": ${paginationInfo.nextButtonsCount}`);
    if (paginationInfo.nextButtonsText.length > 0) {
      paginationInfo.nextButtonsText.forEach((btn, idx) => {
        console.log(`      ${idx + 1}. ${btn.tagName}: "${btn.text}" (value: "${btn.value}")`);
      });
    }

    console.log('\n✅ Debug completado!');

  } catch (error: any) {
    console.error('❌ Error en debug:', error.message);
  } finally {
    if (login) {
      await login.close();
    }
  }
}

// Ejecutar debug
debugTransactions().catch(console.error); 