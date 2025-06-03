# Mejoras en Esperas Inteligentes y Logging

## 🚀 Problemas Resueltos

### ❌ Antes (con waitForTimeout)
```typescript
// Problemático: esperas fijas sin saber si es necesario
await frame.waitForTimeout(3000); // ¿3 segundos? ¿Por qué?
await frame.waitForTimeout(1000); // ¿Qué estamos esperando?
await frame.waitForTimeout(2000); // Tiempo perdido
```

### ✅ Ahora (con esperas inteligentes)
```typescript
// Inteligente: esperamos por elementos específicos
await this.waitForElementReady(frame, '#txtUsuario');
await this.waitForNavigation(frame, ['#lblPrimeraP', '#txtClave']);
await frame.waitForSelector('#btnEntrar', { state: 'visible' });
```

## 🔧 Nuevos Métodos Inteligentes

### 1. `waitForElementReady()`
Espera a que un elemento esté completamente listo (visible y habilitado):
```typescript
private async waitForElementReady(frame: Frame, selector: string): Promise<boolean> {
  // Espera a que exista
  await frame.waitForSelector(selector);
  
  // Espera a que esté visible y habilitado
  await frame.waitForFunction(
    (sel) => {
      const element = document.querySelector(sel) as HTMLElement;
      return element && 
             element.offsetParent !== null && // visible
             !element.hasAttribute('disabled'); // enabled
    },
    selector
  );
}
```

### 2. `waitForNavigation()`
Espera navegación detectando contenido nuevo:
```typescript
private async waitForNavigation(frame: Frame, expectedSelectors: string[]): Promise<boolean> {
  // Espera a que aparezca cualquiera de los elementos esperados
  await Promise.race(
    expectedSelectors.map(selector => 
      frame.waitForSelector(selector)
    )
  );
}
```

## 📝 Sistema de Logging Mejorado

### Logging Automático a Archivo
```typescript
// Cada acción se registra automáticamente
this.log('🔐 Starting login process...');
this.log('👤 Entering username...');
this.log('✅ Username entered successfully');
```

### Archivo de Log con Timestamp
```
[2024-01-15T10:30:15.123Z] 🏦 Banesco Auth initialized for user: tes***
[2024-01-15T10:30:15.456Z] 🚀 Starting Banesco authentication process...
[2024-01-15T10:30:16.789Z] 🌐 Navigating to Banesco login page...
[2024-01-15T10:30:18.012Z] 🖼️  Waiting for login iframe...
[2024-01-15T10:30:19.345Z] ✅ Login iframe ready
```

## 🎯 Esperas Específicas por Etapa

### Username Entry
```typescript
// Antes
await frame.fill('#txtUsuario', username);
await frame.waitForTimeout(1000); // ❌

// Ahora
await this.waitForElementReady(frame, '#txtUsuario'); // ✅
await frame.fill('#txtUsuario', username);
await frame.waitForFunction(
  (selector) => {
    const element = document.querySelector(selector) as HTMLInputElement;
    return element && element.value.length > 0;
  },
  '#txtUsuario'
);
```

### Form Submission
```typescript
// Antes
await button.click();
await frame.waitForTimeout(3000); // ❌

// Ahora
await button.click(); // ✅
await this.waitForNavigation(frame, [
  '#lblPrimeraP',    // Security questions
  '#txtClave',       // Password field
  '.next-page'       // Next page indicator
]);
```

### Modal Handling
```typescript
// Antes
await frame.waitForTimeout(2000); // ❌
const modal = await frame.$('#btnModal');

// Ahora
const modal = await frame.waitForSelector('#btnModal', { // ✅
  timeout: 2000,
  state: 'visible'
});
await modal.click();
await frame.waitForSelector('#btnModal', { state: 'hidden' });
```

## 📊 Cómo Usar los Logs para Debugging

### 1. Obtener Logs Durante Ejecución
```typescript
const auth = new BanescoAuth(credentials, { debug: true });
await auth.login();

// Obtener archivo de log
const logFile = auth.getLogFile();
console.log(`Logs guardados en: ${logFile}`);

// Obtener contenido del log
const logContent = auth.getLogContent();
console.log(logContent);
```

### 2. Exportar Logs
```typescript
// Exportar a archivo específico
auth.exportLogs('mi-debug-session.log');

// Los logs se exportan automáticamente al cerrar
await auth.close();
```

### 3. Analizar Logs para Debugging
```bash
# Ver logs en tiempo real
tail -f debug-banesco-*.log

# Buscar errores específicos
grep "❌\|⚠️" debug-banesco-*.log

# Ver solo navegación
grep "Navigation\|✅\|🔄" debug-banesco-*.log
```

## 🎮 Ejemplo de Uso Completo

```typescript
import { BanescoAuth } from './src/banesco';

async function debugWithSmartWaits() {
  const auth = new BanescoAuth({
    username: 'test_user',
    password: 'test_pass',
    securityQuestions: 'madre:maria,mascota:firulais'
  }, {
    debug: true,
    headless: false,
    timeout: 60000
  });

  try {
    console.log('🚀 Iniciando con esperas inteligentes...');
    
    const result = await auth.login();
    
    if (result.success) {
      console.log('✅ Login exitoso!');
    } else {
      console.log('❌ Login falló:', result.message);
    }
    
    // Obtener logs para análisis
    const logFile = auth.getLogFile();
    const logContent = auth.getLogContent();
    
    console.log('\n📋 Resumen del Log:');
    console.log(`📄 Archivo: ${logFile}`);
    console.log(`📏 Líneas: ${logContent.split('\n').length}`);
    
    // Exportar para compartir
    auth.exportLogs(`analisis-${Date.now()}.log`);
    
  } finally {
    await auth.close();
  }
}

debugWithSmartWaits();
```

## 💡 Ventajas de las Esperas Inteligentes

1. **Más Rápido**: No espera tiempo innecesario
2. **Más Confiable**: Espera condiciones específicas
3. **Mejor Debugging**: Logs detallados de qué está esperando
4. **Menos Flaky**: Reduce fallos por timing
5. **Más Mantenible**: Código más claro y autodocumentado

## 🔍 Debugging con Logs

### Compartir Logs para Ayuda
```bash
# Ejecutar con debug
tsx src/banesco/debug.ts

# Los logs se guardan automáticamente como:
# debug-banesco-2024-01-15T10-30-15-123Z.log
# debug-banesco-exported-2024-01-15T10-30-45-678Z.log

# Compartir el archivo exportado para análisis
```

### Analizar Problemas Comunes
```bash
# Ver si hay elementos que no se encontraron
grep "not found\|not ready" debug-banesco-*.log

# Ver navegación exitosa
grep "Navigation detected\|submitted successfully" debug-banesco-*.log

# Ver timing de operaciones
grep "\[.*\] 🔄\|\[.*\] ✅" debug-banesco-*.log
```

¡Ahora tienes esperas inteligentes y logs completos para debugging! 🎉 