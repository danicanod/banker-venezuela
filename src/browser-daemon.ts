#!/usr/bin/env node

import { PersistentBrowserServer } from './shared/utils/browser-server';
import { config } from 'dotenv';

config();

class BrowserDaemon {
  private server: PersistentBrowserServer;
  private isRunning: boolean = false;

  constructor() {
    this.server = PersistentBrowserServer.getInstance({ 
      headless: process.env.HEADLESS === 'true' 
    });
  }

  async start(): Promise<void> {
    console.log('🚀 INICIANDO DAEMON DEL NAVEGADOR PERSISTENTE');
    console.log('==============================================\n');

    try {
      await this.server.start();
      this.isRunning = true;

      console.log('✅ Daemon iniciado exitosamente');
      console.log('📊 Estadísticas del servidor:');
      
      const status = this.server.getStatus();
      console.log(`   🟢 Estado: ${status.isActive ? 'Activo' : 'Inactivo'}`);
      console.log(`   🕒 Iniciado: ${status.lastUsed.toLocaleString()}`);
      console.log(`   💻 PID: ${process.pid}`);
      
      console.log('\n📋 Comandos disponibles:');
      console.log('   • status    - Ver estado del servidor');
      console.log('   • stats     - Ver estadísticas de red');
      console.log('   • restart   - Reiniciar navegador');
      console.log('   • stop      - Detener daemon');
      console.log('   • help      - Mostrar ayuda');

      this.setupCommands();
      this.startStatusReporting();

    } catch (error) {
      console.error('❌ Error iniciando daemon:', error);
      process.exit(1);
    }
  }

  private setupCommands(): void {
    process.stdin.setEncoding('utf8');
    process.stdin.on('readable', () => {
      const chunk = process.stdin.read();
      if (chunk !== null) {
        const command = chunk.toString().trim().toLowerCase();
        this.handleCommand(command);
      }
    });

    // Manejar señales del sistema
    process.on('SIGINT', () => {
      console.log('\n🛑 Recibida señal SIGINT, deteniendo daemon...');
      this.stop();
    });

    process.on('SIGTERM', () => {
      console.log('\n🛑 Recibida señal SIGTERM, deteniendo daemon...');
      this.stop();
    });
  }

  private async handleCommand(command: string): Promise<void> {
    switch (command) {
      case 'status':
        this.showStatus();
        break;
      
      case 'stats':
        this.showNetworkStats();
        break;
      
      case 'restart':
        await this.restart();
        break;
      
      case 'stop':
        await this.stop();
        break;
      
      case 'help':
        this.showHelp();
        break;
      
      case '':
        break; // Ignorar líneas vacías
        
      default:
        console.log(`❓ Comando desconocido: "${command}". Escribe "help" para ver comandos disponibles.`);
    }
  }

  private showStatus(): void {
    const status = this.server.getStatus();
    const uptime = Date.now() - status.lastUsed.getTime();
    
    console.log('\n📊 ESTADO DEL SERVIDOR:');
    console.log('========================');
    console.log(`🟢 Estado: ${status.isActive ? 'Activo' : 'Inactivo'}`);
    console.log(`🕒 Último uso: ${status.lastUsed.toLocaleString()}`);
    console.log(`⏰ Uptime: ${Math.floor(uptime / 1000)}s`);
    console.log(`📈 Dominios monitoreados: ${status.requestStats.length}`);
    console.log(`💻 PID: ${process.pid}`);
    console.log(`🧠 Memoria: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`);
  }

  private showNetworkStats(): void {
    console.log('\n🌐 ESTADÍSTICAS DE RED:');
    this.server.printRequestAnalysis();
  }

  private async restart(): Promise<void> {
    console.log('\n🔄 REINICIANDO NAVEGADOR...');
    try {
      await this.server.restart();
      console.log('✅ Navegador reiniciado exitosamente');
    } catch (error) {
      console.error('❌ Error reiniciando navegador:', error);
    }
  }

  private async stop(): Promise<void> {
    console.log('\n🛑 DETENIENDO DAEMON...');
    this.isRunning = false;
    
    try {
      await this.server.close();
      console.log('✅ Daemon detenido exitosamente');
      process.exit(0);
    } catch (error) {
      console.error('❌ Error deteniendo daemon:', error);
      process.exit(1);
    }
  }

  private showHelp(): void {
    console.log('\n📋 COMANDOS DISPONIBLES:');
    console.log('=========================');
    console.log('status    - Mostrar estado del servidor');
    console.log('stats     - Mostrar estadísticas de red');
    console.log('restart   - Reiniciar el navegador');
    console.log('stop      - Detener el daemon');
    console.log('help      - Mostrar esta ayuda');
    console.log('\n💡 El daemon optimiza automáticamente las cargas de red');
    console.log('   bloqueando recursos innecesarios y manteniendo el');
    console.log('   navegador listo para conexiones instantáneas.');
  }

  private startStatusReporting(): void {
    // Reporte de estado cada 5 minutos
    setInterval(() => {
      if (this.isRunning) {
        const status = this.server.getStatus();
        const memory = Math.round(process.memoryUsage().heapUsed / 1024 / 1024);
        console.log(`\n⏰ [${new Date().toLocaleTimeString()}] Daemon activo - Memoria: ${memory}MB - Dominios: ${status.requestStats.length}`);
      }
    }, 5 * 60 * 1000); // 5 minutos
  }
}

// Iniciar daemon
async function main() {
  const daemon = new BrowserDaemon();
  await daemon.start();
}

// Solo ejecutar si es llamado directamente
if (import.meta.url === process.argv[1] || import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}