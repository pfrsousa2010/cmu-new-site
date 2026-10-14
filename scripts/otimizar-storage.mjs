// Recomprime as imagens que JÁ estão nos buckets públicos do site.
//
// Os uploads novos já saem otimizados (src/lib/imagem.ts); este script cuida do
// que foi enviado antes. Por padrão é DRY-RUN: só lista o que seria trocado e
// quanto se economiza. Nada é alterado sem `--aplicar`.
//
// Uso (PowerShell):
//   npm i --no-save sharp
//   $env:SUPABASE_SERVICE_ROLE_KEY = "<chave service_role>"   # só nesta sessão; NUNCA no repositório
//   node scripts/otimizar-storage.mjs                          # dry-run
//   node scripts/otimizar-storage.mjs --aplicar                # troca de verdade
//
// Opções: --min-kb=300 (só mexe em arquivos maiores que isso)
//         --max-lado=1600 (maior lado, em px; capas de curso aparecem em ~380 px, 800 basta)
//         --cache-tudo (arquivos que não compensam recomprimir sobem de novo, iguais,
//                       só para trocar o Cache-Control antigo de 1 h pelo de 1 ano)
//         --bucket=site-hero (limita a um bucket; pode repetir)
//
// Como troca com segurança:
//   * Mantém o MESMO caminho e a mesma extensão/formato (jpeg continua jpeg,
//     webp continua webp, png continua png), então nenhuma linha do banco nem
//     imagem_url precisa mudar.
//   * Antes de sobrescrever, guarda o original em ./backup-storage/<bucket>/<caminho>.
//   * Só sobrescreve se a economia for de pelo menos 30%.
//   * Sobe com Cache-Control de 1 ano. Cópias já em cache no CDN/navegador
//     antigo expiram em até 1 h (o padrão anterior).
// Os logos (site-parceiros) ficam de fora: já passam por recorte próprio.

import { createClient } from "@supabase/supabase-js";
import { access, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const args = process.argv.slice(2);
const aplicar = args.includes("--aplicar");
const minKb = Number(args.find((a) => a.startsWith("--min-kb="))?.split("=")[1] ?? 300);
const soBuckets = args.filter((a) => a.startsWith("--bucket=")).map((a) => a.split("=")[1]);
const BUCKETS = (soBuckets.length
  ? soBuckets
  : ["site-cursos", "site-eventos", "site-albuns", "site-hero", "site-depoimentos"]);
const MAX_LADO = Number(args.find((a) => a.startsWith("--max-lado="))?.split("=")[1] ?? 1600);
const cacheTudo = args.includes("--cache-tudo");
const CACHE_1_ANO = "max-age=31536000";
const ECONOMIA_MINIMA = 0.3;

const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL ?? "https://qnbrmgwlopirujzcgziu.supabase.co";
const chave = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!chave) {
  console.error("Defina SUPABASE_SERVICE_ROLE_KEY (Dashboard → Project Settings → API). Não grave a chave em arquivo do repositório.");
  process.exit(1);
}

let sharp;
try {
  sharp = (await import("sharp")).default;
} catch {
  console.error("Falta o sharp. Rode: npm i --no-save sharp");
  process.exit(1);
}

const supabase = createClient(url, chave, { auth: { persistSession: false } });

/** Lista todos os arquivos de um bucket, descendo nas "pastas". */
async function listarTudo(bucket, prefixo = "") {
  const arquivos = [];
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await supabase.storage.from(bucket).list(prefixo, { limit: 1000, offset });
    if (error) throw new Error(`${bucket}/${prefixo}: ${error.message}`);
    for (const item of data) {
      const caminho = prefixo ? `${prefixo}/${item.name}` : item.name;
      if (item.id === null) arquivos.push(...(await listarTudo(bucket, caminho)));
      else arquivos.push({ caminho, tamanho: item.metadata?.size ?? 0, cache: item.metadata?.cacheControl ?? "" });
    }
    if (data.length < 1000) break;
  }
  return arquivos;
}

