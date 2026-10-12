// src/AppStabilityHelpers.ts
// 1) Console patch: drop repeated noisy patterns
(function() {
  const origWarn = console.warn.bind(console);
  const IGNORE_RX = [
    /Unrecognized feature: 'vr'/i,
    /Unrecognized feature: 'ambient-light-sensor'/i,
    /Unrecognized feature: 'battery'/i,
    /An iframe which has both allow-scripts and allow-same-origin/i,
    /Failed to load resource: net::ERR_CONNECTION_TIMED_OUT/i,
    /net::ERR_INTERNET_DISCONNECTED/i,
  ];
  console.warn = (...args: any[]) => {
    try {
      const s = args.map(a => typeof a === 'string' ? a : JSON.stringify(a)).join(' ');
      if (IGNORE_RX.some(rx => rx.test(s))) return;
    } catch {}
    origWarn(...args);
  };
})();

export interface SafeFetchResponse<T = any> {
  ok: boolean;
  status: number;
  body: T | null;
}

export interface SafeFetchOptions {
  timeout?: number;
}

// 2) safeFetch (use instead of fetch for unstable endpoints)
export async function safeFetch<T = any>(
  url: string, 
  opts: RequestInit = {}, 
  { timeout = 5000 }: SafeFetchOptions = {}
): Promise<SafeFetchResponse<T>> {
  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    const res = await fetch(url, { signal: controller.signal, ...opts });
    clearTimeout(id);
    
    if (!res.ok) return { ok: false, status: res.status, body: null };
    
    const ct = res.headers.get("content-type") || "";
    const body = ct.includes("application/json") ? await res.json() : await res.text();
    
    return { ok: true, status: res.status, body: body as T };
  } catch (err) {
    console.warn("safeFetch error:", err && (err as Error).message ? (err as Error).message : err);
    return { ok: false, status: 0, body: null };
  }
}
