import client from './client'
import type { User } from '../types'

export interface LoginResponse {
  access: string
  refresh: string
  user: User
}

export const login = async (email: string, password: string): Promise<LoginResponse> => {
  const res = await client.post<LoginResponse>('/auth/login/', { email, password })
  return res.data
}

export const logout = async (refresh: string): Promise<void> => {
  await client.post('/auth/logout/', { refresh })
}

export const getMe = async (): Promise<User> => {
  const res = await client.get<User>('/auth/users/me/')
  return res.data
}
