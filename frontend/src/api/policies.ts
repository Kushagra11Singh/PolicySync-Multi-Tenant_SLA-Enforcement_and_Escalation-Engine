import client from './client'
import type { PaginatedResponse, SLAPolicy } from '../types'

export const getPolicies = async (): Promise<PaginatedResponse<SLAPolicy>> => {
  const res = await client.get<PaginatedResponse<SLAPolicy>>('/policies/')
  return res.data
}
