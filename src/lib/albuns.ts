import { supabase, BUCKET_ALBUNS, publicUrl } from "./supabase";

export interface AlbumFoto {
  id: string;
  album_id: string;
  storage_path: string;
  ordem: number | null;
}

export interface AlbumRow {
  id: string;
  titulo: string;
  descricao: string | null;
  data: string | null; // ISO date opcional
  publicado: boolean;
  created_at?: string;
  album_fotos?: AlbumFoto[];
}

export interface AlbumInput {
  titulo: string;
  descricao: string | null;
  data: string | null;
  publicado: boolean;
}

/** URLs públicas das fotos do álbum, ordenadas. */
export function fotosAlbum(a: AlbumRow): string[] {
  return [...(a.album_fotos ?? [])]
    .sort((x, y) => (x.ordem ?? 0) - (y.ordem ?? 0))
    .map((f) => publicUrl(BUCKET_ALBUNS, f.storage_path));
}

/** URL pública da primeira foto, ou null. */
export function capaAlbum(a: AlbumRow): string | null {
  return fotosAlbum(a)[0] ?? null;
}

/** Mais recentes primeiro (por data do álbum; sem data, usa created_at). */
export function ordenarAlbuns(albuns: AlbumRow[]): AlbumRow[] {
  return [...albuns].sort((a, b) => {
    const da = a.data ?? a.created_at?.slice(0, 10) ?? "";
    const db = b.data ?? b.created_at?.slice(0, 10) ?? "";
    return db.localeCompare(da);
  });
}

/** Álbuns publicados, com fotos. */
export async function fetchAlbuns(): Promise<AlbumRow[]> {
  const { data, error } = await supabase
    .from("site_albuns")
    .select("*, album_fotos:site_album_fotos(*)")
    .eq("publicado", true);

  if (error) {
    console.error("Erro ao buscar álbuns:", error.message);
    return [];
  }
  return ordenarAlbuns((data ?? []) as AlbumRow[]);
}

/** Todos os álbuns (admin), com fotos. */
export async function fetchAlbunsAdmin(): Promise<AlbumRow[]> {
  const { data, error } = await supabase
    .from("site_albuns")
    .select("*, album_fotos:site_album_fotos(*)");

  if (error) {
    console.error("Erro ao buscar álbuns (admin):", error.message);
    return [];
  }
  return ordenarAlbuns((data ?? []) as AlbumRow[]);
}

export async function criarAlbum(input: AlbumInput): Promise<string> {
  const { data, error } = await supabase
    .from("site_albuns")
    .insert(input)
    .select("id")
    .single();
  if (error) throw error;
  return data.id as string;
}

export async function atualizarAlbum(
  id: string,
  input: AlbumInput
): Promise<void> {
  const { error } = await supabase.from("site_albuns").update(input).eq("id", id);
  if (error) throw error;
}

export async function setAlbumPublicado(
  id: string,
  publicado: boolean
): Promise<void> {
  const { error } = await supabase
    .from("site_albuns")
    .update({ publicado })
    .eq("id", id);
  if (error) throw error;
}

export async function removerAlbum(a: AlbumRow): Promise<void> {
  const paths = (a.album_fotos ?? []).map((f) => f.storage_path);
  if (paths.length) {
    await supabase.storage.from(BUCKET_ALBUNS).remove(paths);
  }
  const { error } = await supabase.from("site_albuns").delete().eq("id", a.id);
  if (error) throw error;
}

/** Faz upload de um arquivo e registra em site_album_fotos. */
export async function adicionarFotoAlbum(
  albumId: string,
  file: File,
  ordem: number
): Promise<void> {
  const ext = file.name.split(".").pop() || "jpg";
  const path = `${albumId}/${Date.now()}-${ordem}.${ext}`;
  const up = await supabase.storage
    .from(BUCKET_ALBUNS)
    .upload(path, file, { upsert: false });
  if (up.error) throw up.error;

  const { error } = await supabase.from("site_album_fotos").insert({
    album_id: albumId,
    storage_path: path,
    ordem,
  });
  if (error) {
    await supabase.storage.from(BUCKET_ALBUNS).remove([path]);
    throw error;
  }
}

export async function removerFotoAlbum(foto: AlbumFoto): Promise<void> {
  await supabase.storage.from(BUCKET_ALBUNS).remove([foto.storage_path]);
  const { error } = await supabase
    .from("site_album_fotos")
    .delete()
    .eq("id", foto.id);
  if (error) throw error;
}
