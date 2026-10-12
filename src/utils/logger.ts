/**
 * Production-safe logging utility
 * Only logs errors and warnings in production
 * Full logging in development
 */

const isDevelopment = import.meta.env.DEV;

export const logger = {
  info: (message: string, ...args: any[]) => {
    if (isDevelopment) {
      console.log(`ℹ️ ${message}`, ...args);
    }
  },

  warn: (message: string, ...args: any[]) => {
    console.warn(`⚠️  ${message}`, ...args);
  },

  error: (message: string, error?: any, ...args: any[]) => {
    console.error(`❌ ${message}`, error, ...args);
  },

  success: (message: string, ...args: any[]) => {
    if (isDevelopment) {
      console.log(`✅ ${message}`, ...args);
    }
  },

  debug: (message: string, ...args: any[]) => {
    if (isDevelopment) {
      console.debug(`🔍 ${message}`, ...args);
    }
  },
};
