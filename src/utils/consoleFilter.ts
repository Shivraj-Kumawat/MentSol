/**
 * Console Filter Utility
 * Reduces noise in development by throttling repeated messages and filtering known issues
 */

type LogLevel = 'log' | 'warn' | 'error' | 'info';

interface FilterOptions {
  throttleMs?: number;
  ignorePatterns?: RegExp[];
  enableInProduction?: boolean;
}

class ConsoleFilter {
  private originalConsole: Record<LogLevel, (...args: any[]) => void> = {
    log: console.log.bind(console),
    warn: console.warn.bind(console),
    error: console.error.bind(console),
    info: console.info.bind(console),
  };

  private seenMessages = new Map<string, number>();
  private options: Required<FilterOptions>;

  constructor(options: FilterOptions = {}) {
    this.options = {
      throttleMs: options.throttleMs ?? 2000,
      ignorePatterns: options.ignorePatterns ?? this.getDefaultIgnorePatterns(),
      enableInProduction: options.enableInProduction ?? false,
    };
  }

  private getDefaultIgnorePatterns(): RegExp[] {
    return [
      // Browser feature warnings
      /Unrecognized feature:/i,
      /vr/i,
      /ambient-light-sensor/i,
      /battery/i,
      
      // Known iframe warnings
      /An iframe which has both allow-scripts and allow-same-origin/i,
      
      // Network errors that are non-critical
      /Failed to load resource: net::ERR_CONNECTION_TIMED_OUT/i,
      
      // React Router future flag warnings (will be resolved with v7 upgrade)
      /React Router Future Flag Warning/i,
      /v7_startTransition/i,
      /v7_relativeSplatPath/i,
      
      // Add custom patterns here
      // /your-custom-pattern/i,
    ];
  }

  private shouldIgnore(message: any): boolean {
    try {
      const messageStr = typeof message === 'string' ? message : JSON.stringify(message);
      return this.options.ignorePatterns.some(pattern => pattern.test(messageStr));
    } catch {
      return false;
    }
  }

  private shouldThrottle(key: string): boolean {
    const now = Date.now();
    const lastSeen = this.seenMessages.get(key);

    if (!lastSeen || now - lastSeen >= this.options.throttleMs) {
      this.seenMessages.set(key, now);
      return false;
    }

    return true;
  }

  private createFilteredLogger(level: LogLevel) {
    return (...args: any[]) => {
      // Check if any argument should be ignored
      if (args.some(arg => this.shouldIgnore(arg))) {
        return;
      }

      // Create a key for throttling (first 2 args)
      const key = `${level}:${JSON.stringify(args.slice(0, 2))}`;

      // Throttle repeated identical messages
      if (this.shouldThrottle(key)) {
        return;
      }

      // Call original console method
      this.originalConsole[level](...args);
    };
  }

  public install(): void {
    // Don't install in production unless explicitly enabled
    if (import.meta.env.PROD && !this.options.enableInProduction) {
      return;
    }

    console.log('🔧 [ConsoleFilter] Installing console filters');

    // Override console methods
    console.log = this.createFilteredLogger('log');
    console.warn = this.createFilteredLogger('warn');
    console.error = this.createFilteredLogger('error');
    console.info = this.createFilteredLogger('info');
  }

  public uninstall(): void {
    console.log('🔧 [ConsoleFilter] Uninstalling console filters');
    
    // Restore original console methods
    console.log = this.originalConsole.log;
    console.warn = this.originalConsole.warn;
    console.error = this.originalConsole.error;
    console.info = this.originalConsole.info;
  }

  public addIgnorePattern(pattern: RegExp): void {
    this.options.ignorePatterns.push(pattern);
  }

  public clearThrottleCache(): void {
    this.seenMessages.clear();
  }
}

// Create and export a singleton instance
export const consoleFilter = new ConsoleFilter({
  throttleMs: 2000,
  enableInProduction: false,
});

// Auto-install in development
if (import.meta.env.DEV) {
  consoleFilter.install();
}

export default consoleFilter;
