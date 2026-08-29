import { supabase, BUCKET_HERO, publicUrl } from "./supabase";

/** Foto do carrossel da Home (tabela `site_hero_imagens`). */
export interface HeroImagem {
  id: string;
  storage_path: string;
  legenda: string | null;
  ordem: number;
  publicado: boolean;
  created_at?: string;
}

export const MAX_HERO_IMAGEM_BYTES = 2 * 1024 * 1024;

/**
 * Fotos usadas antes de o carrossel virar gerenciável (arquivos em /public).
 * Continuam valendo como fallback enquanto ninguém publicar imagens no painel,
 * para a Home nunca ficar sem hero.
 */
export const HERO_FALLBACK = [
  "/sobre-nos/04c518_0422ce93c8c44973a338f68ce10b227b~mv2.avif",
  "/sobre-nos/04c518_04f3154884c94bb194263e71e7e76899~mv2.avif",
  "/sobre-nos/04c518_142944292c9b45f1a6b4d15a918d7b18~mv2.avif",
  "/sobre-nos/04c518_551ca846c7e142458ac05b3964563c73~mv2.avif",
  "/sobre-nos/04c518_6a530e9a6fb4442fae359c9931a0baa2~mv2.avif",
  "/sobre-nos/04c518_6c171a90a57f4d6da5b3997a0e5f30aa~mv2.avif",
  "/sobre-nos/04c518_93ea2b34f5e54a888b3511bb98bdc5c1~mv2.avif",
  "/sobre-nos/04c518_9eaca1b8bdfa48bf83f8d04e266a3ca4~mv2.avif",
  "/sobre-nos/04c518_a209a26536014f3fb7a563b2b3945c00~mv2.avif",
  "/sobre-nos/04c518_a8e6be6f5d3f4cc69f8ee875a36719d9~mv2.avif",
  "/sobre-nos/e7e902_feb773fdef5747039c2ede0def345afd~mv2.avif",
];

export function validarImagemHero(file: File): string | null {
  if (!file.type.startsWith("image/")) return "Selecione apenas arquivos de imagem.";
  if (file.size > MAX_HERO_IMAGEM_BYTES) return "A imagem deve ter no máximo 2 MB.";
  return null;
}

/** URL pública da foto no bucket `site-hero`. */
export function urlHero(img: HeroImagem): string {
  return publicUrl(BUCKET_HERO, img.storage_path);
}

/**
 * Fotos publicadas, na ordem do carrossel.
 * Devolve [] em caso de erro (inclusive se a migração ainda não rodou), para a
 * Home cair no fallback em vez de quebrar.
 */
export async function fetchHeroImagens(): Promise<HeroImagem[]> {
  const { data, error } = await supabase
    .from("site_hero_imagens")
    .select("*")
    .eq("publicado", true)
    .order("ordem", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) {
    console.error("Erro ao buscar fotos do hero:", error.message);
    return [];
  }
  return (data ?? []) as HeroImagem[];
}

/** Todas as fotos (inclusive as despublicadas), para o painel. */
export async function fetchHeroImagensAdmin(): Promise<HeroImagem[]> {
  const { data, error } = await supabase
    .from("site_hero_imagens")
    .select("*")
    .order("ordem", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) {
    console.error("Erro ao buscar fotos do hero (admin):", error.message);
    return [];
  }
  return (data ?? []) as HeroImagem[];
}

/** Sobe o arquivo e registra a foto no fim da ordem. */
export async function adicionarHeroImagem(
  file: File,
  ordem: number,
  legenda?: string
): Promise<void> {
  const erro = validarImagemHero(file);
  if (erro) throw new Error(erro);

  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${Date.now()}-${ordem}.${ext}`;
  const up = await supabase.storage
    .from(BUCKET_HERO)
    .upload(path, file, { upsert: false, contentType: file.type });
  if (up.error) throw up.error;

  const { error } = await supabase.from("site_hero_imagens").insert({
    storage_path: path,
    legenda: legenda?.trim() || null,
    ordem,
  });
  if (error) {
    // Não deixa objeto órfão no bucket quando o insert falha.
    await supabase.storage.from(BUCKET_HERO).remove([path]);
    throw error;
  }
}

export async function removerHeroImagem(img: HeroImagem): Promise<void> {
  await supabase.storage.from(BUCKET_HERO).remove([img.storage_path]);
  const { error } = await supabase
    .from("site_hero_imagens")
    .delete()
    .eq("id", img.id);
  if (error) throw error;
}

export async function setHeroPublicado(
  id: string,
  publicado: boolean
): Promise<void> {
  const { error } = await supabase
    .from("site_hero_imagens")
    .update({ publicado })
    .eq("id", id);
  if (error) throw error;
}

export async function setHeroLegenda(id: string, legenda: string): Promise<void> {
  const { error } = await supabase
    .from("site_hero_imagens")
    .update({ legenda: legenda.trim() || null })
    .eq("id", id);
  if (error) throw error;
}

/**
 * Troca a posição de duas fotos gravando a `ordem` de cada uma.
 * Sem transação: se a segunda escrita falhar, quem chama recarrega a lista.
 */
export async function trocarOrdemHero(
  a: HeroImagem,
  b: HeroImagem
): Promise<void> {
  const updates = [
    supabase.from("site_hero_imagens").update({ ordem: b.ordem }).eq("id", a.id),
    supabase.from("site_hero_imagens").update({ ordem: a.ordem }).eq("id", b.id),
  ];
  const [r1, r2] = await Promise.all(updates);
  if (r1.error) throw r1.error;
  if (r2.error) throw r2.error;
}

/** Próxima posição livre (fotos novas entram no fim). */
export function proximaOrdem(imagens: HeroImagem[]): number {
  return imagens.reduce((max, i) => Math.max(max, i.ordem), -1) + 1;
}
