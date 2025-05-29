import { Frame } from 'playwright';
import { SecurityQuestionMap } from '../types/index';

export class SecurityQuestionsHandler {
  private questionMap: SecurityQuestionMap;

  constructor(securityQuestionsConfig: string) {
    this.questionMap = this.parseSecurityQuestions(securityQuestionsConfig);
  }

  private parseSecurityQuestions(securityQuestions: string): SecurityQuestionMap {
    const questionMap: SecurityQuestionMap = {};
    
    if (!securityQuestions) {
      console.log('⚠️  No se encontró configuración de preguntas de seguridad');
      return questionMap;
    }
    
    const pairs = securityQuestions.split(',');
    
    for (const pair of pairs) {
      const [keyword, answer] = pair.split(':');
      if (keyword && answer) {
        const normalizedKeyword = keyword.trim().toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, ''); // Remove accents
        
        questionMap[normalizedKeyword] = answer.trim();
        console.log(`🔑 Mapeado: "${keyword.trim()}" → "${answer.trim()}"`);
      }
    }
    
    return questionMap;
  }

  private normalizeText(text: string): string {
    return text.toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove accents
      .replace(/[¿?¡!]/g, '') // Remove question marks and exclamations
      .trim();
  }

  private findMatchingAnswer(questionText: string): string | null {
    const normalizedQuestion = this.normalizeText(questionText);
    
    for (const [keyword, answer] of Object.entries(this.questionMap)) {
      if (normalizedQuestion.includes(keyword)) {
        console.log(`✅ Coincidencia encontrada: "${keyword}" en "${questionText}"`);
        return answer;
      }
    }
    
    return null;
  }

  async handleSecurityQuestions(frame: any): Promise<boolean> {
    console.log('🔐 Manejando preguntas de seguridad...');
    
    if (Object.keys(this.questionMap).length === 0) {
      console.log('❌ No hay preguntas configuradas');
      return false;
    }
    
    console.log(`🗂️  ${Object.keys(this.questionMap).length} mapeos cargados`);
    
    // Buscar específicamente los elementos de preguntas conocidos
    const questionElements = [
      { labelId: 'lblPrimeraP', inputId: 'txtPrimeraR' },
      { labelId: 'lblSegundaP', inputId: 'txtSegundaR' },
      { labelId: 'lblTerceraP', inputId: 'txtTerceraR' },
      { labelId: 'lblCuartaP', inputId: 'txtCuartaR' }
    ];
    
    let answersProvided = 0;
    
    for (const element of questionElements) {
      try {
        // Verificar si existe el label de la pregunta
        const labelElement = await frame.$(`#${element.labelId}`);
        if (!labelElement) {
          continue;
        }
        
        // Obtener el texto de la pregunta
        const questionText = await labelElement.textContent();
        if (!questionText) {
          continue;
        }
        
        console.log(`📋 Pregunta: "${questionText}"`);
        
        // Buscar respuesta para esta pregunta
        const answer = this.findMatchingAnswer(questionText);
        
        if (answer) {
          console.log(`🎯 Respuesta: "${answer}"`);
          
          // Verificar si existe el campo de entrada
          const inputElement = await frame.$(`#${element.inputId}`);
          if (!inputElement) {
            continue;
          }
          
          // Verificar si el campo está visible y habilitado
          const isVisible = await inputElement.isVisible();
          const isEnabled = await inputElement.isEnabled();
          
          if (!isVisible || !isEnabled) {
            continue;
          }
          
          // Llenar el campo
          try {
            console.log(`✏️  Llenando ${element.inputId}: "${answer}"`);
            await inputElement.click();
            await inputElement.fill(answer);
            await frame.waitForTimeout(300);
            answersProvided++;
            console.log(`   ✅ Campo llenado exitosamente`);
            
          } catch (e) {
            console.log(`   ❌ Error llenando campo`);
          }
        }
        
      } catch (e) {
        // Continue to next question
      }
    }
    
    console.log(`✅ Respuestas proporcionadas: ${answersProvided}`);
    return answersProvided > 0;
  }

  hasQuestions(): boolean {
    return Object.keys(this.questionMap).length > 0;
  }

  getQuestionCount(): number {
    return Object.keys(this.questionMap).length;
  }
} 