import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { aplicarSeo } from "@/lib/seo";

/** Atualiza título, descrição e canônica a cada troca de rota do site público. */
export default function Seo() {
  const { pathname } = useLocation();
  useEffect(() => {
    aplicarSeo(pathname);
  }, [pathname]);
  return null;
}
