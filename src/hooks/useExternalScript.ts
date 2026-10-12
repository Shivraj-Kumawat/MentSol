import { useEffect, useState } from 'react';
import { safeLoadScript, isScriptLoaded, removeScript } from '@/utils/scriptLoader';

export type ScriptStatus = 'idle' | 'loading' | 'ready' | 'error';

interface UseExternalScriptOptions {
  /**
   * Timeout in milliseconds for script loading
   * @default 2500
   */
  timeout?: number;
  /**
   * Whether to remove the script when component unmounts
   * @default false
   */
  removeOnUnmount?: boolean;
  /**
   * Whether to load the script immediately
   * @default true
   */
  loadImmediately?: boolean;
}

interface UseExternalScriptReturn {
  status: ScriptStatus;
  error: Error | null;
  load: () => Promise<void>;
}

/**
 * React hook for safely loading external scripts
 * 
 * @param src - The script source URL
 * @param options - Configuration options
 * @returns Object with status, error, and load function
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { status, error } = useExternalScript('https://cdn.example.com/library.js');
 *   
 *   if (status === 'loading') return <div>Loading...</div>;
 *   if (status === 'error') return <div>Error: {error?.message}</div>;
 *   if (status === 'ready') return <div>Script loaded!</div>;
 *   
 *   return null;
 * }
 * ```
 */
export function useExternalScript(
  src: string,
  options: UseExternalScriptOptions = {}
): UseExternalScriptReturn {
  const {
    timeout = 2500,
    removeOnUnmount = false,
    loadImmediately = true,
  } = options;

  const [status, setStatus] = useState<ScriptStatus>(() => {
    if (isScriptLoaded(src)) {
      return 'ready';
    }
    return loadImmediately ? 'loading' : 'idle';
  });
  const [error, setError] = useState<Error | null>(null);

  const load = async () => {
    if (status === 'ready' || status === 'loading') {
      return;
    }

    try {
      setStatus('loading');
      setError(null);
      await safeLoadScript(src, timeout);
      setStatus('ready');
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to load script');
      setError(error);
      setStatus('error');
      console.error('Script loading error:', error);
    }
  };

  useEffect(() => {
    if (loadImmediately && status === 'loading') {
      load();
    }
  }, [src, loadImmediately]);

  useEffect(() => {
    return () => {
      if (removeOnUnmount) {
        removeScript(src);
      }
    };
  }, [src, removeOnUnmount]);

  return { status, error, load };
}

/**
 * React hook for loading multiple external scripts
 * 
 * @param scripts - Array of script URLs
 * @param options - Configuration options
 * @returns Object with status, error, and load function
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { status } = useExternalScripts([
 *     'https://cdn.example.com/library1.js',
 *     'https://cdn.example.com/library2.js'
 *   ]);
 *   
 *   return <div>Status: {status}</div>;
 * }
 * ```
 */
export function useExternalScripts(
  scripts: string[],
  options: UseExternalScriptOptions = {}
): UseExternalScriptReturn {
  const {
    timeout = 2500,
    removeOnUnmount = false,
    loadImmediately = true,
  } = options;

  const [status, setStatus] = useState<ScriptStatus>(() => {
    const allLoaded = scripts.every(isScriptLoaded);
    return allLoaded ? 'ready' : loadImmediately ? 'loading' : 'idle';
  });
  const [error, setError] = useState<Error | null>(null);

  const load = async () => {
    if (status === 'ready' || status === 'loading') {
      return;
    }

    try {
      setStatus('loading');
      setError(null);
      
      // Load all scripts in parallel
      await Promise.all(
        scripts.map(src => safeLoadScript(src, timeout))
      );
      
      setStatus('ready');
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to load scripts');
      setError(error);
      setStatus('error');
      console.error('Scripts loading error:', error);
    }
  };

  useEffect(() => {
    if (loadImmediately && status === 'loading') {
      load();
    }
  }, [scripts.join(','), loadImmediately]);

  useEffect(() => {
    return () => {
      if (removeOnUnmount) {
        scripts.forEach(removeScript);
      }
    };
  }, [scripts.join(','), removeOnUnmount]);

  return { status, error, load };
}
