import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getSettings, saveSettings, type AppSettings } from '../api/settings-api'

const SETTINGS_KEY = ['settings'] as const

export function useSettings() {
  return useQuery({ queryKey: SETTINGS_KEY, queryFn: getSettings, staleTime: 5 * 60_000 })
}

export function useSaveSettings() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (settings: AppSettings) => saveSettings(settings),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: SETTINGS_KEY }),
  })
}
