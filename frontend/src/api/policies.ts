import client from './client'
import { PaginatedResponse, SLAPolicy } from '../types'

export const getPolicies = async (): Promise<PaginatedResponse<SLAPolicy>> => {
  const res = await client.get<PaginatedResponse<SLAPolicy>>('/policies/sla/')
  return res.data
}

export const createPolicy = async (data: {
  name: string
  description?: string
  priority: string
  response_time_hours: number
  resolution_time_hours: number
}): Promise<SLAPolicy> => {
  const res = await client.post<SLAPolicy>('/policies/sla/', data)
  return res.data
}
