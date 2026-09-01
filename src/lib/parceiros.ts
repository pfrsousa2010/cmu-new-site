import { supabase, BUCKET_PARCEIROS, publicUrl } from "./supabase";

/**
 * Logo de parceiro exibido na página /parceiros (tabela `site_parceiros`).
 *
 * Não confundir com a tabela `parceiros` do SGE, que cadastra os parceiros de
 * curso ("Em parceria com X" no card). Esta é do site e guarda quem apoia o
 * Clube institucionalmente — as duas listas se cruzam, mas não são a mesma.
 */
export interface ParceiroLogo {
  id: string;
  nome: string;
  storage_path: string;
  ordem: number;
  ativo: boolean;
  created_at?: string;
}

export const MAX_LOGO_BYTES = 2 * 1024 * 1024;

export function validarLogoParceiro(file: File): string | null {
  if (!file.type.startsWith("image/")) {
    return "Selecione apenas arquivos de imagem.";
  }
  if (file.size > MAX_LOGO_BYTES) return "O logo deve ter no máximo 2 MB.";
  return null;
}

/** URL pública do logo no bucket `site-parceiros`. */
export function urlLogoParceiro(p: ParceiroLogo): string {
  return publicUrl(BUCKET_PARCEIROS, p.storage_path);
}

/**
 * Nome a partir do arquivo, para o painel já vir preenchido: "senac-londrina.png"
 * vira "Senac Londrina". O admin corrige na hora se quiser.
 */
export function nomeDoArquivo(nomeArquivo: string): string {
  const semExt = nomeArquivo.replace(/\.[^.]+$/, "");
  return semExt
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .map((p) => (p ? p[0].toLocaleUpperCase("pt-BR") + p.slice(1) : p))
    .join(" ");
}

// ---------------------------------------------------------------------------
// Recorte
//
// Logo de instituição costuma vir com margem vazia embutida no arquivo — o PNG
// do SENAI, por exemplo, é um quadrado de 2084px com a marca ocupando uma faixa
// no meio (76% de sobra). Como o card limita a altura, essa margem faz a logo
// renderizar pequena ao lado de outra que preenche o arquivo inteiro. Recortar
// até o conteúdo iguala o tamanho aparente de todas.
//
// Tudo acontece no navegador, via canvas. Para ler os pixels de uma imagem que
// já está no Storage é obrigatório carregá-la com `crossOrigin`, senão o canvas
// fica "tainted" e `getImageData` lança.
// ---------------------------------------------------------------------------

export interface Recorte {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Maior lado do arquivo gerado. Um card de 120px não precisa de mais. */
const MAX_LADO_RECORTE = 1200;

export function ehSvg(file: { name?: string; type?: string }): boolean {
  return (
    file.type === "image/svg+xml" ||
    Boolean(file.name && /\.svg$/i.test(file.name))
  );
}

export function carregarImagem(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Não foi possível abrir a imagem."));
    img.src = src;
  });
}

/**
 * Menor retângulo que contém o conteúdo visível. Considera vazio o pixel
 * transparente e o quase-branco — logos chegam tanto em PNG com transparência
 * quanto em JPG com fundo branco.
 * Devolve `null` quando a imagem é toda vazia.
 */
export function detectarConteudo(img: HTMLImageElement): Recorte | null {
  const w = img.naturalWidth;
  const h = img.naturalHeight;
  if (!w || !h) return null;

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;
  ctx.drawImage(img, 0, 0);

  const { data } = ctx.getImageData(0, 0, w, h);
  let minX = w;
  let minY = h;
  let maxX = -1;
  let maxY = -1;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      const transparente = data[i + 3] < 12;
      const quaseBranco =
        data[i] > 245 && data[i + 1] > 245 && data[i + 2] > 245;
      if (transparente || quaseBranco) continue;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }

  if (maxX < 0) return null;

  // Folga de 1% para não comer a borda suavizada da marca.
  const folga = Math.ceil(Math.max(w, h) * 0.01);
  const x = Math.max(0, minX - folga);
  const y = Math.max(0, minY - folga);
  return {
    x,
    y,
    w: Math.min(w - x, maxX - minX + 1 + folga * 2),
    h: Math.min(h - y, maxY - minY + 1 + folga * 2),
  };
}

