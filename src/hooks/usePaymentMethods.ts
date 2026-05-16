import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  listPaymentMethods,
  deletePaymentMethod,
} from "@/services/paymentMethodService";

export function usePaymentMethods() {
  return useQuery({
    queryKey: ["payment-methods"],
    queryFn: listPaymentMethods,
  });
}

export function useDeletePaymentMethod() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deletePaymentMethod(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["payment-methods"] });
    },
  });
}
