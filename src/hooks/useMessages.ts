import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { listMessages, postMessage } from "@/services/messageService";
import { supabase } from "@/lib/supabase";

/**
 * Subscribes to new rows in `booking_message` for this booking via Supabase
 * Realtime and invalidates the React-Query cache so the UI reflects them in
 * near-zero latency. Falls back to a 30s polling interval if Realtime is
 * unavailable (e.g. table not enabled in Supabase dashboard).
 */
export function useMessages(bookingId: string | undefined) {
  const qc = useQueryClient();

  useEffect(() => {
    if (!bookingId) return;
    const channel = supabase
      .channel(`booking_message:${bookingId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "booking_message",
          filter: `booking_id=eq.${bookingId}`,
        },
        () => {
          qc.invalidateQueries({ queryKey: ["messages", bookingId] });
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [bookingId, qc]);

  return useQuery({
    queryKey: ["messages", bookingId],
    queryFn: () => listMessages(bookingId!),
    enabled: !!bookingId,
    // Light polling as a fallback if Realtime isn't enabled on the table.
    refetchInterval: 30_000,
  });
}

export function usePostMessage(bookingId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: string) => postMessage(bookingId!, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["messages", bookingId] });
    },
  });
}
