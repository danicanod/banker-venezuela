import { StrategicLogger, LogLevel, LogContext } from '../shared/utils/strategic-logger';

async function demonstrateLogging() {
  const logger = StrategicLogger.getInstance();
  
  // Mostrar configuración inicial
  logger.generateSessionReport();
  
  console.log('🔧 DEMOSTRACIÓN DEL SISTEMA DE LOGGING ESTRATÉGICO');
  console.log('===============================================\n');

  // 1. Demostrar diferentes niveles de log
  console.log('1️⃣  NIVELES DE LOGGING:');
  console.log('======================\n');

  const demoLogger = logger.createComponentLogger('DEMO');
  
  demoLogger.error('Simulando error crítico', new Error('Este es un error de ejemplo'));
  demoLogger.warn('Advertencia sobre configuración');
  demoLogger.info('Información general del sistema');
  demoLogger.debug('Información de debug detallada', { userId: 123, action: 'login' });
  demoLogger.trace('Trazabilidad ultra detallada', { 
    stackTrace: 'demo_function -> auth_module -> db_connection',
    timestamp: Date.now()
  });
  
  // 2. Demostrar logging especializado
  console.log('\n2️⃣  LOGGING ESPECIALIZADO:');
  console.log('==========================\n');

  demoLogger.success('Operación completada exitosamente', { records: 42 });
  demoLogger.security('Intento de acceso detectado', { ip: '192.168.1.100', attempts: 3 });
  demoLogger.network('Request HTTP completado', { 
    url: 'https://api.example.com/users',
    status: 200,
    responseTime: 245
  });
  demoLogger.data('Datos procesados', {
    recordsProcessed: 1500,
    errorCount: 3,
    successRate: 99.8
  });

  // 3. Demostrar performance monitoring y fitness functions
  console.log('\n3️⃣  PERFORMANCE MONITORING:');
  console.log('============================\n');

  // Operación rápida (debería pasar fitness test)
  const fastOpId = demoLogger.startOperation('fast_operation');
  await simulateWork(500); // 500ms
  demoLogger.endOperation(fastOpId);

  // Operación lenta (debería fallar fitness test)
  const slowOpId = demoLogger.startOperation('slow_operation');
  await simulateWork(12000); // 12 segundos
  demoLogger.endOperation(slowOpId);

  // Operación de login simulada
  const loginOpId = demoLogger.startOperation('login');
  await simulateWork(8000); // 8 segundos
  demoLogger.endOperation(loginOpId);

  // 4. Demostrar cambios de contexto
  console.log('\n4️⃣  CAMBIOS DE CONTEXTO:');
  console.log('========================\n');

  console.log('🔄 Cambiando a contexto de TESTING...');
  logger.setContext(LogContext.TESTING);
  demoLogger.info('Mensaje en contexto TESTING');
  demoLogger.debug('Debug en contexto TESTING - debería mostrarse');

  console.log('\n🔄 Cambiando a contexto de PRODUCTION...');
  logger.setContext(LogContext.PRODUCTION);
  demoLogger.info('Mensaje en contexto PRODUCTION - podría no mostrarse');
  demoLogger.debug('Debug en contexto PRODUCTION - NO debería mostrarse');
  demoLogger.warn('Advertencia en PRODUCTION - SÍ debería mostrarse');

  console.log('\n🔄 Cambiando a contexto de DEBUG...');
  logger.setContext(LogContext.DEBUG);
  demoLogger.trace('Trace en contexto DEBUG - debería mostrarse');
  demoLogger.debug('Debug ultra detallado en contexto DEBUG', {
    memoryUsage: process.memoryUsage(),
    timestamp: new Date().toISOString(),
    pid: process.pid
  });

  // 5. Demostrar cambios manuales de log level
  console.log('\n5️⃣  NIVELES MANUALES:');
  console.log('====================\n');

  logger.setLogLevel(LogLevel.ERROR);
  demoLogger.info('Este mensaje NO debería aparecer (nivel ERROR)');
  demoLogger.error('Solo errores aparecen en nivel ERROR', new Error('Ejemplo'));

  logger.setLogLevel(LogLevel.INFO);
  demoLogger.info('Ahora los mensajes INFO SÍ aparecen');
  demoLogger.debug('Pero los DEBUG aún no aparecen');

  logger.setLogLevel(LogLevel.TRACE);
  demoLogger.trace('Ahora TODO aparece incluyendo TRACE');

  // 6. Demostrar performance con memoria
  console.log('\n6️⃣  ANÁLISIS DE MEMORIA:');
  console.log('========================\n');

  const memoryOpId = demoLogger.startOperation('memory_intensive');
  
  // Simular uso intensivo de memoria
  const bigArray: number[] = [];
  for (let i = 0; i < 1000000; i++) {
    bigArray.push(Math.random());
  }
  
  await simulateWork(1000);
  
  demoLogger.endOperation(memoryOpId);
  
  // Limpiar memoria
  bigArray.length = 0;

  // 7. Mostrar configuración final
  console.log('\n7️⃣  CONFIGURACIÓN FINAL:');
  console.log('========================\n');

  const config = logger.getConfig();
  console.log(`📊 Nivel actual: ${LogLevel[config.level]}`);
  console.log(`🎯 Contexto actual: ${config.context}`);

  // Generar reporte final
  logger.generateSessionReport();
}

async function simulateWork(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Configurar variables de entorno para demostración
process.env.NODE_ENV = 'development';
process.env.LOG_LEVEL = 'debug';

// Ejecutar demostración
console.log('🚀 Iniciando demostración del Strategic Logger...\n');
demonstrateLogging()
  .then(() => {
    console.log('\n✅ Demostración completada exitosamente!');
    console.log('\n📝 COMANDOS ÚTILES:');
    console.log('==================');
    console.log('NODE_ENV=production npm run demo:logging    # Logs mínimos');
    console.log('NODE_ENV=development npm run demo:logging   # Logs normales');
    console.log('DEBUG=true npm run demo:logging             # Logs máximos');
    console.log('LOG_LEVEL=trace npm run demo:logging        # Todos los logs');
    console.log('TEST_MODE=true npm run demo:logging         # Modo testing');
  })
  .catch(console.error); 