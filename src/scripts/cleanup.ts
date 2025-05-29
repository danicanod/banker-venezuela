import * as fs from 'fs';
import * as path from 'path';

async function cleanup() {
  console.log('🧹 LIMPIEZA AUTOMÁTICA DEL PROYECTO');
  console.log('===================================\n');

  const projectRoot = process.cwd();
  let totalFiles = 0;
  let totalSize = 0;

  try {
    // 1. Limpiar archivos HTML captures antiguos (más de 7 días)
    console.log('📄 Limpiando archivos HTML antiguos...');
    const htmlCapturesDir = path.join(projectRoot, 'html-captures');
    
    if (fs.existsSync(htmlCapturesDir)) {
      const files = fs.readdirSync(htmlCapturesDir);
      const now = Date.now();
      const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 días en ms
      
      for (const file of files) {
        const filePath = path.join(htmlCapturesDir, file);
        const stats = fs.statSync(filePath);
        
        if (now - stats.mtime.getTime() > maxAge) {
          console.log(`   🗑️  Eliminando: ${file} (${Math.round(stats.size / 1024)}KB)`);
          fs.unlinkSync(filePath);
          totalFiles++;
          totalSize += stats.size;
        }
      }
    }

    // 2. Limpiar directorio dist
    console.log('\n🏗️  Limpiando directorio build...');
    const distDir = path.join(projectRoot, 'dist');
    if (fs.existsSync(distDir)) {
      const size = getDirSize(distDir);
      fs.rmSync(distDir, { recursive: true, force: true });
      console.log(`   🗑️  Eliminado dist/ (${Math.round(size / 1024)}KB)`);
      totalSize += size;
    }

    // 3. Limpiar archivos de log
    console.log('\n📋 Limpiando archivos de log...');
    const logFiles = ['*.log', 'npm-debug.log*', 'yarn-error.log'];
    
    for (const pattern of logFiles) {
      const files = fs.readdirSync(projectRoot).filter(file => 
        file.match(pattern.replace('*', '.*'))
      );
      
      for (const file of files) {
        const filePath = path.join(projectRoot, file);
        const stats = fs.statSync(filePath);
        console.log(`   🗑️  Eliminando: ${file} (${Math.round(stats.size / 1024)}KB)`);
        fs.unlinkSync(filePath);
        totalFiles++;
        totalSize += stats.size;
      }
    }

    // 4. Limpiar archivos temporales
    console.log('\n⏰ Limpiando archivos temporales...');
    const tempPatterns = ['.tmp', '.temp', '.cache'];
    
    function cleanTempFiles(dir: string) {
      if (!fs.existsSync(dir)) return;
      
      const items = fs.readdirSync(dir);
      for (const item of items) {
        const itemPath = path.join(dir, item);
        const stats = fs.statSync(itemPath);
        
        if (stats.isDirectory()) {
          if (tempPatterns.some(pattern => item.includes(pattern))) {
            const size = getDirSize(itemPath);
            fs.rmSync(itemPath, { recursive: true, force: true });
            console.log(`   🗑️  Eliminado directorio: ${item} (${Math.round(size / 1024)}KB)`);
            totalSize += size;
          } else {
            cleanTempFiles(itemPath);
          }
        } else {
          if (tempPatterns.some(pattern => item.includes(pattern)) || 
              item.startsWith('tmp-') || item.startsWith('temp-')) {
            console.log(`   🗑️  Eliminando: ${item} (${Math.round(stats.size / 1024)}KB)`);
            fs.unlinkSync(itemPath);
            totalFiles++;
            totalSize += stats.size;
          }
        }
      }
    }
    
    cleanTempFiles(projectRoot);

    // 5. Optimizar node_modules (limpiar cache)
    console.log('\n📦 Optimizando node_modules...');
    const nodeModulesCache = path.join(projectRoot, 'node_modules/.cache');
    if (fs.existsSync(nodeModulesCache)) {
      const size = getDirSize(nodeModulesCache);
      fs.rmSync(nodeModulesCache, { recursive: true, force: true });
      console.log(`   🗑️  Eliminado node_modules/.cache (${Math.round(size / 1024)}KB)`);
      totalSize += size;
    }

    // 6. Resumen
    console.log('\n📊 RESUMEN DE LIMPIEZA:');
    console.log('=======================');
    console.log(`🗑️  Archivos eliminados: ${totalFiles}`);
    console.log(`💾 Espacio liberado: ${Math.round(totalSize / 1024)}KB (${Math.round(totalSize / 1024 / 1024)}MB)`);
    
    if (totalFiles === 0 && totalSize === 0) {
      console.log('✨ El proyecto ya estaba limpio!');
    } else {
      console.log('✅ Limpieza completada exitosamente!');
    }

  } catch (error: any) {
    console.error('❌ Error durante la limpieza:', error.message);
  }
}

function getDirSize(dirPath: string): number {
  let size = 0;
  
  if (!fs.existsSync(dirPath)) return 0;
  
  const items = fs.readdirSync(dirPath);
  for (const item of items) {
    const itemPath = path.join(dirPath, item);
    const stats = fs.statSync(itemPath);
    
    if (stats.isDirectory()) {
      size += getDirSize(itemPath);
    } else {
      size += stats.size;
    }
  }
  
  return size;
}

// Ejecutar limpieza
cleanup().catch(console.error); 