function formatoDe(caminho) {
  const ext = caminho.split(".").pop()?.toLowerCase();
  if (ext === "jpg" || ext === "jpeg") return { fmt: "jpeg", mime: "image/jpeg" };
  if (ext === "webp") return { fmt: "webp", mime: "image/webp" };
  if (ext === "png") return { fmt: "png", mime: "image/png" };
  return null; // gif, svg, avif, vídeo, etc.: não mexe
}

async function recomprimir(buffer, fmt) {
  let img = sharp(buffer, { failOn: "none" }).rotate().resize({
    width: MAX_LADO, height: MAX_LADO, fit: "inside", withoutEnlargement: true,
  });
  if (fmt === "jpeg") img = img.jpeg({ quality: 80, mozjpeg: true });
  else if (fmt === "webp") img = img.webp({ quality: 80 });
  else img = img.png({ compressionLevel: 9, palette: true });
  return img.toBuffer();
}

const mb = (n) => (n / 1024 / 1024).toFixed(2) + " MB";
let totalAntes = 0;
let totalDepois = 0;
let trocados = 0;
let cacheTrocado = 0;

for (const bucket of BUCKETS) {
  console.log(`\n== ${bucket}`);
  const arquivos = await listarTudo(bucket);
  for (const { caminho, tamanho, cache } of arquivos) {
    const f = formatoDe(caminho);
    if (!f || tamanho < minKb * 1024) continue;

    const { data: blob, error } = await supabase.storage.from(bucket).download(caminho);
    if (error) { console.warn(`  ! ${caminho}: ${error.message}`); continue; }
    const original = Buffer.from(await blob.arrayBuffer());
    const novo = await recomprimir(original, f.fmt);
    const economia = 1 - novo.length / original.length;
    if (economia < ECONOMIA_MINIMA) {
      // Não vale recomprimir, mas o cache curto continua custando downloads repetidos.
      if (cacheTudo && cache !== CACHE_1_ANO) {
        cacheTrocado++;
        console.log(`  ${aplicar ? "CACHE" : "cache?"} ${caminho}  (${cache || "sem cache"} → 1 ano, arquivo igual)`);
        if (aplicar) {
          const { error: erroCache } = await supabase.storage
            .from(bucket)
            .upload(caminho, original, { upsert: true, contentType: f.mime, cacheControl: "31536000" });
          if (erroCache) console.warn(`  ! falha ao subir ${caminho}: ${erroCache.message}`);
        }
      }
      continue;
    }

    totalAntes += original.length;
    totalDepois += novo.length;
    trocados++;
    console.log(`  ${aplicar ? "TROCA" : "troca?"} ${caminho}  ${mb(original.length)} → ${mb(novo.length)}  (-${Math.round(economia * 100)}%)`);

    if (!aplicar) continue;
    const destino = path.join("backup-storage", bucket, caminho);
    await mkdir(path.dirname(destino), { recursive: true });
    // Só guarda o backup se ainda não existe: numa segunda rodada o arquivo do bucket já é a
    // versão comprimida, e sobrescrever perderia o original de verdade.
    const jaTemBackup = await access(destino).then(() => true, () => false);
    if (!jaTemBackup) await writeFile(destino, original);
    const { error: erroUp } = await supabase.storage
      .from(bucket)
      .upload(caminho, novo, { upsert: true, contentType: f.mime, cacheControl: "31536000" });
    if (erroUp) console.warn(`  ! falha ao subir ${caminho}: ${erroUp.message} (original preservado)`);
  }
}

console.log(`\n${trocados} arquivo(s) ${aplicar ? "trocado(s)" : "seriam trocados"}: ${mb(totalAntes)} → ${mb(totalDepois)} (economia ${mb(totalAntes - totalDepois)}).`);
if (cacheTudo) console.log(`${cacheTrocado} arquivo(s) ${aplicar ? "com cache trocado" : "teriam o cache trocado"} para 1 ano (sem mudar o conteúdo).`);
if (!aplicar) console.log("Dry-run: nada foi alterado. Rode com --aplicar para trocar (os originais vão para ./backup-storage).");
