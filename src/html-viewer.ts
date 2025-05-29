import express, { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';

interface HtmlStep {
  step: string;
  title: string;
  html: string;
  timestamp: Date;
  status?: number;
  url?: string;
  cookies?: string[];
}

export class HtmlViewer {
  private app: express.Application;
  private steps: HtmlStep[] = [];
  private server: any = null;
  private port = 3001;

  constructor() {
    this.app = express();
    this.setupRoutes();
  }

  private setupRoutes() {
    // Servir archivos estáticos
    this.app.use('/static', express.static(path.join(__dirname, '../public')));

    // Página principal con lista de pasos
    this.app.get('/', (req: Request, res: Response) => {
      const html = this.generateIndexPage();
      res.send(html);
    });

    // Ver HTML de un paso específico
    this.app.get('/step/:stepId', (req: Request, res: Response) => {
      const stepId = parseInt(req.params.stepId);
      const step = this.steps[stepId];
      
      if (!step) {
        res.status(404).send('Paso no encontrado');
        return;
      }

      const html = this.generateStepPage(step, stepId);
      res.send(html);
    });

    // Ver HTML raw de un paso
    this.app.get('/raw/:stepId', (req: Request, res: Response) => {
      const stepId = parseInt(req.params.stepId);
      const step = this.steps[stepId];
      
      if (!step) {
        res.status(404).send('Paso no encontrado');
        return;
      }

      // Modificar el HTML para evitar problemas de navegación
      let modifiedHtml = step.html;
      
      // Agregar base tag para evitar problemas con rutas relativas
      if (!modifiedHtml.includes('<base')) {
        modifiedHtml = modifiedHtml.replace(
          '<head>',
          '<head>\n    <base href="about:blank">'
        );
      }
      
      // Deshabilitar formularios para evitar envíos accidentales
      modifiedHtml = modifiedHtml.replace(
        /<form([^>]*)>/gi,
        '<form$1 onsubmit="alert(\'Formulario deshabilitado en vista previa\'); return false;">'
      );
      
      // Deshabilitar enlaces para evitar navegación
      modifiedHtml = modifiedHtml.replace(
        /<a([^>]*href[^>]*)>/gi,
        '<a$1 onclick="alert(\'Enlace deshabilitado en vista previa\'); return false;">'
      );

      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('X-Frame-Options', 'SAMEORIGIN');
      res.send(modifiedHtml);
    });

    // API para obtener información de un paso
    this.app.get('/api/step/:stepId', (req: Request, res: Response) => {
      const stepId = parseInt(req.params.stepId);
      const step = this.steps[stepId];
      
      if (!step) {
        res.status(404).json({ error: 'Paso no encontrado' });
        return;
      }

      res.json({
        step: step.step,
        title: step.title,
        timestamp: step.timestamp,
        status: step.status,
        url: step.url,
        htmlLength: step.html.length,
        cookiesCount: step.cookies?.length || 0
      });
    });

    // Limpiar pasos
    this.app.post('/clear', (req: Request, res: Response) => {
      this.steps = [];
      res.json({ message: 'Pasos limpiados' });
    });
  }

  private generateIndexPage(): string {
    return `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>BanescOnline Scraper - HTML Viewer</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            padding: 20px;
        }
        h1 {
            color: #333;
            border-bottom: 2px solid #007bff;
            padding-bottom: 10px;
        }
        .step-card {
            border: 1px solid #ddd;
            border-radius: 6px;
            margin: 10px 0;
            padding: 15px;
            background: #fafafa;
            transition: background-color 0.2s;
        }
        .step-card:hover {
            background: #f0f0f0;
        }
        .step-title {
            font-weight: bold;
            color: #007bff;
            font-size: 1.1em;
        }
        .step-info {
            color: #666;
            font-size: 0.9em;
            margin: 5px 0;
        }
        .step-actions {
            margin-top: 10px;
        }
        .btn {
            display: inline-block;
            padding: 8px 16px;
            margin-right: 10px;
            background: #007bff;
            color: white;
            text-decoration: none;
            border-radius: 4px;
            font-size: 0.9em;
        }
        .btn:hover {
            background: #0056b3;
        }
        .btn-secondary {
            background: #6c757d;
        }
        .btn-secondary:hover {
            background: #545b62;
        }
        .status-success { color: #28a745; }
        .status-redirect { color: #ffc107; }
        .status-error { color: #dc3545; }
        .empty-state {
            text-align: center;
            color: #666;
            padding: 40px;
        }
        .refresh-btn {
            position: fixed;
            top: 20px;
            right: 20px;
            background: #28a745;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 4px;
            cursor: pointer;
        }
    </style>
</head>
<body>
    <button class="refresh-btn" onclick="location.reload()">🔄 Actualizar</button>
    
    <div class="container">
        <h1>🔍 BanescOnline Scraper - HTML Viewer</h1>
        
        ${this.steps.length === 0 ? `
            <div class="empty-state">
                <h3>No hay pasos registrados</h3>
                <p>Ejecuta el scraper para ver los HTMLs aquí</p>
                <code>npm run test-login</code>
            </div>
        ` : `
            <p>Total de pasos capturados: <strong>${this.steps.length}</strong></p>
            
            ${this.steps.map((step, index) => `
                <div class="step-card">
                    <div class="step-title">${step.step} - ${step.title}</div>
                    <div class="step-info">
                        <span class="status-${this.getStatusClass(step.status)}">
                            Status: ${step.status || 'N/A'}
                        </span> | 
                        Tamaño: ${(step.html.length / 1024).toFixed(1)} KB | 
                        Cookies: ${step.cookies?.length || 0} | 
                        ${step.timestamp.toLocaleString()}
                    </div>
                    ${step.url ? `<div class="step-info">URL: ${step.url}</div>` : ''}
                    <div class="step-actions">
                        <a href="/step/${index}" class="btn">📄 Ver Análisis</a>
                        <a href="/raw/${index}" class="btn btn-secondary" target="_blank">🔗 Ver HTML Raw</a>
                    </div>
                </div>
            `).join('')}
        `}
    </div>
</body>
</html>`;
  }

  private generateStepPage(step: HtmlStep, stepId: number): string {
    // Analizar el HTML con información útil
    const analysis = this.analyzeHtml(step.html);
    
    return `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${step.step} - ${step.title}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            padding: 20px;
        }
        .header {
            border-bottom: 2px solid #007bff;
            padding-bottom: 15px;
            margin-bottom: 20px;
        }
        .back-btn {
            display: inline-block;
            padding: 8px 16px;
            background: #6c757d;
            color: white;
            text-decoration: none;
            border-radius: 4px;
            margin-bottom: 15px;
        }
        .info-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin-bottom: 20px;
        }
        .info-card {
            background: #f8f9fa;
            border: 1px solid #dee2e6;
            border-radius: 6px;
            padding: 15px;
        }
        .info-card h3 {
            margin-top: 0;
            color: #495057;
        }
        .code-block {
            background: #f8f9fa;
            border: 1px solid #dee2e6;
            border-radius: 4px;
            padding: 10px;
            font-family: 'Courier New', monospace;
            font-size: 0.9em;
            overflow-x: auto;
            white-space: pre-wrap;
        }
        .html-preview {
            border: 2px solid #007bff;
            border-radius: 6px;
            margin-top: 20px;
        }
        .html-preview iframe {
            width: 100%;
            height: 600px;
            border: none;
            border-radius: 4px;
        }
        .tabs {
            display: flex;
            border-bottom: 1px solid #dee2e6;
            margin-bottom: 15px;
        }
        .tab {
            padding: 10px 20px;
            background: #f8f9fa;
            border: 1px solid #dee2e6;
            border-bottom: none;
            cursor: pointer;
            margin-right: 5px;
        }
        .tab.active {
            background: white;
            border-bottom: 1px solid white;
            margin-bottom: -1px;
        }
        .tab-content {
            display: none;
        }
        .tab-content.active {
            display: block;
        }
    </style>
</head>
<body>
    <div class="container">
        <a href="/" class="back-btn">← Volver al índice</a>
        
        <div class="header">
            <h1>${step.step} - ${step.title}</h1>
            <p>Capturado: ${step.timestamp.toLocaleString()}</p>
        </div>

        <div class="info-grid">
            <div class="info-card">
                <h3>📊 Información General</h3>
                <p><strong>Status:</strong> ${step.status || 'N/A'}</p>
                <p><strong>URL:</strong> ${step.url || 'N/A'}</p>
                <p><strong>Tamaño HTML:</strong> ${(step.html.length / 1024).toFixed(1)} KB</p>
                <p><strong>Cookies:</strong> ${step.cookies?.length || 0}</p>
            </div>

            <div class="info-card">
                <h3>🔍 Análisis del HTML</h3>
                <p><strong>Título:</strong> ${analysis.title || 'Sin título'}</p>
                <p><strong>Formularios:</strong> ${analysis.forms}</p>
                <p><strong>Inputs:</strong> ${analysis.inputs}</p>
                <p><strong>Scripts:</strong> ${analysis.scripts}</p>
            </div>

            ${step.cookies && step.cookies.length > 0 ? `
            <div class="info-card">
                <h3>🍪 Cookies</h3>
                <div class="code-block">${step.cookies.join('\n')}</div>
            </div>
            ` : ''}

            ${analysis.errors.length > 0 ? `
            <div class="info-card">
                <h3>🚨 Errores Detectados</h3>
                <div class="code-block">${analysis.errors.join('\n')}</div>
            </div>
            ` : ''}
        </div>

        <div class="tabs">
            <div class="tab active" onclick="showTab('preview')">📄 Vista Previa</div>
            <div class="tab" onclick="showTab('source')">💻 Código Fuente</div>
            <div class="tab" onclick="showTab('forms')">📋 Formularios</div>
        </div>

        <div id="preview" class="tab-content active">
            <div class="html-preview">
                <iframe src="/raw/${stepId}"></iframe>
            </div>
        </div>

        <div id="source" class="tab-content">
            <div class="code-block">${this.escapeHtml(step.html)}</div>
        </div>

        <div id="forms" class="tab-content">
            <div class="info-card">
                <h3>📋 Análisis de Formularios</h3>
                ${analysis.formDetails.length > 0 ? 
                  analysis.formDetails.map(form => `
                    <div style="margin-bottom: 20px; padding: 10px; border: 1px solid #ddd;">
                      <h4>Formulario: ${form.action || 'Sin action'}</h4>
                      <p><strong>Método:</strong> ${form.method || 'GET'}</p>
                      <p><strong>Campos:</strong></p>
                      <div class="code-block">${form.inputs.join('\n')}</div>
                    </div>
                  `).join('') : 
                  '<p>No se encontraron formularios</p>'
                }
            </div>
        </div>
    </div>

    <script>
        function showTab(tabName) {
            // Ocultar todos los contenidos
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active');
            });
            
            // Desactivar todas las pestañas
            document.querySelectorAll('.tab').forEach(tab => {
                tab.classList.remove('active');
            });
            
            // Mostrar el contenido seleccionado
            document.getElementById(tabName).classList.add('active');
            
            // Activar la pestaña seleccionada
            event.target.classList.add('active');
        }
    </script>
</body>
</html>`;
  }

  private analyzeHtml(html: string) {
    const cheerio = require('cheerio');
    const $ = cheerio.load(html);
    
    const analysis = {
      title: $('title').text(),
      forms: $('form').length,
      inputs: $('input').length,
      scripts: $('script').length,
      errors: [] as string[],
      formDetails: [] as any[]
    };

    // Analizar formularios
    $('form').each((i: number, form: any) => {
      const $form = $(form);
      const formDetail = {
        action: $form.attr('action') || '',
        method: $form.attr('method') || 'GET',
        inputs: [] as string[]
      };

      $form.find('input').each((j: number, input: any) => {
        const $input = $(input);
        const name = $input.attr('name') || '';
        const type = $input.attr('type') || 'text';
        const value = $input.attr('value') || '';
        formDetail.inputs.push(`${name} (${type}): ${value.substring(0, 50)}${value.length > 50 ? '...' : ''}`);
      });

      analysis.formDetails.push(formDetail);
    });

    // Buscar errores
    const errorSelectors = ['[id*="error"]', '[class*="error"]', '[style*="color: red"]'];
    errorSelectors.forEach(selector => {
      $(selector).each((i: number, el: any) => {
        const text = $(el).text().trim();
        if (text) {
          analysis.errors.push(text);
        }
      });
    });

    return analysis;
  }

  private escapeHtml(html: string): string {
    return html
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  private getStatusClass(status?: number): string {
    if (!status) return 'error';
    if (status >= 200 && status < 300) return 'success';
    if (status >= 300 && status < 400) return 'redirect';
    return 'error';
  }

  /**
   * Agregar un paso HTML para visualización
   */
  addStep(step: string, title: string, html: string, options: {
    status?: number;
    url?: string;
    cookies?: string[];
  } = {}) {
    this.steps.push({
      step,
      title,
      html,
      timestamp: new Date(),
      ...options
    });
    
    console.log(`📄 HTML capturado: ${step} - ${title} (${(html.length / 1024).toFixed(1)} KB)`);
  }

  /**
   * Iniciar el servidor web
   */
  start(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.server = this.app.listen(this.port, () => {
        console.log(`🌐 HTML Viewer iniciado en http://localhost:${this.port}`);
        console.log(`📄 Ve los HTMLs capturados en tu navegador`);
        resolve();
      }).on('error', (err: any) => {
        if (err.code === 'EADDRINUSE') {
          this.port++;
          this.start().then(resolve).catch(reject);
        } else {
          reject(err);
        }
      });
    });
  }

  /**
   * Detener el servidor web
   */
  stop() {
    if (this.server) {
      this.server.close();
      console.log('🛑 HTML Viewer detenido');
    }
  }

  /**
   * Limpiar todos los pasos
   */
  clear() {
    this.steps = [];
    console.log('🗑️ Pasos HTML limpiados');
  }
} 