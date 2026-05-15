import client from './client'
import type {
  PaginatedResponse,
  TicketListItem,
  TicketDetail,
  EscalationLogItem
} from '../types'

export interface TicketFilters {
  status?: string
  priority?: string
  escalated?: boolean
  page?: number
}

export const getTickets = async (filters: TicketFilters = {}): Promise<PaginatedResponse<TicketListItem>> => {
  const params: Record<string, string> = {}
  if (filters.status) params.status = filters.status
  if (filters.priority) params.priority = filters.priority
  if (filters.escalated) params.escalated = 'true'
  if (filters.page) params.page = String(filters.page)

  const res = await client.get<PaginatedResponse<TicketListItem>>('/tickets/', { params })
  return res.data
}

export const getTicket = async (id: string): Promise<TicketDetail> => {
  const res = await client.get<TicketDetail>(`/tickets/${id}/`)
  return res.data
}

export const createTicket = async (data: {
  title: string
  description: string
  priority: string
  sla_policy?: string
  assigned_agent?: string
}): Promise<TicketDetail> => {
  const res = await client.post<TicketDetail>('/tickets/', data)
  return res.data
}

export const resolveTicket = async (id: string): Promise<TicketDetail> => {
  const res = await client.patch<TicketDetail>(`/tickets/${id}/resolve/`)
  return res.data
}

export const addComment = async (ticketId: string, body: string, isInternal = false): Promise<void> => {
  await client.post(`/tickets/${ticketId}/comment/`, { body, is_internal: isInternal })
}

export const getEscalationLogs = async (ticketId?: string): Promise<PaginatedResponse<EscalationLogItem>> => {
  const params = ticketId ? { ticket: ticketId } : {}
  const res = await client.get<PaginatedResponse<EscalationLogItem>>('/escalations/logs/', { params })
  return res.data
}
