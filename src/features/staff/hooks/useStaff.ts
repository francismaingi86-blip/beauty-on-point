import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { listStaff, createStaff, updateStaffRole, removeStaff, type CreateStaffInput } from '../api/staff-api'
import type { StaffRole } from '@/stores/useAuthStore'

const STAFF_KEY = ['staff'] as const

export function useStaff() {
  return useQuery({ queryKey: STAFF_KEY, queryFn: listStaff })
}

export function useCreateStaff() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateStaffInput) => createStaff(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: STAFF_KEY }),
  })
}

export function useUpdateStaffRole() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, role }: { id: string; role: StaffRole }) => updateStaffRole(id, role),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: STAFF_KEY }),
  })
}

export function useRemoveStaff() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => removeStaff(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: STAFF_KEY }),
  })
}
