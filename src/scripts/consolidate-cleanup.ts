import { promises as fs } from 'fs';
import { join } from 'path';

console.log('🧹 CONSOLIDACIÓN Y LIMPIEZA DEL PROYECTO');
console.log('========================================\n');

async function deleteFileIfExists(filePath: string): Promise<void> {
  try {
    await fs.access(filePath);
    await fs.unlink(filePath);
    console.log(`✅ Eliminado: ${filePath}`);
  } catch (error) {
    // El archivo no existe, no hacer nada
  }
}

async function cleanupProject() {
  try {
    console.log('🗂️  FASE 1: Eliminando archivos de login obsoletos');
    console.log('================================================');
    
    // Mantener solo optimized-login.ts, eliminar otros logins
    const loginFilesToRemove = [
      'src/banks/banesco/auth/login.ts',
      'src/banks/banesco/auth/turbo-login.ts',
      'src/banks/banesco/auth/ultra-login.ts'
    ];
    
    for (const file of loginFilesToRemove) {
      await deleteFileIfExists(file);
    }

    console.log('\n🧪 FASE 2: Eliminando tests obsoletos');
    console.log('====================================');
    
    // Eliminar tests experimentales, mantener solo test-optimized-login.ts
    const testFilesToRemove = [
      'src/scripts/test-smart-timeouts.ts',
      'src/scripts/test-turbo-optimization.ts',
      'src/scripts/test-ultra-optimizations.ts',
      'src/scripts/test-complete.ts',
      'src/scripts/test-network-analysis.ts',
      'src/scripts/test-only-extraction.ts',
      'src/scripts/debug-transactions.ts',
      'src/scripts/analyze-html-transactions.ts',
      'src/scripts/demo-performance-real.ts'
    ];
    
    for (const file of testFilesToRemove) {
      await deleteFileIfExists(file);
    }

    console.log('\n🔧 FASE 3: Eliminando utilidades redundantes');
    console.log('===========================================');
    
    // Mantener solo smart-waiter.ts, eliminar turbo-waiter.ts y adaptive-waiter.ts
    const utilityFilesToRemove = [
      'src/shared/utils/turbo-waiter.ts',
      'src/shared/utils/adaptive-waiter.ts',
      // Mantener estas utilidades avanzadas pero eliminar redundantes
      'src/shared/utils/parallel-browser-manager.ts',
      'src/shared/utils/adaptive-timeout.ts',
      'src/shared/utils/network-interceptor.ts',
      'src/shared/utils/predictive-preloader.ts'
    ];
    
    for (const file of utilityFilesToRemove) {
      await deleteFileIfExists(file);
    }

    console.log('\n📁 FASE 4: Limpiando archivos temporales');
    console.log('=======================================');
    
    // Limpiar archivos temporales y de debug
    const tempFilesToRemove = [
      'src/test-account-link.ts',
      'src/test-account-navigation.ts', 
      'src/test-simple-navigation.ts',
      'src/test-transactions-complete.ts',
      'src/test-network-analysis.ts',
      'src/debug-transactions.ts',
      'src/analyze-html-transactions.ts',
      'src/test-only-extraction.ts'
    ];
    
    for (const file of tempFilesToRemove) {
      await deleteFileIfExists(file);
    }

    console.log('\n📊 FASE 5: Resumen de archivos mantenidos');
    console.log('========================================');
    console.log('✅ ARCHIVOS PRINCIPALES:');
    console.log('   📄 src/index.ts - Punto de entrada principal');
    console.log('   🔐 src/banks/banesco/auth/optimized-login.ts - Login consolidado');
    console.log('   🔐 src/banks/banesco/auth/security-questions.ts - Manejo de preguntas');
    console.log('   🏦 src/banks/banesco/scrapers/accounts.ts - Scraper de cuentas');
    console.log('   💳 src/banks/banesco/scrapers/transactions.ts - Scraper de transacciones');
    console.log('');
    console.log('✅ UTILIDADES CORE:');
    console.log('   ⚡ src/shared/utils/smart-waiter.ts - Esperas inteligentes');
    console.log('   📊 src/shared/utils/strategic-logger.ts - Sistema de logging');
    console.log('   💾 src/shared/utils/session-manager.ts - Gestión de sesiones');
    console.log('   🌐 src/shared/utils/browser-server.ts - Browser persistente');
    console.log('   💾 src/shared/utils/html-saver.ts - Guardado de HTML para debug');
    console.log('');
    console.log('✅ TESTS:');
    console.log('   🧪 src/scripts/test-optimized-login.ts - Test principal');
    console.log('   📊 src/scripts/demo-strategic-logging.ts - Demo de logging');
    console.log('   🧹 src/scripts/cleanup.ts - Limpieza de archivos temporales');

    console.log('\n🎉 CONSOLIDACIÓN COMPLETADA');
    console.log('===========================');
    console.log('📦 Proyecto consolidado exitosamente');
    console.log('🚀 Solo los archivos esenciales se mantienen');
    console.log('⚡ Performance optimizada con OptimizedLogin');
    console.log('🧠 Session persistence para evitar preguntas de seguridad');
    console.log('');
    console.log('📋 COMANDOS PRINCIPALES:');
    console.log('   npm run accounts       - Ejecutar scraper completo');
    console.log('   npm run test           - Test del sistema optimizado');
    console.log('   npm run test:debug     - Test con máximo detalle');
    console.log('   npm run test:production - Test con logs mínimos');

  } catch (error) {
    console.error('❌ Error durante la consolidación:', error);
  }
}

cleanupProject(); 