/**
 * Aplica o recorte e devolve um PNG novo (PNG sempre, para não perder
 * transparência). Reduz proporcionalmente quando o recorte passa de
 * `MAX_LADO_RECORTE`: os originais chegam a 2084px, muito acima do que o card
 * usa, e converter um JPG grande para PNG sem reduzir incharia o arquivo.
 */
export function recortarParaArquivo(
  img: HTMLImageElement,
  recorte: Recorte,
  nomeBase: string
): Promise<File> {
  const escala = Math.min(1, MAX_LADO_RECORTE / Math.max(recorte.w, recorte.h));
  const destW = Math.max(1, Math.round(recorte.w * escala));
  const destH = Math.max(1, Math.round(recorte.h * escala));

  const canvas = document.createElement("canvas");
  canvas.width = destW;
  canvas.height = destH;
  const ctx = canvas.getContext("2d");
  if (!ctx) return Promise.reject(new Error("Canvas indisponível."));
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(
    img,
    recorte.x,
    recorte.y,
    recorte.w,
    recorte.h,
    0,
    0,
    destW,
    destH
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) return reject(new Error("Falha ao gerar a imagem recortada."));
      const nome = nomeBase.replace(/\.[^.]+$/, "") + ".png";
      resolve(new File([blob], nome, { type: "image/png" }));
    }, "image/png");
  });
}

/**
 * Corta a margem vazia de um arquivo recém-escolhido. SVG passa direto: é
 * vetor, escala sem perder nitidez, e rasterizar para cortar seria uma piora.
 * Qualquer falha devolve o arquivo original — recorte é melhoria, não pode
 * impedir o upload.
 */
export async function autoRecortarArquivo(file: File): Promise<File> {
  if (ehSvg(file)) return file;
  const url = URL.createObjectURL(file);
  try {
    const img = await carregarImagem(url);
    const recorte = detectarConteudo(img);
    if (!recorte) return file;
    const sobra =
      1 - (recorte.w * recorte.h) / (img.naturalWidth * img.naturalHeight);
    const jaPequeno =
      Math.max(img.naturalWidth, img.naturalHeight) <= MAX_LADO_RECORTE;
    // Já está justo e em tamanho razoável: não recodifica à toa.
    if (sobra < 0.02 && jaPequeno) return file;
    return await recortarParaArquivo(img, recorte, file.name);
  } catch (e) {
    console.error("Auto-recorte falhou, subindo o arquivo original:", e);
    return file;
  } finally {
    URL.revokeObjectURL(url);
  }
}

/**
 * Troca o arquivo de um logo já cadastrado. Sobe em caminho novo antes de
 * apagar o antigo: o CDN do Storage guarda por caminho, então reaproveitar o
 * mesmo path continuaria servindo a imagem velha.
 */
export async function substituirArquivoParceiro(
  p: ParceiroLogo,
  novo: File
): Promise<string> {
  const ext = novo.name.split(".").pop()?.toLowerCase() || "png";
  const path = `${Date.now()}-${p.ordem}.${ext}`;

  const up = await supabase.storage
    .from(BUCKET_PARCEIROS)
    .upload(path, novo, { upsert: false, contentType: novo.type });
  if (up.error) throw up.error;

  const { error } = await supabase
    .from("site_parceiros")
    .update({ storage_path: path })
    .eq("id", p.id);
  if (error) {
    await supabase.storage.from(BUCKET_PARCEIROS).remove([path]);
    throw error;
  }

  // Best-effort, como nos demais fluxos: a linha já aponta para o arquivo novo.
  await supabase.storage.from(BUCKET_PARCEIROS).remove([p.storage_path]);
  return path;
}

