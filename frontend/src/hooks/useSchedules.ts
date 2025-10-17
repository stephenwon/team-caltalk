import { useState, useEffect, useMemo } from 'react'
import { logger } from '@/utils/logger'
import { useTeamStore } from '@/stores/team-store'
import api from '@/services/api'
import type { Schedule, ScheduleParticipant, ApiResponse } from '@/types'

interface CreateScheduleRequest {
  title: string
  content?: string
  startDatetime: string
  endDatetime: string
  scheduleType: 'personal' | 'team'
  participantIds?: number[]
}

interface UpdateScheduleRequest extends Partial<CreateScheduleRequest> {
  id: number
}

interface ScheduleWithParticipants extends Schedule {
  participants: ScheduleParticipant[]
  participant_count: number
}

interface UseSchedulesReturn {
  schedules: ScheduleWithParticipants[]
  loading: boolean
  error: string | null

  // CRUD operations
  createSchedule: (data: CreateScheduleRequest) => Promise<void>
  updateSchedule: (data: UpdateScheduleRequest) => Promise<void>
  deleteSchedule: (scheduleId: number) => Promise<void>

  // Filter and utility functions
  getSchedulesForDate: (date: string) => ScheduleWithParticipants[]
  getSchedulesForDateRange: (
    startDate: string,
    endDate: string
  ) => ScheduleWithParticipants[]

  // Refresh data
  refetch: () => Promise<void>
}

export function useSchedules(): UseSchedulesReturn {
  const [schedules, setSchedules] = useState<ScheduleWithParticipants[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { currentTeam } = useTeamStore()

  // Normalize schedule data (convert start_datetime/end_datetime to start_time/end_time)
  const normalizeSchedule = (schedule: any): ScheduleWithParticipants => {
    return {
      ...schedule,
      start_time: schedule.start_datetime || schedule.start_time,
      end_time: schedule.end_datetime || schedule.end_time,
    }
  }

  // Fetch schedules for current team
  const fetchSchedules = async () => {
    if (!currentTeam) {
      setSchedules([])
      return
    }

    setLoading(true)
    setError(null)

    try {
      logger.log('Fetching schedules for team:', currentTeam.id)
      const response = await api.get<
        ApiResponse<{ schedules: ScheduleWithParticipants[] }>
      >('/schedules', {
        params: { teamId: currentTeam.id },
      })
      logger.log('Schedules API response:', response.data)
      const normalizedSchedules = (response.data.data?.schedules || []).map(
        normalizeSchedule
      )
      logger.log('Normalized schedules:', normalizedSchedules)
      setSchedules(normalizedSchedules)
    } catch (err) {
      logger.error('Failed to fetch schedules:', err)
      setError(
        err instanceof Error ? err.message : '일정을 불러오는데 실패했습니다.'
      )
      setSchedules([])
    } finally {
      setLoading(false)
    }
  }

  // Create new schedule
  const createSchedule = async (data: CreateScheduleRequest) => {
    if (!currentTeam) {
      throw new Error('팀이 선택되지 않았습니다.')
    }

    setLoading(true)
    setError(null)

    try {
      const response = await api.post<
        ApiResponse<{ schedule: ScheduleWithParticipants }>
      >('/schedules', {
        ...data,
        teamId: currentTeam.id,
      })

      const newSchedule = response.data.data?.schedule
      if (newSchedule) {
        setSchedules((prev) => [...prev, normalizeSchedule(newSchedule)])
      }
    } catch (err: any) {
      // Handle schedule conflicts
      if (
        err.response?.data?.message === '일정 충돌이 발생했습니다' &&
        err.response?.data?.conflicts
      ) {
        const conflictDetails = err.response.data.conflicts
          .map(
            (c: any) =>
              `${c.userName}: ${c.conflictingSchedule.title} (${new Date(c.conflictingSchedule.startDatetime).toLocaleString('ko-KR')})`
          )
          .join('\n')
        const conflictError = new Error(
          `일정 충돌이 발생했습니다:\n\n${conflictDetails}\n\n다른 시간을 선택해주세요.`
        )
        setError(conflictError.message)
        throw conflictError
      }

      setError(
        err.response?.data?.message ||
          err.message ||
          '일정 생성에 실패했습니다.'
      )
      throw err
    } finally {
      setLoading(false)
    }
  }

  // Update existing schedule
  const updateSchedule = async (data: UpdateScheduleRequest) => {
    if (!currentTeam) {
      throw new Error('팀이 선택되지 않았습니다.')
    }

    setLoading(true)
    setError(null)

    try {
      const response = await api.put<
        ApiResponse<{ schedule: ScheduleWithParticipants }>
      >(`/schedules/${data.id}`, data)

      const updatedSchedule = response.data.data?.schedule
      if (updatedSchedule) {
        setSchedules((prev) =>
          prev.map((schedule) =>
            schedule.id === data.id
              ? normalizeSchedule(updatedSchedule)
              : schedule
          )
        )
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          err.message ||
          '일정 수정에 실패했습니다.'
      )
      throw err
    } finally {
      setLoading(false)
    }
  }

  // Delete schedule
  const deleteSchedule = async (scheduleId: number) => {
    if (!currentTeam) {
      throw new Error('팀이 선택되지 않았습니다.')
    }

    setLoading(true)
    setError(null)

    try {
      await api.delete(`/schedules/${scheduleId}`)
      setSchedules((prev) =>
        prev.filter((schedule) => schedule.id !== scheduleId)
      )
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          err.message ||
          '일정 삭제에 실패했습니다.'
      )
      throw err
    } finally {
      setLoading(false)
    }
  }

  // Get schedules for specific date
  const getSchedulesForDate = useMemo(() => {
    return (date: string) => {
      const targetDate = new Date(date).toDateString()
      return schedules.filter((schedule) => {
        const startTime = schedule.start_datetime || schedule.start_time
        if (!startTime) return false
        const scheduleDate = new Date(startTime).toDateString()
        return scheduleDate === targetDate
      })
    }
  }, [schedules])

  // Get schedules for date range
  const getSchedulesForDateRange = useMemo(() => {
    return (startDate: string, endDate: string) => {
      const start = new Date(startDate)
      const end = new Date(endDate)

      return schedules.filter((schedule) => {
        const startTime = schedule.start_datetime || schedule.start_time
        const endTime = schedule.end_datetime || schedule.end_time
        if (!startTime || !endTime) return false

        const scheduleStart = new Date(startTime)
        const scheduleEnd = new Date(endTime)

        // Check if schedule overlaps with the date range
        return scheduleStart <= end && scheduleEnd >= start
      })
    }
  }, [schedules])

  // Fetch schedules when team changes
  useEffect(() => {
    fetchSchedules()
  }, [currentTeam])

  return {
    schedules,
    loading,
    error,
    createSchedule,
    updateSchedule,
    deleteSchedule,
    getSchedulesForDate,
    getSchedulesForDateRange,
    refetch: fetchSchedules,
  }
}
