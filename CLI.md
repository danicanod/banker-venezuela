# CLI Bancario

Este CLI proporciona una interfaz unificada para interactuar con funciones bancarias, manejo de navegadores y utilidades.

## Instalación

```bash
# Opción 1: Instalar globalmente desde el script
npm run install-cli

# Opción 2: Instalar globalmente con npm
npm install -g .

# Opción 3: Ejecutar directamente con npx
npx tsx src/cli.ts

# Opción 4: Instalar usando el comando CLI
tsx src/cli.ts install-global
```

## Uso

La CLI está organizada en comandos agrupados por categoría:

```
banker [comando] [subcomando] [opciones]
```

Para ver la ayuda general:

```bash
banker --help
```

## Comandos Disponibles

### Operaciones Bancarias

```bash
# Ver información de cuentas
banker bank accounts

# Obtener movimientos de cuenta
banker bank transactions
banker bank transactions --days=15  # Últimos 15 días
banker bank transactions --headless  # Modo sin interfaz

# Método alternativo para transacciones (cuando el método principal falla)
banker bank fix-transactions

# Método alternativo con manejo automático de preguntas de seguridad
banker bank secure-transactions

# Configurar preguntas de seguridad
banker bank setup-security

# Probar login optimizado
banker bank test-login
banker bank test-login --debug  # Modo debug
```

### Gestión del Navegador

```bash
# Ver estado del navegador
banker browser status

# Cerrar navegador
banker browser close
```

### Gestión del Daemon

```bash
# Iniciar daemon del navegador
banker daemon start
banker daemon start --headless  # Modo sin interfaz

# Detener daemon
banker daemon stop

# Ver estado del daemon
banker daemon status
```

### Sesiones Persistentes

```bash
# Ver estado de sesiones persistentes
banker persistent status

# Cerrar sesiones persistentes
banker persistent close
```

### Utilidades

```bash
# Limpiar archivos temporales
banker utils clean

# Limpiar sistema completo
banker utils cleanup

# Visor HTML para depuración
banker utils html-viewer

# Instalar CLI globalmente
banker install-global
```

### Herramientas de Diagnóstico

```bash
# Verificar conexión con el banco
banker diagnostic network

# Verificar certificado SSL del banco
banker diagnostic ssl

# Verificar configuración del navegador
banker diagnostic browser
```

## Ejemplos de Uso

### Flujo básico de trabajo

```bash
# Iniciar daemon en segundo plano
banker daemon start --headless

# Obtener transacciones recientes
banker bank transactions --days=7

# Cerrar navegador al terminar
banker browser close
```

### Depuración

```bash
# Probar login en modo debug
banker bank test-login --debug

# Ver sesiones activas
banker persistent status

# Limpiar archivos temporales
banker utils clean
``` 