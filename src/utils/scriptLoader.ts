/**
 * Safely load external scripts with timeout and error handling
 * 
 * @param src - The script source URL
 * @param timeout - Timeout in milliseconds (default: 2500ms)
 * @returns Promise that resolves when script loads or rejects on error/timeout
 * 
 * @example
 * ```ts
 * try {
 *   await safeLoadScript('https://cdn.example.com/library.js');
 *   console.log('Script loaded successfully');
 * } catch (error) {
 *   console.error('Failed to load script:', error);
 * }
 * ```
 */
export function safeLoadScript(src: string, timeout: number = 2500): Promise<void> {
  return new Promise((resolve, reject) => {
    // Check if script is already loaded
    const existingScript = document.querySelector(`script[src="${src}"]`);
    if (existingScript) {
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    
    let timeoutId: number;
    let resolved = false;

    const cleanup = () => {
      if (timeoutId) clearTimeout(timeoutId);
      script.onload = null;
      script.onerror = null;
    };

    script.onload = () => {
      if (!resolved) {
        resolved = true;
        cleanup();
        resolve();
      }
    };

    script.onerror = (error) => {
      if (!resolved) {
        resolved = true;
        cleanup();
        document.head.removeChild(script);
        reject(new Error(`Failed to load script: ${src}`));
      }
    };

    // Set timeout
    timeoutId = window.setTimeout(() => {
      if (!resolved) {
        resolved = true;
        cleanup();
        document.head.removeChild(script);
        reject(new Error(`Script load timeout: ${src}`));
      }
    }, timeout);

    document.head.appendChild(script);
  });
}

/**
 * Load multiple scripts in parallel with timeout handling
 * 
 * @param scripts - Array of script URLs
 * @param timeout - Timeout in milliseconds for each script
 * @returns Promise that resolves when all scripts load
 * 
 * @example
 * ```ts
 * await safeLoadScripts([
 *   'https://cdn.example.com/library1.js',
 *   'https://cdn.example.com/library2.js'
 * ]);
 * ```
 */
export async function safeLoadScripts(scripts: string[], timeout: number = 2500): Promise<void> {
  await Promise.all(scripts.map(src => safeLoadScript(src, timeout)));
}

/**
 * Load scripts in sequence (one after another)
 * Useful when scripts have dependencies on each other
 * 
 * @param scripts - Array of script URLs
 * @param timeout - Timeout in milliseconds for each script
 * @returns Promise that resolves when all scripts load in order
 * 
 * @example
 * ```ts
 * await safeLoadScriptsSequentially([
 *   'https://cdn.example.com/jquery.js',
 *   'https://cdn.example.com/jquery-plugin.js' // depends on jquery
 * ]);
 * ```
 */
export async function safeLoadScriptsSequentially(scripts: string[], timeout: number = 2500): Promise<void> {
  for (const src of scripts) {
    await safeLoadScript(src, timeout);
  }
}

/**
 * Load a script with retry logic
 * 
 * @param src - The script source URL
 * @param options - Configuration options
 * @returns Promise that resolves when script loads
 * 
 * @example
 * ```ts
 * await safeLoadScriptWithRetry('https://cdn.example.com/library.js', {
 *   retries: 3,
 *   timeout: 3000
 * });
 * ```
 */
export async function safeLoadScriptWithRetry(
  src: string, 
  options: { retries?: number; timeout?: number } = {}
): Promise<void> {
  const { retries = 3, timeout = 2500 } = options;
  let lastError: Error | undefined;

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      await safeLoadScript(src, timeout);
      return;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');
      console.warn(`Script load attempt ${attempt + 1}/${retries} failed for ${src}:`, error);
      
      // Wait before retrying (exponential backoff)
      if (attempt < retries - 1) {
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }
  }

  throw lastError || new Error(`Failed to load script after ${retries} attempts: ${src}`);
}

/**
 * Check if a script is already loaded
 * 
 * @param src - The script source URL
 * @returns true if script exists in DOM
 */
export function isScriptLoaded(src: string): boolean {
  return !!document.querySelector(`script[src="${src}"]`);
}

/**
 * Remove a loaded script from the DOM
 * 
 * @param src - The script source URL
 */
export function removeScript(src: string): void {
  const script = document.querySelector(`script[src="${src}"]`);
  if (script) {
    document.head.removeChild(script);
  }
}
