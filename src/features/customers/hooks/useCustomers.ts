import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  listCustomers,
  saveCustomer,
  deleteCustomer,
  type CustomerFormValues,
} from '../api/customers-api'

const CUSTOMERS_KEY = ['customers'] as const

export function useCustomers() {
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
