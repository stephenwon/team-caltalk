// API Response Types
export interface ApiResponse<T> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

// User Types
export interface User {
  id: number | string
  username?: string
  email: string
  name: string
  created_at: string
  updated_at: string
}

// Team Types
export interface Team {
  id: number
  name: string
  description?: string
  invite_code: string
  created_by: number
  created_at: string
  updated_at: string
}

export interface TeamMember {
  id: number
  team_id: number
  user_id: number
  role: 'leader' | 'member'
  joined_at: string
}

// Schedule Types
export interface Schedule {
  id: number
  team_id?: number
  title: string
  content?: string
  description?: string
  start_time?: string // Legacy field
  end_time?: string // Legacy field
  start_datetime?: string
  end_datetime?: string
  schedule_type?: string
  creator_id?: number
  created_by?: number
  created_at?: string
  updated_at?: string
}

export interface ScheduleParticipant {
  id: number
  schedule_id: number
  user_id: number
  status: 'pending' | 'accepted' | 'declined'
  created_at: string
}

// Message Types
export interface Message {
  id: number
  team_id: number
  user_id: number
  content: string
  message_date: string
  created_at: string
  updated_at: string
}

// Auth Types
export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  username: string
  email: string
  password: string
  name: string
}

export interface AuthResponse {
  user: User
  token: string
}
