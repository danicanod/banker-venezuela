/**
 * Performance Configuration for Banking Scrapers
 * 
 * This file contains optimized performance configurations for different
 * banking scenarios to maximize speed while maintaining functionality.
 */

export interface PerformanceConfig {
  blockCSS?: boolean;
  blockImages?: boolean; 
  blockFonts?: boolean;
  blockMedia?: boolean;
  blockNonEssentialJS?: boolean;
  blockAds?: boolean;
  blockAnalytics?: boolean;
}

/**
 * Performance presets for different banking scenarios
 */
export const PERFORMANCE_PRESETS = {
  /**
   * Maximum performance - blocks everything possible
   * Use for: Login/authentication flows where only forms are needed
   */
  MAXIMUM: {
    blockCSS: true,
    blockImages: true,
    blockFonts: true,
    blockMedia: true,
    blockNonEssentialJS: true,
    blockAds: true,
    blockAnalytics: true
  } as PerformanceConfig,

  /**
   * Aggressive performance - blocks most resources but keeps essential JS
   * Use for: Transaction scraping where some JS might be needed for tables
   */
  AGGRESSIVE: {
    blockCSS: true,
    blockImages: true,
    blockFonts: true,
    blockMedia: true,
    blockNonEssentialJS: false, // Keep JS for dynamic content
    blockAds: true,
    blockAnalytics: true
  } as PerformanceConfig,

  /**
   * Balanced performance - blocks obvious non-essentials
   * Use for: Complex pages where visual feedback might be helpful
   */
  BALANCED: {
    blockCSS: false,    // Keep CSS for visual feedback in debug
    blockImages: true,
    blockFonts: true,
    blockMedia: true,
    blockNonEssentialJS: false,
    blockAds: true,
    blockAnalytics: true
  } as PerformanceConfig,

  /**
   * Conservative performance - only blocks obvious non-essentials
   * Use for: Debugging or when experiencing issues with aggressive blocking
   */
  CONSERVATIVE: {
    blockCSS: false,
    blockImages: false,
    blockFonts: false,
    blockMedia: true,
    blockNonEssentialJS: false,
    blockAds: true,
    blockAnalytics: true
  } as PerformanceConfig,

  /**
   * No performance optimizations - for debugging only
   */
  NONE: {
    blockCSS: false,
    blockImages: false,
    blockFonts: false,
    blockMedia: false,
    blockNonEssentialJS: false,
    blockAds: false,
    blockAnalytics: false
  } as PerformanceConfig
};

/**
 * Bank-specific performance configurations
 * Based on testing and known requirements for each bank
 */
export const BANK_PERFORMANCE_CONFIGS = {
  /**
   * BNC Bank optimized configuration
   * BNC works well with aggressive blocking since forms are simple
   */
  BNC: {
    auth: PERFORMANCE_PRESETS.MAXIMUM,      // Login is just forms
    scraping: PERFORMANCE_PRESETS.AGGRESSIVE // Tables might need some JS
  },

  /**
   * Banesco Bank optimized configuration  
   * Banesco has complex iframes and might need more JS
   */
  BANESCO: {
    auth: PERFORMANCE_PRESETS.AGGRESSIVE,   // Security questions need some JS
    scraping: PERFORMANCE_PRESETS.BALANCED  // Complex table structures
  }
};

/**
 * Get optimized performance config for a specific bank and operation
 */
export function getBankPerformanceConfig(
  bankName: string, 
  operation: 'auth' | 'scraping',
  preset?: keyof typeof PERFORMANCE_PRESETS
): PerformanceConfig {
  
  // If specific preset requested, use it
  if (preset && PERFORMANCE_PRESETS[preset]) {
    return { ...PERFORMANCE_PRESETS[preset] };
  }
  
  // Bank-specific optimized configs
  const bankUpper = bankName.toUpperCase();
  if (BANK_PERFORMANCE_CONFIGS[bankUpper as keyof typeof BANK_PERFORMANCE_CONFIGS]) {
    const bankConfig = BANK_PERFORMANCE_CONFIGS[bankUpper as keyof typeof BANK_PERFORMANCE_CONFIGS];
    return { ...bankConfig[operation] };
  }
  
  // Fallback to balanced for unknown banks
  return { ...PERFORMANCE_PRESETS.BALANCED };
}

