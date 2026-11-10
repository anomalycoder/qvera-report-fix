import { useState, useEffect, useCallback } from 'react'
import type { HealthCheckResponse } from '@/types/health'

export function useHealthCheck(pollIntervalMs?: number) {
  const [data, setData] = useState<HealthCheckResponse | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [latencyMs, setLatencyMs] = useState<number | null>(null)

  const checkHealth = useCallback(async () => {
    setLoading(true)
    const startTime = performance.now()
    try {
      const response = await fetch('/api/v1/health')
      const duration = Math.round(performance.now() - startTime)
      setLatencyMs(duration)

      if (!response.ok) {
        throw new Error(`Server responded with HTTP ${response.status}`)
      }
      const json: HealthCheckResponse = await response.json()
      setData(json)
      setError(null)
    } catch (err: any) {
      setError(err?.message || 'Unable to connect to backend server')
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    checkHealth()

    if (pollIntervalMs && pollIntervalMs > 0) {
      const timer = setInterval(checkHealth, pollIntervalMs)
      return () => clearInterval(timer)
    }
  }, [checkHealth, pollIntervalMs])

  return { data, loading, error, latencyMs, refetch: checkHealth }
}
