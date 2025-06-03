#!/usr/bin/env tsx
import { Command } from 'commander';
import { config } from 'dotenv';
import { existsSync } from 'fs';
import { execSync } from 'child_process';
import ora from 'ora';
import path from 'path';
import chalk from 'chalk';
import boxen from 'boxen';
import Table from 'cli-table3';
import figures from 'figures';

// Load environment variables
config();

// CLI Styling
const styles = {
  title: chalk.bold.hex('#42b983'),
  subtitle: chalk.hex('#97c7b5'),
  success: chalk.green,
  error: chalk.bold.red,
  warning: chalk.hex('#FFA500'),
  info: chalk.blue,
  command: chalk.cyan,
  param: chalk.yellow,
  highlight: chalk.bold.white,
  dim: chalk.dim,
  accent: chalk.hex('#42b983'),
  box: {
    padding: 1,
    margin: { top: 1, bottom: 1 },
    borderStyle: 'round',
    borderColor: '#42b983'
  }
};

// Helper for styled logging
const log = {
  title: (text: string) => console.log(styles.title(`\n${text}`)),
  subtitle: (text: string) => console.log(styles.subtitle(text)),
  info: (text: string) => console.log(`${styles.info(figures.info)} ${text}`),
  success: (text: string) => console.log(`${styles.success(figures.tick)} ${text}`),
  error: (text: string) => console.log(`${styles.error(figures.cross)} ${text}`),
  warning: (text: string) => console.log(`${styles.warning(figures.warning)} ${text}`),
  highlight: (text: string) => console.log(`\n${styles.highlight(text)}`),
  table: (headers: string[], rows: any[][]) => {
    const table = new Table({
      head: headers.map(h => styles.accent(h)),
      style: { head: [], border: [] }
    });
    
    rows.forEach(row => table.push(row));
    console.log(table.toString());
  },
  box: (title: string, content: string) => {
    console.log(boxen(
      `${styles.title(title)}\n\n${content}`, 
      styles.box as any
    ));
  }
};

// Welcome banner
const showWelcomeBanner = () => {
  if (process.argv.length <= 2) {
    log.box(
      '🏦 Banker Venezuela CLI', 
      `Sistema optimizado para scraping de datos bancarios venezolanos
      
${styles.subtitle('Uso:')} ${styles.command('banker')} ${styles.param('[comando]')} ${styles.param('[opciones]')}
      
Ejecute ${styles.command('banker --help')} para ver todos los comandos disponibles.`
    );
  }
};

// Create CLI program
const program = new Command();
program
  .name('banker')
  .description('🏦 CLI para scraping de datos bancarios venezolanos')
  .version('2.0.0', '-v, --version', 'Muestra la versión actual')
  .helpOption('-h, --help', 'Mostrar información de ayuda');

