/**
 * Banesco Security Questions Handler
 * 
 * This module handles the processing and answering of security questions
 * during Banesco authentication using Playwright.
 */

import { Frame } from 'playwright';
import type { SecurityQuestion } from './types';

export class SecurityQuestionsHandler {
  private questionMap: Map<string, string> = new Map();
  private logCallback?: (message: string) => void;

  constructor(securityQuestionsConfig?: string, logCallback?: (message: string) => void) {
    this.logCallback = logCallback;
    
    if (securityQuestionsConfig) {
      this.parseSecurityQuestions(securityQuestionsConfig);
    }
  }

  /**
   * Log message using callback or console
   */
  private log(message: string): void {
    if (this.logCallback) {
      this.logCallback(message);
    } else {
      console.log(message);
    }
  }

  /**
   * Parse security questions configuration string
   * Format: "keyword1:answer1,keyword2:answer2,keyword3:answer3"
   */
  private parseSecurityQuestions(config: string): void {
    if (!config || config.trim() === '') {
      this.log('⚠️  No security questions configuration provided');
      return;
    }

    const pairs = config.split(',');
    
    for (const pair of pairs) {
      const [keyword, answer] = pair.split(':');
      if (keyword && answer) {
        const normalizedKeyword = this.normalizeText(keyword.trim());
        const cleanAnswer = answer.trim();
        
        this.questionMap.set(normalizedKeyword, cleanAnswer);
        this.log(`🔑 Security question mapped: "${keyword.trim()}" → "${cleanAnswer}"`);
      }
    }
  }

  /**
   * Normalize text by removing accents, punctuation, and converting to lowercase
   */
  private normalizeText(text: string): string {
    return text.toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove accents
      .replace(/[¿?¡!.,;]/g, '') // Remove punctuation
      .trim();
  }

  /**
   * Find matching answer for a given question text
   */
  private findMatchingAnswer(questionText: string): string | null {
    const normalizedQuestion = this.normalizeText(questionText);
    
    this.log(`🔍 Searching answer for normalized question: "${normalizedQuestion}"`);
    
    for (const [keyword, answer] of Array.from(this.questionMap.entries())) {
      this.log(`   🔎 Checking keyword: "${keyword}"`);
      if (normalizedQuestion.includes(keyword)) {
        this.log(`✅ Security question match found: "${keyword}" in "${questionText}"`);
        return answer;
      }
    }
    
    this.log(`❓ No match found for question: "${questionText}"`);
    this.log(`💡 Available keywords: ${Array.from(this.questionMap.keys()).join(', ')}`);
    return null;
  }

  /**
   * Wait for element to be ready for interaction
   */
  private async waitForElementReady(frame: Frame, selector: string, timeout: number = 10000): Promise<boolean> {
    try {
      // Wait for element to exist
      await frame.waitForSelector(selector, { timeout });
      
      // Wait for element to be visible and enabled
      await frame.waitForFunction(
        (sel) => {
          const element = document.querySelector(sel) as HTMLElement;
          return element && 
                 element.offsetParent !== null && // visible
                 !element.hasAttribute('disabled'); // enabled
        },
        selector,
        { timeout }
      );
      
      return true;
    } catch (error) {
      this.log(`⚠️  Element not ready: ${selector} - ${error}`);
      return false;
    }
  }

  /**
   * Diagnose security questions page state
   */
  private async diagnoseSecurityQuestionsPage(frame: Frame): Promise<void> {
    this.log('🔬 Diagnosing security questions page...');
    
    try {
      // Check for common security question elements
      const potentialElements = [
        '#lblPrimeraP', '#txtPrimeraR',
        '#lblSegundaP', '#txtSegundaR', 
        '#lblTerceraP', '#txtTerceraR',
        '#lblCuartaP', '#txtCuartaR',
        '[id*="pregunta"]', '[id*="Pregunta"]',
        '[id*="respuesta"]', '[id*="Respuesta"]',
        '.security-question', '.pregunta-seguridad'
      ];
      
      for (const selector of potentialElements) {
        try {
          const element = await frame.$(selector);
          if (element) {
            const isVisible = await element.isVisible();
            const isEnabled = await element.isEnabled();
            const text = await element.textContent() || '';
            
            this.log(`🔍 Found element ${selector}: visible=${isVisible}, enabled=${isEnabled}, text="${text.substring(0, 50)}..."`);
          }
        } catch (e) {
          // Element doesn't exist, continue
        }
      }
      
      // Check page title and URL
      const title = await frame.title().catch(() => 'Unknown');
      this.log(`📄 Page title: "${title}"`);
      
      // Check for any forms
      const forms = await frame.$$('form');
      this.log(`📝 Found ${forms.length} form(s) on page`);
      
      // Check for submit buttons
      const submitButtons = await frame.$$('[type="submit"], [id*="btn"], [class*="btn"]');
      this.log(`🔘 Found ${submitButtons.length} potential button(s)`);
      
      for (let i = 0; i < Math.min(submitButtons.length, 5); i++) {
        try {
          const button = submitButtons[i];
          const buttonText = await button.textContent() || '';
          const buttonId = await button.getAttribute('id') || '';
          const buttonClass = await button.getAttribute('class') || '';
          
          this.log(`   🔘 Button ${i+1}: id="${buttonId}", class="${buttonClass}", text="${buttonText}"`);
        } catch (e) {
          // Skip this button
        }
      }
      
    } catch (error) {
      this.log(`❌ Error during diagnosis: ${error}`);
    }
  }

