import { useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  listCustomers,
  saveCustomer,
  deleteCustomer,
  syncPendingCustomers,
  refreshCustomersFromServer,
  type CustomerFormValues,
} from '../api/customers-api'

const CUSTOMERS_KEY = ['customers'] as const

export function useCustomers() {
  const queryClient = useQueryClient()

  useEffect(() => {
    const onOnline = async () => {
      await syncPendingCustomers()
      await refreshCustomersFromServer()
      queryClient.invalidateQueries({ queryKey: CUSTOMERS_KEY })
    }
    window.addEventListener('online', onOnline)
    onOnline()
    return () => window.removeEventListener('online', onOnline)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return useQuery({ queryKey: CUSTOMERS_KEY, queryFn: listCustomers })
}

export function useSaveCustomer() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ values, id }: { values: CustomerFormValues; id?: string }) => saveCustomer(values, id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CUSTOMERS_KEY }),
  })
}

export function useDeleteCustomer() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteCustomer(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CUSTOMERS_KEY }),
  })
}
