#!/usr/bin/env tsx

/**
 * Banesco Security Questions Debug Script
 * 
 * Este script está específicamente diseñado para debuggear problemas
 * con las preguntas de seguridad en el proceso de autenticación.
 */

import { BanescoAuth } from './auth/banesco-auth';
import type { BanescoCredentials } from './auth/types';

async function debugSecurityQuestions() {
  console.log('🔐 Banesco Security Questions Debugger');
  console.log('======================================');
  console.log('🎯 Este script se enfoca específicamente en las preguntas de seguridad');
  console.log('🐛 Se pausará en cada paso del proceso para diagnóstico detallado\n');

  // Validate credentials
  if (!process.env.BANESCO_USERNAME || !process.env.BANESCO_PASSWORD) {
    console.error('❌ Variables de entorno requeridas:');
    console.error('   BANESCO_USERNAME - Tu usuario de Banesco');
    console.error('   BANESCO_PASSWORD - Tu contraseña de Banesco');
    console.error('   BANESCO_SECURITY_QUESTIONS - Preguntas de seguridad');
    console.error('\nEjemplo:');
    console.error('   BANESCO_USERNAME=usuario BANESCO_PASSWORD=clave BANESCO_SECURITY_QUESTIONS="madre:maria,mascota:firulais" tsx src/banesco/debug-security-questions.ts');
    process.exit(1);
  }

  if (!process.env.BANESCO_SECURITY_QUESTIONS) {
    console.warn('⚠️  BANESCO_SECURITY_QUESTIONS no está configurado');
    console.warn('   Sin preguntas de seguridad configuradas, el proceso se estancará');
    console.warn('   Formato: "keyword1:answer1,keyword2:answer2"');
    console.warn('   Ejemplo: "madre:maria,colegio:central,mascota:firulais"\n');
  }

  const credentials: BanescoCredentials = {
    username: process.env.BANESCO_USERNAME,
    password: process.env.BANESCO_PASSWORD,
    securityQuestions: process.env.BANESCO_SECURITY_QUESTIONS
  };

  console.log('📋 Configuración de debugging:');
  console.log(`   👤 Usuario: ${credentials.username.substring(0, 3)}***`);
  console.log(`   🔐 Preguntas configuradas: ${credentials.securityQuestions ? 'SÍ' : 'NO'}`);
  if (credentials.securityQuestions) {
    const questionCount = credentials.securityQuestions.split(',').length;
    console.log(`   📝 Número de respuestas: ${questionCount}`);
    console.log(`   🔑 Keywords: ${credentials.securityQuestions.split(',').map(q => q.split(':')[0]).join(', ')}`);
  }
  console.log('');

  const auth = new BanescoAuth(credentials, {
    headless: false,  // Siempre visible para debugging
    timeout: 300000,  // 5 minutos timeout
    debug: true,      // Enable todos los debug pauses
    saveSession: false // No guardar sesión durante debugging
  });

  try {
    console.log('🚀 Iniciando debug de preguntas de seguridad...\n');
    
    const startTime = Date.now();
    const result = await auth.login();
    const endTime = Date.now();
    const duration = Math.round((endTime - startTime) / 1000);
    
    console.log(`\n⏱️  Sesión de debug completada en ${duration} segundos`);
    
    if (result.success) {
      console.log('🎉 ¡Autenticación exitosa!');
      console.log('✅ Las preguntas de seguridad se manejaron correctamente');
      
    } else {
      console.error('❌ ¡Autenticación falló!');
      console.error('📝 Mensaje de error:', result.message);
      
      if (result.error) {
        console.error('🔍 Detalles del error:', result.error);
      }
      
      console.log('\n🔍 Análisis de posibles problemas:');
      
      if (result.message.includes('security questions')) {
        console.log('   🎯 Problema relacionado con preguntas de seguridad');
        console.log('   💡 Verifica que las keywords coincidan con las preguntas mostradas');
        console.log('   💡 Revisa los logs para ver las preguntas exactas');
      }
      
      if (!credentials.securityQuestions) {
        console.log('   ❌ No hay preguntas de seguridad configuradas');
        console.log('   💡 Configura BANESCO_SECURITY_QUESTIONS con el formato correcto');
      }
    }
    
  } catch (error) {
    console.error('\n💥 Error durante la sesión de debug:', error);
    
  } finally {
    console.log('\n🧹 Limpiando sesión de debug...');
    
    // Get log information
    const logFile = auth.getLogFile();
    console.log(`📄 Logs guardados en: ${logFile}`);
    
    // Export logs specifically for security questions analysis
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const exportPath = `debug-security-questions-${timestamp}.log`;
    const exported = auth.exportLogs(exportPath);
    
    if (exported) {
      console.log(`📤 Logs de preguntas de seguridad exportados a: ${exportPath}`);
      console.log('💡 Comparte este archivo para análisis detallado');
    }
    
    // Security questions specific analysis
    console.log('\n📊 Análisis de Preguntas de Seguridad:');
    
    if (credentials.securityQuestions) {
      const questions = credentials.securityQuestions.split(',');
      console.log(`   📝 Configuradas: ${questions.length} preguntas`);
      
      questions.forEach((q, i) => {
        const [keyword, answer] = q.split(':');
        console.log(`   ${i + 1}. "${keyword}" → "${answer}"`);
      });
      
      console.log('\n💡 Tips para mejorar el matching:');
      console.log('   - Usa keywords simples (madre, padre, mascota, colegio)');
      console.log('   - Evita acentos y caracteres especiales');
      console.log('   - Las keywords deben estar contenidas en la pregunta');
      console.log('   - Revisa los logs para ver las preguntas exactas mostradas');
      
    } else {
      console.log('   ❌ No hay preguntas configuradas');
      console.log('   💡 Configura con: export BANESCO_SECURITY_QUESTIONS="madre:maria,mascota:firulais"');
    }
    
    // Keep browser open longer for manual analysis
    console.log('\n⏳ Navegador se cerrará en 15 segundos...');
    console.log('💡 Usa este tiempo para inspeccionar manualmente la página');
    await new Promise(resolve => setTimeout(resolve, 15000));
    
    await auth.close();
    console.log('✅ Sesión de debug completada');
    
    console.log('\n📊 Resumen Final:');
    console.log(`📄 Log principal: ${logFile}`);
    if (exported) {
      console.log(`📤 Log exportado: ${exportPath}`);
    }
    console.log('💡 Usa estos logs para identificar problemas específicos con las preguntas de seguridad');
  }
}

// Handle script interruption
process.on('SIGINT', async () => {
  console.log('\n\n⚠️  Debug de preguntas de seguridad interrumpido');
  console.log('🧹 Limpiando...');
  process.exit(0);
});

// Run the security questions debug session
debugSecurityQuestions()
  .then(() => {
    console.log('\n🏁 Script de debug de preguntas de seguridad completado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Script de debug falló:', error);
    process.exit(1);
  }); 