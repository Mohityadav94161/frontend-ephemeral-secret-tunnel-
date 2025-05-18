/**
 * Logger utility that conditionally logs based on environment
 * In production, only errors and warnings are shown
 * In development, all logs are shown
 */

const isProduction = import.meta.env.MODE === 'production';

// Define a more specific type for arguments
type LogArgs = unknown[];

const logger = {
  // Error logs - always shown
  error: (...args: LogArgs) => {
    console.error(...args);
  },
  
  // Warning logs - always shown
  warn: (...args: LogArgs) => {
    console.warn(...args);
  },
  
  // Info logs - hidden in production
  info: (...args: LogArgs) => {
    if (!isProduction) {
      console.info(...args);
    }
  },
  
  // Debug logs - hidden in production
  debug: (...args: LogArgs) => {
    if (!isProduction) {
      console.debug(...args);
    }
  },
  
  // Standard logs - hidden in production
  log: (...args: LogArgs) => {
    if (!isProduction) {
      console.log(...args);
    }
  }
};

export default logger; 