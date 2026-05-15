import { useState, useEffect, useCallback } from 'react'
import type { TicketListItem, PaginatedResponse } from '../types'
import { getTickets } from '../api/tickets'
import type { TicketFilters } from '../api/tickets'

const POLL_INTERVAL_MS = 30_000

export function useTickets(filters: TicketFilters = {}) {
  const [data, setData] = useState<PaginatedResponse<TicketListItem> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(async () => {
    try {
      const result = await getTickets(filters)
      setData(result)
      setError(null)
    } catch (err: any) {
      setError(err.message ?? 'Failed to load tickets')
    } finally {
      setLoading(false)
    }
  }, [JSON.stringify(filters)])

  useEffect(() => {
    fetch()
    const interval = setInterval(fetch, POLL_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [fetch])

  return { data, loading, error, refetch: fetch }
}
