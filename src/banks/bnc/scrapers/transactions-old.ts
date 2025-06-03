/**
 * BNC Transactions Scraper with Playwright
 * 
 * This module provides transaction scraping functionality for BNC online banking
 * using Playwright browser automation.
 */

import { Page } from 'playwright';
import type { BncTransaction, BncAccount } from '../types';
import { BNC_URLS, BNC_SELECTORS, BncAccountType } from '../types';
import { writeFileSync, appendFileSync } from 'fs';

export interface BncTransactionScrapingResult {
  success: boolean;
  message: string;
  transactions: BncTransaction[];
  accountsScraped: string[];
  errors?: string[];
}

export class BncTransactionsScraper {
  private page: Page;
  private logFile: string;
  private debug: boolean;

  constructor(page: Page, debug: boolean = false) {
    this.page = page;
    this.debug = debug;
    
    // Setup log file
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    this.logFile = `bnc-transactions-${timestamp}.log`;
    
    this.log('🏦 BNC Transactions Scraper initialized');
  }

  /**
   * Log message to console and file
   */
  private log(message: string): void {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${message}`;
    
    console.log(message);
    
    try {
      appendFileSync(this.logFile, logEntry + '\n');
    } catch (error) {
      console.warn('Failed to write to log file:', error);
    }
  }

  /**
   * Pause execution for debugging
   */
  private async debugPause(message: string): Promise<void> {
    if (this.debug) {
      this.log(`🐛 DEBUG PAUSE: ${message}`);
      this.log('💡 Use Playwright Inspector to debug. Continue execution when ready.');
      await this.page.pause();
    }
  }

  /**
   * Wait for element to be ready
   */
  private async waitForElementReady(selector: string, timeout: number = 10000): Promise<boolean> {
    try {
      await this.page.waitForSelector(selector, { timeout });
      
      await this.page.waitForFunction(
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
   * Get last 25 transactions from all accounts
   */
  async getLast25Transactions(): Promise<BncTransactionScrapingResult> {
    this.log('🚀 Starting BNC transactions scraping...');
    
    const allTransactions: BncTransaction[] = [];
    const accountsScraped: string[] = [];
    const errors: string[] = [];

    try {
      // Navigate to transactions page
      this.log('🌐 Navigating to transactions page...');
      await this.page.goto(BNC_URLS.TRANSACTIONS, {
        waitUntil: 'networkidle',
        timeout: 30000
      });

      await this.debugPause('Transactions page loaded - ready to scrape accounts');

      // Iterate through all 3 account types
      const accountTypes = [
        { index: 1, name: BncAccountType.VES_1109 },
        { index: 2, name: BncAccountType.USD_0816 },
        { index: 3, name: BncAccountType.USD_0801 }
      ];

      for (const account of accountTypes) {
        try {
          this.log(`💰 Processing account: ${account.name} (index: ${account.index})`);
          
          const accountTransactions = await this.scrapeAccountTransactions(account.index, account.name);
          
          if (accountTransactions.length > 0) {
            allTransactions.push(...accountTransactions);
            accountsScraped.push(account.name);
            this.log(`✅ Successfully scraped ${accountTransactions.length} transactions from ${account.name}`);
          } else {
            this.log(`⚠️  No transactions found for ${account.name}`);
          }

          // Wait between accounts to avoid rate limiting
          await this.page.waitForTimeout(1000);

        } catch (error: any) {
          const errorMessage = `Failed to scrape ${account.name}: ${error.message}`;
          this.log(`❌ ${errorMessage}`);
          errors.push(errorMessage);
          
          // Continue with next account
          continue;
        }
      }

      await this.debugPause(`All accounts processed - found ${allTransactions.length} total transactions`);

      this.log(`🎉 Scraping completed: ${allTransactions.length} transactions from ${accountsScraped.length} accounts`);

      return {
        success: true,
        message: `Successfully scraped ${allTransactions.length} transactions from ${accountsScraped.length} accounts`,
        transactions: allTransactions,
        accountsScraped,
        errors: errors.length > 0 ? errors : undefined
      };

    } catch (error: any) {
      this.log(`💥 Fatal error during scraping: ${error.message}`);
      
      return {
        success: false,
        message: `Scraping failed: ${error.message}`,
        transactions: allTransactions,
        accountsScraped,
        errors: [error.message, ...errors]
      };
    }
  }

  /**
   * Scrape transactions for a specific account
   */
  private async scrapeAccountTransactions(accountIndex: number, accountName: string): Promise<BncTransaction[]> {
    this.log(`🔍 Scraping transactions for ${accountName}...`);

    try {
      // Navigate to transactions page (refresh to ensure clean state)
      await this.page.goto(BNC_URLS.TRANSACTIONS, {
        waitUntil: 'networkidle',
        timeout: 30000
      });

      // Click on the filter button to open account selector
      this.log('🔘 Opening account filter...');
      const filterReady = await this.waitForElementReady(BNC_SELECTORS.FILTER_BUTTON);
      if (!filterReady) {
        throw new Error('Filter button not ready');
      }

      await this.page.click(BNC_SELECTORS.FILTER_BUTTON);
      
      // Wait for dropdown to be visible
      await this.page.waitForTimeout(1000);

      // Select the specific account
      this.log(`🎯 Selecting account: ${accountName} (index: ${accountIndex})`);
      const accountSelector = `#bs-select-1-${accountIndex}`;
      
      await this.page.waitForSelector(accountSelector, { timeout: 10000 });
      await this.page.click(accountSelector);

      // Click search button to load transactions
      this.log('🔍 Loading transactions...');
      const searchReady = await this.waitForElementReady(BNC_SELECTORS.SEARCH_BUTTON);
      if (!searchReady) {
        throw new Error('Search button not ready');
      }

      await this.page.click(BNC_SELECTORS.SEARCH_BUTTON);

      // Wait for transactions to load
      await this.page.waitForTimeout(2500);

      // Check if transactions are available
      try {
        await this.page.waitForSelector(BNC_SELECTORS.DROPDOWN_ICON, { timeout: 5000 });
      } catch (error) {
        this.log(`⚠️  No transactions found for ${accountName}`);
        return [];
      }

      // Expand all transaction details by clicking dropdown icons
      this.log('📋 Expanding transaction details...');
      await this.expandAllTransactionDetails();

      // Wait for all details to load
      await this.page.waitForTimeout(1000);

      // Extract transaction data
      this.log('📊 Extracting transaction data...');
      const transactions = await this.extractTransactionData(accountName);

      this.log(`✅ Extracted ${transactions.length} transactions for ${accountName}`);
      return transactions;

    } catch (error: any) {
      this.log(`❌ Error scraping ${accountName}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Expand all transaction details
   */
  private async expandAllTransactionDetails(): Promise<void> {
    try {
      const dropdownIcons = await this.page.$$(BNC_SELECTORS.DROPDOWN_ICON);
      
      if (dropdownIcons.length === 0) {
        this.log('⚠️  No dropdown icons found');
        return;
      }

      this.log(`🔽 Expanding ${dropdownIcons.length} transaction details...`);

      // Click all dropdown icons to expand details
      for (const icon of dropdownIcons) {
        try {
          await icon.click();
          await this.page.waitForTimeout(200); // Small delay between clicks
        } catch (error) {
          // Continue with other icons if one fails
        }
      }

      // Wait for all expanded content to load
      await this.page.waitForTimeout(1000);

    } catch (error) {
      this.log(`⚠️  Error expanding transaction details: ${error}`);
      // Continue with extraction even if expansion fails
    }
  }

  /**
   * Extract transaction data from the page
   */
  private async extractTransactionData(accountName: string): Promise<BncTransaction[]> {
    try {
      // Extract all transaction fields
      const dates = await this.page.$$eval(
        BNC_SELECTORS.TRANSACTION_DATE,
        elements => elements.map(el => el.textContent?.split('\n').join(' ') || '')
      );

      const types = await this.page.$$eval(
        BNC_SELECTORS.TRANSACTION_TYPE,
        elements => elements.map(el => el.textContent || '')
      );

      const references = await this.page.$$eval(
        BNC_SELECTORS.TRANSACTION_REFERENCE,
        elements => elements.map(el => el.textContent || '')
      );

      const amounts = await this.page.$$eval(
        BNC_SELECTORS.TRANSACTION_AMOUNT,
        elements => elements.map(el => el.textContent || '')
      );

      const descriptions = await this.page.$$eval(
        BNC_SELECTORS.TRANSACTION_DESCRIPTION,
        elements => elements.map(el => el.textContent || '')
      );

      // Build transaction objects
      const transactions: BncTransaction[] = [];

      for (let i = 0; i < dates.length; i++) {
        const transaction: BncTransaction = {
          id: `${accountName}-${references[i] || i}`,
          bankName: 'BNC',
          date: this.parseDate(dates[i] || ''),
          amount: this.parseAmount(amounts[i] || '0'),
          description: (descriptions[i] || types[i] || 'Transacción').trim(),
          type: this.determineTransactionType(amounts[i] || '0'),
          reference: references[i] || '',
          transactionType: types[i] || '',
          referenceNumber: references[i] || '',
          balance: 0, // BNC doesn't provide balance in transaction list
          category: 'Uncategorized'
        };

        transactions.push(transaction);
      }

      return transactions;

    } catch (error: any) {
      this.log(`❌ Error extracting transaction data: ${error.message}`);
      throw error;
    }
  }

  /**
   * Parse date string to ISO string format
   */
  private parseDate(dateString: string): string {
    try {
      // BNC date format is typically "DD/MM/YYYY" or "DD-MM-YYYY"
      const cleanDate = dateString.trim().replace(/\s+/g, ' ');
      const dateParts = cleanDate.split(/[\/\-\s]/);
      
      if (dateParts.length >= 3) {
        const day = parseInt(dateParts[0]);
        const month = parseInt(dateParts[1]) - 1; // JS months are 0-indexed
        const year = parseInt(dateParts[2]);
        
        const parsedDate = new Date(year, month, day);
        return parsedDate.toISOString().split('T')[0]; // Return YYYY-MM-DD format
      }
      
      // Fallback to current date if parsing fails
      return new Date().toISOString().split('T')[0];
    } catch (error) {
      this.log(`⚠️  Failed to parse date: ${dateString}`);
      return new Date().toISOString().split('T')[0];
    }
  }

  /**
   * Parse amount string to number
   */
  private parseAmount(amountString: string): number {
    try {
      // Remove currency symbols and format
      const cleanAmount = amountString
        .replace(/[Bs\.S\$\,\s]/g, '')
        .replace(',', '.');
      
      const amount = parseFloat(cleanAmount);
      return isNaN(amount) ? 0 : Math.abs(amount);
    } catch (error) {
      this.log(`⚠️  Failed to parse amount: ${amountString}`);
      return 0;
    }
  }

  /**
   * Determine transaction type (debit/credit) from amount
   */
  private determineTransactionType(amountString: string): 'debit' | 'credit' {
    // If amount contains minus sign or is in parentheses, it's a debit
    if (amountString.includes('-') || amountString.includes('(')) {
      return 'debit';
    }
    return 'credit';
  }

  /**
   * Determine currency from account name
   */
  private determineCurrency(accountName: string): string {
    if (accountName.includes('USD')) {
      return 'USD';
    }
    return 'VES'; // Default to Venezuelan Bolívars
  }

  /**
   * Export transactions to JSON file
   */
  exportTransactions(transactions: BncTransaction[], filename?: string): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const exportFilename = filename || `bnc-transactions-${timestamp}.json`;
    
    try {
      writeFileSync(exportFilename, JSON.stringify(transactions, null, 2));
      this.log(`📤 Transactions exported to: ${exportFilename}`);
      return exportFilename;
    } catch (error) {
      this.log(`❌ Failed to export transactions: ${error}`);
      throw error;
    }
  }

  /**
   * Get log file path
   */
  getLogFile(): string {
    return this.logFile;
  }
} 