/**
 * Logos ativos, na ordem definida no painel.
 * Devolve [] em caso de erro (inclusive se a migração ainda não rodou), para a
 * página cair nos placeholders em vez de quebrar.
 */
export async function fetchParceiros(): Promise<ParceiroLogo[]> {
  const { data, error } = await supabase
    .from("site_parceiros")
    .select("*")
    .eq("ativo", true)
    .order("ordem", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) {
    console.error("Erro ao buscar parceiros:", error.message);
    return [];
  }
  return (data ?? []) as ParceiroLogo[];
}

/** Todos os logos (inclusive os inativos), para o painel. */
export async function fetchParceirosAdmin(): Promise<ParceiroLogo[]> {
  const { data, error } = await supabase
    .from("site_parceiros")
    .select("*")
    .order("ordem", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) {
    console.error("Erro ao buscar parceiros (admin):", error.message);
    return [];
  }
  return (data ?? []) as ParceiroLogo[];
}

/** Sobe o arquivo e registra o logo no fim da ordem. */
export async function adicionarParceiro(
  file: File,
  ordem: number,
  nome?: string
): Promise<void> {
  const erro = validarLogoParceiro(file);
  if (erro) throw new Error(erro);

  // O nome vem do arquivo escolhido; o recorte troca a extensão para .png.
  const nomeFinal = nome?.trim() || nomeDoArquivo(file.name);
  const arquivo = await autoRecortarArquivo(file);

  const ext = arquivo.name.split(".").pop()?.toLowerCase() || "png";
  const path = `${Date.now()}-${ordem}.${ext}`;
  const up = await supabase.storage
    .from(BUCKET_PARCEIROS)
    .upload(path, arquivo, { upsert: false, contentType: arquivo.type });
  if (up.error) throw up.error;

  const { error } = await supabase.from("site_parceiros").insert({
    nome: nomeFinal,
    storage_path: path,
    ordem,
  });
  if (error) {
    // Não deixa objeto órfão no bucket quando o insert falha.
    await supabase.storage.from(BUCKET_PARCEIROS).remove([path]);
    throw error;
  }
}

export async function removerParceiro(p: ParceiroLogo): Promise<void> {
  await supabase.storage.from(BUCKET_PARCEIROS).remove([p.storage_path]);
  const { error } = await supabase
    .from("site_parceiros")
    .delete()
    .eq("id", p.id);
  if (error) throw error;
}

export async function setParceiroAtivo(
  id: string,
  ativo: boolean
): Promise<void> {
  const { error } = await supabase
    .from("site_parceiros")
    .update({ ativo })
    .eq("id", id);
  if (error) throw error;
}

export async function setParceiroNome(id: string, nome: string): Promise<void> {
  const limpo = nome.trim();
  if (!limpo) throw new Error("O nome do parceiro não pode ficar vazio.");
  const { error } = await supabase
    .from("site_parceiros")
    .update({ nome: limpo })
    .eq("id", id);
  if (error) throw error;
}

/**
 * Troca a posição de dois logos gravando a `ordem` de cada um.
 * Sem transação: se a segunda escrita falhar, quem chama recarrega a lista.
 */
export async function trocarOrdemParceiro(
  a: ParceiroLogo,
  b: ParceiroLogo
): Promise<void> {
  const [r1, r2] = await Promise.all([
    supabase.from("site_parceiros").update({ ordem: b.ordem }).eq("id", a.id),
    supabase.from("site_parceiros").update({ ordem: a.ordem }).eq("id", b.id),
  ]);
  if (r1.error) throw r1.error;
  if (r2.error) throw r2.error;
}

/** Próxima posição livre (logos novos entram no fim). */
export function proximaOrdemParceiro(lista: ParceiroLogo[]): number {
  return lista.reduce((max, p) => Math.max(max, p.ordem), -1) + 1;
}
