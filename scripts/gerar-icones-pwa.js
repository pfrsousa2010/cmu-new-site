#!/usr/bin/env node

/**
 * Gera os icones do painel instalavel a partir de public/logo-cmu.png.
 *
 * Roda sob demanda (`npm run icones-pwa`), e nao no build: a logo quase
 * nunca muda, e os PNGs ficam versionados no repositorio.
 *
 * A logo do CMU ja e quadrada e ja e so a marca -- nao tem texto embaixo
 * para recortar. O trabalho aqui e so aparar o transparente em volta
 * (assim o desenho ocupa o quadro inteiro, e nao a moldura vazia do
 * arquivo original) e centralizar sobre um fundo solido.
 *
 * **Fundo branco.** A marca tem verde, azul, laranja e vermelho; qualquer
 * fundo colorido come uma delas, e transparente vira preto no Android.
 *
 * Sao tres arquivos porque "any" e "maskable" sao coisas diferentes:
 *
 *   any       -- o sistema mostra a imagem como ela e.
 *   maskable  -- o Android recorta na forma do tema (circulo, squircle,
 *                gota). O que estiver perto da borda e cortado fora, por
 *                isso aqui a marca ocupa bem menos da area.
 */

import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const ORIGEM = path.join(process.cwd(), 'public', 'logo-cmu.png');
const DESTINO = path.join(process.cwd(), 'public', 'icons');

const FUNDO = { r: 255, g: 255, b: 255, alpha: 1 };

/** Quanto do quadrado a marca ocupa. O maskable cede espaco para o recorte. */
const OCUPACAO = { any: 0.8, maskable: 0.56 };

/** A marca centralizada num quadrado branco de `lado` pixels. */
const montarIcone = async (marca, lado, ocupacao, destino) => {
  const redimensionada = await sharp(marca)
    .resize(Math.round(lado * ocupacao), Math.round(lado * ocupacao), {
      fit: 'inside',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .toBuffer();

  await sharp({ create: { width: lado, height: lado, channels: 4, background: FUNDO } })
    .composite([{ input: redimensionada, gravity: 'centre' }])
    .png()
    .toFile(destino);
};

const gerar = async () => {
  if (!fs.existsSync(ORIGEM)) {
    console.error(`Logo nao encontrada: ${ORIGEM}`);
    process.exit(1);
  }

  fs.mkdirSync(DESTINO, { recursive: true });

  // O threshold e alto porque a logo vem com uma franja clara em volta do
  // desenho; aparar so o transparente puro deixaria a moldura branca.
  const marca = await sharp(ORIGEM).trim({ threshold: 10 }).png().toBuffer();
  const { width, height } = await sharp(marca).metadata();

  await montarIcone(marca, 192, OCUPACAO.any, path.join(DESTINO, 'admin-192.png'));
  await montarIcone(marca, 512, OCUPACAO.any, path.join(DESTINO, 'admin-512.png'));
  await montarIcone(marca, 512, OCUPACAO.maskable, path.join(DESTINO, 'admin-512-maskable.png'));

  console.log(`Marca aparada em ${width}x${height}.`);
  console.log(`Icones gerados em public/icons: ${fs.readdirSync(DESTINO).sort().join(', ')}`);
};

gerar().catch((error) => {
  console.error('Erro ao gerar os icones:', error.message);
  process.exit(1);
});
