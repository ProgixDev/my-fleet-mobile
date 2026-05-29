import { useEffect } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";

export default function PairDeepLinkScreen() {
  const router = useRouter();
  const { idOrSlug } = useLocalSearchParams<{ idOrSlug: string }>();

  useEffect(() => {
    if (!idOrSlug) return;
    router.replace({
      pathname: "/scan",
      params: { code: idOrSlug },
    });
  }, [idOrSlug, router]);

  return null;
}
