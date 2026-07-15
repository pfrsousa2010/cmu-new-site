import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL ?? "https://qnbrmgwlopirujzcgziu.supabase.co";
const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFuYnJtZ3dsb3BpcnVqemNneml1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE4NTI0OTcsImV4cCI6MjA2NzQyODQ5N30.47ec-BCeybGEwQAAlcyT92gaqG_ufrv1NkczpHDLRxU";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
    flowType: "pkce",
  },
});

// Buckets do Storage usados pelo site público (namespaced com "site-" para não
// colidir com o sistema de gestão que compartilha o mesmo projeto Supabase).
export const BUCKET_EVENTOS = "site-eventos";
export const BUCKET_ARQUIVOS = "site-arquivos";
export const BUCKET_CURSOS = "site-cursos";

/** URL pública de um objeto no Storage. */
export function publicUrl(bucket: string, path: string): string {
  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
}
