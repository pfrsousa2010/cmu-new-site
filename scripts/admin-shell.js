#!/usr/bin/env node

/**
 * Monta o /admin como aplicativo instalavel.
 *
 * Escreve dois arquivos em dist/admin/:
 *
 *   index.html  a mesma aplicacao, com o manifesto e os icones do painel.
 *               Precisa ser um HTML proprio porque o manifesto nao pode
 *               aparecer nas paginas do site -- quem visita o site nao
 *               deve receber convite para instalar nada.
 *
 *   sw.js       o service worker. Fica dentro de /admin/ de proposito: um
 *               service worker so controla o diretorio onde esta, e e isso
 *               que impede o site publico de virar parte do aplicativo.
 *
 * Roda depois do `vite build`, no fim do `npm run build`.
 */

import fs from 'fs';
import path from 'path';

const DIST = path.join(process.cwd(), 'dist');
const DESTINO = path.join(DIST, 'admin');

const ICONES = ['/icons/admin-192.png', '/icons/admin-512.png'];

/**
 * O HTML do painel e montado do zero, e nao filtrado a partir do
 * index.html do site.
 *
 * Filtrar seria cacar tag por tag -- description, Open Graph, Twitter,
 * JSON-LD -- e cada meta nova que alguem acrescentasse ao site vazaria
 * para ca sem ninguem perceber. Montando do zero, o painel so tem o que
 * precisa, e o index.html do site pode crescer a vontade.
 *
 * Do build so aproveitamos as tags que o Vite injeta, porque os nomes dos
 * arquivos levam hash e mudam a cada build.
 */
const montarHtml = (template) => {
  const injetadas = [
    ...template.matchAll(/<script type="module"[^>]*><\/script>/g),
    ...template.matchAll(/<link rel="stylesheet"[^>]*>/g),
  ].map((achado) => achado[0]);

  if (!injetadas.length) {
    console.error('admin-shell: nao achei o script nem o css do Vite em dist/index.html.');
    process.exit(1);
  }

  return `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />

    <title>CMU Admin</title>
    <meta name="robots" content="noindex, nofollow" />

    <link rel="manifest" href="/admin-manifest.json" />
    <link rel="icon" type="image/png" href="/icons/admin-192.png" />
    <link rel="apple-touch-icon" href="/icons/admin-192.png" />

    <meta name="theme-color" content="#26333f" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="black" />
    <meta name="apple-mobile-web-app-title" content="CMU Admin" />

    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Nunito:wght@600;700;800;900&family=Nunito+Sans:wght@400;600;700&display=swap"
      rel="stylesheet"
    />

    ${injetadas.join('\n    ')}
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>
`;
};

/**
 * O service worker sai daqui, e nao de um arquivo estatico em public/,
 * porque precisa saber os nomes dos arquivos gerados pelo Vite -- que
 * levam hash e mudam a cada build. O mesmo hash serve de versao do cache:
 * build novo, cache novo, sem precisar lembrar de trocar um numero na mao.
 */
const montarServiceWorker = (assets) => {
  const versao =
    assets
      .map((arquivo) => arquivo.replace(/\.[^.]+$/, '').split('-').pop())
      .join('-')
      .slice(0, 24) || String(Date.now());
  const precache = ['/admin/', ...assets.map((a) => `/assets/${a}`), ...ICONES];

  return `/*
 * Service worker do painel do Clube das Maes Unidas.
 * Gerado por scripts/admin-shell.js -- nao edite: e reescrito a cada build.
 */

const CACHE = 'cmu-admin-${versao}';
const PRECACHE = ${JSON.stringify(precache, null, 2)};

self.addEventListener('install', (evento) => {
  evento.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(PRECACHE)));
});

self.addEventListener('activate', (evento) => {
  evento.waitUntil(
    caches.keys().then((chaves) =>
      Promise.all(chaves.filter((chave) => chave !== CACHE).map((chave) => caches.delete(chave)))
    )
  );
});

/*
 * Nao ha skipWaiting de proposito: a versao nova assume quando o app e
 * fechado e reaberto. Trocar os arquivos por baixo de uma tela em uso
 * pode quebra-la no meio de um cadastro, e perguntar "deseja atualizar?"
 * e uma decisao que quem usa o painel nao tem como tomar.
 */

const SEM_CONEXAO = \`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Sem conexao</title>
<style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#f4f1ec;
color:#2b2622;font-family:system-ui,sans-serif;text-align:center;padding:24px}
h1{font-size:20px;margin:0 0 8px}p{color:#6f675f;margin:0;max-width:24rem;line-height:1.5}</style>
</head><body><div><h1>Sem conexao</h1>
<p>O painel precisa de internet para mostrar eventos, cursos e arquivos. Assim que a
conexao voltar, e so abrir de novo.</p></div></body></html>\`;

self.addEventListener('fetch', (evento) => {
  const requisicao = evento.request;
  const url = new URL(requisicao.url);

  // So GET, e so o proprio site. Supabase passa direto, sempre: painel com
  // dado vindo de cache faz alguem editar em cima de informacao velha, que
  // e pior do que painel que nao abre.
  if (requisicao.method !== 'GET' || url.origin !== self.location.origin) return;

  // Navegacao: devolve a casca do app. O React resolve a rota depois.
  if (requisicao.mode === 'navigate') {
    evento.respondWith(
      fetch(requisicao)
        .catch(() => caches.match('/admin/'))
        .then((resposta) => resposta || new Response(SEM_CONEXAO, {
          status: 503,
          headers: { 'Content-Type': 'text/html; charset=utf-8' },
        }))
    );
    return;
  }

  // Arquivos com hash no nome nunca mudam de conteudo: cache primeiro.
  if (url.pathname.startsWith('/assets/') || url.pathname.startsWith('/icons/')) {
    evento.respondWith(
      caches.match(requisicao).then((cacheado) => cacheado || fetch(requisicao))
    );
  }
});
`;
};

const gerar = () => {
  const template = path.join(DIST, 'index.html');

  if (!fs.existsSync(template)) {
    console.error('admin-shell: dist/index.html nao encontrado. Rode o vite build antes.');
    process.exit(1);
  }

  const assets = fs.existsSync(path.join(DIST, 'assets'))
    ? fs.readdirSync(path.join(DIST, 'assets')).filter((a) => /\.(js|css)$/.test(a)).sort()
    : [];

  if (!assets.length) {
    console.error('admin-shell: nenhum arquivo em dist/assets. O build do Vite falhou?');
    process.exit(1);
  }

  fs.mkdirSync(DESTINO, { recursive: true });
  fs.writeFileSync(
    path.join(DESTINO, 'index.html'),
    montarHtml(fs.readFileSync(template, 'utf8')),
    'utf8'
  );
  fs.writeFileSync(path.join(DESTINO, 'sw.js'), montarServiceWorker(assets), 'utf8');

  console.log(`admin-shell: dist/admin/index.html e sw.js gerados (${assets.length} arquivos no cache).`);
};

gerar();
