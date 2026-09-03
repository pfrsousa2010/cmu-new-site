import { supabase, BUCKET_DEPOIMENTOS, publicUrl } from "./supabase";

/**
 * Depoimento exibido na Home (tabela `site_depoimentos`).
 *
 * Cada um é foto OU vídeo. `poster_path` só existe para vídeo: é um quadro
 * extraído no navegador na hora do upload, usado como miniatura da navegação e
 * como capa do player.
 */
export interface Depoimento {
  id: string;
  nome: string;
  texto: string;
  midia_tipo: "foto" | "video";
  midia_path: string;
  poster_path: string | null;
  ordem: number;
  ativo: boolean;
  created_at?: string;
}

export const MAX_FOTO_BYTES = 2 * 1024 * 1024;
export const MAX_VIDEO_BYTES = 25 * 1024 * 1024;

export function ehVideo(file: File): boolean {
  return file.type.startsWith("video/");
}

export function validarMidiaDepoimento(file: File): string | null {
  if (ehVideo(file)) {
    if (file.size > MAX_VIDEO_BYTES) {
      return "O vídeo deve ter no máximo 25 MB.";
    }
    return null;
  }
  if (!file.type.startsWith("image/")) {
    return "Selecione uma imagem ou um vídeo.";
  }
  if (file.size > MAX_FOTO_BYTES) return "A foto deve ter no máximo 2 MB.";
  return null;
}

export function urlMidia(d: Depoimento): string {
  return publicUrl(BUCKET_DEPOIMENTOS, d.midia_path);
}

/** Imagem de capa: o poster no caso de vídeo, a própria foto no caso de foto. */
export function urlPoster(d: Depoimento): string | null {
  if (d.midia_tipo === "foto") return urlMidia(d);
  return d.poster_path ? publicUrl(BUCKET_DEPOIMENTOS, d.poster_path) : null;
}

// ---------------------------------------------------------------------------
// Poster do vídeo
// ---------------------------------------------------------------------------

/**
 * Extrai um quadro do vídeo para servir de capa. Busca 1s (ou o meio, se for
 * mais curto) porque o primeiro quadro costuma ser preto.
 * Devolve `null` se o navegador não conseguir decodificar — o depoimento entra
 * sem capa e a lista mostra um ícone de play no lugar.
 */
export function posterDoVideo(file: File): Promise<File | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.preload = "metadata";
    video.muted = true;
    video.playsInline = true;

    const desistir = () => {
      URL.revokeObjectURL(url);
      resolve(null);
    };

    video.onerror = desistir;
    video.onloadedmetadata = () => {
      video.currentTime = Math.min(1, (video.duration || 2) / 2);
    };
    video.onseeked = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d");
        if (!ctx || !canvas.width || !canvas.height) return desistir();
        ctx.drawImage(video, 0, 0);
        canvas.toBlob((blob) => {
          URL.revokeObjectURL(url);
          resolve(
            blob ? new File([blob], "poster.jpg", { type: "image/jpeg" }) : null
          );
        }, "image/jpeg", 0.85);
      } catch {
        desistir();
      }
    };

    video.src = url;
  });
}

// ---------------------------------------------------------------------------
// Consultas
// ---------------------------------------------------------------------------

/** Depoimentos ativos, na ordem do painel. `[]` em caso de erro. */
export async function fetchDepoimentos(): Promise<Depoimento[]> {
  const { data, error } = await supabase
    .from("site_depoimentos")
    .select("*")
    .eq("ativo", true)
    .order("ordem", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) {
    console.error("Erro ao buscar depoimentos:", error.message);
    return [];
  }
  return (data ?? []) as Depoimento[];
}

/** Todos, inclusive inativos, para o painel. */
export async function fetchDepoimentosAdmin(): Promise<Depoimento[]> {
  const { data, error } = await supabase
    .from("site_depoimentos")
    .select("*")
    .order("ordem", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) {
    console.error("Erro ao buscar depoimentos (admin):", error.message);
    return [];
  }
  return (data ?? []) as Depoimento[];
}

// ---------------------------------------------------------------------------
// Escrita
// ---------------------------------------------------------------------------

async function subirMidia(file: File, prefixo: string): Promise<string> {
  const ext = file.name.split(".").pop()?.toLowerCase() || "bin";
  const path = `${prefixo}-${Date.now()}.${ext}`;
  const { error } = await supabase.storage
    .from(BUCKET_DEPOIMENTOS)
    .upload(path, file, { upsert: false, contentType: file.type });
  if (error) throw error;
  return path;
}

