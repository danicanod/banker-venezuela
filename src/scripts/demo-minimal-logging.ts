import { StrategicLogger, LogLevel, LogContext } from '../shared/utils/strategic-logger';

// Configurar para modo PRODUCTION explícitamente antes de usar el logger
process.env.NODE_ENV = 'production';

async function demonstrateMinimalLogging() {
  const logger = StrategicLogger.getInstance();
  
  // Forzar contexto de producción
  logger.setContext(LogContext.PRODUCTION);
  
  console.log('🔧 DEMOSTRACIÓN DE LOGGING MÍNIMO (PRODUCTION)');
  console.log('=============================================\n');

  const demoLogger = logger.createComponentLogger('MINIMAL-DEMO');
  
  console.log('📊 Configuración actual:');
  const config = logger.getConfig();
  console.log(`   - Contexto: ${config.context}`);
  console.log(`   - Nivel: ${LogLevel[config.level]} (${config.level})`);
  console.log(`   - Solo se mostrarán: ERRORES (1) y ADVERTENCIAS (2)\n`);
  
  console.log('🔍 PROBANDO DIFERENTES TIPOS DE LOGS:');
  console.log('=====================================\n');

  console.log('❌ ERROR - DEBERÍA APARECER:');
  demoLogger.error('Error crítico del sistema', new Error('Fallo de conexión a base de datos'));
  
  console.log('\n⚠️  WARN - DEBERÍA APARECER:');
  demoLogger.warn('Memoria baja detectada', { available: '50MB', threshold: '100MB' });
  demoLogger.security('Intento de acceso no autorizado', { ip: '192.168.1.100', attempts: 5 });
  
  console.log('\nℹ️  INFO - NO DEBERÍA APARECER:');
  demoLogger.info('Sistema iniciado correctamente');
  demoLogger.success('Login exitoso');
  
  console.log('\n🔧 DEBUG - NO DEBERÍA APARECER:');
  demoLogger.debug('Información de debug detallada', { userId: 123 });
  demoLogger.network('Request HTTP completado', { status: 200, time: 245 });
  demoLogger.data('Datos procesados', { records: 1500 });
  
  console.log('\n🔍 TRACE - NO DEBERÍA APARECER:');
  demoLogger.trace('Trazabilidad ultra detallada');
  
  console.log('\n⚡ PERFORMANCE MONITORING:');
  console.log('==========================\n');
  
  // Performance en producción - solo fitness functions aparecerán si son > WARN
  const opId = demoLogger.startOperation('critical_operation');
  await simulateWork(2000);
  demoLogger.endOperation(opId);
  
  console.log('\n🆚 COMPARACIÓN CON DESARROLLO:');
  console.log('==============================\n');
  
  console.log('🔄 Cambiando temporalmente a DEVELOPMENT...');
  logger.setContext(LogContext.DEVELOPMENT);
  
  console.log('\nAhora en DEVELOPMENT (INFO level) - MÁS LOGS APARECERÁN:');
  demoLogger.info('Este mensaje SÍ aparece en development');
  demoLogger.debug('Este debug NO aparece aún (level INFO)');
  
  console.log('\n🔄 Cambiando a DEBUG context...');
  logger.setContext(LogContext.DEBUG);
  
  console.log('\nAhora en DEBUG (TRACE level) - TODOS LOS LOGS APARECEN:');
  demoLogger.trace('Este trace SÍ aparece en debug');
  demoLogger.debug('Este debug SÍ aparece en debug');
  demoLogger.data('Estos datos SÍ aparecen en debug', { verbose: true });
  
  console.log('\n🔄 Volviendo a PRODUCTION...');
  logger.setContext(LogContext.PRODUCTION);
  
  console.log('\nDe vuelta en PRODUCTION - SOLO ERRORES Y WARNS:');
  demoLogger.info('Este mensaje NO aparece de nuevo');
  demoLogger.warn('Este warning SÍ aparece de nuevo');
  
  console.log('\n📋 RESUMEN DE LA DEMO:');
  console.log('======================');
  console.log('✅ En PRODUCTION solo viste ERRORES y ADVERTENCIAS');
  console.log('✅ Logs INFO, DEBUG y TRACE fueron silenciados automáticamente');
  console.log('✅ Performance metrics solo aparecen si superan el threshold WARNING');
  console.log('✅ Stack traces de errores se ocultan en production por seguridad');
  console.log('✅ El sistema se adapta automáticamente según NODE_ENV');
  
  // Generar reporte final
  logger.generateSessionReport();
}

async function simulateWork(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

console.log('🚀 Iniciando demostración de LOGGING MÍNIMO...\n');

demonstrateMinimalLogging()
  .then(() => {
    console.log('\n✅ Demostración de logging mínimo completada!');
    console.log('\n📝 COMANDOS RELACIONADOS:');
    console.log('=========================');
    console.log('npm run demo:minimal             # Esta demo de logging mínimo');
    console.log('NODE_ENV=production npm run test:extraction  # Test real con logs mínimos');
    console.log('DEBUG=true npm run test:extraction           # Test con máximo detalle');
  })
  .catch(console.error); 