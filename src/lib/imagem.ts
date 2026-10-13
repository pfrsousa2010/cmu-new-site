// Otimização de imagens antes do upload ao Storage.
//
// Os buckets do site são públicos e servidos pelo CDN do Supabase: cada visita
// baixa as fotos de novo, e o plano free tem 5 GB de egress por mês (cota
// compartilhada com o sistema de gestão). Fotos de celular chegam com 3–6 MB;
// para um card de 400 px bastam algumas centenas de KB. Tudo acontece no
// navegador, via canvas, no mesmo estilo de `autoRecortarArquivo` (parceiros.ts).

/**
 * Cache-Control dos uploads (1 ano). Seguro porque todo caminho leva
 * `Date.now()`: trocar a imagem sempre gera um caminho novo, nunca reaproveita
 * o antigo. Sem isso o padrão do Supabase é 1 hora.
 */
export const CACHE_CONTROL_LONGO = "31536000";

/** Maior lado, em pixels, das fotos do site (cobre telas retina em cards e carrossel). */
export const MAX_LADO_FOTO = 1600;

const TIPOS_OTIMIZAVEIS = ["image/jpeg", "image/png", "image/webp"];

interface OpcoesOtimizar {
  /** Maior lado da imagem final, em pixels. */
  maxLado?: number;
  /** Qualidade do WebP, de 0 a 1. */
  qualidade?: number;
}

async function abrirImagem(file: File): Promise<ImageBitmap | HTMLImageElement> {
  if (typeof createImageBitmap === "function") {
    try {
      // `from-image` respeita a orientação EXIF (foto de celular em pé).
      return await createImageBitmap(file, { imageOrientation: "from-image" });
    } catch {
      // cai para o <img> abaixo
    }
  }
  const url = URL.createObjectURL(file);
  try {
    return await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("Não foi possível ler a imagem."));
      img.src = url;
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}

function dimensoes(img: ImageBitmap | HTMLImageElement): { w: number; h: number } {
  return img instanceof HTMLImageElement
    ? { w: img.naturalWidth, h: img.naturalHeight }
    : { w: img.width, h: img.height };
}

/**
 * Reduz a foto para `maxLado` e converte para WebP. Nunca falha: se o formato
 * não for suportado (gif, svg, heic...), se algo der errado ou se o resultado
 * não ficar menor, devolve o arquivo original.
 */
export async function otimizarImagem(
  file: File,
  { maxLado = MAX_LADO_FOTO, qualidade = 0.82 }: OpcoesOtimizar = {}
): Promise<File> {
  if (!TIPOS_OTIMIZAVEIS.includes(file.type)) return file;
  try {
    const img = await abrirImagem(file);
    const { w, h } = dimensoes(img);
    if (!w || !h) return file;

    const escala = Math.min(1, maxLado / Math.max(w, h));
    const destW = Math.max(1, Math.round(w * escala));
    const destH = Math.max(1, Math.round(h * escala));

    const canvas = document.createElement("canvas");
    canvas.width = destW;
    canvas.height = destH;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(img, 0, 0, destW, destH);
    if ("close" in img) img.close();

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/webp", qualidade)
    );
    if (!blob || blob.type !== "image/webp") return file;
    // Imagem pequena que já estava enxuta: não troca por uma maior.
    if (escala === 1 && blob.size >= file.size) return file;

    const base = file.name.replace(/\.[^.]+$/, "") || "foto";
    return new File([blob], `${base}.webp`, { type: "image/webp" });
  } catch (e) {
    console.error("Otimização de imagem falhou, enviando o original:", e);
    return file;
  }
}
