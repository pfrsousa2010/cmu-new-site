/**
 * Imagens de referência do site atual (Wix). Usadas como placeholder visual.
 * TODO (cliente): baixar e re-hospedar no Supabase Storage antes do go-live.
 */
export const wix = (id: string, w: number, h: number) =>
  `https://static.wixstatic.com/media/${id}/v1/fill/w_${w},h_${h},al_c,q_85/img.jpg`;

export const HERO_IMG =
  "https://static.wixstatic.com/media/e50536_0aac0d5797c24c9ebb1b78f3f9026718~mv2_d_5873_3304_s_4_2.jpg/v1/fill/w_1100,h_760,al_c,q_85/hero.jpg";

export const SOBRE_IMG =
  "https://static.wixstatic.com/media/84770f_6d8f65290fd8480282082b66ac697efa~mv2_d_8688_5792_s_4_2.jpeg/v1/fill/w_1000,h_640,al_c,q_85/sobre.jpg";

export const IMG_PADARIA = wix("11062b_ac6b9ad9218741a48da2ef38594c9232~mv2.jpg", 600, 400);
export const IMG_MESA = wix("11062b_a78f37611bc24c84836a48d6076c04b1~mv2.jpg", 600, 400);
export const IMG_MARMITA = wix("11062b_7349016b10fa463bb6ea2bf2286b161a~mv2.jpeg", 600, 400);
export const IMG_DOCES = wix("04c518_79c28ee490c04ef5937e73dee26ac7aa~mv2.png", 600, 400);
export const IMG_JUNTOS = wix("11062b_1bae4c1b9e17401eb83214230196c28c~mv2.jpg", 600, 400);

/** Fallback quando um curso não tem imagem própria (imagem_url). */
export const CURSO_FALLBACK = "/logo-cmu.png";