/**
 * Domains to always block (ads, analytics, trackers)
 * Comprehensive list of known tracking and advertising domains
 */
export const BLOCKED_DOMAINS = [
  // Google Analytics & Tag Manager
  'google-analytics.com',
  'googletagmanager.com',
  'analytics.google.com',
  'stats.wp.com',
  
  // Social Media Trackers
  'facebook.com',
  'connect.facebook.net',
  'twitter.com',
  'platform.twitter.com',
  'linkedin.com',
  'platform.linkedin.com',
  
  // Advertising Networks
  'doubleclick.net',
  'googlesyndication.com',
  'amazon-adsystem.com',
  'adsystem.amazon.com',
  'ads.yahoo.com',
  'adsrvr.org',
  'turn.com',
  'mathtag.com',
  'exelator.com',
  'mediamath.com',
  'rlcdn.com',
  'amazon.com/gp/aw/cr',
  'amazon.com/dp/aws',
  
  // Analytics & Tracking
  'quantserve.com',
  'scorecardresearch.com',
  'zedo.com',
  'hotjar.com',
  'fullstory.com',
  'loggly.com',
  'mixpanel.com',
  'segment.com',
  'amplitude.com',
  
  // CDNs often used for tracking
  'cdn.mxpnl.com',
  'api.mixpanel.com',
  'in.getclicky.com',
  'static.getclicky.com',
  
  // Other common trackers
  'newrelic.com',
  'nr-data.net',
  'optimizely.com',
  'crazyegg.com',
  'mouseflow.com'
];

/**
 * Essential JavaScript patterns that should never be blocked
 * These are critical for banking functionality
 */
export const ESSENTIAL_JS_PATTERNS = [
  // Common libraries
  'jquery',
  'bootstrap', 
  'angular',
  'react',
  'vue',
  'lodash',
  'moment',
  'axios',
  'fetch',
  
  // Banking-specific patterns
  'banking',
  'auth',
  'login',
  'security',
  'transaction',
  'account',
  'session',
  'csrf',
  'token',
  'validate',
  'form',
  
  // Venezuelan banks specific
  'banesco',
  'bnc',
  'banco',
  'venezuela'
];

/**
 * Get list of domains to block based on configuration
 */
export function getBlockedDomains(config: PerformanceConfig): string[] {
  if (!config.blockAds && !config.blockAnalytics) {
    return [];
  }
  
  return BLOCKED_DOMAINS.filter(domain => {
    // Block analytics domains
    if (config.blockAnalytics && (
      domain.includes('analytics') ||
      domain.includes('tracking') ||
      domain.includes('stats')
    )) {
      return true;
    }
    
    // Block advertising domains
    if (config.blockAds && (
      domain.includes('ads') ||
      domain.includes('doubleclick') ||
      domain.includes('adsystem')
    )) {
      return true;
    }
    
    // Block all domains if both ads and analytics blocking enabled
    return config.blockAds && config.blockAnalytics;
  });
}

/**
 * Check if a JavaScript URL contains essential patterns
 */
export function isEssentialJS(url: string, bankName: string): boolean {
  const urlLower = url.toLowerCase();
  const bankLower = bankName.toLowerCase();
  
  // Always allow same-domain JS
  try {
    const urlObj = new URL(url);
    if (urlObj.hostname.includes(bankLower)) {
      return true;
    }
  } catch (e) {
    // Invalid URL, check patterns
  }
  
  // Check essential patterns
  return ESSENTIAL_JS_PATTERNS.some(pattern => 
    urlLower.includes(pattern) || urlLower.includes(bankLower)
  );
} 