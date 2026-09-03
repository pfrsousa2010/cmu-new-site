const UNSPLASH_KEY = import.meta.env.VITE_UNSPLASH_ACCESS_KEY as
  | string
  | undefined;

export type UnsplashFoto = {
  id: string;
  thumb: string;
  regular: string;
  alt: string;
  downloadLocation: string;
  photographer: string;
  photographerUrl: string;
};

export function unsplashConfigured(): boolean {
  return Boolean(UNSPLASH_KEY?.trim());
}

/** Cota do plano demo do Unsplash, por chave. Cada busca gasta uma. */
const LIMITE_HORA = 50;

/**
 * Traduz a resposta de erro do Unsplash. Sem isso o 403 mais comum — a cota
 * horária estourada — chega ao admin como um número solto, e ele não tem como
 * saber que basta esperar nem que a aba Anexar continua funcionando.
 */
function erroUnsplash(status: number, corpo: string): Error {
  const texto = corpo.trim();
  if (status === 403 && /rate limit/i.test(texto)) {
    return new Error(
      `Limite do Unsplash atingido (${LIMITE_HORA} buscas por hora). ` +
        "Espere a virada da hora ou use a aba Anexar para subir uma imagem do computador."
    );
  }
  if (status === 401) {
    return new Error(
      "Chave do Unsplash recusada. Confira VITE_UNSPLASH_ACCESS_KEY no .env."
    );
  }
  return new Error(`Unsplash ${status}: ${texto || "erro desconhecido"}`);
}

export async function buscarFotosUnsplash(
  termo: string,
  page = 1
): Promise<{ fotos: UnsplashFoto[]; total: number }> {
  const key = UNSPLASH_KEY?.trim();
  if (!key) {
    throw new Error("VITE_UNSPLASH_ACCESS_KEY não configurada");
  }
  const q = termo.trim();
  if (!q) return { fotos: [], total: 0 };

  const url = new URL("https://api.unsplash.com/search/photos");
  url.searchParams.set("query", q);
  url.searchParams.set("page", String(page));
  url.searchParams.set("per_page", "12");
  url.searchParams.set("orientation", "landscape");

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Client-ID ${key}` },
  });
  if (!res.ok) {
    throw erroUnsplash(res.status, await res.text());
  }

  const data = (await res.json()) as {
    total: number;
    results: Array<{
      id: string;
      alt_description: string | null;
      description: string | null;
      urls: { thumb: string; regular: string };
      links: { download_location: string };
      user: { name: string; links: { html: string } };
    }>;
  };

  return {
    total: data.total ?? 0,
    fotos: (data.results ?? []).map((r) => ({
      id: r.id,
      thumb: r.urls.thumb,
      regular: r.urls.regular,
      alt: r.alt_description || r.description || "Foto Unsplash",
      downloadLocation: r.links.download_location,
      photographer: r.user.name,
      photographerUrl: r.user.links.html,
    })),
  };
}

/** Dispara o download tracked do Unsplash e retorna File pronto para o Storage. */
export async function baixarFotoUnsplash(
  downloadLocation: string,
  fileName = "unsplash.jpg"
): Promise<File> {
  const key = UNSPLASH_KEY?.trim();
  if (!key) {
    throw new Error("VITE_UNSPLASH_ACCESS_KEY não configurada");
  }

  const track = await fetch(downloadLocation, {
    headers: { Authorization: `Client-ID ${key}` },
  });
  if (!track.ok) {
    throw erroUnsplash(track.status, await track.text());
  }
  const trackJson = (await track.json()) as { url?: string };
  let imageUrl = trackJson.url;
  if (!imageUrl) throw new Error("URL de download Unsplash ausente");

  // Redimensiona no CDN para caber no limite do Storage.
  try {
    const u = new URL(imageUrl);
    u.searchParams.set("w", "1400");
    u.searchParams.set("q", "80");
    u.searchParams.set("fm", "jpg");
    imageUrl = u.toString();
  } catch {
    /* mantém URL original */
  }

  const imgRes = await fetch(imageUrl);
  if (!imgRes.ok) throw new Error(`Falha ao baixar imagem (${imgRes.status})`);
  const blob = await imgRes.blob();
  const type = blob.type || "image/jpeg";
  const ext = type.includes("png") ? "png" : type.includes("webp") ? "webp" : "jpg";
  const safe = fileName.replace(/\.[^.]+$/, "") || "unsplash";
  return new File([blob], `${safe}.${ext}`, { type });
}
