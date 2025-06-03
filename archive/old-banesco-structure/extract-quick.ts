#!/usr/bin/env tsx

/**
 * Banesco Quick Transaction Extractor
 * 
 * Script optimizado que usa sesión existente y va directo a transacciones
 */

import dotenv from 'dotenv';
import { BanescoAuth } from './auth/banesco-auth';
import { TransactionsScraper } from '../banks/banesco/scrapers/transactions';
import type { BanescoCredentials } from './auth/types';

// Load environment variables
dotenv.config();

async function quickExtractTransactions() {
  console.log('⚡ EXTRACTOR RÁPIDO DE TRANSACCIONES BANESCO');
  console.log('============================================');
  console.log('🎯 Usando sesión existente y navegación directa\n');

  if (!process.env.BANESCO_USERNAME || !process.env.BANESCO_PASSWORD) {
    console.error('❌ Faltan credenciales en .env');
    process.exit(1);
  }

  const credentials: BanescoCredentials = {
    username: process.env.BANESCO_USERNAME,
    password: process.env.BANESCO_PASSWORD,
    securityQuestions: process.env.SECURITY_QUESTIONS
  };

  const auth = new BanescoAuth(credentials, {
    headless: true,
    timeout: 60000,
    debug: false,
    saveSession: true
  });

  const scraper = new TransactionsScraper();
  
  try {
    // Paso 1: Autenticar
    console.log('🔐 PASO 1: Autenticando...');
    const loginResult = await auth.login();

    if (!loginResult.success) {
      console.error('❌ Error de autenticación:', loginResult.message);
      return;
    }

    console.log('✅ Autenticado exitosamente');
    
    // Paso 2: Obtener página autenticada
    const page = auth.getPage();
    if (!page) {
      throw new Error('No se pudo obtener la página');
    }

    // Paso 3: Navegar directamente a movimientos con período específico
    console.log('\n🎯 PASO 2: Navegando directamente a movimientos...');
    const movimientosUrl = 'https://www.banesconline.com/Mantis/WebSite/consultamovimientoscuenta/movimientoscuenta.aspx';
    
    await page.goto(movimientosUrl, { 
      waitUntil: 'networkidle',
      timeout: 30000
    });
    
    console.log(`📍 Navegado a: ${page.url()}`);
    
    // Paso 4: Configurar período automáticamente
    console.log('\n📅 PASO 3: Configurando período de consulta...');
    
    try {
      // Esperar que la página esté completamente cargada
      await page.waitForTimeout(2000);
      
      // Detectar y seleccionar el período "Mes Anterior"
      console.log('🔍 Buscando selector de período...');
      
      // Múltiples estrategias para encontrar y configurar el período
      const periodSelectors = [
        'select[name*="periodo"]',
        'select[name*="Periodo"]', 
        'select[id*="periodo"]',
        'select[id*="Periodo"]',
        '#ddlPeriodo',
        'select'
      ];
      
      let periodConfigured = false;
      
      for (const selector of periodSelectors) {
        try {
          const selectElement = await page.$(selector);
          if (selectElement) {
            console.log(`📋 Encontrado selector: ${selector}`);
            
            // Intentar obtener las opciones disponibles
            const options = await page.$$eval(`${selector} option`, opts => 
              opts.map(opt => ({ 
                value: (opt as HTMLOptionElement).value, 
                text: opt.textContent || '' 
              }))
            );
            
            console.log('📝 Opciones disponibles:');
            options.forEach((opt, idx) => {
              console.log(`   ${idx + 1}. ${opt.text} (value: ${opt.value})`);
            });
            
            // Buscar "Mes Anterior"
            const mesAnteriorOption = options.find(opt => 
              opt.value.toLowerCase().includes('mesanterior') ||
              opt.value.toLowerCase().includes('mes_anterior') ||
              opt.value === 'PeriodoMesAnterior'
            );
            
            if (mesAnteriorOption) {
              console.log(`🎯 Seleccionando: ${mesAnteriorOption.text}`);
              await page.selectOption(selector, mesAnteriorOption.value);
              periodConfigured = true;
              console.log('✅ Período "Mes Anterior" configurado exitosamente');
              break;
            } else {
              console.log('⚠️  "Mes Anterior" no encontrado en este selector');
            }
          }
        } catch (e: any) {
          // Continuar con el siguiente selector
        }
      }
      
      if (!periodConfigured) {
        // Estrategia alternativa: buscar por texto del elemento
        console.log('🔄 Intentando estrategia alternativa por texto...');
        try {
          // Buscar elemento que contenga "Mes Anterior"
          const mesAnteriorElement = await page.getByText('Mes Anterior').first();
          if (mesAnteriorElement) {
            await mesAnteriorElement.click();
            console.log('✅ Clickeado "Mes Anterior" por texto');
            periodConfigured = true;
          }
        } catch (e: any) {
          console.log('⚠️  No se pudo clickear por texto');
        }
      }
      
      if (periodConfigured) {
        // Buscar y hacer clic en "Consultar"
        console.log('🔍 Buscando botón "Consultar"...');
        
        const consultarSelectors = [
          'input[value*="Consultar"]',
          'input[value="Consultar"]',
          'button:has-text("Consultar")',
          '#btnConsultar',
          'input[type="submit"]'
        ];
        
        let consultarClicked = false;
        
        for (const selector of consultarSelectors) {
          try {
            const button = await page.$(selector);
            if (button) {
              console.log(`🔘 Encontrado botón: ${selector}`);
              await button.click();
              console.log('✅ Botón "Consultar" clickeado');
              consultarClicked = true;
              break;
            }
          } catch (e: any) {
            // Continuar
          }
        }
        
        if (consultarClicked) {
          console.log('⏳ Esperando carga de movimientos...');
          await page.waitForTimeout(5000); // Esperar más tiempo para cargar datos
          console.log('📍 Página actualizada');
        } else {
          console.log('⚠️  No se encontró botón "Consultar"');
        }
      } else {
        console.log('⚠️  No se pudo configurar el período automáticamente');
      }
      
    } catch (e: any) {
      console.log('⚠️  Error configurando período:', e.message);
    }

    // Paso 5: Extraer transacciones
    console.log('\n📊 PASO 4: Extrayendo transacciones...');
    const result = await scraper.scrapeTransactions(page);

    if (result.success && result.data && result.data.length > 0) {
      console.log(`\n🎉 ¡ÉXITO! Extraídas ${result.data.length} transacciones`);
      
      // Mostrar resumen
      const metadata = result.metadata;
      if (metadata?.accountSummary) {
        console.log(`💰 Saldo actual: ${metadata.accountSummary.currentBalance?.toFixed(2) || 'N/A'}`);
      }
      
      // Mostrar primeras transacciones
      console.log('\n📋 ÚLTIMAS TRANSACCIONES:');
      console.log('========================');
      
      result.data.slice(0, 5).forEach((tx, idx) => {
        console.log(`\n${idx + 1}. 📅 ${tx.date}`);
        console.log(`   📝 ${tx.description}`);
        console.log(`   💰 ${tx.amount.toFixed(2)} (${tx.type === 'debit' ? '🔴 Débito' : '🟢 Crédito'})`);
        console.log(`   📊 Saldo: ${tx.balance?.toFixed(2) || 'N/A'}`);
      });

      if (result.data.length > 5) {
        console.log(`\n... y ${result.data.length - 5} transacciones más`);
      }
      
      // Guardar en JSON
      const filename = `banesco-transactions-${new Date().toISOString().split('T')[0]}.json`;
      const fs = await import('fs');
      fs.writeFileSync(filename, JSON.stringify({
        extractedAt: new Date().toISOString(),
        totalTransactions: result.data.length,
        accountSummary: metadata?.accountSummary,
        transactions: result.data
      }, null, 2));
      
      console.log(`\n💾 Transacciones guardadas en: ${filename}`);
      
    } else {
      console.log('❌ No se encontraron transacciones');
      console.log('📝 Razón:', result.error || 'Sin datos');
    }

  } catch (error) {
    console.error('💥 Error:', error);
  } finally {
    await auth.close();
  }
}

// Ejecutar
quickExtractTransactions()
  .then(() => {
    console.log('\n✅ Extracción completada');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Error fatal:', error);
    process.exit(1);
  }); 