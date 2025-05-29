import * as fs from 'fs';
import * as path from 'path';
import { JSDOM } from 'jsdom';

async function analyzeHTMLTransactions() {
  console.log('🔍 ANÁLISIS DIRECTO DE HTML - TRANSACCIONES');
  console.log('==========================================\n');

  try {
    const htmlPath = path.join(process.cwd(), 'html-captures/account-movements-PeriodoMesAnterior.html');
    
    if (!fs.existsSync(htmlPath)) {
      console.error('❌ No se encontró el archivo HTML:', htmlPath);
      return;
    }

    console.log('📄 Analizando archivo:', htmlPath);
    const htmlContent = fs.readFileSync(htmlPath, 'utf-8');
    const dom = new JSDOM(htmlContent);
    const document = dom.window.document;

    console.log('✅ HTML cargado exitosamente');
    console.log(`📊 Tamaño del archivo: ${Math.round(htmlContent.length / 1024)}KB\n`);

    // Buscar todas las tablas
    const tables = Array.from(document.querySelectorAll('table'));
    console.log(`📋 Total de tablas encontradas: ${tables.length}\n`);

    // Analizar cada tabla
    const transactionTables: any[] = [];

    tables.forEach((table, index) => {
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
      
      if (hasTransactionKeywords && dataRows.length > 0 && headers.length >= 4) {
        transactionTables.push({
          index,
          rowCount: rows.length,
          columnCount: headers.length,
          headers,
          dataRows,
          textSample: tableText.substring(0, 100)
        });
      }
    });

    console.log(`✅ Tablas con transacciones encontradas: ${transactionTables.length}\n`);

    transactionTables.forEach((table, idx) => {
      console.log(`📊 TABLA ${idx + 1} (Índice original ${table.index}):`);
      console.log(`   📏 Dimensiones: ${table.rowCount} filas × ${table.columnCount} columnas`);
      console.log(`   📝 Headers: [${table.headers.join(', ')}]`);
      console.log(`   📊 Filas de datos: ${table.dataRows.length}`);
      console.log(`   📄 Muestra: ${table.textSample}...\n`);
      
      if (table.dataRows.length > 0) {
        console.log(`   🔍 Primera fila: [${table.dataRows[0].join(' | ')}]\n`);
      }
    });

    // Buscar la tabla perfecta con headers de transacciones
    const perfectTable = transactionTables.find(table => 
      table.headers.some((h: string) => h.toLowerCase().includes('fecha')) &&
      table.headers.some((h: string) => h.toLowerCase().includes('descripción')) &&
      table.headers.some((h: string) => h.toLowerCase().includes('monto')) &&
      table.headers.some((h: string) => h.toLowerCase().includes('saldo'))
    );

    if (perfectTable) {
      console.log(`🎯 TABLA PERFECTA ENCONTRADA (Índice ${perfectTable.index}):`);
      console.log(`   📋 Headers: [${perfectTable.headers.join(', ')}]`);
      console.log(`   📊 Total de transacciones: ${perfectTable.dataRows.length}\n`);
      
      // Mapear los headers a índices antes del forEach
      const fechaIdx = perfectTable.headers.findIndex((h: string) => h.toLowerCase().includes('fecha'));
      const descripcionIdx = perfectTable.headers.findIndex((h: string) => h.toLowerCase().includes('descripción'));
      const referenciaIdx = perfectTable.headers.findIndex((h: string) => h.toLowerCase().includes('referencia'));
      const montoIdx = perfectTable.headers.findIndex((h: string) => h.toLowerCase().includes('monto'));
      const dcIdx = perfectTable.headers.findIndex((h: string) => h.toLowerCase().includes('d/c'));
      const saldoIdx = perfectTable.headers.findIndex((h: string) => h.toLowerCase().includes('saldo'));
      
      console.log(`🏆 TODAS LAS TRANSACCIONES EXTRAÍDAS:`);
      console.log('=====================================\n');
      
      perfectTable.dataRows.forEach((row: string[], idx: number) => {
        const fecha = fechaIdx >= 0 ? row[fechaIdx] : row[0] || '';
        const descripcion = descripcionIdx >= 0 ? row[descripcionIdx] : row[1] || '';
        const referencia = referenciaIdx >= 0 ? row[referenciaIdx] : row[2] || '';
        const monto = montoIdx >= 0 ? row[montoIdx] : row[3] || '';
        const dc = dcIdx >= 0 ? row[dcIdx] : row[4] || '';
        const saldo = saldoIdx >= 0 ? row[saldoIdx] : row[5] || '';
        
        console.log(`💳 Transacción ${idx + 1}:`);
        console.log(`   📅 Fecha: ${fecha}`);
        console.log(`   📝 Descripción: ${descripcion}`);
        console.log(`   🔢 Referencia: ${referencia}`);
        console.log(`   💰 Monto: ${monto}`);
        console.log(`   ↕️  D/C: ${dc}`);
        console.log(`   📊 Saldo: ${saldo}\n`);
      });

      // Estadísticas adicionales
      console.log(`📈 ESTADÍSTICAS:`);
      console.log(`   🔢 Total de transacciones: ${perfectTable.dataRows.length}`);
      
      // Contar débitos y créditos
      const debitos = perfectTable.dataRows.filter((row: string[]) => {
        const dcValue = dcIdx >= 0 ? row[dcIdx]?.toLowerCase() : '';
        return dcValue.includes('d') || dcValue.includes('débito') || dcValue.includes('debit');
      });
      
      const creditos = perfectTable.dataRows.filter((row: string[]) => {
        const dcValue = dcIdx >= 0 ? row[dcIdx]?.toLowerCase() : '';
        return dcValue.includes('c') || dcValue.includes('crédito') || dcValue.includes('credit');
      });
      
      console.log(`   📉 Débitos: ${debitos.length}`);
      console.log(`   📈 Créditos: ${creditos.length}`);
      
      // Rango de fechas
      const fechas = perfectTable.dataRows.map((row: string[]) => fechaIdx >= 0 ? row[fechaIdx] : row[0]).filter((f: string) => f);
      if (fechas.length > 0) {
        console.log(`   📅 Primera fecha: ${fechas[0]}`);
        console.log(`   📅 Última fecha: ${fechas[fechas.length - 1]}`);
      }

    } else {
      console.log('⚠️  No se encontró tabla perfecta con todos los headers esperados');
    }

    // Buscar mensaje de paginación
    const bodyText = document.body.textContent || '';
    const hasPagination = bodyText.includes('Para consultar el resto de sus operaciones presione el botón Siguiente');
    
    console.log(`\n📄 INFORMACIÓN DE PAGINACIÓN:`);
    console.log(`   🔍 Tiene paginación: ${hasPagination}`);
    
    if (hasPagination) {
      console.log(`   📢 Mensaje detectado: "Para consultar el resto de sus operaciones presione el botón Siguiente"`);
      
      // Buscar botones de siguiente
      const nextButtons = Array.from(document.querySelectorAll('input, button, a')).filter(el => {
        const text = el.textContent?.toLowerCase() || '';
        const value = (el as HTMLInputElement).value?.toLowerCase() || '';
        return text.includes('siguiente') || value.includes('siguiente');
      });
      
      console.log(`   🔘 Botones "Siguiente" encontrados: ${nextButtons.length}`);
      nextButtons.forEach((btn, idx) => {
        const inputEl = btn as HTMLInputElement;
        console.log(`      ${idx + 1}. ${btn.tagName}: "${btn.textContent?.trim()}" (value: "${inputEl.value || ''}")`);
      });
    }

    console.log('\n✅ Análisis completado!');

  } catch (error: any) {
    console.error('❌ Error analizando HTML:', error.message);
  }
}

// Ejecutar análisis
analyzeHTMLTransactions().catch(console.error); 