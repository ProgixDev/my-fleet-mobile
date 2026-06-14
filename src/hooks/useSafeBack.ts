import { useRouter, type Href } from "expo-router";
import { useCallback } from "react";

// Returns a back handler that never triggers the "GO_BACK was not handled by
// any navigator" warning: it goes back only when there is history, otherwise
// it replaces to a sensible fallback route. Use this instead of bare
// router.back() on any screen that can be a navigation root (deep links,
// app-resume, or after router.replace cleared the stack).
export function useSafeBack(fallback: Href = "/home") {
  const router = useRouter();
  return useCallback(() => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace(fallback);
    }
  }, [router, fallback]);
}
