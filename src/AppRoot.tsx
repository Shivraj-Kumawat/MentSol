// src/AppRoot.tsx
import React, { useEffect, useState } from "react";
import {
  createBrowserRouter,
  RouterProvider,
  RouteObject,
  Link,
  Outlet,
} from "react-router-dom";

/* ===========================
   Console filters & helpers
   =========================== */
(function installConsoleFilters() {
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
      const s = args
        .map((a) => (typeof a === "string" ? a : JSON.stringify(a)))
        .join(" ");
      if (IGNORE_RX.some((rx) => rx.test(s))) return;
    } catch {}
    origWarn(...args);
  };
})();

// safeFetch: use for unstable endpoints
export async function safeFetch(
  url: string,
  opts: RequestInit = {},
  { timeout = 5000 }: { timeout?: number } = {}
) {
  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    const res = await fetch(url, { signal: controller.signal, ...opts });
    clearTimeout(id);
    if (!res.ok) return { ok: false, status: res.status, body: null };
    const ct = res.headers.get("content-type") || "";
    const body = ct.includes("application/json") ? await res.json() : await res.text();
    return { ok: true, status: res.status, body };
  } catch (err: any) {
    console.warn("safeFetch error:", err && err.message ? err.message : err);
    return { ok: false, status: 0, body: null };
  }
}

// safeLoadScript: load analytics with timeout
export function safeLoadScript(src: string, timeout = 2500) {
  return new Promise<void>((res, rej) => {
    const s = document.createElement("script");
    s.src = src;
    s.async = true;
    s.onload = () => res();
    s.onerror = (e) => rej(e);
    document.head.appendChild(s);
    setTimeout(() => rej(new Error("script load timeout")), timeout);
  });
}

/* ===========================
   WebRTC stub (avoids 404 imports)
   =========================== */
export async function initWebRTCSession(sessionId: string, options = {}) {
  console.info("[webrtc-stub] init", sessionId);
  return {
    success: true,
    roomId: `session_${sessionId}`,
    token: "dev-stub-token",
    url: `${window.location.origin}/webrtc-stub/${sessionId}`,
  };
}
export function cleanupWebRTC() {
  console.info("[webrtc-stub] cleanup");
}

/* ===========================
   SafeIframe component
   - Use this instead of raw <iframe>
   =========================== */
export function SafeIframe({
  src,
  title = "embed",
  height = 400,
  style,
}: {
  src: string;
  title?: string;
  height?: number | string;
  style?: React.CSSProperties;
}) {
  return (
    <iframe
      src={src}
      title={title}
      loading="lazy"
      referrerPolicy="strict-origin-when-cross-origin"
      // allow only safe, well-supported features
      allow="camera; microphone; autoplay; fullscreen; clipboard-read"
      sandbox="allow-scripts allow-forms"
      style={{
        width: "100%",
        height,
        border: "none",
        borderRadius: 8,
        ...style,
      }}
    />
  );
}

/* ===========================
   Pages
   =========================== */
function HomePage() {
  const [apiStatus, setApiStatus] = useState<string>("unknown");

  useEffect(() => {
    // Example: test a backend endpoint gracefully
    (async () => {
      const r = await safeFetch("/api/health", {}, { timeout: 1500 });
      setApiStatus(r.ok ? `ok (${r.status})` : `unavailable`);
    })();

    // Example: attempt to load analytics non-blocking
    safeLoadScript("https://analytics.tiktok.com/i18n/pixel/events.js?sdkid=CVJ5MTBC77U1BR7NAGTG").catch(
      () => {
        console.info("analytics script not loaded (dev) — continuing.");
      }
    );
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <h1>App (Dev-stable)</h1>
      <p>API status: <strong>{apiStatus}</strong></p>
      <nav style={{ marginBottom: 12 }}>
        <Link to="/">Home</Link> {" | "} <Link to="/video/dev-session">Video (fallback)</Link>
      </nav>

      <section style={{ marginTop: 16 }}>
        <h3>Safe embed preview</h3>
        <SafeIframe src="https://lovable.dev/careers" height={360} />
        <small style={{ display: "block", marginTop: 8, color: "#666" }}>
          Using SafeIframe: removed unsupported features & tightened sandbox to avoid sandbox escape warnings.
        </small>
      </section>

      <Outlet />
    </div>
  );
}

function VideoCallPage({ params }: any) {
  const sessionId = (params && params.id) || window.location.pathname.split("/").pop() || "dev-session";
  const [room, setRoom] = useState<any>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const r = await initWebRTCSession(sessionId);
        if (!mounted) return;
        if (r && r.success) setRoom(r);
        else setErr("Could not create call room (dev).");
      } catch (e) {
        console.error(e);
        setErr("Video call init error.");
      }
    })();
    return () => {
      mounted = false;
      cleanupWebRTC();
    };
  }, [sessionId]);

  if (err)
    return (
      <div style={{ padding: 20 }}>
        <h2>Video Call (Fallback)</h2>
        <p style={{ color: "crimson" }}>{err}</p>
      </div>
    );

  if (!room)
    return (
      <div style={{ padding: 20 }}>
        <h2>Preparing video call…</h2>
      </div>
    );

  return (
    <div style={{ padding: 20 }}>
      <h2>Dev Video Room</h2>
      <p>Room ID: <strong>{room.roomId}</strong></p>
      <div
        style={{
          height: 320,
          borderRadius: 12,
          background: "#f3f4f6",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        Dev video placeholder
      </div>
    </div>
  );
}

/* ===========================
   Router (with future flags)
   =========================== */
const routes: RouteObject[] = [
  { path: "/", element: <HomePage /> },
  { path: "/video/:id", element: <VideoCallPage /> },
];

const router = createBrowserRouter(routes, {
  future: { 
    v7_startTransition: true, 
    v7_relativeSplatPath: true 
  } as any, // Type assertion for compatibility
});

/* ===========================
   App root
   =========================== */
export default function AppRoot() {
  // DEFENSIVE: Safe initialization for SSR/WebView compatibility
  const [online, setOnline] = useState<boolean>(() => {
    if (typeof navigator !== 'undefined' && typeof navigator.onLine === 'boolean') {
      return navigator.onLine;
    }
    return true; // Assume online if navigator unavailable
  });
  
  useEffect(() => {
    // DEFENSIVE: Early return if window is not available
    if (typeof window === 'undefined') return;
    
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);
  
  return (
    <div>
      {!online && (
        <div style={{ background: "#fde68a", padding: 8, textAlign: "center" }}>
          You appear offline — some network features are disabled.
        </div>
      )}
      <RouterProvider router={router} />
    </div>
  );
}
