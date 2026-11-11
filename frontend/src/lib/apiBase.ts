/**
 * Configures runtime API routing and Bearer token forwarding for production builds.
 * In local Vite development (VITE_API_BASE_URL unset), `/api/*` flows through Vite's proxy.
 * In production (Vercel), set VITE_API_BASE_URL to the deployed FastAPI origin (e.g. https://qvera-api.onrender.com).
 */
export function resolveApiUrl(url: string): string {
  const base = (import.meta.env.VITE_API_BASE_URL || "").trim().replace(/\/+$/, "")
  if (!base || !url.startsWith("/api")) return url
  return `${base}${url}`
}

export function installApiBaseInterceptor(): void {
  if (typeof window === "undefined") return
  const base = (import.meta.env.VITE_API_BASE_URL || "").trim().replace(/\/+$/, "")

  const origFetch = window.fetch.bind(window)
  window.fetch = (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const rawUrl = typeof input === "string" ? input : input instanceof Request ? input.url : String(input)
    const isApiCall = rawUrl.startsWith("/api") || (base !== "" && rawUrl.startsWith(base))
    const finalUrl = rawUrl.startsWith("/api") ? resolveApiUrl(rawUrl) : input

    if (!isApiCall) {
      return origFetch(finalUrl, init)
    }

    const token =
      localStorage.getItem("qvera_auth_token") || localStorage.getItem("acadza_auth_token")
    const headers = new Headers(
      init?.headers || (input instanceof Request ? input.headers : undefined)
    )
    if (token && !headers.has("Authorization")) {
      headers.set("Authorization", `Bearer ${token}`)
    }

    return origFetch(finalUrl, {
      ...init,
      headers,
      credentials: init?.credentials || "include",
    })
  }

  if (base && typeof window.EventSource !== "undefined") {
    const NativeEventSource = window.EventSource
    window.EventSource = function (url: string | URL, eventSourceInitDict?: EventSourceInit) {
      const target = typeof url === "string" && url.startsWith("/api") ? resolveApiUrl(url) : url
      return new NativeEventSource(target, eventSourceInitDict)
    } as unknown as typeof EventSource
    window.EventSource.prototype = NativeEventSource.prototype
  }
}
