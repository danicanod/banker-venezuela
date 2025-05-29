#!/usr/bin/env tsx

import { promises as fs } from 'fs';
import { join } from 'path';

console.log('🔐 CONFIGURADOR DE PREGUNTAS DE SEGURIDAD');
console.log('=======================================\n');

async function setupSecurity() {
  try {
    console.log('📋 Este script te ayudará a configurar las preguntas de seguridad de Banesco.\n');
    
    // Leer .env actual
    const envPath = join(process.cwd(), '.env');
    let envContent = '';
    
    try {
      envContent = await fs.readFile(envPath, 'utf-8');
    } catch (e) {
      console.log('⚠️  No se encontró archivo .env, creando uno nuevo...');
    }

    console.log('💡 INSTRUCCIONES:');
    console.log('================');
    console.log('1. Primero, intenta hacer login en el banco manualmente');
    console.log('2. Anota las preguntas de seguridad que te aparecen');
    console.log('3. Identifica palabras clave en cada pregunta');
    console.log('4. Configura el mapeo palabra_clave:respuesta\n');

    console.log('🎯 EJEMPLOS DE CONFIGURACIÓN:');
    console.log('=============================');
    console.log('Si ves preguntas como:');
    console.log('- "¿Cuál es tu anime favorito?" → anime:NombreDelAnime');
    console.log('- "¿Cómo se llama tu mascota?" → mascota:NombreMascota');
    console.log('- "¿Cuál es tu libro favorito?" → libro:NombreLibro');
    console.log('- "¿En qué ciudad naciste?" → ciudad:NombreCiudad\n');

    console.log('📝 CONFIGURACIONES DE EJEMPLO:');
    console.log('==============================');
    
    const examples = [
      'anime:Naruto,mascota:Firulais',
      'libro:Bible,ciudad:Caracas,mascota:Max',
      'anime:DragonBall,comida:Pasta,color:Azul',
      'pelicula:Matrix,mascota:Luna,deporte:Futbol'
    ];

    examples.forEach((example, i) => {
      console.log(`${i + 1}. SECURITY_QUESTIONS="${example}"`);
    });

    console.log('\n🔧 CONFIGURACIÓN AVANZADA:');
    console.log('==========================');
    console.log('Puedes usar múltiples palabras clave para la misma respuesta:');
    console.log('SECURITY_QUESTIONS="anime:Naruto,ánime:Naruto,animé:Naruto,mascota:Firulais,pet:Firulais"');

    console.log('\n📂 ARCHIVO .ENV ACTUAL:');
    console.log('=======================');
    
    if (envContent) {
      const lines = envContent.split('\n');
      const relevantLines = lines.filter(line => 
        line.includes('BANESCO_') || 
        line.includes('SECURITY_QUESTIONS') ||
        line.startsWith('#')
      );
      
      if (relevantLines.length > 0) {
        relevantLines.forEach(line => {
          if (line.includes('SECURITY_QUESTIONS') && !line.startsWith('#')) {
            console.log(`✅ ${line}`);
          } else if (line.includes('BANESCO_USERNAME')) {
            console.log(`✅ ${line.split('=')[0]}=***`);
          } else if (line.includes('BANESCO_PASSWORD')) {
            console.log(`✅ ${line.split('=')[0]}=***`);
          } else {
            console.log(`   ${line}`);
          }
        });
      } else {
        console.log('❌ No se encontró configuración de Banesco');
      }
    } else {
      console.log('❌ Archivo .env no existe');
    }

    console.log('\n🎮 COMANDOS PARA PROBAR:');
    console.log('========================');
    console.log('1. npm run transactions:simple   # Evita preguntas de seguridad (más rápido)');
    console.log('2. npm run transactions:fast     # Con preguntas de seguridad configuradas');
    console.log('3. npm run transactions          # Completo con análisis detallado');

    console.log('\n📋 PASOS SIGUIENTES:');
    console.log('====================');
    console.log('1. Edita tu archivo .env y agrega la línea SECURITY_QUESTIONS');
    console.log('2. Usa el formato: SECURITY_QUESTIONS="palabra1:respuesta1,palabra2:respuesta2"');
    console.log('3. Prueba con: npm run transactions:simple (no requiere preguntas)');
    console.log('4. Si funciona, configura las preguntas y prueba: npm run transactions:fast');

    console.log('\n⚠️  IMPORTANTE:');
    console.log('===============');
    console.log('- Las respuestas deben ser exactamente como las configuraste en el banco');
    console.log('- Las palabras clave no distinguen mayúsculas ni acentos');
    console.log('- Si no tienes preguntas configuradas, usa transactions:simple');

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

setupSecurity(); 