// Utility to run a script with proper error handling
async function runScript(scriptPath: string, args: string[] = []): Promise<void> {
  const spinner = ora({
    text: 'Iniciando operación...',
    color: 'green'
  }).start();
  
  try {
    const scriptFullPath = path.join(process.cwd(), 'src', scriptPath);
    if (!existsSync(scriptFullPath)) {
      spinner.fail(`Script no encontrado: ${scriptPath}`);
      return;
    }

    // Convert args to proper command line arguments
    const argsString = args.join(' ');
    
    spinner.text = 'Ejecutando...';
    
    // Use tsx to run TypeScript directly
    execSync(`tsx ${scriptFullPath} ${argsString}`, { 
      stdio: 'inherit',
      env: process.env
    });
    
    spinner.succeed('Operación completada');
  } catch (error) {
    spinner.fail(`Error: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}

// Define option types
interface TransactionOptions {
  days?: string;
  headless?: boolean;
}

interface DebugOptions {
  debug?: boolean;
}

interface HeadlessOptions {
  headless?: boolean;
}

// BANK OPERATIONS
// ===============
const bankCommand = program.command('bank')
  .description('Operaciones bancarias');

// Account info
bankCommand.command('accounts')
  .description('Obtener información de cuentas')
  .action(async () => {
    log.title('Consultando cuentas bancarias');
    log.subtitle('Obteniendo información detallada de todas las cuentas disponibles');
    await runScript('index.ts');
  });

// Transactions
bankCommand.command('transactions')
  .description('Obtener movimientos de cuenta')
  .option('-d, --days <days>', 'Número de días para consultar', '30')
  .option('--headless', 'Ejecutar en modo headless', false)
  .action(async (options: TransactionOptions) => {
    const args = [];
    if (options.days) args.push(`--days=${options.days}`);
    if (options.headless) args.push('--headless');
    
    log.title('Consultando transacciones bancarias');
    log.subtitle(`Período: últimos ${options.days || '30'} días`);
    
    await runScript('scripts/transactions-working-simple.ts', args);
  });

// Nuevo método directo de transacciones
bankCommand.command('fix-transactions')
  .description('Acceso directo a transacciones (método alternativo)')
  .action(async () => {
    log.title('Acceso directo a transacciones bancarias');
    log.subtitle('Utilizando método alternativo para conexión directa');
    await runScript('scripts/fix-banesco.ts');
  });

// Nuevo método con manejo automático de preguntas de seguridad
bankCommand.command('secure-transactions')
  .description('Acceso a transacciones con manejo de preguntas de seguridad')
  .action(async () => {
    log.title('Acceso seguro a transacciones bancarias');
    log.subtitle('Con manejo automático de preguntas de seguridad');
    await runScript('scripts/fix-banesco-security.ts');
  });

// Security setup
bankCommand.command('setup-security')
  .description('Configurar preguntas de seguridad')
  .action(async () => {
    log.title('Configuración de seguridad');
    log.subtitle('Configuración de preguntas de seguridad para autenticación');
    await runScript('scripts/setup-security.ts');
  });

// Test login
bankCommand.command('test-login')
  .description('Probar login optimizado')
  .option('--debug', 'Ejecutar en modo debug', false)
  .action(async (options: DebugOptions) => {
    const args = [];
    if (options.debug) args.push('--debug');
    
    log.title('Prueba de autenticación');
    log.subtitle(options.debug ? 'Modo debug activado' : 'Modo estándar');
    await runScript('scripts/test-optimized-login.ts', args);
  });

// BROWSER MANAGEMENT
// =================
const browserCommand = program.command('browser')
  .description('Gestión del navegador');

// Status
browserCommand.command('status')
  .description('Ver estado del navegador')
  .action(async () => {
    log.title('Estado del navegador');
    await runScript('scripts/browser-status.ts');
  });

// Close
browserCommand.command('close')
  .description('Cerrar navegador')
  .action(async () => {
    log.title('Cerrando navegador');
    await runScript('scripts/browser-close.ts');
  });

// DAEMON MANAGEMENT
// ================
const daemonCommand = program.command('daemon')
  .description('Gestión del daemon del navegador');

// Start
daemonCommand.command('start')
  .description('Iniciar daemon del navegador')
  .option('--headless', 'Ejecutar en modo headless', false)
  .action(async (options: HeadlessOptions) => {
    const args = [];
    if (options.headless) args.push('--headless');
    
    log.title('Iniciando daemon del navegador');
    log.subtitle(options.headless ? 'Modo headless activado' : 'Modo con interfaz gráfica');
    await runScript('scripts/browser-daemon.ts', args);
  });

// Stop
daemonCommand.command('stop')
  .description('Detener daemon del navegador')
  .action(async () => {
    log.title('Deteniendo daemon del navegador');
    execSync('pkill -f \'tsx.*browser-daemon\' || echo \'No daemon running\'', { 
      stdio: 'inherit' 
    });
    log.success('Daemon detenido correctamente');
  });

// Status
daemonCommand.command('status')
  .description('Ver estado del daemon')
  .action(async () => {
    log.title('Estado del daemon');
    try {
      const output = execSync('pgrep -f \'tsx.*browser-daemon\'', { 
        stdio: 'pipe',
        encoding: 'utf-8'
      });
      
      if (output && output.trim()) {
        log.success('El daemon está activo');
        log.info(`PID: ${output.trim()}`);
      } else {
        log.warning('El daemon no está en ejecución');
      }
    } catch (e) {
      log.warning('El daemon no está en ejecución');
    }
  });

// PERSISTENT SESSION
// =================
const persistentCommand = program.command('persistent')
  .description('Gestión de sesiones persistentes');

// Status
persistentCommand.command('status')
  .description('Ver estado de sesiones persistentes')
  .action(async () => {
    log.title('Estado de sesiones persistentes');
    await runScript('scripts/persistent-status.ts');
  });

// Close
persistentCommand.command('close')
  .description('Cerrar sesiones persistentes')
  .action(async () => {
    log.title('Cerrando sesiones persistentes');
    await runScript('scripts/persistent-close.ts');
  });

// UTILITIES
// =========
const utilsCommand = program.command('utils')
  .description('Utilidades');

// Clean
utilsCommand.command('clean')
  .description('Limpiar archivos temporales')
  .action(async () => {
    log.title('Limpiando archivos temporales');
    execSync('rm -rf dist/ html-captures/ *.html', { 
      stdio: 'inherit' 
    });
    log.success('Limpieza completada correctamente');
  });

// Cleanup
utilsCommand.command('cleanup')
  .description('Limpiar sistema completo (sesiones, navegadores, archivos)')
  .action(async () => {
    log.title('Limpieza completa del sistema');
    log.subtitle('Eliminando sesiones, navegadores y archivos temporales');
    await runScript('scripts/cleanup.ts');
  });

// HTML Viewer
utilsCommand.command('html-viewer')
  .description('Visualizar capturas HTML')
  .action(async () => {
    log.title('Visor de capturas HTML');
    await runScript('html-viewer.ts');
  });

// DIAGNOSTIC TOOLS
// ===============
const diagnosticCommand = program.command('diagnostic')
  .description('Herramientas de diagnóstico');

// Network Test
diagnosticCommand.command('network')
  .description('Verificar conexión con el banco')
  .action(async () => {
    log.title('Prueba de conexión con el banco');
    log.subtitle('Verificando si el sitio del banco está accesible');
    
    const spinner = ora({
      text: 'Verificando conexión...',
      color: 'blue'
    }).start();
    
    try {
      // Verificar conexión con el banco usando curl
      execSync('curl -s -o /dev/null -w "%{http_code}" https://www.banesconline.com/', { 
        stdio: 'pipe' 
      });
      
      spinner.succeed('Sitio del banco accesible');
      log.success('La conexión con el banco está funcionando correctamente');
    } catch (error) {
      spinner.fail('Error de conexión');
      log.error('No se pudo conectar con el banco. Verifique su conexión a internet.');
      log.info('Puede intentar abrir https://www.banesconline.com/ en su navegador para confirmar.');
    }
  });

// SSL Certificate Check
diagnosticCommand.command('ssl')
  .description('Verificar certificado SSL del banco')
  .action(async () => {
    log.title('Verificación de certificado SSL');
    
    try {
      const output = execSync('echo | openssl s_client -connect www.banesconline.com:443 2>/dev/null | openssl x509 -noout -dates', { 
        stdio: 'pipe',
        encoding: 'utf-8'
      });
      
      log.success('Certificado SSL válido');
      log.info('Información del certificado:');
      console.log(chalk.gray(output));
    } catch (error) {
      log.error('Error al verificar el certificado SSL');
      log.warning('Puede haber problemas con el certificado del banco que impiden la conexión');
    }
  });

// Browser Check
diagnosticCommand.command('browser')
  .description('Verificar configuración del navegador')
  .action(async () => {
    log.title('Diagnóstico del navegador');
    await runScript('scripts/browser-diagnostic.ts');
  });

// Install globally
program.command('install-global')
  .description('Instalar CLI globalmente')
  .action(async () => {
    log.title('Instalación global de CLI');
    await runScript('scripts/install-cli.ts');
  });

// Show welcome banner if no arguments
if (process.argv.length === 2) {
  showWelcomeBanner();
}

// Parse the command line arguments
program.parse();

// Output help if no command is provided
if (process.argv.length === 2) {
  program.outputHelp();
} 