"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

/** Keep one browser Supabase client for the lifetime of a mounted component. */
export function useSupabaseClient() {
  const [client] = useState(() => createClient());
  return client;
}
