import { StrategicLogger } from '../shared/utils/strategic-logger';

async function demonstrateRealPerformance() {
  console.log('🎯 DEMO: Performance Monitoring en Escenario Real de Scraping');
  console.log('=============================================================\n');
  
  const logger = StrategicLogger.getInstance();
  const bankLogger = logger.createComponentLogger('BancoScraper');
  
  console.log('📊 Configuración:', logger.getConfig());
  console.log('');
  
  // Simular login rápido (debería pasar)
  console.log('🔐 Simulando LOGIN...');
  const loginId = bankLogger.startOperation('login');
  await new Promise(resolve => setTimeout(resolve, 2000)); // 2 segundos
  bankLogger.endOperation(loginId);
  
  // Simular navegación súper rápida (debería pasar)
  console.log('\n🧭 Simulando NAVEGACIÓN...');
  const navId = bankLogger.startOperation('navigation');
  await new Promise(resolve => setTimeout(resolve, 800)); // 0.8 segundos
  bankLogger.endOperation(navId);
  
  // Simular extracción lenta (debería fallar)
  console.log('\n💳 Simulando EXTRACCIÓN LENTA...');
  const extractId = bankLogger.startOperation('extraction');
  await new Promise(resolve => setTimeout(resolve, 7000)); // 7 segundos
  bankLogger.endOperation(extractId);
  
  console.log('\n📊 RESUMEN:');
  console.log('===========');
  console.log('✅ Login: Rápido (2s) - Debería PASAR fitness');
  console.log('✅ Navegación: Muy rápido (0.8s) - Debería PASAR fitness'); 
  console.log('❌ Extracción: Lento (7s) - Debería FALLAR fitness');
  console.log('\n🎯 Los fitness scores te ayudan a identificar operaciones que necesitan optimización');
}

demonstrateRealPerformance().catch(console.error); 