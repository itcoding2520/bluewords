import { useEffect, useState } from "react";
import { installGlobalActionTracking } from "@/lib/global-action-tracking";

export function useGlobalActionTracking() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    return installGlobalActionTracking(setVisible);
  }, [setVisible]);

  return visible;
}