async function apagarMidia(paths: (string | null | undefined)[]) {
  const validos = paths.filter(Boolean) as string[];
  if (validos.length === 0) return;
  await supabase.storage.from(BUCKET_DEPOIMENTOS).remove(validos);
}

export interface DadosDepoimento {
  nome: string;
  texto: string;
}

/** Cria o depoimento no fim da lista. */
export async function adicionarDepoimento(
  dados: DadosDepoimento,
  midia: File,
  ordem: number
): Promise<void> {
  const erro = validarMidiaDepoimento(midia);
  if (erro) throw new Error(erro);
  if (!dados.nome.trim()) throw new Error("Informe o nome de quem fala.");
  if (!dados.texto.trim()) throw new Error("Escreva o depoimento.");

  const video = ehVideo(midia);
  const midiaPath = await subirMidia(midia, video ? "video" : "foto");

  let posterPath: string | null = null;
  if (video) {
    const poster = await posterDoVideo(midia);
    if (poster) {
      try {
        posterPath = await subirMidia(poster, "poster");
      } catch (e) {
        // Capa é acessório: sem ela o depoimento ainda funciona.
        console.error("Não foi possível salvar a capa do vídeo:", e);
      }
    }
  }

  const { error } = await supabase.from("site_depoimentos").insert({
    nome: dados.nome.trim(),
    texto: dados.texto.trim(),
    midia_tipo: video ? "video" : "foto",
    midia_path: midiaPath,
    poster_path: posterPath,
    ordem,
  });
  if (error) {
    // Não deixa arquivo órfão no bucket quando o insert falha.
    await apagarMidia([midiaPath, posterPath]);
    throw error;
  }
}

/**
 * Atualiza texto/nome e, opcionalmente, troca a mídia. A mídia antiga só é
 * apagada depois que a linha já aponta para a nova.
 */
export async function atualizarDepoimento(
  d: Depoimento,
  dados: DadosDepoimento,
  novaMidia?: File | null
): Promise<void> {
  if (!dados.nome.trim()) throw new Error("Informe o nome de quem fala.");
  if (!dados.texto.trim()) throw new Error("Escreva o depoimento.");

  const patch: Record<string, unknown> = {
    nome: dados.nome.trim(),
    texto: dados.texto.trim(),
  };

  let novosPaths: string[] = [];
  if (novaMidia) {
    const erro = validarMidiaDepoimento(novaMidia);
    if (erro) throw new Error(erro);

    const video = ehVideo(novaMidia);
    const midiaPath = await subirMidia(novaMidia, video ? "video" : "foto");
    novosPaths.push(midiaPath);

    let posterPath: string | null = null;
    if (video) {
      const poster = await posterDoVideo(novaMidia);
      if (poster) {
        try {
          posterPath = await subirMidia(poster, "poster");
          novosPaths.push(posterPath);
        } catch (e) {
          console.error("Não foi possível salvar a capa do vídeo:", e);
        }
      }
    }

    patch.midia_tipo = video ? "video" : "foto";
    patch.midia_path = midiaPath;
    patch.poster_path = posterPath;
  }

  const { error } = await supabase
    .from("site_depoimentos")
    .update(patch)
    .eq("id", d.id);

  if (error) {
    await apagarMidia(novosPaths);
    throw error;
  }

  if (novaMidia) await apagarMidia([d.midia_path, d.poster_path]);
}

export async function removerDepoimento(d: Depoimento): Promise<void> {
  await apagarMidia([d.midia_path, d.poster_path]);
  const { error } = await supabase
    .from("site_depoimentos")
    .delete()
    .eq("id", d.id);
  if (error) throw error;
}

export async function setDepoimentoAtivo(
  id: string,
  ativo: boolean
): Promise<void> {
  const { error } = await supabase
    .from("site_depoimentos")
    .update({ ativo })
    .eq("id", id);
  if (error) throw error;
}

export async function trocarOrdemDepoimento(
  a: Depoimento,
  b: Depoimento
): Promise<void> {
  const [r1, r2] = await Promise.all([
    supabase.from("site_depoimentos").update({ ordem: b.ordem }).eq("id", a.id),
    supabase.from("site_depoimentos").update({ ordem: a.ordem }).eq("id", b.id),
  ]);
  if (r1.error) throw r1.error;
  if (r2.error) throw r2.error;
}

export function proximaOrdemDepoimento(lista: Depoimento[]): number {
  return lista.reduce((max, d) => Math.max(max, d.ordem), -1) + 1;
}
