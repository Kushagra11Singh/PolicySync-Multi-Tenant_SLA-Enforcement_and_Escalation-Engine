export type UserRole = 'admin' | 'manager' | 'agent'
export type TicketStatus = 'open' | 'in_progress' | 'pending' | 'resolved' | 'closed'
export type SLAStatus = 'ok' | 'at_risk' | 'breached' | 'met' | 'none'

export interface User {
  id: string
  email: string
  full_name: string
  role: UserRole
  tenant_name: string | null
  is_active: boolean
  created_at: string
}

export interface SLAPolicy {
  id: string
  name: string
  description: string
  priority: string
  response_time_hours: number
  resolution_time_hours: number
  is_active: boolean
  open_ticket_count: number
}

export interface EscalationRule {
  id: string
  level: number
  escalate_at_percent: number
  escalate_to: string
  escalate_to_email: string
  escalate_to_name: string
  is_active: boolean
}

export interface SLAPolicyDetail extends SLAPolicy {
  escalation_rules: EscalationRule[]
}

export interface TicketListItem {
  id: string
  title: string
  status: TicketStatus
  priority: string
  assigned_agent_name: string | null
  sla_policy_name: string | null
  sla_resolution_deadline: string | null
  sla_percent_elapsed: number | null
  sla_status: SLAStatus
  is_escalated: boolean
  escalation_level: number
  created_at: string
  updated_at: string
}

export interface Comment {
  id: string
  body: string
  is_internal: boolean
  author_name: string
  created_at: string
}

export interface EscalationLogItem {
  id: string
  ticket: string
  ticket_title: string
  level: number
  reason: string
  sla_percent_elapsed: number
  escalated_to_email: string
  escalated_to_name: string
  created_at: string
}

export interface TicketDetail extends TicketListItem {
  description: string
  created_by: string
  created_by_name: string
  sla_policy: string | null
  sla_response_deadline: string | null
  first_response_at: string | null
  resolved_at: string | null
  comments: Comment[]
}

export interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}
