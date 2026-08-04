export interface WorkoutLog {
  id: string
  user_id: string
  session_id: string
  performed_on: string // date ISO (YYYY-MM-DD)
  created_at: string
  updated_at: string
}

export interface SetLog {
  id: string
  workout_log_id: string
  session_block_id: string
  set_index: number
  actual_reps: number | null
  actual_weight: number | null
  completed: boolean
  comment: string | null
  created_at: string
  updated_at: string
}
