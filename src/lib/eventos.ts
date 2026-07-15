import { supabase, BUCKET_EVENTOS, publicUrl } from "./supabase";

export interface EventoFoto {
  id: string;
  evento_id: string;
  storage_path: string;
  ordem: number | null;
}

export interface EventoRow {
  id: string;
  titulo: string;
  descricao: string | null;
  data: string; // ISO date
  hora: string | null;
  publicado: boolean;
  created_at?: string;
  evento_fotos?: EventoFoto[];
}

const MESES = [
  "jan", "fev", "mar", "abr", "mai", "jun",
  "jul", "ago", "set", "out", "nov", "dez",
];

/** "2026-08-03" -> { dia: "03", mes: "ago" } */
export function diaMesDe(iso: string): { dia: string; mes: string } {
  if (!iso) return { dia: "--", mes: "" };
  const [, m, d] = iso.split("-");
  return { dia: d, mes: MESES[parseInt(m, 10) - 1] ?? "" };
}

/** "2026-08-03" -> "03/08/2026" */
export function fmtDataBR(iso: string): string {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

/** "03/08/2026" -> "2026-08-03" (aceita também já-ISO) */
export function parseDataBR(br: string): string | null {
  if (!br) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(br)) return br;
  const m = br.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return null;
  return `${m[3]}-${m[2]}-${m[1]}`;
}

/** URL pública da primeira foto de um evento, ou null. */
export function capaEvento(e: EventoRow): string | null {
  const fotos = [...(e.evento_fotos ?? [])].sort(
    (a, b) => (a.ordem ?? 0) - (b.ordem ?? 0)
  );
  return fotos[0] ? publicUrl(BUCKET_EVENTOS, fotos[0].storage_path) : null;
}

export function ehFuturo(iso: string, hoje = new Date()): boolean {
  if (!iso) return false;
  const hojeStr = hoje.toISOString().slice(0, 10);
  return iso >= hojeStr;
}

/** Eventos publicados, com fotos, ordenados por data. */
export async function fetchEventos(): Promise<EventoRow[]> {
  const { data, error } = await supabase
    .from("site_eventos")
    .select("*, evento_fotos:site_evento_fotos(*)")
    .eq("publicado", true)
    .order("data", { ascending: true });

  if (error) {
    console.error("Erro ao buscar eventos:", error.message);
    return [];
  }
  return (data ?? []) as EventoRow[];
}

/** Todos os eventos (admin), com fotos. */
export async function fetchEventosAdmin(): Promise<EventoRow[]> {
  const { data, error } = await supabase
    .from("site_eventos")
    .select("*, evento_fotos:site_evento_fotos(*)")
    .order("data", { ascending: false });

  if (error) {
    console.error("Erro ao buscar eventos (admin):", error.message);
    return [];
  }
  return (data ?? []) as EventoRow[];
}

export interface EventoInput {
  titulo: string;
  descricao: string | null;
  data: string; // ISO
  hora: string | null;
  publicado: boolean;
}

export async function criarEvento(input: EventoInput): Promise<string> {
  const { data, error } = await supabase
    .from("site_eventos")
    .insert(input)
    .select("id")
    .single();
  if (error) throw error;
  return data.id as string;
}

export async function atualizarEvento(
  id: string,
  input: EventoInput
): Promise<void> {
  const { error } = await supabase.from("site_eventos").update(input).eq("id", id);
  if (error) throw error;
}

export async function removerEvento(e: EventoRow): Promise<void> {
  // Remove os arquivos do Storage; as linhas evento_fotos caem por cascade.
  const paths = (e.evento_fotos ?? []).map((f) => f.storage_path);
  if (paths.length) {
    await supabase.storage.from(BUCKET_EVENTOS).remove(paths);
  }
  const { error } = await supabase.from("site_eventos").delete().eq("id", e.id);
  if (error) throw error;
}

/** Faz upload de um arquivo de foto e registra em evento_fotos. */
export async function adicionarFoto(
  eventoId: string,
  file: File,
  ordem: number
): Promise<void> {
  const ext = file.name.split(".").pop() || "jpg";
  const path = `${eventoId}/${Date.now()}-${ordem}.${ext}`;
  const up = await supabase.storage
    .from(BUCKET_EVENTOS)
    .upload(path, file, { upsert: false });
  if (up.error) throw up.error;

  const { error } = await supabase
    .from("site_evento_fotos")
    .insert({ evento_id: eventoId, storage_path: path, ordem });
  if (error) throw error;
}

export async function removerFoto(foto: EventoFoto): Promise<void> {
  await supabase.storage.from(BUCKET_EVENTOS).remove([foto.storage_path]);
  const { error } = await supabase
    .from("site_evento_fotos")
    .delete()
    .eq("id", foto.id);
  if (error) throw error;
}
