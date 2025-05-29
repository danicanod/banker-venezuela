import fs from 'fs';
import path from 'path';

export class HTMLSaver {
  private htmlDir: string;

  constructor(outputDir: string = 'html-captures') {
    this.htmlDir = path.join(process.cwd(), outputDir);
    this.ensureDirectoryExists();
  }

  private ensureDirectoryExists(): void {
    if (!fs.existsSync(this.htmlDir)) {
      fs.mkdirSync(this.htmlDir, { recursive: true });
    }
  }

  async saveHTML(page: any, filename: string): Promise<void> {
    try {
      const content = await page.content();
      const filePath = path.join(this.htmlDir, filename);
      fs.writeFileSync(filePath, content);
      console.log(`💾 HTML guardado: ${filename} (${this.htmlDir})`);
    } catch (error) {
      console.log(`⚠️  No se pudo guardar ${filename}:`, error);
    }
  }

  async saveFrameHTML(frame: any, filename: string): Promise<void> {
    try {
      const content = await frame.content();
      const filePath = path.join(this.htmlDir, filename);
      fs.writeFileSync(filePath, content);
      console.log(`💾 HTML de frame guardado: ${filename} (${this.htmlDir})`);
    } catch (error) {
      console.log(`⚠️  No se pudo guardar frame ${filename}:`, error);
    }
  }

  getOutputDir(): string {
    return this.htmlDir;
  }
} 