  /**
   * Handle security questions in the Banesco login iframe
   */
  async handleSecurityQuestions(frame: Frame): Promise<boolean> {
    this.log('🔐 Processing security questions...');
    
    if (this.questionMap.size === 0) {
      this.log('❌ No security questions configured');
      return false;
    }
    
    this.log(`🗂️  ${this.questionMap.size} security question mappings loaded`);
    this.log(`📋 Available keywords: ${Array.from(this.questionMap.keys()).join(', ')}`);
    
    // Diagnose page state first
    await this.diagnoseSecurityQuestionsPage(frame);
    
    // Known Banesco security question elements
    const questionElements = [
      { labelId: 'lblPrimeraP', inputId: 'txtPrimeraR' },
      { labelId: 'lblSegundaP', inputId: 'txtSegundaR' },
      { labelId: 'lblTerceraP', inputId: 'txtTerceraR' },
      { labelId: 'lblCuartaP', inputId: 'txtCuartaR' }
    ];
    
    let answersProvided = 0;
    let questionsFound = 0;
    
    for (const element of questionElements) {
      try {
        this.log(`🔍 Checking security question element: ${element.labelId}`);
        
        // Quick check first - no timeout
        const labelElement = await frame.$(`#${element.labelId}`);
        if (!labelElement) {
          this.log(`   ⏭️  Question ${element.labelId} not found, skipping`);
          continue;
        }
        
        // Check if visible immediately
        const isVisible = await labelElement.isVisible();
        if (!isVisible) {
          this.log(`   ⏭️  Question ${element.labelId} not visible, skipping`);
          continue;
        }
        
        // Get question text
        const questionText = await labelElement.textContent() || '';
        if (!questionText.trim()) {
          this.log(`   ⚠️  Question ${element.labelId} has no text content`);
          continue;
        }
        
        questionsFound++;
        this.log(`📋 Security question ${questionsFound}: "${questionText}"`);
        
        // Find answer for this question
        const answer = this.findMatchingAnswer(questionText);
        
        if (!answer) {
          this.log(`   ❓ No answer found for this question`);
          continue;
        }
        
        this.log(`🎯 Found answer: "${answer}"`);
        
        // Quick check for input field - no timeout
        const inputElement = await frame.$(`#${element.inputId}`);
        if (!inputElement) {
          this.log(`   ❌ Input element ${element.inputId} not found`);
          continue;
        }
        
        // Check if input is visible and enabled immediately
        const inputVisible = await inputElement.isVisible();
        const inputEnabled = await inputElement.isEnabled();
        
        if (!inputVisible || !inputEnabled) {
          this.log(`   ❌ Input field ${element.inputId} not ready (visible: ${inputVisible}, enabled: ${inputEnabled})`);
          continue;
        }
        
        // Fill the security question answer
        try {
          this.log(`✏️  Filling ${element.inputId} with answer...`);
          
          // Clear field first
          await inputElement.click();
          await inputElement.selectText();
          await inputElement.fill('');
          
          // Fill with answer
          await inputElement.fill(answer);
          
          // Verify the answer was entered
          const fieldValue = await inputElement.inputValue();
          if (fieldValue === answer) {
            answersProvided++;
            this.log(`   ✅ Security question answered successfully (${answersProvided}/${questionsFound})`);
          } else {
            this.log(`   ⚠️  Answer may not have been entered correctly. Expected: "${answer}", Got: "${fieldValue}"`);
          }
          
          // Brief pause before next question
          await frame.waitForTimeout(300);
          
        } catch (fillError) {
          this.log(`   ❌ Error filling security question field: ${fillError}`);
        }
        
      } catch (questionError) {
        this.log(`⚠️  Error processing security question ${element.labelId}: ${questionError}`);
        // Continue to next question
      }
    }
    
    this.log(`📊 Security questions summary:`);
    this.log(`   🔍 Questions found: ${questionsFound}`);
    this.log(`   ✅ Answers provided: ${answersProvided}`);
    this.log(`   📋 Available mappings: ${this.questionMap.size}`);
    
    if (questionsFound === 0) {
      this.log(`❌ No security questions found on page - check page state`);
      return false;
    }
    
    if (answersProvided === 0) {
      this.log(`❌ No answers were provided - check question matching`);
      return false;
    }
    
    if (answersProvided < questionsFound) {
      this.log(`⚠️  Only ${answersProvided}/${questionsFound} questions answered - some answers may be missing`);
      
      // If we have some answers but not all, still try to continue
      if (answersProvided > 0) {
        this.log(`💡 Proceeding with ${answersProvided} answered questions`);
        return true;
      }
    }
    
    return answersProvided > 0;
  }

  /**
   * Check if security questions are configured
   */
  hasQuestions(): boolean {
    return this.questionMap.size > 0;
  }

  /**
   * Get the number of configured security questions
   */
  getQuestionCount(): number {
    return this.questionMap.size;
  }

  /**
   * Get all configured security questions (for debugging)
   */
  getConfiguredQuestions(): SecurityQuestion[] {
    return Array.from(this.questionMap.entries()).map(([keyword, answer]) => ({
      question: keyword,
      answer: answer,
      fieldName: 'unknown'
    }));
  }
} 