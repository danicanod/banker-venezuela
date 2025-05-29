# 🤝 Contributing to Multi-Bank Scraper

¡Gracias por tu interés en contribuir! Este proyecto busca crear la mejor solución de scraping bancario para Venezuela.

## 📋 Tabla de Contenidos

- [Código de Conducta](#código-de-conducta)
- [¿Cómo Contribuir?](#cómo-contribuir)
- [Agregar Nuevo Banco](#agregar-nuevo-banco)
- [Reportar Bugs](#reportar-bugs)
- [Desarrollo Local](#desarrollo-local)
- [Pull Request Guidelines](#pull-request-guidelines)

## 📜 Código de Conducta

Este proyecto sigue el [Contributor Covenant](https://www.contributor-covenant.org/). Al participar, se espera que mantengas este código.

## 🎯 ¿Cómo Contribuir?

### 🏦 Agregar Nuevo Banco

La arquitectura modular facilita agregar nuevos bancos:

1. **Crear estructura de directorios**:
```bash
src/banks/nuevo-banco/
├── auth/
│   ├── login.ts
│   └── security-questions.ts (si aplica)
├── scrapers/
│   ├── accounts.ts
│   └── transactions.ts
└── types/
    └── index.ts
```

2. **Implementar interfaces base**:
```typescript
export class NuevoBancoLogin implements BankScraper {
  async login(): Promise<LoginResult> { /* ... */ }
  async scrapeAccounts(): Promise<ScrapingResult<BankAccount>> { /* ... */ }
  async scrapeTransactions(): Promise<ScrapingResult<BankTransaction>> { /* ... */ }
  async close(): Promise<void> { /* ... */ }
}
```

3. **Configurar banco**:
```typescript
export const NUEVO_BANCO_CONFIG: BankConfig = {
  name: 'Nuevo Banco',
  code: 'nuevo-banco',
  baseUrl: 'https://www.nuevobanco.com',
  loginUrl: 'https://www.nuevobanco.com/login',
  supportedFeatures: ['accounts', 'transactions'],
  locale: 'es-VE',
  timezone: 'America/Caracas'
};
```

### 🐛 Reportar Bugs

Al reportar un bug, incluye:

- **Versión de Node.js**: `node --version`
- **Sistema Operativo**: Windows/macOS/Linux
- **Banco afectado**: Banesco/Mercantil/etc.
- **Pasos para reproducir**
- **HTML captures** (si están disponibles)
- **Error logs completos**

**Template de Bug Report**:
```markdown
## 🐛 Bug Report

### Entorno
- OS: [Ubuntu 20.04]
- Node.js: [v18.17.0]
- Banco: [Banesco]

### Descripción
[Descripción clara del problema]

### Pasos para Reproducir
1. Ejecutar `npm run accounts`
2. Ver error en...

### Resultado Esperado
[Lo que debería pasar]

### Resultado Actual
[Lo que realmente pasa]

### HTML Captures
[Si están disponibles, adjuntar archivos HTML relevantes]
```

## 💻 Desarrollo Local

### Setup Inicial
```bash
# Clonar repositorio
git clone https://github.com/tu-usuario/multi-bank-scraper.git
cd multi-bank-scraper

# Instalar dependencias
npm install

# Configurar environment
cp env.example .env
# Editar .env con tus credenciales

# Compilar
npm run build

# Ejecutar tests
npm run accounts
```

### Scripts de Desarrollo
```bash
# Desarrollo con recarga automática
npm run dev

# Debug con HTML viewer
npm run html-viewer

# Limpiar archivos temporales
npm run clean

# Estado del browser
npm run browser:status
```

### Estructura de Commits

Usamos [Conventional Commits](https://www.conventionalcommits.org/):

```bash
feat(banesco): add transaction categorization
fix(browser): resolve timeout issues in modals
docs(readme): update installation guide
perf(scraper): improve login speed by 30%
test(auth): add security questions unit tests
```

**Tipos de commits**:
- `feat`: Nueva funcionalidad
- `fix`: Corrección de bugs
- `docs`: Documentación
- `style`: Formato de código
- `refactor`: Refactoring sin cambios funcionales
- `perf`: Mejoras de performance
- `test`: Tests
- `chore`: Tareas de mantenimiento

## 🔄 Pull Request Guidelines

### Antes de Enviar PR

1. **Fork** el repositorio
2. **Crear branch** desde `main`: `git checkout -b feature/nueva-funcionalidad`
3. **Hacer cambios** siguiendo las guías de estilo
4. **Escribir tests** si aplica
5. **Ejecutar tests**: `npm run build && npm run accounts`
6. **Actualizar docs** si es necesario
7. **Commit** siguiendo Conventional Commits

### Checklist del PR

- [ ] ✅ Código compila sin errores
- [ ] ✅ Tests pasan exitosamente
- [ ] ✅ Documentación actualizada
- [ ] ✅ Changelog actualizado (si aplica)
- [ ] ✅ Commits siguen Conventional Commits
- [ ] ✅ Branch actualizado con `main`

### Template de PR

```markdown
## 📝 Descripción

[Breve descripción de los cambios]

## 🎯 Tipo de Cambio

- [ ] 🐛 Bug fix
- [ ] ✨ Nueva funcionalidad
- [ ] 💥 Breaking change
- [ ] 📚 Documentación
- [ ] 🎨 Refactoring

## 🏦 Banco Afectado

- [ ] Banesco
- [ ] Mercantil
- [ ] BOV
- [ ] Nuevo banco: ___________

## ✅ Testing

- [ ] Tests locales pasan
- [ ] Probado en ambiente real
- [ ] HTML captures verificados

## 📋 Notas Adicionales

[Cualquier información adicional relevante]
```

## 🚀 Roadmap de Contribuciones

### Q2 2024
- [ ] **Banco de Venezuela (BOV)**
- [ ] **Mercantil Bank**
- [ ] **Unit Tests** completos

### Q3 2024
- [ ] **Banco Provincial**
- [ ] **API REST**
- [ ] **Docker Support**

### Q4 2024
- [ ] **Dashboard Web**
- [ ] **Scheduled Jobs**
- [ ] **Mobile Support**

## 💡 Ideas de Contribución

### Para Principiantes
- 📝 Mejorar documentación
- 🐛 Reportar y reproducir bugs
- 🧪 Escribir tests unitarios
- 🎨 Mejorar logging y debugging

### Para Desarrolladores Experimentados
- 🏦 Implementar nuevos bancos
- ⚡ Optimizaciones de performance
- 🔒 Mejoras de seguridad
- 🏗️ Refactoring arquitectural

### Para DevOps
- 🐳 Docker containerization
- 🔄 CI/CD pipelines
- 📊 Monitoring y observability
- ☁️ Cloud deployment guides

## 📞 Contacto

- **Issues**: Para bugs y feature requests
- **Discussions**: Para preguntas generales
- **Security**: Para vulnerabilidades, contactar en privado

---

¡Gracias por contribuir al futuro del banking automation en Venezuela! 🇻🇪 